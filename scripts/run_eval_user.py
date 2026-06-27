import numpy as np
import pandas as pd
from sklearn.datasets import fetch_openml
from sklearn.utils import resample
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from scipy.stats import spearmanr
import time

# ── 1. Load and expand dataset ────────────────────────────────────────────────
print("Loading dataset...")
data = fetch_openml(name="default-of-credit-card-clients", version=1, as_frame=True)
X = data.data.astype(float).values
y = data.target.astype(int).values

X_exp, y_exp = resample(X, y, n_samples=100_000, stratify=y, random_state=42)
print(f"Expanded dataset: {X_exp.shape}, default rate: {y_exp.mean():.3f}")

# ── 2. Drift injection ────────────────────────────────────────────────────────
rng = np.random.default_rng(42)

def inject_s1(X): return X + rng.normal(0, 0.5, X.shape)
def inject_s2(X):
    X_d = X.copy(); X_d[:, 0] += 1.5 * X[:, 0].std(); return X_d
def inject_s3(X, y):
    y_d = y.copy()
    idx = rng.choice(len(y_d), int(len(y_d) * 0.15), replace=False)
    y_d[idx] = 1 - y_d[idx]
    return X.copy(), y_d
def inject_s4(X, y):
    X_d = inject_s1(X); return inject_s3(X_d, y)

# ── 3. PSI helper ─────────────────────────────────────────────────────────────
def compute_psi(baseline, current, bins=10, eps=1e-4):
    mn, mx = min(baseline.min(), current.min()), max(baseline.max(), current.max())
    edges = np.linspace(mn, mx, bins + 1)
    e = np.histogram(baseline, bins=edges)[0].astype(float) + eps
    a = np.histogram(current,  bins=edges)[0].astype(float) + eps
    e /= e.sum(); a /= a.sum()
    return float(np.sum((a - e) * np.log(a / e)))

def compute_psi_log(baseline, current, bins=10, eps=1e-4):
    bpos = baseline[baseline > 0]; cpos = current[current > 0]
    if len(bpos) == 0 or len(cpos) == 0: return 0.0
    mn, mx = np.log(max(bpos.min(), 1e-6)), np.log(bpos.max())
    if mn >= mx: return compute_psi(baseline, current, bins, eps)
    edges = np.exp(np.linspace(mn, mx, bins + 1))
    e = np.histogram(bpos, bins=edges)[0].astype(float) + eps
    a = np.histogram(cpos, bins=edges)[0].astype(float) + eps
    e /= e.sum(); a /= a.sum()
    return float(np.sum((a - e) * np.log(a / e)))

def compute_kl(baseline, current, bins=10, eps=1e-4):
    mn, mx = min(baseline.min(), current.min()), max(baseline.max(), current.max())
    edges = np.linspace(mn, mx, bins + 1)
    e = np.histogram(baseline, bins=edges)[0].astype(float) + eps
    a = np.histogram(current,  bins=edges)[0].astype(float) + eps
    e /= e.sum(); a /= a.sum()
    return float(np.sum(a * np.log(a / e)))

# ── 4. Alert fusion ───────────────────────────────────────────────────────────
PSI_WARN, PSI_CRIT = 0.10, 0.20
KL_WARN,  KL_CRIT  = 0.10, 0.20
RHO_WARN, RHO_CRIT = 0.70, 0.50
FR_WARN,  FR_CRIT  = 0.05, 0.10

def tier(val, warn, crit, lower_is_bad=False):
    if lower_is_bad:
        if val < crit:  return 2
        if val < warn:  return 1
        return 0
    else:
        if val > crit:  return 2
        if val > warn:  return 1
        return 0

def get_alert(psi_out, psi_inc, psi_cr, kl, rho, fr):
    tiers = [
        tier(psi_out, PSI_WARN, PSI_CRIT),
        tier(psi_inc, PSI_WARN, PSI_CRIT),
        tier(psi_cr,  PSI_WARN, PSI_CRIT),
        tier(kl,      KL_WARN,  KL_CRIT),
        tier(rho,     RHO_WARN, RHO_CRIT, lower_is_bad=True),
        tier(fr,      FR_WARN,  FR_CRIT),
    ]
    return max(tiers)  # 0=None, 1=Warning, 2=Critical

ALERT_NAMES = {0: "None", 1: "Warning", 2: "Critical"}

# ── 5. Cross-validation ───────────────────────────────────────────────────────
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

results = []
table4_signals = {sc: [] for sc in ["Baseline", "S1", "S2", "S3", "S4"]}
regression_points = []  # (reference_level, predicted_score)

REFERENCE_LEVELS = {
    "Baseline": 0.0,
    "S1": 0.15,
    "S2": 0.15,
    "S3": 0.35,
    "S4": 0.35,
}

for fold, (train_idx, test_idx) in enumerate(skf.split(X_exp, y_exp)):
    print(f"\n{'='*50}\nFold {fold+1}/5")
    X_tr, X_te = X_exp[train_idx], X_exp[test_idx]
    y_tr, y_te = y_exp[train_idx], y_exp[test_idx]

    # Train models
    rf = RandomForestClassifier(n_estimators=100, max_depth=10,
                                min_samples_leaf=5, random_state=42, n_jobs=-1)
    lr = LogisticRegression(penalty='l2', C=1.0, solver='lbfgs',
                            max_iter=1000, random_state=42)
    rf.fit(X_tr, y_tr); lr.fit(X_tr, y_tr)

    rf_acc  = accuracy_score(y_te, rf.predict(X_te))
    lr_acc  = accuracy_score(y_te, lr.predict(X_te))
    rf_prec = precision_score(y_te, rf.predict(X_te), zero_division=0)
    rf_rec  = recall_score(y_te, rf.predict(X_te), zero_division=0)
    rf_f1   = f1_score(y_te, rf.predict(X_te), zero_division=0)
    rf_auc  = roc_auc_score(y_te, rf.predict_proba(X_te)[:,1])
    lr_prec = precision_score(y_te, lr.predict(X_te), zero_division=0)
    lr_rec  = recall_score(y_te, lr.predict(X_te), zero_division=0)
    lr_f1   = f1_score(y_te, lr.predict(X_te), zero_division=0)
    lr_auc  = roc_auc_score(y_te, lr.predict_proba(X_te)[:,1])

    print(f"RF: {rf_acc:.4f}  LR: {lr_acc:.4f}")

    # Baseline signals (no drift)
    base_scores = rf.predict_proba(X_te)[:, 1]
    base_inc    = X_te[:, 4]   # LIMIT_BAL proxy; adjust col index if needed
    base_cr     = X_te[:, 0]

    # Per-scenario evaluation
    scenarios = {
        "Baseline": (X_te, y_te),
        "S1":       (inject_s1(X_te), y_te),
        "S2":       (inject_s2(X_te), y_te),
        "S3":       inject_s3(X_te, y_te),
        "S4":       inject_s4(X_te, y_te),
    }

    scenario_alerts = {}
    detected_multi = 0
    detected_psi   = 0
    tp_multi = tn_multi = fp_multi = fn_multi = 0

    for sc_name, (X_sc, y_sc) in scenarios.items():
        sc_scores = rf.predict_proba(X_sc)[:, 1]
        sc_inc    = X_sc[:, 4]
        sc_cr     = X_sc[:, 0]

        psi_out = compute_psi(base_scores, sc_scores)
        psi_inc = compute_psi_log(base_inc, sc_inc)
        psi_cr  = compute_psi(base_cr, sc_cr)
        kl_val  = compute_kl(base_scores, sc_scores)
        rho_val = spearmanr(base_scores, sc_scores).statistic
        base_preds = (base_scores >= 0.5).astype(int)
        sc_preds   = (sc_scores   >= 0.5).astype(int)
        fr_val  = np.mean(base_preds != sc_preds)

        alert = get_alert(psi_out, psi_inc, psi_cr, kl_val, rho_val, fr_val)
        psi_alert = tier(psi_out, PSI_WARN, PSI_CRIT)

        scenario_alerts[sc_name] = {
            "psi_out": psi_out, "psi_inc": psi_inc, "psi_cr": psi_cr,
            "kl": kl_val, "rho": rho_val, "fr": fr_val,
            "alert": alert, "psi_alert": psi_alert
        }
        table4_signals[sc_name].append(scenario_alerts[sc_name])

        # Regression point
        ref = REFERENCE_LEVELS[sc_name]
        # Predicted score: normalize max tier to [0, 0.5]
        sig_vals = [psi_out, psi_inc, psi_cr, kl_val, 1 - rho_val, fr_val]
        pred_score = max(sig_vals) * 0.5 / max(max(sig_vals), 1e-9)
        pred_score = min(pred_score, 0.5)
        regression_points.append((ref, pred_score))

        # Detection counting
        is_drift = sc_name != "Baseline"
        multi_detected = alert >= 1
        psi_detected   = psi_alert >= 1

        if is_drift:
            if multi_detected: tp_multi += 1
            else:              fn_multi += 1
            if psi_detected:   detected_psi += 1
        else:
            if not multi_detected: tn_multi += 1
            else:                  fp_multi += 1

        print(f"  {sc_name}: PSI_out={psi_out:.3f} PSI_inc={psi_inc:.3f} "
              f"KL={kl_val:.3f} rho={rho_val:.3f} FR={fr_val:.3f} "
              f"Alert={ALERT_NAMES[alert]}")

    da_multi = (tp_multi + tn_multi) / (tp_multi + tn_multi + fp_multi + fn_multi)
    da_psi   = (detected_psi + (1 if scenario_alerts["Baseline"]["psi_alert"] == 0 else 0)) / 5
    fnr = fn_multi / max(tp_multi + fn_multi, 1)

    # Recovery time: time one retrain
    t0 = time.time()
    rf2 = RandomForestClassifier(n_estimators=100, max_depth=10,
                                 min_samples_leaf=5, random_state=42, n_jobs=-1)
    rf2.fit(X_tr, y_tr)
    recovery_time = (time.time() - t0) / 60  # minutes

    results.append({
        "fold": fold + 1,
        "rf_acc": rf_acc, "lr_acc": lr_acc,
        "rf_prec": rf_prec, "rf_rec": rf_rec, "rf_f1": rf_f1, "rf_auc": rf_auc,
        "lr_prec": lr_prec, "lr_rec": lr_rec, "lr_f1": lr_f1, "lr_auc": lr_auc,
        "da_multi": da_multi, "da_psi": da_psi,
        "fnr": fnr, "recovery_min": recovery_time,
    })

# ── 6. Summary output ─────────────────────────────────────────────────────────
df = pd.DataFrame(results)

print("\n" + "="*60)
print("TABLE CV1 — FOLD-LEVEL RESULTS")
print("="*60)
for _, r in df.iterrows():
    print(f"Fold {int(r.fold)}: RF={r.rf_acc*100:.1f}% LR={r.lr_acc*100:.1f}% "
          f"Multi={r.da_multi*100:.1f}% PSI={r.da_psi*100:.1f}% "
          f"Recovery={r.recovery_min:.1f}min FNR={r.fnr*100:.1f}%")

print("\nMEANS ± SD:")
for col, label in [("rf_acc","RF Acc"), ("lr_acc","LR Acc"),
                   ("da_multi","Multi-Signal DA"), ("da_psi","PSI-Only DA"),
                   ("recovery_min","Recovery (min)"), ("fnr","FNR")]:
    print(f"  {label}: {df[col].mean()*100:.1f}% ± {df[col].std()*100:.1f}%")

print("\nTABLE 1 — CLASSIFIER PERFORMANCE:")
for col, label in [("rf_prec","RF Prec"), ("rf_rec","RF Rec"),
                   ("rf_f1","RF F1"), ("rf_auc","RF AUC"),
                   ("lr_prec","LR Prec"), ("lr_rec","LR Rec"),
                   ("lr_f1","LR F1"), ("lr_auc","LR AUC")]:
    print(f"  {label}: {df[col].mean():.3f}")

print("\nTABLE 4 — SIGNAL VALUES (mean across folds):")
for sc in ["Baseline", "S1", "S2", "S3", "S4"]:
    sigs = table4_signals[sc]
    print(f"  {sc}: PSI_out={np.mean([s['psi_out'] for s in sigs]):.3f} "
          f"PSI_inc={np.mean([s['psi_inc'] for s in sigs]):.3f} "
          f"KL={np.mean([s['kl'] for s in sigs]):.3f} "
          f"rho={np.mean([s['rho'] for s in sigs]):.3f} "
          f"FR={np.mean([s['fr'] for s in sigs])*100:.1f}% "
          f"Alert={ALERT_NAMES[round(np.mean([s['alert'] for s in sigs]))]}")

print("\nREGRESSION ANALYSIS:")
refs  = np.array([p[0] for p in regression_points])
preds = np.array([p[1] for p in regression_points])
r = np.corrcoef(refs, preds)[0, 1]
resid = preds - refs
print(f"  R = {r:.4f}")
print(f"  Residual mean (mu) = {resid.mean():.6f}")
print(f"  Residual std  (sigma) = {resid.std():.4f}")

print("\nIN-SAMPLE TRAINING ACCURACY (fold 1, for §6.5):")
# Refit fold 1 and report train accuracy
fold1_train = list(skf.split(X_exp, y_exp))[0][0]
fold1_test  = list(skf.split(X_exp, y_exp))[0][1]
rf_f1_model = RandomForestClassifier(n_estimators=100, max_depth=10,
                                     min_samples_leaf=5, random_state=42, n_jobs=-1)
rf_f1_model.fit(X_exp[fold1_train], y_exp[fold1_train])
train_acc = accuracy_score(y_exp[fold1_train], rf_f1_model.predict(X_exp[fold1_train]))
print(f"  RF training accuracy (fold 1): {train_acc*100:.1f}%")

print("\nDONE. Paste full output back.")
