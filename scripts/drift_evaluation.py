import numpy as np
from sklearn.datasets import fetch_openml
from sklearn.utils import resample
from river.drift import ADWIN
from river.drift.binary import DDM
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold

# ── 1. Load and expand dataset ────────────────────────────────────────────────
print("Loading dataset...")
data = fetch_openml(name="default-of-credit-card-clients", version=1, as_frame=True)
X, y = data.data.astype(float).values, data.target.astype(int).values
X_exp, y_exp = resample(X, y, n_samples=100_000, stratify=y, random_state=42)

# ── 2. Drift injection functions ──────────────────────────────────────────────
rng = np.random.default_rng(42)

def inject_s1(X):
    """Covariate shift: Gaussian noise on all features."""
    return X + rng.normal(0, 0.5, X.shape)

def inject_s2(X):
    """Feature distribution shift: LIMIT_BAL right-shifted by 1.5 SD."""
    X_d = X.copy()
    X_d[:, 0] += 1.5 * X[:, 0].std()  # column 0 = LIMIT_BAL
    return X_d

def inject_s3(X, y):
    """Concept drift: flip 15% of labels."""
    y_d = y.copy()
    idx = rng.choice(len(y_d), int(len(y_d) * 0.15), replace=False)
    y_d[idx] = 1 - y_d[idx]
    return X.copy(), y_d

def inject_s4(X, y):
    """Compound: S1 + S3 simultaneously."""
    X_d = inject_s1(X)
    X_d, y_d = inject_s3(X_d, y)
    return X_d, y_d

# ── 3. Detector runner ────────────────────────────────────────────────────────
def run_detector(detector, errors):
    for i, err in enumerate(errors):
        detector.update(err)
        if detector.drift_detected:
            return True, i
    return False, -1

# ── 4. Evaluate ───────────────────────────────────────────────────────────────
scenarios = {
    "S1": lambda X, y: (inject_s1(X), y),
    "S2": lambda X, y: (inject_s2(X), y),
    "S3": lambda X, y: inject_s3(X, y),
    "S4": lambda X, y: inject_s4(X, y),
}

results = {det: {sc: [] for sc in scenarios} for det in ["ADWIN", "DDM"]}
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

for fold, (train_idx, test_idx) in enumerate(skf.split(X_exp, y_exp)):
    print(f"\nFold {fold+1}/5")
    X_tr, X_te = X_exp[train_idx], X_exp[test_idx]
    y_tr, y_te = y_exp[train_idx], y_exp[test_idx]

    rf = RandomForestClassifier(n_estimators=100, max_depth=10,
                                min_samples_leaf=5, random_state=42)
    rf.fit(X_tr, y_tr)

    for sc, inject_fn in scenarios.items():
        X_d, y_d = inject_fn(X_te, y_te)
        errors = (rf.predict(X_d) != y_d).astype(int).tolist()

        for det_name, detector in [("ADWIN", ADWIN()), ("DDM", DDM())]:
            detected, at_sample = run_detector(detector, errors)
            results[det_name][sc].append(int(detected))
            print(f"  {det_name} {sc}: {'DETECTED at sample ' + str(at_sample) if detected else 'MISSED'}")

# ── 5. Summary ────────────────────────────────────────────────────────────────
print("\n=== FINAL RESULTS ===")
for det in ["ADWIN", "DDM"]:
    for sc in ["S1", "S2", "S3", "S4"]:
        folds = results[det][sc]
        print(f"{det} {sc}: {sum(folds)/len(folds)*100:.0f}% ({sum(folds)}/{len(folds)} folds detected)")
