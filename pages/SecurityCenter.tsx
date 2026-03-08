
import React from 'react';
import { SecurityStatus, AuditEntry, ThreatLevel, IntegrityStatus, ModelType } from '../types';
import { ShieldAlert, Zap, Lock, Unlock, RotateCcw, AlertTriangle, ShieldCheck, Bug, Search, Terminal, Eye, AlertCircle, BarChart3, ChevronRight } from 'lucide-react';

interface SecurityCenterProps {
  security: SecurityStatus;
  onAttack: (type: 'INCOME_INFLATION' | 'DATA_POISONING' | 'FEATURE_MASKING' | 'CUSTOM', customParams?: any) => void;
  onReboot: () => void;
  logs: AuditEntry[];
}

const SecurityCenter: React.FC<SecurityCenterProps> = ({ security, onAttack, onReboot, logs }) => {
  const [showCustom, setShowCustom] = React.useState(false);
  const [customParams, setCustomParams] = React.useState({
    psiDelta: 0.1,
    flipDelta: 0.1,
    rankDelta: -0.05,
    threat: ThreatLevel.MEDIUM,
    integrity: IntegrityStatus.VERIFIED,
    details: "Custom adversarial vector simulation.",
    forensics: ["Custom anomaly detected"]
  });

  const isCritical = security.threatLevel === ThreatLevel.CRITICAL;
  const isMedium = security.threatLevel === ThreatLevel.MEDIUM;

  // Mock comparison data for "both models" detection
  const modelComparison = [
    { name: ModelType.LOGISTIC_REGRESSION, drift: security.threatLevel === ThreatLevel.LOW ? 5 : isMedium ? 25 : 95, integrity: security.threatLevel === ThreatLevel.CRITICAL ? 'Compromised' : 'Verified' },
    { name: ModelType.RANDOM_FOREST, drift: security.threatLevel === ThreatLevel.LOW ? 3 : isMedium ? 15 : 88, integrity: security.threatLevel === ThreatLevel.CRITICAL ? 'Compromised' : 'Verified' }
  ];

  return (
    <div className="space-y-6">
      {/* Comparative Model Integrity - NEW SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Twin-Model Integrity Check</h3>
            <p className="text-xs text-slate-400">Comparing threat detection sensitivity across architectures</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modelComparison.map((model, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-200">{model.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  model.integrity === 'Verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {model.integrity.toUpperCase()}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-500">Drift Detection Rate</span>
                  <span className={model.drift > 50 ? 'text-rose-400' : 'text-slate-300'}>{model.drift}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${model.drift > 50 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-indigo-500'}`} 
                    style={{ width: `${model.drift}%` }} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-slate-900 border rounded-2xl p-8 relative overflow-hidden transition-all duration-500 ${
          isCritical ? 'border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.1)]' : 'border-slate-800'
        }`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
               <div>
                <h2 className="text-2xl font-bold text-white mb-2">Security Status Engine</h2>
                <p className="text-sm text-slate-400">Real-time authentication and tampering detection</p>
               </div>
            </div>

            <div className="flex items-center gap-6 mb-10">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all duration-700 ${
                security.integrity === IntegrityStatus.VERIFIED 
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' 
                  : 'border-rose-500 bg-rose-500/10 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
              }`}>
                {security.integrity === IntegrityStatus.VERIFIED ? <ShieldCheck size={40} /> : <ShieldAlert size={40} />}
              </div>
              <div>
                <div className={`text-3xl font-bold tracking-tight transition-colors ${
                   security.integrity === IntegrityStatus.VERIFIED ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {security.integrity}
                </div>
                <div className="text-sm text-slate-500 font-mono mt-1">
                  SHA-256 Checksum: {security.integrity === IntegrityStatus.VERIFIED ? 'MATCHED' : 'MODIFIED'}
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <div className={`flex justify-between items-center text-sm p-4 bg-slate-950 rounded-xl border ${isCritical ? 'border-rose-500/30' : 'border-slate-800'}`}>
                  <span className="text-slate-400">Threat Assessment</span>
                  <span className={`font-bold px-3 py-0.5 rounded ${
                    security.threatLevel === ThreatLevel.CRITICAL ? 'bg-rose-500/10 text-rose-400' : 
                    security.threatLevel === ThreatLevel.MEDIUM ? 'bg-amber-500/10 text-amber-400' : 
                    'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {security.threatLevel}
                  </span>
               </div>
               
               <button 
                 onClick={onReboot}
                 className={`w-full py-4 text-white font-black rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg ${
                   isCritical 
                     ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40 animate-pulse' 
                     : 'bg-slate-800 hover:bg-slate-700 shadow-black/20 border border-slate-700'
                 }`}
               >
                 <RotateCcw size={20} />
                 IMMUTABLE SYSTEM REBOOT
               </button>
            </div>
          </div>
          <div className={`absolute -bottom-10 -right-10 opacity-[0.03] transition-colors duration-1000 ${isCritical ? 'text-rose-500' : 'text-slate-400'}`}>
            <Lock size={200} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-slate-800 rounded-lg">
                <Bug size={18} className="text-slate-400" />
             </div>
             <h2 className="text-2xl font-bold text-white">Simulation Lab</h2>
           </div>
           <p className="text-sm text-slate-400 mb-8">Test system resilience against adversarial vectors</p>

           <div className="grid grid-cols-1 gap-4">
              <AttackButton 
                icon={<TrendingUp className="text-blue-400" size={20} />} 
                title="Income Inflation (Medium)" 
                desc="Artificial distribution shift in training data."
                onClick={() => onAttack('INCOME_INFLATION')}
                disabled={isCritical}
              />
              <AttackButton 
                icon={<Bug className="text-amber-400" size={20} />} 
                title="Data Poisoning (Critical)" 
                desc="Corrupt samples injected into retraining batch."
                onClick={() => onAttack('DATA_POISONING')}
                disabled={isCritical}
              />
              <AttackButton 
                icon={<AlertTriangle className="text-rose-400" size={20} />} 
                title="Feature Masking (Critical)" 
                desc="Critical weight deletion during production."
                onClick={() => onAttack('FEATURE_MASKING')}
                disabled={isCritical}
              />

              <div className="pt-4 border-t border-slate-800">
                <button 
                  onClick={() => setShowCustom(!showCustom)}
                  className="w-full flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-indigo-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Terminal size={18} className="text-indigo-400" />
                    <span className="text-sm font-bold text-white">Custom Attack Vector</span>
                  </div>
                  <ChevronRight size={16} className={`text-slate-500 transition-transform ${showCustom ? 'rotate-90' : ''}`} />
                </button>

                {showCustom && (
                  <div className="mt-4 p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PSI Delta</label>
                        <input 
                          type="number" step="0.01" 
                          value={customParams.psiDelta} 
                          onChange={e => setCustomParams({...customParams, psiDelta: Number(e.target.value)})}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Flip Rate Delta</label>
                        <input 
                          type="number" step="0.01" 
                          value={customParams.flipDelta} 
                          onChange={e => setCustomParams({...customParams, flipDelta: Number(e.target.value)})}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rank Delta</label>
                        <input 
                          type="number" step="0.01" 
                          value={customParams.rankDelta} 
                          onChange={e => setCustomParams({...customParams, rankDelta: Number(e.target.value)})}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Threat Level</label>
                        <select 
                          value={customParams.threat} 
                          onChange={e => setCustomParams({...customParams, threat: e.target.value as ThreatLevel})}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                        >
                          <option value={ThreatLevel.LOW}>Low</option>
                          <option value={ThreatLevel.MEDIUM}>Medium</option>
                          <option value={ThreatLevel.CRITICAL}>Critical</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Attack Details</label>
                      <textarea 
                        value={customParams.details} 
                        onChange={e => setCustomParams({...customParams, details: e.target.value})}
                        className="w-full h-20 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50 resize-none"
                      />
                    </div>

                    <button 
                      onClick={() => onAttack('CUSTOM', customParams)}
                      disabled={isCritical}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-indigo-900/20"
                    >
                      Execute Custom Attack
                    </button>
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h3 className="text-lg font-bold text-white mb-6">Security Event Log</h3>
        <div className="space-y-3">
           {logs.length === 0 ? (
             <div className="text-center py-10 text-slate-500 italic">No security events detected. System healthy.</div>
           ) : (
             logs.map(log => (
               <div key={log.id} className="flex gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl group hover:border-slate-700 transition-colors">
                  <div className={`p-2 rounded-lg transition-colors ${log.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20' : 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20'}`}>
                    <ShieldAlert size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                       <div className="text-sm font-bold text-white">{log.action}</div>
                       <div className="text-[10px] text-slate-600 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{log.details}</p>
                    {log.severity === 'CRITICAL' && (
                       <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded border border-rose-500/20">
                          <Eye size={12} /> Root Cause Detected
                       </div>
                    )}
                  </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};

const AttackButton = ({ icon, title, desc, onClick, disabled }: any) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`w-full text-left p-4 bg-slate-950 border border-slate-800 rounded-xl transition-all group ${
      disabled ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:bg-slate-800 hover:border-slate-700'
    }`}
  >
    <div className="flex gap-4">
      <div className={`p-3 bg-slate-900 rounded-lg transition-colors ${!disabled && 'group-hover:bg-slate-700'}`}>
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold text-white">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
    </div>
  </button>
);

const TrendingUp = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
);

export default SecurityCenter;
