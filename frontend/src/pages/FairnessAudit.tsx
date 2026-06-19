import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Fingerprint, AlertTriangle, ShieldCheck, Cpu, Settings, Activity } from 'lucide-react';
import { getFairnessMetrics } from '../api/modelApi';
import { Applicant } from '../types';

interface FairnessAuditProps {
  applicants: Applicant[];
}

const FairnessAudit: React.FC<FairnessAuditProps> = ({ applicants }) => {
    const [auditData, setAuditData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const calculateFairness = () => {
            if (!applicants || applicants.length === 0) return;
            const getApproveRate = (subset: Applicant[]) => {
                if (subset.length === 0) return 0;
                const approved = subset.filter(a => a.decision?.toLowerCase() === 'approve').length;
                return (approved / subset.length) * 100;
            };
            const genderGroups = {
                Male: applicants.filter(a => a.gender === 'Male'),
                Female: applicants.filter(a => a.gender === 'Female'),
                Other: applicants.filter(a => a.gender === 'Other')
            };
            const ageGroups = {
                '18-25': applicants.filter(a => a.age >= 18 && a.age <= 25),
                '26-40': applicants.filter(a => a.age >= 26 && a.age <= 40),
                '41-60': applicants.filter(a => a.age >= 41 && a.age <= 60),
                '60+': applicants.filter(a => a.age > 60)
            };
            const genderRates = {
                Male: getApproveRate(genderGroups.Male),
                Female: getApproveRate(genderGroups.Female),
                Other: getApproveRate(genderGroups.Other)
            };
            const ageRates = {
                '18-25': getApproveRate(ageGroups['18-25']),
                '26-40': getApproveRate(ageGroups['26-40']),
                '41-60': getApproveRate(ageGroups['41-60']),
                '60+': getApproveRate(ageGroups['60+'])
            };
            const calculateIndices = (privilegedRate: number, unprivilegedRate: number) => {
                const di = privilegedRate > 0 ? unprivilegedRate / privilegedRate : 1.0;
                const spd = (unprivilegedRate - privilegedRate) / 100;
                return {
                    disparate_impact: di,
                    statistical_parity_difference: spd,
                    status: (di < 0.8 || di > 1.25) ? 'Biased' : 'Fair'
                };
            };
            const data = {
                rates: { gender: genderRates, age_group: ageRates },
                metrics: {
                    gender: calculateIndices(genderRates.Male, genderRates.Female),
                    age_group: calculateIndices(ageRates['26-40'], ageRates['18-25'])
                },
                mitigation: { active: false, group_thresholds: { 'Male': 0.65, 'Female': 0.62, 'Age 18-25': 0.60 }, mitigation_history: [] }
            };
            setAuditData(data);
        };

        const fetchFairness = async () => {
            try {
                const data = await getFairnessMetrics();
                if (data && data.metrics) {
                    setAuditData(data);
                } else {
                    // Fallback to local calculation if backend fails or returns empty
                    calculateFairness();
                }
            } catch (err) {
                console.error("Fairness fetch failed", err);
                calculateFairness();
            } finally {
                setLoading(false);
            }
        };

        fetchFairness();
    }, [applicants]);

    if (loading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <div className="flex flex-col items-center justify-center text-slate-500 font-mono text-sm uppercase tracking-widest gap-4">
                    <Fingerprint size={48} className="animate-pulse text-indigo-500" />
                    Scanning Demographics for Bias...
                </div>
            </div>
        );
    }

    if (!auditData || !auditData.metrics) {
        return (
            <div className="p-8 text-center text-rose-400 font-mono">
                Failed to load fairness metrics. Ensure the backend is running.
            </div>
        );
    }

    const { gender, age_group } = auditData.metrics;

    // Format data for Recharts
    const genderRates = [
        { name: 'Male (Privileged)', approveRate: auditData.rates.gender['Male'] || 0 },
        { name: 'Female (Unprivileged)', approveRate: auditData.rates.gender['Female'] || 0 },
        { name: 'Other', approveRate: auditData.rates.gender['Other'] || 0 }
    ];

    const ageRates = [
        { name: '26-40 (Privileged)', approveRate: auditData.rates.age_group['26-40'] || 0 },
        { name: '18-25 (Unprivileged)', approveRate: auditData.rates.age_group['18-25'] || 0 },
        { name: '41-60', approveRate: auditData.rates.age_group['41-60'] || 0 },
        { name: '60+', approveRate: auditData.rates.age_group['60+'] || 0 }
    ];

    const getStatusCard = (title: string, metrics: any) => {
        const isBiased = metrics.status === 'Biased';
        return (
            <div className={`p-6 rounded-2xl border ${isBiased ? 'border-rose-500/30 bg-rose-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                <div className="flex items-center gap-3 mb-4">
                    {isBiased ? <AlertTriangle className="text-rose-500" size={24} /> : <ShieldCheck className="text-emerald-500" size={24} />}
                    <h3 className={`text-lg font-bold ${isBiased ? 'text-rose-400' : 'text-emerald-400'}`}>{title} Impact</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Disparate Impact</p>
                        <p className={`text-2xl font-black ${isBiased && metrics.disparate_impact < 0.8 ? 'text-rose-500 bg-rose-500/10 rounded px-2 py-1 inline-block' : 'text-slate-100'}`}>
                            {metrics.disparate_impact.toFixed(3)}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">Four-Fifths Rule Threshold (0.8)</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Statistical Parity Diff</p>
                        <p className={`text-2xl font-black ${Math.abs(metrics.statistical_parity_difference) > 0.1 ? 'text-rose-500' : 'text-slate-100'}`}>
                            {metrics.statistical_parity_difference.toFixed(3)}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">Target 0.0</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getStatusCard('Gender Demographics', gender)}
                {getStatusCard('Age Demographics', age_group)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl h-[400px]">
                    <h3 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-widest">Gender Approval Rates</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={genderRates} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                            <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                            <Bar dataKey="approveRate" fill="#6366f1" radius={[4, 4, 0, 0]} name="Approval Rate %" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl h-[400px]">
                    <h3 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-widest">Age Group Approval Rates</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={ageRates} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                            <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                            <Bar dataKey="approveRate" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Approval Rate %" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {auditData.mitigation && (
                <div className={`p-6 rounded-2xl border transition-all duration-500 ${auditData.mitigation.active ? 'border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-slate-800 bg-slate-900/50 opacity-80'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${auditData.mitigation.active ? 'bg-indigo-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                                <Cpu size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                    Autonomic Fairness Mitigation
                                    {auditData.mitigation.active && <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Active</span>}
                                </h3>
                                <p className="text-xs text-slate-400">Step 18: Self-correcting AI threshold tuning</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Status</p>
                            <p className={`text-sm font-mono ${auditData.mitigation.active ? 'text-indigo-400' : 'text-slate-400'}`}>
                                {auditData.mitigation.active ? 'AUTONOMIC CORRECTION IN PROGRESS' : 'STANDBY - BIAS WITHIN LIMITS'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Settings size={12} /> Dynamic Thresholds</h4>
                            <div className="space-y-3">
                                {Object.entries(auditData.mitigation.group_thresholds).map(([group, val]: [string, any]) => (
                                    <div key={group} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                                        <span className="text-xs text-slate-300 capitalize">{group}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500" style={{ width: `${(val as number) * 100}%` }}></div>
                                            </div>
                                            <span className={`text-xs font-mono font-bold ${val < 0.5 ? 'text-indigo-400' : 'text-slate-400'}`}>{val.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Activity size={12} /> Mitigation History (Log)</h4>
                            <div className="bg-slate-950/50 rounded-xl border border-slate-800/50 overflow-hidden">
                                {auditData.mitigation.mitigation_history && auditData.mitigation.mitigation_history.length > 0 ? (
                                    <div className="divide-y divide-slate-900 max-h-[160px] overflow-y-auto">
                                        {auditData.mitigation.mitigation_history.reverse().map((entry: any, i: number) => (
                                            <div key={i} className="p-3 flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5"></div>
                                                <div>
                                                    <p className="text-xs text-slate-200 font-medium">{entry.action}</p>
                                                    <p className="text-[10px] text-slate-500">{entry.details}</p>
                                                    <p className="text-[9px] text-slate-600 mt-0.5">{new Date(entry.timestamp).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-600 text-xs italic font-mono">
                                        No mitigation events recorded. System is operating at peak fairness.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-400 mb-2 uppercase tracking-widest"><Fingerprint size={16} /> Audit Summary</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                    This audit analyzes decisions against protected synthetic attributes (Gender & Age).
                    Disparate Impact (DI) compares the approval rate of the unprivileged group to the privileged group.
                    A DI of exactly 1.0 implies demographic parity. If the metric drops below 0.8, the system issues a warning
                    in accordance with standard fairness frameworks (e.g., the EEOC Four-Fifths rule).
                </p>
            </div>
        </div>
    );
};

export default FairnessAudit;
