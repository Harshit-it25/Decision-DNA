import React, { useState } from 'react';
import { 
  Terminal, Search, Info, PlusCircle, 
  ChevronRight, BarChart4, Cpu, Zap
} from 'lucide-react';
import { ModelMetadata, Applicant } from '../types';

interface ExplainabilityProps {
  activeModel: ModelMetadata;
  applicants: Applicant[];
  aiTier: string;
  onAddApplicant: () => void;
  onTrain: () => void;
}

const Explainability: React.FC<ExplainabilityProps> = ({ activeModel, applicants, aiTier, onAddApplicant, onTrain }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(applicants[0]?.id || null);

  const filteredApplicants = applicants.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    app.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedApp = filteredApplicants.find(a => a.id === selectedId) || filteredApplicants[0];

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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="text" 
                placeholder="Search applicants..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
            {filteredApplicants.length > 0 ? (
              filteredApplicants.map(app => (
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
                      <FeatureBar label="Credit Score" value={selectedApp.creditScore} max={850} weight={0.45} />
                      <FeatureBar label="Annual Income" value={selectedApp.income} max={200000} weight={0.35} />
                      <FeatureBar label="Debt-to-Income" value={selectedApp.debtRatio} max={1} weight={0.20} inverse />
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
                          "This decision was primarily driven by the applicant's high credit score, which offset the moderate debt-to-income ratio."
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
                  <h3 className="text-lg font-bold text-white">Counterfactual Analysis</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">To flip to Approve:</p>
                    <p className="text-xs text-slate-300">Increase Credit Score by <span className="text-emerald-400 font-bold">+45 points</span></p>
                  </div>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">To flip to Reject:</p>
                    <p className="text-xs text-slate-300">Increase Debt Ratio by <span className="text-rose-400 font-bold">+0.12</span></p>
                  </div>
                </div>
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
