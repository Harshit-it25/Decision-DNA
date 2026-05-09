import React, { useState } from 'react';
import { 
  Terminal, Search, Info, PlusCircle, 
  ChevronRight, BarChart4, Cpu, Zap, Users, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { generateCounterfactuals } from '../services/modelEngine';
import { getDecisionExplanation } from '../api/modelApi';
import { ModelMetadata, Applicant } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface ExplainabilityProps {
  activeModel: ModelMetadata;
  applicants: Applicant[];
  aiTier: string;
  onAddApplicant: () => void;
  onTrain: () => void;
}

const Explainability: React.FC<ExplainabilityProps> = ({ activeModel, applicants, aiTier, onAddApplicant, onTrain }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Approve' | 'Reject'>('All');
  const [selectedId, setSelectedId] = useState<string | null>(applicants[0]?.id || null);
  const [counterfactuals, setCounterfactuals] = useState<any[]>([]);
  const [contributions, setContributions] = useState<Record<string, number>>({});
  const [dynamicReason, setDynamicReason] = useState<string>("");
  const [isExplaining, setIsExplaining] = useState(false);

  const filteredApplicants = applicants.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'All' || app.decision === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const selectedApp = filteredApplicants.find(a => a.id === selectedId) || filteredApplicants[0];

  React.useEffect(() => {
    const fetchExplanation = async () => {
      if (!selectedApp) return;
      setIsExplaining(true);
      try {
        const data = await getDecisionExplanation(selectedApp);
        if (data.contributions) setContributions(data.contributions);
        if (data.counterfactuals) setCounterfactuals(data.counterfactuals);
        if (data.reason) setDynamicReason(data.reason);
      } catch (err) {
        console.error("Explainability fetch failed", err);
        // Fallback to local simulation
        setCounterfactuals(generateCounterfactuals(selectedApp, activeModel));
        setDynamicReason(selectedApp.reason || (selectedApp.decision === 'Approve' ? "Applicant approved based on stable risk metrics." : "Applicant rejected due to risk threshold violations."));
      } finally {
        setIsExplaining(false);
      }
    };
    fetchExplanation();
  }, [selectedApp, activeModel]);

  React.useEffect(() => {
    if (!selectedId && filteredApplicants.length > 0) {
      setSelectedId(filteredApplicants[0].id);
    }
  }, [filteredApplicants, selectedId]);

  // Compute demographic fairness payload
  const fairnessData = applicants.reduce((acc, app) => {
    if (!app.nationality) return acc;
    if (!acc[app.nationality]) {
      acc[app.nationality] = { total: 0, approved: 0 };
    }
    acc[app.nationality].total += 1;
    if (app.decision === 'Approve') {
      acc[app.nationality].approved += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; approved: number }>);

  // Group low-count nationalities to prevent noise
  const aggregatedFairness: Record<string, { total: number; approved: number }> = { 'Other (Grouped)': { total: 0, approved: 0 } };
  
  Object.keys(fairnessData).forEach(nat => {
    if (fairnessData[nat].total < 50) {
      aggregatedFairness['Other (Grouped)'].total += fairnessData[nat].total;
      aggregatedFairness['Other (Grouped)'].approved += fairnessData[nat].approved;
    } else {
      aggregatedFairness[nat] = fairnessData[nat];
    }
  });

  if (aggregatedFairness['Other (Grouped)'].total === 0) {
    delete aggregatedFairness['Other (Grouped)'];
  }

  const demographicChartData = Object.keys(aggregatedFairness).map(nat => ({
    name: nat,
    sampleSize: aggregatedFairness[nat].total,
    approvalRate: parseFloat(((aggregatedFairness[nat].approved / aggregatedFairness[nat].total) * 100).toFixed(1))
  })).sort((a, b) => b.approvalRate - a.approvalRate);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Applicant List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl flex flex-col overflow-hidden h-[700px]">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
            <h3 className="text-lg font-bold text-white">Decision Queue</h3>
            <button onClick={onAddApplicant} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all">
              <PlusCircle size={16} />
            </button>
          </div>
          
          <div className="p-4 bg-slate-950/30 border-b border-slate-800">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="text" 
                placeholder="Search applicants (name, id)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setStatusFilter('All')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${statusFilter === 'All' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800/50'}`}
              >All</button>
              <button 
                onClick={() => setStatusFilter('Approve')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${statusFilter === 'Approve' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400 border border-transparent'}`}
              >Approve</button>
              <button 
                onClick={() => setStatusFilter('Reject')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${statusFilter === 'Reject' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent'}`}
              >Reject</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
            {filteredApplicants.length > 0 ? (
              filteredApplicants.slice(0, 200).map(app => (
                <button 
                  key={app.id} 
                  onClick={() => setSelectedId(app.id)}
                  className={`w-full p-6 text-left transition-all hover:bg-slate-800/50 flex justify-between items-center group ${selectedId === app.id ? 'bg-indigo-500/5 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
                >
                  <div>
                    <p className={`text-sm font-bold ${selectedId === app.id ? 'text-indigo-400' : 'text-slate-200'}`}>{app.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{app.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${app.decision === 'Approve' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                      {app.decision}
                    </span>
                    <ChevronRight size={14} className={`transition-transform ${selectedId === app.id ? 'translate-x-1 text-indigo-400' : 'text-slate-700'}`} />
                  </div>
                </button>
              ))
            ) : (
              <div className="p-12 text-center text-slate-600">
                <p className="text-xs font-bold uppercase tracking-widest">No results found</p>
              </div>
            )}
          </div>
        </div>

        {/* Explainability View */}
        <div className="lg:col-span-2 space-y-8">
          {selectedApp ? (
            <>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-indigo-400">
                      <Terminal size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">Decision DNA</h3>
                      <p className="text-slate-500 text-sm">Local interpretable model-agnostic explanations.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Risk Probability</p>
                    <p className={`text-3xl font-black ${selectedApp.riskProbability > 0.6 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {(selectedApp.riskProbability * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Feature Contributions */}
                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <BarChart4 size={14} /> Feature Contributions
                    </h4>
                    <div className="space-y-4">
                      <FeatureBar label="Credit Score" value={selectedApp.creditScore} max={850} weight={contributions.creditScore || 0.45} />
                      <FeatureBar label="Annual Income" value={selectedApp.income} max={200000} weight={contributions.income || 0.35} />
                      <FeatureBar label="Debt-to-Income" value={selectedApp.debtRatio} max={1} weight={contributions.debtRatio || 0.20} inverse />
                      <FeatureBar label="Loan Amount" value={selectedApp.loanAmount} max={100000} weight={contributions.loanAmount || 0.15} inverse />
                    </div>
                  </div>

                  {/* Model Context */}
                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Cpu size={14} /> Governance Context
                    </h4>
                    <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Active Model</span>
                        <span className="text-slate-200 font-bold">{activeModel.type} v{activeModel.version}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Inference Latency</span>
                        <span className="text-emerald-400 font-bold">12ms</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">AI Tier</span>
                        <span className="text-violet-400 font-bold uppercase">{aiTier}</span>
                      </div>
                      <div className="pt-4 border-t border-slate-800">
                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                          "{dynamicReason || selectedApp.reason || "Analyzing decision drivers..."}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Counterfactuals */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="text-amber-400" size={20} />
                  <div>
                    <h3 className="text-lg font-bold text-white">Counterfactual Analysis</h3>
                    <p className="text-xs text-slate-500">Dynamically generated requirements to reverse model boundary decision.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {counterfactuals.length > 0 ? counterfactuals.map((cf, i) => (
                    <div key={i} className="p-4 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         {cf.direction === 'Increase' ? <ArrowUpRight size={48} className={cf.targetDecision === 'Approve' ? 'text-emerald-400' : 'text-rose-400'} /> : <ArrowDownRight size={48} className={cf.targetDecision === 'Approve' ? 'text-emerald-400' : 'text-rose-400'}/>}
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 relative z-10">To flip to {cf.targetDecision}:</p>
                      <p className="text-xs text-slate-300 relative z-10">{cf.feature}: <span className={`${cf.targetDecision === 'Approve' ? 'text-emerald-400' : 'text-rose-400'} font-bold`}>{cf.direction === 'Increase' ? '+' : '-'}{cf.amount}</span></p>
                    </div>
                  )) : (
                    <div className="col-span-full p-4 bg-slate-950 border border-slate-800 rounded-xl">
                        <p className="text-xs text-slate-500 text-center">No single feature adjustment can flip this decision.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Demographic Fairness Audit */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="text-sky-400" size={20} />
                  <div>
                    <h3 className="text-lg font-bold text-white">Demographic Fairness Audit</h3>
                    <p className="text-xs text-slate-500">Live approval rate distribution mapped across reported nationalities.</p>
                  </div>
                </div>
                
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demographicChartData} margin={{ top: 20, right: 30, left: -20, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60} 
                        stroke="#64748b" 
                        fontSize={10} 
                        tick={{ fill: '#94a3b8' }} 
                        tickMargin={20}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={10} 
                        tickFormatter={(value) => `${value}%`}
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', fontSize: '12px', color: '#f8fafc' }}
                        itemStyle={{ color: '#38bdf8' }}
                        formatter={(value: any, name: any, props: any) => [`${value}% (n=${props.payload.sampleSize})`, 'Approval Rate']}
                      />
                      <Bar dataKey="approvalRate" radius={[4, 4, 0, 0]}>
                        {demographicChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.approvalRate < 20 ? '#f43f5e' : entry.approvalRate > 80 ? '#34d399' : '#818cf8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {demographicChartData.length > 0 && demographicChartData[demographicChartData.length - 1].approvalRate < 20 && (
                  <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 text-xs">
                    <Info size={14} className="shrink-0" />
                    Warning: Structural disparities detected. Group "{demographicChartData[demographicChartData.length - 1].name}" falls below 20% approval threshold.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900 border border-slate-800 rounded-3xl">
              <Search size={64} className="opacity-10 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">Select an applicant to analyze</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FeatureBar = ({ label, value, max, weight, inverse }: any) => {
  const percentage = Math.min(100, (value / max) * 100);
  const displayValue = label.includes('Ratio') ? value.toFixed(2) : (label.includes('Income') ? `$${value.toLocaleString()}` : value);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200">{displayValue}</span>
      </div>
      <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${inverse ? (percentage > 40 ? 'bg-rose-500' : 'bg-emerald-500') : (percentage > 70 ? 'bg-emerald-500' : 'bg-amber-500')}`} 
          style={{ width: `${percentage}%` }} 
        />
      </div>
      <div className="flex justify-between text-[8px] text-slate-600 font-mono">
        <span>Weight: {(weight * 100).toFixed(0)}%</span>
        <span>Impact: {inverse ? (percentage > 40 ? 'Negative' : 'Positive') : (percentage > 70 ? 'Positive' : 'Neutral')}</span>
      </div>
    </div>
  );
};

export default Explainability;
