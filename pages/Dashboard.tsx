
import React, { useState, useEffect } from 'react';
import { 
  ModelMetadata, DriftMetrics, SecurityStatus, AuditEntry, 
  ThreatLevel, IntegrityStatus 
} from '../types';
import { 
  ShieldCheck, AlertCircle, Zap, Crosshair, 
  BarChart2, ShieldAlert, Cpu, Activity, Info, Terminal, AlertTriangle, Sparkles, RefreshCw, Search
} from 'lucide-react';
import { performDeepScan, AITier } from '../services/geminiService';
import { getSystemInfo } from '../api/systemApi';

// Reusable Components
import StatCard from '../components/cards/StatCard';
import StabilityChart from '../components/charts/StabilityChart';
import SecurityAlert from '../components/alerts/SecurityAlert';

interface DashboardProps {
  activeModel: ModelMetadata;
  metrics: DriftMetrics;
  security: SecurityStatus;
  auditLogs: AuditEntry[];
  insight: string;
  aiTier: AITier;
}

const Dashboard: React.FC<DashboardProps> = ({ activeModel, metrics, security, auditLogs, insight, aiTier }) => {
  const [deepScanResult, setDeepScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);

  useEffect(() => {
    getSystemInfo()
      .then(data => setSystemInfo(data))
      .catch(err => console.error("Failed to fetch system info", err));
  }, []);

  const chartData = [
    { name: 'T-5', drift: 0.02, risk: 0.1 },
    { name: 'T-4', drift: 0.05, risk: 0.12 },
    { name: 'T-3', drift: 0.03, risk: 0.11 },
    { name: 'T-2', drift: metrics.psi * 0.8, risk: 0.15 },
    { name: 'T-1', drift: metrics.psi * 0.9, risk: 0.22 },
    { name: 'Now', drift: metrics.psi, risk: security.threatLevel === ThreatLevel.CRITICAL ? 0.85 : 0.25 },
  ];

  const handleDeepScan = async () => {
    setIsScanning(true);
    const result = await performDeepScan(metrics, security, auditLogs);
    setDeepScanResult(result);
    setIsScanning(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Cpu className="text-emerald-400" />} 
          title="Active Model" 
          value={activeModel?.type || 'Uninitialized'} 
          subtitle={`Version ${activeModel?.version || '0.0.0'}`} 
        />
        <StatCard 
          icon={<ShieldAlert className={security.threatLevel === ThreatLevel.CRITICAL ? 'text-rose-400' : 'text-emerald-400'} />} 
          title="Threat Level" 
          value={security.threatLevel} 
          subtitle={security.integrity} 
          accent={security.threatLevel === ThreatLevel.CRITICAL} 
        />
        <StatCard 
          icon={<Activity className="text-indigo-400" />} 
          title="System Drift" 
          value={metrics.psi.toFixed(3)} 
          subtitle="PSI Threshold" 
        />
        <StatCard 
          icon={<Sparkles className={aiTier === 'performance' ? 'text-violet-400' : 'text-slate-400'} />} 
          title="Intelligence" 
          value={aiTier.toUpperCase()} 
          subtitle={aiTier === 'performance' ? "Gemini 3 Pro" : "Gemini 3 Flash"} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">Stability Over Time</h3>
            <button 
              onClick={handleDeepScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:border-indigo-500/50 transition-all shadow-inner disabled:opacity-50"
            >
              {isScanning ? <RefreshCw size={12} className="animate-spin" /> : <Search size={12} />}
              Run Deep Forensic Scan
            </button>
          </div>
          
          {deepScanResult && (
            <div className="mb-6">
              <SecurityAlert 
                type="ai" 
                title="Pro Analyst Report" 
                message={deepScanResult} 
                onDismiss={() => setDeepScanResult(null)} 
              />
            </div>
          )}

          <StabilityChart data={chartData} />
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Zap size={20} className="text-amber-400" /> AI Guardian
            </h3>
            <div className={`p-4 rounded-xl border ${security.threatLevel === ThreatLevel.CRITICAL ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-950 border-slate-800'}`}>
              <p className="text-xs text-slate-300 leading-relaxed italic">"{insight}"</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Recent Audit</h3>
            <div className="space-y-4 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
              {auditLogs.slice(0, 5).map(log => (
                <div key={log.id} className="flex gap-3 text-[10px] border-l border-slate-800 pl-3 pb-4 last:pb-0">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${log.severity === 'CRITICAL' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                  <div><div className="font-bold text-slate-300">{log.action}</div><div className="text-slate-600 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Terminal size={20} className="text-indigo-400" /> System Environment
            </h3>
            <div className="space-y-3 font-mono text-[10px]">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500 uppercase">Node.js</span>
                <span className="text-indigo-400">{systemInfo?.nodeVersion || 'v20.x'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500 uppercase">Platform</span>
                <span className="text-slate-300">{systemInfo?.platform || 'linux'} ({systemInfo?.arch || 'x64'})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500 uppercase">Runtime</span>
                <span className="text-slate-300">npm / tsx</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-500 uppercase">Node Path</span>
                <span className="text-[9px] text-slate-400 break-all bg-slate-950 p-2 rounded border border-slate-800">
                  {systemInfo?.nodePath || '/usr/local/bin/node'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
