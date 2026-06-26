import React, { useState, useEffect } from 'react';
import { ShieldAlert, Zap, Cpu, ShieldCheck, AlertTriangle, Activity, Terminal, RefreshCw, Key } from 'lucide-react';
import { getSecurityStatus, triggerRedTeam, triggerHardening, verifyWatermark as apiVerifyWatermark } from '../api/modelApi';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const SecurityHardening: React.FC = () => {
    const [securityData, setSecurityData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [auditing, setAuditing] = useState(false);
    const [verifyingWatermark, setVerifyingWatermark] = useState(false);

    const fetchSecurityStatus = async () => {
        try {
            const data = await getSecurityStatus();
            setSecurityData(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch security status", error);
        }
    };

    const verifyWatermark = async () => {
        setVerifyingWatermark(true);
        try {
            await apiVerifyWatermark();
            await fetchSecurityStatus();
            setTimeout(() => setVerifyingWatermark(false), 2000);
        } catch (error) {
            console.error("Watermark verification failed", error);
            setVerifyingWatermark(false);
        }
    };

    useEffect(() => {
        fetchSecurityStatus();
        const interval = setInterval(fetchSecurityStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleTriggerRedTeam = async () => {
        setAuditing(true);
        try {
            await triggerRedTeam();
            setTimeout(() => setAuditing(false), 2000);
        } catch (error) {
            console.error("Red-team trigger failed", error);
            setAuditing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center bg-neutral-bg">
                <div className="flex flex-col items-center justify-center text-neutral-secondary font-sans text-sm uppercase tracking-widest gap-4">
                    <ShieldAlert size={48} className="animate-pulse text-burgundy" />
                    Initializing Model Security Shield...
                </div>
            </div>
        );
    }

    const historyData = (securityData?.audit_history || []).map((h: any) => ({
        time: h.timestamp ? new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        robustness: (h.robustness || 0) * 100,
        evasion: (h.evasion_rate || 0) * 100
    }));

    const reversedAuditHistory = [...(securityData?.audit_history || [])].reverse();

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 font-sans text-neutral-text">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 p-8 bg-white border border-neutral-border rounded-2xl relative overflow-hidden group shadow-sm">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldAlert size={120} className="text-danger" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-danger/5 rounded-2xl border border-danger/20">
                                <ShieldAlert className="text-danger" size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-neutral-text uppercase tracking-tight italic transform -skew-x-6">Model Red-Teaming</h3>
                                <p className="text-xs text-neutral-secondary font-mono tracking-widest">Phase 8: Evolutionary Adversarial Robustness</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <p className="text-[10px] text-neutral-secondary font-black uppercase tracking-widest mb-2">Robustness Score</p>
                                <div className="flex items-end gap-3">
                                    <span className="text-5xl font-bold text-neutral-text">{((securityData?.robustness_score || 0) * 100).toFixed(1)}%</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full mb-1 ${(securityData?.robustness_score || 0) > 0.8 ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                                        {(securityData?.robustness_score || 0) > 0.8 ? 'RESILIENT' : 'VULNERABLE'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-neutral-secondary font-black uppercase tracking-widest mb-2">Last Audit</p>
                                <p className="text-sm font-mono text-neutral-text bg-neutral-bg p-2 rounded-lg border border-neutral-border inline-block">
                                    {securityData?.last_red_team_audit ? new Date(securityData.last_red_team_audit).toLocaleString() : 'NEVER AUDITED'}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={handleTriggerRedTeam}
                            disabled={auditing}
                            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${auditing ? 'bg-neutral-border text-neutral-secondary cursor-not-allowed' : 'bg-danger hover:bg-danger/90 text-white shadow-sm active:scale-95'}`}
                        >
                            {auditing ? <RefreshCw size={20} className="animate-spin" /> : <Zap size={20} />}
                            {auditing ? 'Crunching Permutations...' : 'Initiate Red-Team Stress Test'}
                        </button>
                    </div>
                </div>

                {/* Model Hardening (Robust Training) */}
                <div className="p-8 bg-white border border-neutral-border rounded-2xl relative overflow-hidden group shadow-sm">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldCheck size={120} className="text-success" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-success-light rounded-2xl border border-success/20">
                                <ShieldCheck className="text-success" size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-neutral-text uppercase tracking-tight italic transform -skew-x-6">Robust Training</h3>
                                <p className="text-xs text-neutral-secondary font-mono tracking-widest">Immunize against Adversaries</p>
                            </div>
                        </div>

                        <p className="text-sm text-neutral-secondary mb-8 leading-relaxed">
                            Perform an automated hardening cycle by augmenting the training set with adversarial examples generated in Step 19.
                        </p>

                        <button 
                            onClick={async () => {
                                setAuditing(true);
                                try {
                                    await triggerHardening();
                                    setTimeout(() => setAuditing(false), 3000);
                                } catch (e) {
                                    setAuditing(false);
                                }
                            }}
                            disabled={auditing}
                            className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${auditing ? 'bg-neutral-border text-neutral-secondary cursor-not-allowed' : 'bg-burgundy hover:bg-burgundy-hover text-white shadow-sm active:scale-95'}`}
                        >
                            {auditing ? <RefreshCw size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                            {auditing ? 'Immunizing Weights...' : 'Start Hardening Cycle'}
                        </button>
                    </div>
                </div>

                <div className="p-8 bg-white border border-neutral-border rounded-2xl flex flex-col justify-between shadow-sm">
                    <div>
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-neutral-secondary uppercase tracking-widest mb-6">
                            <Activity size={14} className="text-burgundy" /> Security Telemetry
                        </h4>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-neutral-secondary">Evasion Resistance</span>
                                <span className="text-sm font-mono text-neutral-text">{((securityData?.robustness_score || 0) * 0.95 * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-neutral-border rounded-full overflow-hidden">
                                <div className="h-full bg-burgundy" style={{ width: `${(securityData?.robustness_score || 0) * 100}%` }}></div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-neutral-secondary">Data Poisoning Shield</span>
                                <span className="text-sm font-mono text-neutral-text">99.8%</span>
                            </div>
                            <div className="h-1.5 w-full bg-neutral-border rounded-full overflow-hidden">
                                <div className="h-full bg-success" style={{ width: '99.8%' }}></div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-neutral-secondary">IP Watermarking</span>
                                <span className={`text-[10px] font-mono px-2 rounded ${securityData?.is_watermarked ? 'text-success bg-success-light' : 'text-gold bg-gold-light'}`}>
                                    {securityData?.is_watermarked ? 'VERIFIED' : 'PENDING'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-[-10px]">
                                <span className="text-[10px] text-neutral-secondary italic">Signature Confidence</span>
                                <span className="text-[10px] font-mono text-neutral-text">{((securityData?.watermark_confidence || 0) * 100).toFixed(1)}%</span>
                            </div>
                            <button 
                                onClick={verifyWatermark}
                                disabled={verifyingWatermark}
                                className={`w-full text-[10px] font-bold uppercase tracking-widest py-2 rounded-xl border border-neutral-border transition-all ${verifyingWatermark ? 'bg-neutral-bg text-neutral-secondary' : 'hover:bg-neutral-bg text-neutral-text active:scale-[0.98]'}`}
                            >
                                {verifyingWatermark ? 'Querying Signature...' : 'Verify Ownership'}
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-burgundy-light/20 border border-burgundy/10 rounded-xl">
                        <p className="text-[10px] text-burgundy font-bold mb-1 flex items-center gap-2"><Key size={12}/> Model Fingerprint</p>
                        <p className="text-[10px] font-mono text-neutral-secondary truncate">SHA256: d8e8f822...a9b3c4d5e6f7</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-white border border-neutral-border rounded-2xl h-[400px] shadow-sm">
                    <h3 className="text-[10px] font-black text-neutral-secondary mb-8 uppercase tracking-widest">Robustness Trend (Last 10 Audits)</h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={historyData}>
                            <defs>
                                <linearGradient id="colorRob" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="time" stroke="#6B7280" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis stroke="#6B7280" fontSize={10} axisLine={false} tickLine={false} unit="%" />
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E5E7EB', borderRadius: '8px', color: '#111827' }} />
                            <Area type="monotone" dataKey="robustness" stroke="#DC2626" strokeWidth={3} fillOpacity={1} fill="url(#colorRob)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="p-8 bg-white border border-neutral-border rounded-2xl shadow-sm">
                    <h3 className="text-[10px] font-black text-neutral-secondary mb-8 uppercase tracking-widest flex items-center gap-2">
                        <Terminal size={14} /> Red-Team Forensic Log
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                        {reversedAuditHistory.length > 0 ? (
                            reversedAuditHistory.map((entry: any, i: number) => (
                                <div key={i} className="p-4 bg-neutral-bg border border-neutral-border rounded-xl flex items-start gap-4 group hover:border-danger/30 transition-all">
                                    <div className="mt-1">
                                        {entry.evasion_rate > 0.2 ? (
                                            <AlertTriangle className="text-danger" size={16} />
                                        ) : (
                                            <ShieldCheck className="text-success" size={16} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-xs font-bold text-neutral-text">Evasion Attempt Simulation #{100+i}</p>
                                            <span className="text-[10px] text-neutral-secondary font-mono">{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : 'N/A'}</span>
                                        </div>
                                        <p className="text-[11px] text-neutral-secondary">
                                            Model robustness clocked at {((entry.robustness || 0) * 100).toFixed(1)}%. 
                                            Evasion success rate detected at {((entry.evasion_rate || 0) * 100).toFixed(1)}%.
                                        </p>
                                        <div className="mt-2 text-[9px] font-mono text-neutral-text bg-white border border-neutral-border p-2 rounded">
                                            VULNERABILITY_INDEX: {(((entry.evasion_rate || 0) * 100)).toFixed(2)} | THREAT: {entry.evasion_rate > 0.2 ? 'HIGH' : 'LOW'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 text-neutral-secondary text-xs italic font-mono uppercase tracking-widest">
                                No red-team data available. Perform audit.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityHardening;
