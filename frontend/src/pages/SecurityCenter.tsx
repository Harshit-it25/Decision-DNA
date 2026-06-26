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
  const activeForensics = security.forensicEvidence || [];
  const historicalForensics = logs
    .filter(l => l.category === 'ATTACK' || l.category === 'DRIFT')
    .map(l => l.details)
    .slice(0, 5);

  const displayForensics = activeForensics.length > 0 ? activeForensics : historicalForensics;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans text-neutral-text">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Security Overview */}
          <div className={`bg-white border rounded-2xl p-8 transition-all shadow-sm ${security.threatLevel === ThreatLevel.CRITICAL ? 'border-danger shadow-md' : 'border-neutral-border'}`}>
            <div className="flex justify-between items-start mb-8">
              <div className="flex gap-4">
                <div className={`p-4 rounded-xl border ${security.threatLevel === ThreatLevel.LOW ? 'bg-success/5 border-success/20 text-success' : 'bg-danger/5 border-danger/20 text-danger'}`}>
                  <Shield size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-neutral-text uppercase tracking-tight">Security Posture</h3>
                  <p className="text-neutral-secondary text-sm">Real-time model integrity and adversarial detection.</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-neutral-secondary uppercase tracking-widest mb-1">Threat Level</p>
                <p className={`text-2xl font-black ${security.threatLevel === ThreatLevel.LOW ? 'text-success' : 'text-danger'}`}>{security.threatLevel.toUpperCase()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-neutral-bg border border-neutral-border rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Search className="text-burgundy" size={18} />
                  <h4 className="text-sm font-bold text-neutral-text">Forensic Evidence</h4>
                </div>
                <div className="space-y-3">
                  {displayForensics.length > 0 ? (
                    displayForensics.map((ev, i) => (
                      <p key={i} className="text-xs text-neutral-text font-mono bg-white p-2 rounded border border-neutral-border">{ev}</p>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-secondary italic">No suspicious patterns detected in current stream.</p>
                  )}
                </div>
              </div>
              <div className="p-6 bg-neutral-bg border border-neutral-border rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="text-success" size={18} />
                  <h4 className="text-sm font-bold text-neutral-text">Integrity Hash</h4>
                </div>
                <p className="text-[10px] text-neutral-secondary font-mono break-all mb-4">SHA256: 8f4e2c1a9b8d7c6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e</p>
                <div className="flex items-center gap-2 text-success">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Verified Baseline</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attack Simulation (Red Teaming) */}
          <div className="bg-white border border-neutral-border rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-neutral-text mb-6">Adversarial Simulation Lab</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="bg-white border border-neutral-border rounded-2xl p-8 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-neutral-text">Security Events</h3>
            <button onClick={onReboot} className="p-2 hover:bg-neutral-bg rounded-lg text-neutral-secondary hover:text-danger transition-all">
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-2">
            {logs.length > 0 ? (
              logs.map(log => (
                <div key={log.id} className="p-4 bg-neutral-bg border border-neutral-border rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${log.severity === 'CRITICAL' ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-warning/10 border-warning/20 text-warning'}`}>
                      {log.severity}
                    </span>
                    <span className="text-[8px] text-neutral-secondary font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs font-bold text-neutral-text">{log.action}</p>
                  <p className="text-[10px] text-neutral-secondary leading-relaxed">{log.details}</p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-neutral-secondary">
                <Shield size={48} className="opacity-10 mb-4 text-burgundy" />
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
  <button onClick={onClick} className="p-6 bg-white border border-neutral-border rounded-xl hover:border-danger hover:shadow-sm transition-all text-left group">
    <div className="p-3 bg-neutral-bg rounded-xl border border-neutral-border group-hover:bg-danger-light group-hover:border-danger/20 group-hover:text-danger transition-all mb-4 w-fit">
      {icon}
    </div>
    <h4 className="text-sm font-bold text-neutral-text mb-2">{label}</h4>
    <p className="text-[10px] text-neutral-secondary leading-relaxed">{description}</p>
  </button>
);

const ShieldCheck = ({ size }: any) => <Shield size={size} />;

export default SecurityCenter;
