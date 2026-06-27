import React, { useMemo } from 'react';
import { Shield, ShieldAlert, Zap, RotateCcw, AlertTriangle, Search, Lock, Activity, Users, CheckCircle, ShieldCheck, FileText } from 'lucide-react';
import { SecurityStatus, ThreatLevel, AuditEntry, ModelMetadata } from '../types';

interface SecurityCenterProps {
  security: SecurityStatus;
  activeModel: ModelMetadata;
  user: { username: string, role: string } | null;
  onAttack: (type: string) => void;
  onReboot: () => void;
  logs: AuditEntry[];
}

const SecurityCenter: React.FC<SecurityCenterProps> = ({ security, activeModel, user, onAttack, onReboot, logs }) => {
  const activeForensics = security.forensicEvidence || [];
  const historicalForensics = logs
    .filter(l => l.category === 'ATTACK' || l.category === 'DRIFT')
    .map(l => l.details)
    .slice(0, 5);

  const displayForensics = activeForensics.length > 0 ? activeForensics : historicalForensics;

  // --- Dynamic JWT and RBAC Telemetry ---
  const jwtStatus = useMemo(() => {
    return {
      status: user ? 'VALID' : 'INACTIVE',
      algorithm: 'HS256',
      issuedAt: user ? 'Session Start' : 'N/A',
      expiry: '30 Minutes',
      strength: '256-bit signature',
      limiter: '60 req/min active'
    };
  }, [user]);

  const rbacMatrix = useMemo(() => {
    const role = user?.role || 'MORTGAGE_OFFICER';
    const isSecAdmin = role === 'SECURITY_ADMIN';
    const isAuditor = role === 'AUDITOR';
    const isMortgageOfficer = role === 'MORTGAGE_OFFICER';

    return {
      role: `${role.replace('_', ' ')} (Prototype Simulation)`,
      permissions: [
        { name: 'Model Prediction (Inference)', allowed: true },
        { name: 'Drift & Model Telemetry', allowed: true },
        { name: 'Security Red-Teaming Lab', allowed: isSecAdmin || isAuditor },
        { name: 'System Security Hardening', allowed: isSecAdmin || isMortgageOfficer },
        { name: 'Emergency System Reboot', allowed: isSecAdmin }
      ]
    };
  }, [user]);

  const promptInjectionStatus = useMemo(() => {
    const isCompromised = security.threatLevel === ThreatLevel.CRITICAL;
    return {
      status: isCompromised ? 'WARNING' : 'ACTIVE',
      filter: 'Llama-Guard V3 / Gemini Guardrails',
      blocks: isCompromised ? 3 : 0,
      piiFilter: 'Active (SSN/Email redacted)'
    };
  }, [security.threatLevel]);

  const auditStatus = useMemo(() => {
    return {
      ledgerSync: 'PASSED',
      synchronizedLogs: logs.length,
      integrityCheck: 'SIGNED',
      lastVerification: new Date().toLocaleTimeString()
    };
  }, [logs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans text-neutral-text">
      
      {/* Upper Grid: 5 columns for Threat Level, Fingerprint, JWT, Prompt, Audit Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* 1. Threat Level */}
        <div className={`bg-white border p-6 rounded-2xl flex flex-col justify-between shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
          security.threatLevel === ThreatLevel.CRITICAL ? 'border-danger bg-danger/5' : 'border-neutral-border'
        }`}>
          <div>
            <span className="text-[9px] font-black text-neutral-secondary uppercase tracking-widest block mb-1">Threat Level</span>
            <p className={`text-2xl font-black tracking-tight ${
              security.threatLevel === ThreatLevel.LOW ? 'text-success' : security.threatLevel === ThreatLevel.MEDIUM ? 'text-warning' : 'text-danger'
            }`}>
              {security.threatLevel.toUpperCase()}
            </p>
          </div>
          <p className="text-[10px] text-neutral-secondary leading-normal mt-3">
            {security.threatLevel === ThreatLevel.LOW 
              ? 'All endpoints operating normal. Vulnerability score optimal.' 
              : 'Security mitigation protocol active. Review forensic logs.'}
          </p>
        </div>

        {/* 2. SHA-256 Model Fingerprint */}
        <div className="bg-white border border-neutral-border p-6 rounded-2xl flex flex-col justify-between shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <span className="text-[9px] font-black text-neutral-secondary uppercase tracking-widest block mb-1">Model Fingerprint</span>
            <p className="text-[10px] font-mono text-neutral-text break-all bg-neutral-bg p-2 rounded border border-neutral-border mt-1.5 leading-normal">
              {activeModel.fingerprint.substring(0, 32)}...
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-success mt-3 text-[9px] font-bold uppercase tracking-widest">
            <ShieldCheck size={11} /> Verified Signature
          </div>
        </div>

        {/* 3. JWT Status */}
        <div className="bg-white border border-neutral-border p-6 rounded-2xl flex flex-col justify-between shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-black text-neutral-secondary uppercase tracking-widest block mb-1">JWT Token (Prototype)</span>
              <span className="text-[8px] font-bold text-success bg-success-light border border-success/20 px-1.5 py-0.5 rounded">
                {jwtStatus.status}
              </span>
            </div>
            <div className="space-y-1 mt-2 text-[10px] text-neutral-secondary">
              <p>Signing: <span className="font-bold text-neutral-text">{jwtStatus.algorithm}</span></p>
              <p>Limiter: <span className="font-bold text-neutral-text">{jwtStatus.limiter}</span></p>
            </div>
          </div>
          <span className="text-[9px] text-neutral-secondary italic mt-3">Verified Active Session</span>
        </div>

        {/* 4. Prompt Injection Protection */}
        <div className="bg-white border border-neutral-border p-6 rounded-2xl flex flex-col justify-between shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-black text-neutral-secondary uppercase tracking-widest block mb-1">Prompt Shield (Prototype)</span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                promptInjectionStatus.status === 'ACTIVE' ? 'text-success bg-success-light border-success/20' : 'text-danger bg-danger-light border-danger/20'
              }`}>
                {promptInjectionStatus.status}
              </span>
            </div>
            <div className="space-y-1 mt-2 text-[10px] text-neutral-secondary">
              <p>Filter: <span className="font-bold text-neutral-text">LlamaGuard V3</span></p>
              <p>SSN/Email: <span className="font-bold text-neutral-text">Redacted</span></p>
            </div>
          </div>
          <span className="text-[9px] text-neutral-secondary block mt-3 font-bold">
            Blocks Today: <span className="text-burgundy font-black">{promptInjectionStatus.blocks}</span>
          </span>
        </div>

        {/* 5. Audit Status */}
        <div className="bg-white border border-neutral-border p-6 rounded-2xl flex flex-col justify-between shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-black text-neutral-secondary uppercase tracking-widest block mb-1">Audit Ledger (Prototype)</span>
              <span className="text-[8px] font-bold text-success bg-success-light border border-success/20 px-1.5 py-0.5 rounded">
                {auditStatus.ledgerSync}
              </span>
            </div>
            <div className="space-y-1 mt-2 text-[10px] text-neutral-secondary">
              <p>Sync Logs: <span className="font-bold text-neutral-text">{auditStatus.synchronizedLogs} records</span></p>
              <p>Status: <span className="font-bold text-neutral-text">{auditStatus.integrityCheck}</span></p>
            </div>
          </div>
          <span className="text-[9px] text-neutral-secondary font-mono mt-3">
            Synced: {auditStatus.lastVerification}
          </span>
        </div>

      </div>

      {/* Main Grid: Red-Team Lab & Forensic Ledger + RBAC Permission Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Red-Team Lab */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Security Posture Header */}
          <div className="bg-white border border-neutral-border rounded-2xl p-8 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                <div className="p-3 bg-burgundy/5 rounded-2xl border border-burgundy/20 text-burgundy">
                  <Shield size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-text uppercase tracking-tight">Security Control Matrix</h3>
                  <p className="text-neutral-secondary text-sm">Adversarial stress testing and red-team simulations.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Forensics log */}
              <div className="p-6 bg-neutral-bg border border-neutral-border rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Search className="text-burgundy" size={18} />
                  <h4 className="text-sm font-bold text-neutral-text">Forensic Telemetry Ledger</h4>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {displayForensics.length > 0 ? (
                    displayForensics.map((ev, i) => (
                      <p key={i} className="text-[10px] text-neutral-text font-mono bg-white p-2 rounded border border-neutral-border leading-normal">{ev}</p>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-secondary italic">No suspicious activity records found in session state.</p>
                  )}
                </div>
              </div>

              {/* RBAC Permission Matrix */}
              <div className="p-6 bg-neutral-bg border border-neutral-border rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="text-burgundy" size={18} />
                    <h4 className="text-sm font-bold text-neutral-text">RBAC Authorization: {rbacMatrix.role}</h4>
                  </div>
                  <div className="space-y-2">
                    {rbacMatrix.permissions.map((perm, i) => (
                      <div key={i} className="flex justify-between items-center text-[10px] border-b border-neutral-border pb-1.5">
                        <span className="text-neutral-secondary">{perm.name}</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${
                          perm.allowed ? 'bg-success-light text-success border border-success/10' : 'bg-danger-light text-danger border border-danger/10'
                        }`}>
                          {perm.allowed ? 'Authorized' : 'Restricted'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attack Simulation */}
          <div className="bg-white border border-neutral-border rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-neutral-text mb-6">Adversarial Simulation Lab</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AttackButton 
                icon={<Zap size={18} />} 
                label="Income Inflation Attack" 
                onClick={() => onAttack('INCOME_INFLATION')} 
                description="Simulate systemic data manipulation forcing high PSI."
              />
              <AttackButton 
                icon={<AlertTriangle size={18} />} 
                label="Data Poisoning Injection" 
                onClick={() => onAttack('DATA_POISONING')} 
                description="Inject bias into training buffer to test model tolerance."
              />
              <AttackButton 
                icon={<ShieldAlert size={18} />} 
                label="Feature Masking Simulation" 
                onClick={() => onAttack('FEATURE_MASKING')} 
                description="Verify stability when specific parameters are masked."
              />
              <AttackButton 
                icon={<Activity size={18} />} 
                label="Data Drift Injection" 
                onClick={() => onAttack('DATA_DRIFT')} 
                description="Artificially inflate PSI indicators to test self-healing triggers."
              />
            </div>
          </div>

        </div>

        {/* Security Logs (Events) */}
        <div className="bg-white border border-neutral-border rounded-2xl p-8 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-neutral-text">Security Events</h3>
            <button 
              onClick={() => {
                if (security.threatLevel === ThreatLevel.LOW && !window.confirm("System is stable. Reboot anyway?")) return;
                onReboot();
              }} 
              className="p-2 bg-neutral-bg border border-neutral-border hover:bg-danger-light hover:text-danger hover:border-danger/20 rounded-lg text-neutral-secondary transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
            >
              <RotateCcw size={12} /> Reboot System
            </button>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-2">
            {logs.length > 0 ? (
              logs.map(log => (
                <div key={log.id} className="p-4 bg-neutral-bg border border-neutral-border rounded-xl space-y-2 hover:border-burgundy/25 transition-all">
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
                <ShieldCheck size={48} className="opacity-10 mb-4 text-burgundy" />
                <p className="text-xs font-bold uppercase tracking-widest">No Security Incidents</p>
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

export default SecurityCenter;
