import React from 'react';
import { Shield, ShieldAlert, Zap, RotateCcw, AlertTriangle, Search, Lock, Activity } from 'lucide-react';
import { SecurityStatus, ThreatLevel, AuditEntry } from '../types';

interface SecurityCenterProps {
  security: SecurityStatus;
  onAttack: (type: string) => void;
  onReboot: () => void;
  logs: AuditEntry[];
}

const SecurityCenter: React.FC<SecurityCenterProps> = ({ security, onAttack, onReboot, logs }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Security Overview */}
          <div className={`bg-slate-900 border rounded-3xl p-8 transition-all ${security.threatLevel === ThreatLevel.CRITICAL ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.2)]' : 'border-slate-800'}`}>
            <div className="flex justify-between items-start mb-8">
              <div className="flex gap-4">
                <div className={`p-4 rounded-2xl border ${security.threatLevel === ThreatLevel.LOW ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                  <Shield size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Security Posture</h3>
                  <p className="text-slate-500 text-sm">Real-time model integrity and adversarial detection.</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Threat Level</p>
                <p className={`text-2xl font-black ${security.threatLevel === ThreatLevel.LOW ? 'text-emerald-500' : 'text-rose-500'}`}>{security.threatLevel.toUpperCase()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <Search className="text-indigo-400" size={18} />
                  <h4 className="text-sm font-bold text-white">Forensic Evidence</h4>
                </div>
                <div className="space-y-3">
                  {security.forensicEvidence && security.forensicEvidence.length > 0 ? (
                    security.forensicEvidence.map((ev, i) => (
                      <p key={i} className="text-xs text-slate-400 font-mono bg-slate-900 p-2 rounded border border-slate-800">{ev}</p>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No suspicious patterns detected in current stream.</p>
                  )}
                </div>
              </div>
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="text-emerald-400" size={18} />
                  <h4 className="text-sm font-bold text-white">Integrity Hash</h4>
                </div>
                <p className="text-[10px] text-slate-500 font-mono break-all mb-4">SHA256: 8f4e2c1a9b8d7c6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e</p>
                <div className="flex items-center gap-2 text-emerald-500">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Verified Baseline</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attack Simulation (Red Teaming) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <h3 className="text-lg font-bold text-white mb-6">Adversarial Simulation Lab</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AttackButton 
                icon={<Zap size={18} />} 
                label="Income Inflation" 
                onClick={() => onAttack('INCOME_INFLATION')} 
                description="Simulate systemic data manipulation."
              />
              <AttackButton 
                icon={<AlertTriangle size={18} />} 
                label="Data Poisoning" 
                onClick={() => onAttack('DATA_POISONING')} 
                description="Inject bias into training buffer."
              />
              <AttackButton 
                icon={<ShieldAlert size={18} />} 
                label="Feature Masking" 
                onClick={() => onAttack('FEATURE_MASKING')} 
                description="Test model sensitivity limits."
              />
              <AttackButton 
                icon={<Activity size={18} />} 
                label="Data Drift Attack" 
                onClick={() => onAttack('DATA_DRIFT')} 
                description="Artificially inflate PSI to test monitoring alerts."
              />
            </div>
          </div>
        </div>

        {/* Security Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Security Events</h3>
            <button onClick={onReboot} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-400 transition-all">
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-2">
            {logs.length > 0 ? (
              logs.map(log => (
                <div key={log.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${log.severity === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                      {log.severity}
                    </span>
                    <span className="text-[8px] text-slate-600 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-200">{log.action}</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{log.details}</p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-600">
                <Shield size={48} className="opacity-10 mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">No Security Events</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AttackButton = ({ icon, label, onClick, description }: any) => (
  <button onClick={onClick} className="p-6 bg-slate-950 border border-slate-800 rounded-2xl hover:border-rose-500/50 transition-all text-left group">
    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 group-hover:bg-rose-500/10 group-hover:border-rose-500/20 group-hover:text-rose-400 transition-all mb-4 w-fit">
      {icon}
    </div>
    <h4 className="text-sm font-bold text-white mb-2">{label}</h4>
    <p className="text-[10px] text-slate-500 leading-relaxed">{description}</p>
  </button>
);

const ShieldCheck = ({ size }: any) => <Shield size={size} />;

export default SecurityCenter;
