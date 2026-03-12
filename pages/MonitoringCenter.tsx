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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Drift Analysis</h3>
          <div className="flex items-end gap-4 mb-2">
            <span className="text-4xl font-black text-white">{metrics.psi.toFixed(3)}</span>
            <span className={`text-xs font-bold mb-1 ${metrics.psi < 0.1 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {metrics.psi < 0.1 ? 'Stable' : 'Drift Alert'}
            </span>
          </div>
          <p className="text-xs text-slate-500">Population Stability Index (PSI)</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Prediction Flip Rate</h3>
          <div className="flex items-end gap-4 mb-2">
            <span className="text-4xl font-black text-white">{(metrics.flipRate * 100).toFixed(1)}%</span>
            <span className="text-xs font-bold mb-1 text-emerald-500">Normal</span>
          </div>
          <p className="text-xs text-slate-500">Rate of decision changes vs baseline</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Rank Correlation</h3>
          <div className="flex items-end gap-4 mb-2">
            <span className="text-4xl font-black text-white">{metrics.spearmanRank.toFixed(2)}</span>
            <span className="text-xs font-bold mb-1 text-emerald-500">High</span>
          </div>
          <p className="text-xs text-slate-500">Spearman's Rank Correlation</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Live Decision Stream</h3>
          <span className="text-xs text-slate-500 font-mono">Monitoring {applicants.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">Applicant</th>
                <th className="px-6 py-4">Credit Score</th>
                <th className="px-6 py-4">Income</th>
                <th className="px-6 py-4">Risk Prob</th>
                <th className="px-6 py-4">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {applicants.slice(0, 10).map(app => (
                <tr key={app.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-white">{app.name}</p>
                    <p className="text-[10px] text-slate-500">{app.id}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{app.creditScore}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">${app.income.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${app.riskProbability > 0.6 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${app.riskProbability * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{(app.riskProbability * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${app.decision === 'Approve' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
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
