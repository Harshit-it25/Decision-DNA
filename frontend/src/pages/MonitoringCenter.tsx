import React from 'react';
import { Activity, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DriftMetrics, SecurityStatus, Applicant } from '../types';

interface MonitoringCenterProps {
  metrics: DriftMetrics;
  security: SecurityStatus;
  applicants: Applicant[];
}

const MonitoringCenter: React.FC<MonitoringCenterProps> = ({ metrics, security, applicants }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <h3 className="text-xs font-bold text-neutral-secondary uppercase tracking-widest mb-4 flex justify-between">
            <span>Drift Analysis</span>
            <span className={metrics.psi < 0.1 && (metrics.featurePsi?.income || 0) < 0.1 && (metrics.featurePsi?.creditScore || 0) < 0.1 ? 'text-success' : 'text-danger'}>
              {metrics.psi < 0.1 && (metrics.featurePsi?.income || 0) < 0.1 && (metrics.featurePsi?.creditScore || 0) < 0.1 ? 'Stable' : 'Drift Alert'}
            </span>
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-2xl font-bold text-neutral-text">{metrics.psi.toFixed(3)}</div>
              <p className="text-[10px] text-neutral-secondary uppercase">Output</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-text truncate">{(metrics.featurePsi?.income || 0).toFixed(3)}</div>
              <p className="text-[10px] text-neutral-secondary uppercase">Income</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-text truncate">{(metrics.featurePsi?.creditScore || 0).toFixed(3)}</div>
              <p className="text-[10px] text-neutral-secondary uppercase">Credit</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-neutral-secondary uppercase tracking-widest mb-4">Prediction Flip Rate</h3>
          <div className="flex items-end gap-4 mb-2">
            <span className="text-4xl font-bold text-neutral-text">{(metrics.flipRate * 100).toFixed(1)}%</span>
            <span className="text-xs font-bold mb-1 text-success">Normal</span>
          </div>
          <p className="text-xs text-neutral-secondary">Rate of decision changes vs baseline</p>
        </div>
        <div className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-neutral-secondary uppercase tracking-widest mb-4">Rank Correlation</h3>
          <div className="flex items-end gap-4 mb-2">
            <span className="text-4xl font-bold text-neutral-text">{metrics.spearmanRank.toFixed(2)}</span>
            <span className="text-xs font-bold mb-1 text-success">High</span>
          </div>
          <p className="text-xs text-neutral-secondary">Spearman's Rank Correlation</p>
        </div>
      </div>

      <div className="bg-white border border-neutral-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-neutral-border flex justify-between items-center bg-white">
          <h3 className="text-lg font-bold text-neutral-text">Live Decision Stream</h3>
          <span className="text-xs text-neutral-secondary font-mono">Monitoring {applicants.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-bg text-[10px] font-black text-neutral-secondary uppercase tracking-widest border-b border-neutral-border">
                <th className="px-6 py-4">Applicant</th>
                <th className="px-6 py-4">Credit Score</th>
                <th className="px-6 py-4">Income</th>
                <th className="px-6 py-4">Risk Prob</th>
                <th className="px-6 py-4">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border bg-white">
              {applicants.slice(0, 10).map((app, index) => (
                <tr key={app.id} className="even:bg-neutral-bg/30 hover:bg-burgundy-light/20 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-neutral-text">{app.name}</p>
                    <p className="text-[10px] text-neutral-secondary font-mono">{app.id}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-text">{app.creditScore}</td>
                  <td className="px-6 py-4 text-sm text-neutral-text">${app.income.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-neutral-border rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${app.riskProbability > 0.6 ? 'bg-danger' : 'bg-success'}`} style={{ width: `${app.riskProbability * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-neutral-secondary">{(app.riskProbability * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${app.decision === 'Approve' ? 'bg-success-light border-success/20 text-success' : 'bg-danger-light border-danger/20 text-danger'}`}>
                      {app.decision}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonitoringCenter;
