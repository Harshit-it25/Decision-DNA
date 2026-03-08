
import React, { useState, useMemo } from 'react';
import { AuditEntry } from '../types';
import { Clock, Filter, Search, X, AlertCircle, Hash, Terminal as TerminalIcon, Play, Database, Sparkles, RefreshCw } from 'lucide-react';
import { executeSQL } from '../services/sqlEngine';
import { generateSQL } from '../services/geminiService';

interface AuditTimelineProps {
  logs: AuditEntry[];
}

const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  
  // SQL State
  const [showSqlConsole, setShowSqlConsole] = useState(false);
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM auditLogs WHERE severity = 'CRITICAL'");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [sqlResults, setSqlResults] = useState<any[] | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleRunSQL = async () => {
    setIsExecuting(true);
    setSqlError(null);
    try {
      const results = await executeSQL(sqlQuery);
      setSqlResults(results);
    } catch (err: any) {
      setSqlError(err.message || "Query execution failed.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleGenerateSQL = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    const generated = await generateSQL(aiPrompt);
    if (generated) setSqlQuery(generated);
    setIsAiLoading(false);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || log.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "All" || log.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [logs, searchTerm, categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">System Audit Trail</h2>
          <p className="text-sm text-slate-400 font-medium">Persistent forensic records for compliance</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              if(confirm("Are you sure? This will permanently delete all applicants and logs.")) {
                window.indexedDB.deleteDatabase("DecisionDNADB");
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Purge All Data
          </button>
          <button onClick={() => setShowSqlConsole(!showSqlConsole)} className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition-all ${showSqlConsole ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}><TerminalIcon size={14} /> SQL Terminal</button>
        </div>
      </div>

      {showSqlConsole && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-in slide-in-from-top-4">
          <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest"><Database size={14} /> AI-Powered SQL Terminal</div>
            <div className="text-[9px] text-slate-600 font-mono">TABLES: applicants, models, auditLogs</div>
          </div>
          
          <div className="p-6 space-y-4">
             {/* AI Prompt Input */}
             <div className="relative group">
                <input 
                  type="text" 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask AI to write SQL: e.g. 'Show me Canadians with credit score over 700'"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-32 py-3 text-xs text-slate-300 outline-none focus:border-indigo-500/50 transition-all shadow-inner"
                />
                <button 
                  onClick={handleGenerateSQL}
                  disabled={isAiLoading}
                  className="absolute right-2 top-2 bottom-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isAiLoading ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                  Generate SQL
                </button>
             </div>

             <div className="relative">
                <textarea value={sqlQuery} onChange={(e) => setSqlQuery(e.target.value)} className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-400 outline-none focus:border-emerald-500/30 transition-all resize-none shadow-inner" spellCheck={false} />
                <button onClick={handleRunSQL} disabled={isExecuting} className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg transition-all shadow-xl disabled:opacity-50"><Play size={12} /> Run Query</button>
             </div>

             {sqlError && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 font-mono">ERROR: {sqlError}</div>}
             {sqlResults && (
               <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                 <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800 text-[9px] font-mono text-slate-500 uppercase">{sqlResults.length} ROWS FOUND</div>
                 <div className="max-h-60 overflow-auto terminal-scroll p-4"><pre className="text-[10px] text-emerald-300/80 leading-relaxed font-mono">{JSON.stringify(sqlResults, null, 2)}</pre></div>
               </div>
             )}
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        {filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs opacity-50">No forensic data found</div>
        ) : (
          <div className="border-l border-slate-800 ml-4 pl-8 space-y-10">
            {filteredLogs.map(log => (
              <div key={log.id} className="relative">
                <div className={`absolute -left-[44px] w-6 h-6 rounded-full border-4 border-slate-950 flex items-center justify-center ${log.severity === 'CRITICAL' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-slate-700'}`}><Clock size={10} className="text-white" /></div>
                <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-slate-200">{log.action}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${log.category === 'ATTACK' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>{log.category}</span>
                    <span className="text-[9px] font-mono text-slate-600">ID: {log.id}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{log.details}</p>
                  <div className="mt-3 text-[9px] font-mono text-slate-600">{new Date(log.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTimeline;
