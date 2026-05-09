import React from 'react';
import { History, Search, Filter, Download, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { AuditEntry } from '../types';

interface AuditTimelineProps {
  logs: AuditEntry[];
}

const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Immutable Audit Trail</h2>
          <p className="text-slate-500 text-sm">Cryptographically signed system logs for compliance.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500/50 w-64"
            />
          </div>
          <button className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all">
            <Filter size={18} />
          </button>
          <button className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all">
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="px-8 py-4">Timestamp</th>
                <th className="px-8 py-4">Category</th>
                <th className="px-8 py-4">Action</th>
                <th className="px-8 py-4">Details</th>
                <th className="px-8 py-4">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-xs text-slate-300 font-mono">{new Date(log.timestamp).toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/10 uppercase tracking-widest">
                      {log.category}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{log.action}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs text-slate-500 max-w-md line-clamp-2">{log.details}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {log.severity === 'CRITICAL' ? <AlertCircle size={14} className="text-rose-500" /> : 
                       log.severity === 'WARNING' ? <AlertCircle size={14} className="text-amber-500" /> : 
                       <CheckCircle2 size={14} className="text-emerald-500" />}
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        log.severity === 'CRITICAL' ? 'text-rose-500' : 
                        log.severity === 'WARNING' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {log.severity}
                      </span>
                    </div>
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

export default AuditTimeline;
