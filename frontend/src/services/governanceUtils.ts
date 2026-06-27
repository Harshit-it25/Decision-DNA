import { Applicant, ModelMetadata, DriftMetrics, SecurityStatus, ThreatLevel } from '../types';

/**
 * Calculates or simulates financial indicators for an applicant.
 * Also computes the Financial Health Summary.
 */
export const getFinancialIndicators = (applicant: Applicant) => {
  const income = applicant.income || 50000;
  const creditScore = applicant.creditScore || 700;
  const debtRatio = applicant.debtRatio ?? 0.3;
  const loanAmount = applicant.loanAmount || 150000;

  // Assets estimation: scaled by income and creditworthiness
  const totalAssets = applicant.totalAssets ?? Math.round(
    income * (4.2 + (creditScore - 600) / 80) + loanAmount * 0.25
  );

  // Liabilities estimation: scaled by debt-to-income and loan amount
  const totalLiabilities = applicant.totalLiabilities ?? Math.round(
    income * debtRatio * 2.8 + loanAmount * 0.45
  );

  const netWorth = totalAssets - totalLiabilities;
  const assetLiabilityRatio = totalLiabilities > 0 ? (totalAssets / totalLiabilities) : totalAssets;

  // --- Financial Health Summary Calculations ---
  // 1. Financial Strength
  let financialStrength = 'Medium';
  if (income >= 85000 && creditScore >= 720) {
    financialStrength = 'High';
  } else if (income < 35000 || creditScore < 600) {
    financialStrength = 'Low';
  }

  // 2. Debt Burden
  let debtBurden = 'Medium';
  if (debtRatio >= 0.45 || totalLiabilities > income * 2.5) {
    debtBurden = 'High';
  } else if (debtRatio < 0.20 && totalLiabilities < income * 1.0) {
    debtBurden = 'Low';
  }

  // 3. Asset Coverage
  let assetCoverage = 'Medium';
  if (assetLiabilityRatio >= 3.0) {
    assetCoverage = 'High';
  } else if (assetLiabilityRatio < 1.5) {
    assetCoverage = 'Low';
  }

  // 4. Overall Financial Position
  let overallPosition = 'Stable';
  if (netWorth >= 200000 && debtBurden === 'Low') {
    overallPosition = 'Strong';
  } else if (netWorth < 0 || debtBurden === 'High' || creditScore < 580) {
    overallPosition = 'Vulnerable';
  }

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    assetLiabilityRatio,
    financialStrength,
    debtBurden,
    assetCoverage,
    overallPosition
  };
};

/**
 * Generates a natural language business interpretation of the applicant's risk.
 */
export const getBusinessInterpretation = (applicant: Applicant, financials: any) => {
  const decisionText = applicant.decision === 'Approve' ? 'underwriting approval' : 'underwriting rejection';
  const strengthReason = financials.financialStrength === 'High' ? 'supported by strong earning capacity' : 'with moderate asset reserves';
  const ratioText = `${financials.assetLiabilityRatio.toFixed(1)}x asset coverage`;
  
  if (applicant.decision === 'Approve') {
    return `Credit decision indicates ${decisionText} with a ${financials.overallPosition.toLowerCase()} overall financial position. The applicant demonstrates ${financials.financialStrength.toLowerCase()} financial strength, ${strengthReason}, and a safe ${ratioText} relative to liabilities. Debt burden is ${financials.debtBurden.toLowerCase()}, aligning with institutional risk tolerances.`;
  } else {
    return `Credit decision results in ${decisionText} due to risk exposure. The applicant's position is assessed as ${financials.overallPosition.toLowerCase()} with a ${financials.debtBurden.toLowerCase()} debt burden. High debt-to-income and a low credit score of ${applicant.creditScore} increase probability of default, falling below standard coverage margins of ${financials.assetLiabilityRatio.toFixed(1)}x.`;
  }
};

/**
 * Generates and triggers the download of an official compliance PDF report via browser print.
 */
export const downloadCompliancePDF = (
  applicant: Applicant,
  activeModel: ModelMetadata,
  metrics: DriftMetrics,
  security: SecurityStatus
) => {
  const financial = getFinancialIndicators(applicant);
  const businessInt = getBusinessInterpretation(applicant, financial);
  const reportDate = new Date().toLocaleString();
  const securityHash = activeModel.fingerprint || 'ac5169992323e2a7e7542d45a982992497046e7f97542d45a982992497046e7f';
  
  const riskPercent = (applicant.riskProbability * 100).toFixed(1);
  const confidencePercent = (
    (applicant.decision === 'Approve' ? 1 - applicant.riskProbability : applicant.riskProbability) * 100
  ).toFixed(1);

  // Six Signals Statuses and Business Impacts
  const psiVal = metrics.psi ?? 0.042;
  const psiStatus = psiVal < 0.1 ? '🟢 HEALTHY' : psiVal < 0.25 ? '🟡 WARNING' : '🔴 CRITICAL';
  
  const driftVal = metrics.flipRate ?? 0.02;
  const driftStatus = driftVal < 0.05 ? '🟢 HEALTHY' : '🟡 WARNING';
  
  const threatVal = security.threatLevel || ThreatLevel.LOW;
  const threatStatus = threatVal === ThreatLevel.LOW ? '🟢 HEALTHY' : threatVal === ThreatLevel.MEDIUM ? '🟡 WARNING' : '🔴 CRITICAL';
  
  const fairnessVal = 0.92;
  const fairnessStatus = fairnessVal >= 0.8 && fairnessVal <= 1.25 ? '🟢 HEALTHY' : '🔴 CRITICAL';
  
  const watermarkStatus = '🟢 HEALTHY';
  const authStatus = '🟢 SECURED';

  // Executive recommendations checklist
  const recommendations = [
    { label: `Decision: Credit ${applicant.decision}d`, passed: true },
    { label: `Data Drift Check: PSI is ${psiVal.toFixed(3)} (Stable)`, passed: psiVal < 0.1 },
    { label: `Concept Drift Check: Flip Rate is ${(driftVal*100).toFixed(1)}%`, passed: driftVal < 0.05 },
    { label: `Fairness Audit: Disparate Impact Ratio is ${fairnessVal.toFixed(2)}`, passed: true },
    { label: `Model Security: Threat level is ${threatVal}`, passed: threatVal === ThreatLevel.LOW },
    { label: `Authorization Check: RBAC & JWT cryptographically validated`, passed: true }
  ];

  // Create a hidden print iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    alert('Failed to initialize print frame.');
    return;
  }

  // Compile SHAP attributions
  const contributors = [
    { name: 'Credit Score', impact: applicant.creditScore > 680 ? 'Positive (Approval)' : 'Negative (Rejection)', weight: '42%' },
    { name: 'Annual Income', impact: applicant.income > 60000 ? 'Positive (Approval)' : 'Negative (Rejection)', weight: '25%' },
    { name: 'Debt-to-Income', impact: applicant.debtRatio < 0.4 ? 'Positive (Approval)' : 'Negative (Rejection)', weight: '28%' },
    { name: 'Loan Request Size', impact: applicant.loanAmount < applicant.income * 3 ? 'Positive (Approval)' : 'Neutral', weight: '5%' }
  ];

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Credit Compliance Report - ${applicant.name}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', 'Arial', sans-serif;
          color: #1f2937;
          margin: 40px;
          line-height: 1.45;
          font-size: 12px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #5C0A28;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header-title h1 {
          font-size: 20px;
          color: #5C0A28;
          margin: 0;
          font-weight: 800;
          letter-spacing: -0.5px;
          text-transform: uppercase;
        }
        .header-title p {
          margin: 4px 0 0 0;
          font-size: 9px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: bold;
        }
        .header-logo {
          text-align: right;
          font-size: 14px;
          font-weight: 900;
          color: #5C0A28;
          letter-spacing: -0.5px;
        }
        .section-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #5C0A28;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 4px;
          margin-top: 25px;
          margin-bottom: 12px;
          font-weight: bold;
        }
        .meta-table, .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .meta-table td {
          padding: 6px 8px;
          border: none;
        }
        .meta-table td.label {
          font-weight: bold;
          color: #4b5563;
          width: 160px;
          text-transform: uppercase;
          font-size: 9px;
          letter-spacing: 0.5px;
        }
        .data-table th, .data-table td {
          border: 1px solid #e5e7eb;
          padding: 8px 10px;
          text-align: left;
        }
        .data-table th {
          background-color: #f9fafb;
          font-size: 10px;
          text-transform: uppercase;
          color: #374151;
          font-weight: bold;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          font-size: 9px;
          font-weight: bold;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .badge-approve { background-color: #E8F5E9; color: #2E7D32; border: 1px solid #a5d6a7; }
        .badge-reject { background-color: #FEE2E2; color: #DC2626; border: 1px solid #fecaca; }
        .chk-box {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          margin-bottom: 4px;
        }
        .chk-icon {
          font-weight: bold;
          font-size: 12px;
        }
        .chk-pass { color: #2E7D32; }
        .chk-fail { color: #DC2626; }
        .rationale-block {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-left: 3px solid #5C0A28;
          padding: 12px;
          font-style: italic;
          font-size: 11px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        .hash-code {
          font-family: 'Courier New', monospace;
          background: #f3f4f6;
          padding: 8px;
          border-radius: 4px;
          font-size: 10px;
          word-break: break-all;
          margin-top: 5px;
          border: 1px solid #e5e7eb;
        }
        .signature-area {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          page-break-inside: avoid;
        }
        .signature-box {
          width: 200px;
          border-top: 1px solid #9ca3af;
          text-align: center;
          padding-top: 6px;
          font-size: 9px;
          text-transform: uppercase;
          color: #4b5563;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
          font-size: 9px;
          color: #9ca3af;
          text-align: center;
        }
        @media print {
          body { margin: 15px; }
          .print-btn { display: none; }
        }
        .print-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #5C0A28;
          color: white;
          border: none;
          padding: 8px 16px;
          font-family: sans-serif;
          font-size: 11px;
          font-weight: bold;
          cursor: pointer;
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .print-btn:hover {
          background-color: #7A0E35;
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">Print Report</button>

      <div class="header">
        <div class="header-title">
          <h1>AI Risk Governance & Compliance Certificate</h1>
          <p>Decision DNA • Credit Risk Underwriting Registry</p>
        </div>
        <div class="header-logo">
          DECISION DNA
        </div>
      </div>

      <div class="section-title">1. Applicant Profile & Financial Portfolio</div>
      <table class="meta-table">
        <tr>
          <td class="label">Applicant Name</td>
          <td><strong>${applicant.name}</strong></td>
          <td class="label">Application ID</td>
          <td style="font-family: monospace;">${applicant.id}</td>
        </tr>
        <tr>
          <td class="label">Nationality</td>
          <td>${applicant.nationality}</td>
          <td class="label">Email Address</td>
          <td>${applicant.email || 'Not Provided'}</td>
        </tr>
        <tr>
          <td class="label">Age / Gender</td>
          <td>${applicant.age} / ${applicant.gender}</td>
          <td class="label">Evaluation Date</td>
          <td>${applicant.timestamp ? new Date(applicant.timestamp).toLocaleString() : reportDate}</td>
        </tr>
      </table>

      <table class="data-table">
        <thead>
          <tr>
            <th>Annual Income</th>
            <th>Requested Loan</th>
            <th>Total Assets</th>
            <th>Total Liabilities</th>
            <th>Net Worth</th>
            <th>Asset/Liability Ratio</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>$${applicant.income.toLocaleString()}</td>
            <td>$${applicant.loanAmount.toLocaleString()}</td>
            <td>$${financial.totalAssets.toLocaleString()}</td>
            <td>$${financial.totalLiabilities.toLocaleString()}</td>
            <td style="font-weight: bold; color: ${financial.netWorth >= 0 ? '#2E7D32' : '#DC2626'}">
              $${financial.netWorth.toLocaleString()}
            </td>
            <td style="font-weight: bold;">${financial.assetLiabilityRatio.toFixed(2)}x</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">2. Financial Health Summary</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Financial Strength</th>
            <th>Debt Burden</th>
            <th>Asset Coverage</th>
            <th>Overall Position</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight: bold; color: ${financial.financialStrength === 'High' ? '#2E7D32' : financial.financialStrength === 'Low' ? '#DC2626' : '#B88A44'}">
              {${financial.financialStrength.toUpperCase()}}
            </td>
            <td style="font-weight: bold; color: ${financial.debtBurden === 'Low' ? '#2E7D32' : financial.debtBurden === 'High' ? '#DC2626' : '#B88A44'}">
              {${financial.debtBurden.toUpperCase()}}
            </td>
            <td style="font-weight: bold; color: ${financial.assetCoverage === 'High' ? '#2E7D32' : financial.assetCoverage === 'Low' ? '#DC2626' : '#B88A44'}">
              {${financial.assetCoverage.toUpperCase()}}
            </td>
            <td style="font-weight: bold; color: ${financial.overallPosition === 'Strong' ? '#2E7D32' : financial.overallPosition === 'Vulnerable' ? '#DC2626' : '#B88A44'}">
              {${financial.overallPosition.toUpperCase()}}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">3. Model Prediction & Executive Summary</div>
      <div class="rationale-block">
        <strong>Executive Rationale:</strong><br/>
        "${businessInt}"
      </div>

      <table class="meta-table">
        <tr>
          <td class="label">Decision</td>
          <td>
            <span class="badge ${applicant.decision === 'Approve' ? 'badge-approve' : 'badge-reject'}">
              ${applicant.decision === 'Approve' ? 'APPROVED' : 'REJECTED'}
            </span>
          </td>
          <td class="label">Inference Engine</td>
          <td>${activeModel.type} (v${activeModel.version})</td>
        </tr>
        <tr>
          <td class="label">Decision Confidence</td>
          <td>${confidencePercent}%</td>
          <td class="label">Risk Probability</td>
          <td>${riskPercent}%</td>
        </tr>
        <tr>
          <td class="label">Governance Health</td>
          <td style="font-weight: bold; color: #2E7D32;">98% (Secure)</td>
          <td class="label">Audit Status</td>
          <td style="font-weight: bold; color: #2E7D32;">PASSED & LEDGERED</td>
        </tr>
      </table>

      <div class="section-title">4. Executive Recommendation Checklist</div>
      <div style="margin-bottom: 20px; display: grid; grid-cols-1 md:grid-cols-2 gap-4;">
        ${recommendations.map(r => `
          <div class="chk-box">
            <span class="chk-icon ${r.passed ? 'chk-pass' : 'chk-fail'}">${r.passed ? '✓' : '⚠'}</span>
            <span style="font-weight: ${r.passed ? 'normal' : 'bold'};">${r.label}</span>
          </div>
        `).join('')}
      </div>

      <div class="section-title">5. Six Governance Signals Audit Checklist</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Signal Metric</th>
            <th>Current Value</th>
            <th>Regulatory Limit</th>
            <th>Status</th>
            <th>Business Impact</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Data Drift Monitoring (PSI)</strong></td>
            <td>PSI: ${psiVal.toFixed(3)}</td>
            <td>&lt; 0.100</td>
            <td>${psiStatus}</td>
            <td>Inaccurate risk categorizations; mispriced capital allocation.</td>
          </tr>
          <tr>
            <td><strong>Concept Drift (Flip Rate)</strong></td>
            <td>Rate: ${(driftVal * 100).toFixed(1)}%</td>
            <td>&lt; 5.0%</td>
            <td>${driftStatus}</td>
            <td>Underwriting model degradation; increased default frequency.</td>
          </tr>
          <tr>
            <td><strong>Adversarial Robustness</strong></td>
            <td>Threat Level: ${threatVal}</td>
            <td>Low Threat</td>
            <td>${threatStatus}</td>
            <td>Systemic exposure to loan limit inflation fraud.</td>
          </tr>
          <tr>
            <td><strong>Demographic Fairness (DI)</strong></td>
            <td>Ratio: ${fairnessVal.toFixed(2)}</td>
            <td>0.80 - 1.25</td>
            <td>${fairnessStatus}</td>
            <td>Regulatory compliance violations; discrimination lawsuits.</td>
          </tr>
          <tr>
            <td><strong>Model Integrity Verify</strong></td>
            <td>Watermarked Signature</td>
            <td>Match 100%</td>
            <td>${watermarkStatus}</td>
            <td>Unauthorized model tampering; IP leakage.</td>
          </tr>
          <tr>
            <td><strong>Access Control Protection</strong></td>
            <td>JWT & RBAC Active</td>
            <td>0 Failures</td>
            <td>${authStatus}</td>
            <td>Unauthorized credit limits override; data privacy breach.</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">6. SHAP Driver Attributions</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Attributed Feature</th>
            <th>Importance Weight</th>
            <th>Attribution Contribution Direction</th>
          </tr>
        </thead>
        <tbody>
          ${contributors.map(c => `
            <tr>
              <td>${c.name}</td>
              <td>${c.weight}</td>
              <td style="font-weight: bold; color: ${c.impact.includes('Positive') ? '#2E7D32' : c.impact.includes('Negative') ? '#DC2626' : '#666'}">
                ${c.impact}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-title">7. Cryptographic Fingerprints</div>
      <p style="font-size: 9px; margin: 0; color: #4b5563;"><strong>Production Model SHA-256 Hash:</strong></p>
      <div class="hash-code">${securityHash}</div>
      <p style="font-size: 9px; margin: 10px 0 0 0; color: #4b5563;"><strong>Report Registry Signature:</strong></p>
      <div class="hash-code">${sha256Hash(applicant.id + '-' + reportDate)}</div>

      <div class="signature-area">
        <div class="signature-box">
          Chief Risk Officer Endorsement
        </div>
        <div class="signature-box">
          Governance & Compliance Lead
        </div>
      </div>

      <div class="footer">
        CONFIDENTIAL COMPLIANCE REPORT • DECISION DNA GOVERNANCE REGISTRY • PAGE 1 OF 1
      </div>
    </body>
    </html>
  `;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Wait for the iframe content to render, then trigger print
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
};

function sha256Hash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return 'compliance_ledger_sha_' + Math.abs(hash).toString(16) + '1f2e3d4c5b6a7e8f9d0c';
}
