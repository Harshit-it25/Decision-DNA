import React from 'react';
import { History, Search, Filter, Download, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { AuditEntry } from '../types';

interface AuditTimelineProps {
  logs: AuditEntry[];
}

const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans text-neutral-text">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-text uppercase tracking-tight">Immutable Audit Trail</h2>
          <p className="text-neutral-secondary text-sm">Cryptographically signed system logs for compliance.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-secondary" size={14} />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="pl-10 pr-4 py-2 bg-white border border-neutral-border rounded-xl text-xs text-neutral-text outline-none focus:border-burgundy/50 w-64 shadow-sm"
            />
          </div>
          <button className="p-2 bg-white border border-neutral-border rounded-xl text-neutral-secondary hover:text-burgundy transition-all shadow-sm">
            <Filter size={18} />
          </button>
          <button className="p-2 bg-white border border-neutral-border rounded-xl text-neutral-secondary hover:text-burgundy transition-all shadow-sm">
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-bg text-[10px] font-black text-neutral-secondary uppercase tracking-widest border-b border-neutral-border">
                <th className="px-8 py-4">Timestamp</th>
                <th className="px-8 py-4">Category</th>
                <th className="px-8 py-4">Action</th>
                <th className="px-8 py-4">Details</th>
                <th className="px-8 py-4">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border bg-white">
              {logs.map(log => (
                <tr key={log.id} className="even:bg-neutral-bg/30 hover:bg-burgundy-light/20 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-xs text-neutral-secondary font-mono">{new Date(log.timestamp).toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-bold text-burgundy bg-burgundy-light/30 px-2 py-1 rounded border border-burgundy/10 uppercase tracking-widest">
                      {log.category}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-neutral-text group-hover:text-burgundy transition-colors">{log.action}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs text-neutral-secondary max-w-md line-clamp-2">{log.details}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {log.severity === 'CRITICAL' ? <AlertCircle size={14} className="text-danger" /> : 
                       log.severity === 'WARNING' ? <AlertCircle size={14} className="text-warning" /> : 
                       <CheckCircle2 size={14} className="text-success" />}
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${
                        log.severity === 'CRITICAL' ? 'text-danger' : 
                        log.severity === 'WARNING' ? 'text-warning' : 'text-success'
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
