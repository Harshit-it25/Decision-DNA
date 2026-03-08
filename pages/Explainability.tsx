
import React, { useState, useEffect, useMemo } from 'react';
import { Applicant, ModelMetadata } from '../types';
import { getDecisionExplanation, analyzeAppeal, AITier } from '../services/geminiService';
import { BrainCircuit, User, CheckCircle2, XCircle, Search, MessageSquare, UserPlus, RefreshCw, Sparkles, Send, Globe, Zap, Filter, Users, TrendingDown, DollarSign, Activity, Download } from 'lucide-react';
import { MOCK_APPLICANTS } from '../constants';

interface ExplainabilityProps {
  activeModel: ModelMetadata;
  applicants: Applicant[]; 
  aiTier: AITier;
  onAddApplicant: () => void;
  onTrain: () => void;
}

const Explainability: React.FC<ExplainabilityProps> = ({ activeModel, applicants, aiTier, onAddApplicant, onTrain }) => {
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'All' | 'Approve' | 'Reject'>('All');
  const [nationalityFilter, setNationalityFilter] = useState<string>('All');
  const [riskFilter, setRiskFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const [incomeFilter, setIncomeFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  
  const [explanation, setExplanation] = useState<string>("Initializing analyst engine...");
  const [appealResponse, setAppealResponse] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAppealing, setIsAppealing] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  const handleTrain = () => {
    setIsTraining(true);
    onTrain();
    setTimeout(() => setIsTraining(false), 3000);
  };

  const handleExportCSV = () => {
    if (!applicants.length) return;
    
    const headers = ['id', 'name', 'nationality', 'income', 'debtRatio', 'creditScore', 'loanAmount', 'riskProbability', 'decision'];
    const csvRows = [
      headers.join(','),
      ...applicants.map(app => [
        app.id,
        `"${app.name}"`,
        app.nationality,
        app.income,
        app.debtRatio,
        app.creditScore,
        app.loanAmount,
        app.riskProbability,
        app.decision
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `decision_dna_dataset_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safety fallback for selectedApp
  const selectedApp = useMemo(() => {
    const found = applicants.find(a => a.id === selectedAppId);
    if (found) return found;
    if (applicants.length > 0) return applicants[0];
    return MOCK_APPLICANTS[0];
  }, [applicants, selectedAppId]);

  // Sync selectedAppId if it's empty or invalid
  useEffect(() => {
    if (!selectedAppId && applicants.length > 0) {
      setSelectedAppId(applicants[0].id);
    }
  }, [applicants, selectedAppId]);

  const uniqueNationalities = useMemo(() => {
    const nations = new Set(applicants.map(a => a.nationality));
    nations.delete('All');
    return ['All', ...Array.from(nations).sort()];
  }, [applicants]);

  useEffect(() => {
    if (selectedApp && activeModel) handleExplain();
    setAppealResponse(null);
    setUserAnswer("");
  }, [selectedAppId, aiTier, selectedApp, activeModel]);

  const handleExplain = async () => {
    if (!selectedApp || !activeModel || !activeModel.type) return;
    setIsLoading(true);
    const result = await getDecisionExplanation(selectedApp, activeModel, aiTier);
    setExplanation(result);
    setIsLoading(false);
  };

  const handleAppeal = async () => {
    if (!userAnswer.trim() || !selectedApp || !activeModel) return;
    setIsAppealing(true);
    const result = await analyzeAppeal(selectedApp, activeModel, userAnswer, aiTier);
    setAppealResponse(result);
    setIsAppealing(false);
  };

  const filteredApplicants = useMemo(() => {
    return (applicants || []).filter(app => {
      // Basic Search
      const matchesSearch = app?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           app?.id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status Filter
      const matchesStatus = statusFilter === 'All' || app.decision === statusFilter;
      
      // Nationality Filter
      const matchesNationality = nationalityFilter === 'All' || app.nationality === nationalityFilter;
      
      // Risk Filter Logic
      let matchesRisk = true;
      if (riskFilter === 'Low') matchesRisk = app.riskProbability < 0.3;
      else if (riskFilter === 'Medium') matchesRisk = app.riskProbability >= 0.3 && app.riskProbability <= 0.7;
      else if (riskFilter === 'High') matchesRisk = app.riskProbability > 0.7;

      // Income Filter Logic
      let matchesIncome = true;
      if (incomeFilter === 'Low') matchesIncome = app.income < 50000;
      else if (incomeFilter === 'Medium') matchesIncome = app.income >= 50000 && app.income <= 100000;
      else if (incomeFilter === 'High') matchesIncome = app.income > 100000;

      return matchesSearch && matchesStatus && matchesNationality && matchesRisk && matchesIncome;
    });
  }, [applicants, searchTerm, statusFilter, nationalityFilter, riskFilter, incomeFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setNationalityFilter("All");
    setRiskFilter("All");
    setIncomeFilter("All");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl h-[750px] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 space-y-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="text-indigo-400" size={18} />
              <h3 className="font-bold text-white">Applicants</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportCSV}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all"
                title="Export CSV"
              >
                <Download size={14} />
              </button>
              <button 
                onClick={onAddApplicant}
                className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/20 transition-all"
                title="Add Applicant"
              >
                <UserPlus size={14} />
              </button>
              <button 
                onClick={handleTrain}
                disabled={isTraining}
                className={`p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition-all ${isTraining ? 'animate-pulse' : ''}`}
                title="Train Model"
              >
                <RefreshCw size={14} className={isTraining ? 'animate-spin' : ''} />
              </button>
              {(searchTerm || statusFilter !== 'All' || nationalityFilter !== 'All' || riskFilter !== 'All' || incomeFilter !== 'All') && (
                <button 
                  onClick={resetFilters} 
                  className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FilterSelect 
              icon={<Filter size={10} />} 
              value={statusFilter} 
              onChange={(v: string) => setStatusFilter(v as any)}
              options={[
                { label: 'All Status', value: 'All' },
                { label: 'Accepted', value: 'Approve' },
                { label: 'Rejected', value: 'Reject' }
              ]}
            />
            <FilterSelect 
              icon={<Globe size={10} />} 
              value={nationalityFilter} 
              onChange={setNationalityFilter}
              options={uniqueNationalities.map(n => ({ label: n === 'All' ? 'All Nations' : n, value: n }))}
            />
            <FilterSelect 
              icon={<Activity size={10} />} 
              value={riskFilter} 
              onChange={(v: string) => setRiskFilter(v as any)}
              options={[
                { label: 'All Risk', value: 'All' },
                { label: 'Low Risk', value: 'Low' },
                { label: 'Medium Risk', value: 'Medium' },
                { label: 'High Risk', value: 'High' }
              ]}
            />
            <FilterSelect 
              icon={<DollarSign size={10} />} 
              value={incomeFilter} 
              onChange={(v: string) => setIncomeFilter(v as any)}
              options={[
                { label: 'All Income', value: 'All' },
                { label: 'Low (<$50k)', value: 'Low' },
                { label: 'Mid ($50-100k)', value: 'Medium' },
                { label: 'High (>$100k)', value: 'High' }
              ]}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 terminal-scroll bg-slate-950/20">
          {filteredApplicants.length > 0 ? (
            filteredApplicants.map(app => (
              <button 
                key={app.id} 
                onClick={() => setSelectedAppId(app.id)} 
                className={`w-full p-4 rounded-xl border text-left transition-all group ${selectedAppId === app.id ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.08)]' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 overflow-hidden">
                    <div className="font-bold text-base text-white truncate group-hover:text-indigo-300 transition-colors">
                      {app.name || "Unknown Applicant"}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">{app.id}</div>
                    <div className="flex flex-wrap gap-2 mt-3">
                       <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
                         <DollarSign size={10} /> ${(app.income/1000).toFixed(0)}k
                       </span>
                       <span className={`text-[10px] px-2 py-1 rounded-lg border flex items-center gap-1.5 ${
                         app.riskProbability > 0.7 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                         app.riskProbability > 0.3 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                         'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                       }`}>
                         <Activity size={10} /> Risk: {(app.riskProbability * 100).toFixed(0)}%
                       </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0 ml-3">
                    {app.decision === 'Approve' ? (
                      <CheckCircle2 className="text-emerald-500" size={20} />
                    ) : (
                      <XCircle className="text-rose-500" size={20} />
                    )}
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border tracking-wider ${
                      app.decision === 'Approve' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                      {app.decision === 'Approve' ? 'Accepted' : 'Rejected'}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-50">
              <Search size={32} className="text-slate-700 animate-pulse" />
              <div className="space-y-1">
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">No applicants match</div>
                <div className="text-[9px] text-slate-600">Try adjusting your filters</div>
              </div>
              <button 
                onClick={resetFilters} 
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold px-4 py-1.5 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/5 transition-all"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <BrainCircuit size={120} className="text-indigo-500" />
          </div>

          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-950 rounded-3xl flex items-center justify-center border border-slate-800 shadow-inner group">
                <User size={40} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div>
                <h2 className="text-5xl font-black text-white tracking-tighter">
                  {selectedApp?.name || "No Name Provided"}
                </h2>
                <div className="flex items-center gap-4 mt-4">
                   <span className="text-xs text-slate-500 font-mono uppercase tracking-widest bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">{selectedApp?.id}</span>
                   <span className="text-xs text-slate-400 flex items-center gap-2">
                     <Globe size={14} className="text-indigo-500" /> {selectedApp?.nationality}
                   </span>
                   <span className="text-xs text-slate-400 flex items-center gap-2">
                     <DollarSign size={14} className="text-emerald-500" /> ${selectedApp?.income?.toLocaleString()}
                   </span>
                </div>
              </div>
            </div>
            <div className={`px-10 py-4 rounded-2xl font-black text-lg border shadow-lg ${selectedApp?.decision === 'Approve' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-500/5'}`}>
              {selectedApp?.decision === 'Approve' ? 'ACCEPTED' : 'REJECTED'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-6 bg-slate-950/40 p-6 rounded-2xl border border-slate-800/50">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <BrainCircuit size={14} className="text-indigo-500" /> Decision Weighting
                </h4>
                <div className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {activeModel?.type}
                </div>
              </div>
              <div className="space-y-4">
                {activeModel?.featureImportance?.map(feat => (
                  <div key={feat.feature} className="space-y-3">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400 uppercase tracking-wider">{feat.feature}</span>
                      <span className="text-indigo-400 font-mono text-sm">{(feat.weight * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                      <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.4)]" style={{ width: `${feat.weight * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col min-h-[300px] relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-emerald-400">
                  <MessageSquare size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">AI Audit Logic</span>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 border rounded text-[9px] font-black transition-all ${
                  aiTier === 'performance' ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}>
                  <Sparkles size={10} /> {aiTier === 'performance' ? 'PRO ANALYST' : 'STANDARD'}
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center text-center px-4 py-2">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <RefreshCw size={32} className="animate-spin text-emerald-500" />
                      <div className="absolute inset-0 bg-emerald-500/20 blur-xl animate-pulse rounded-full" />
                    </div>
                    <div className="text-[11px] font-mono text-emerald-500 uppercase tracking-widest">Performing Forensic Analysis...</div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-200 italic leading-relaxed font-medium">"{explanation}"</p>
                )}
              </div>
              <button 
                onClick={handleExplain} 
                disabled={isLoading} 
                className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/20 active:scale-[0.98] border border-indigo-400/20"
              >
                Refresh Analysis
              </button>
            </div>
          </div>

          {selectedApp?.decision === 'Reject' && (
            <div className="mt-8 pt-8 border-t border-slate-800 space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-500">
                  <Zap size={16} />
                  <h4 className="text-[11px] font-black uppercase tracking-widest">Submit Re-evaluation Appeal</h4>
                </div>
                <span className="text-[9px] text-slate-500 uppercase font-bold">Automated Legal Scan Active</span>
              </div>
              <div className="relative group">
                <textarea 
                  value={userAnswer} 
                  onChange={(e) => setUserAnswer(e.target.value)} 
                  placeholder="Provide additional justification for automated review (e.g., upcoming promotion, external collateral)..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs text-slate-300 outline-none focus:border-amber-500/50 transition-all h-28 resize-none shadow-inner group-hover:border-slate-700" 
                />
                <button 
                  onClick={handleAppeal} 
                  disabled={isAppealing || !userAnswer.trim()} 
                  className="absolute bottom-4 right-4 p-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all shadow-xl disabled:opacity-50 disabled:grayscale"
                >
                  {isAppealing ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
              {appealResponse && (
                <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-xs text-slate-300 font-medium italic border-l-4 border-l-amber-500 animate-in slide-in-from-bottom-2">
                  <div className="text-[9px] font-black uppercase text-amber-500 mb-1">Appeal Verdict:</div>
                  "{appealResponse}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-component for filters
const FilterSelect = ({ icon, value, onChange, options }: any) => (
  <div className="relative">
    <select 
      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-[10px] font-bold text-slate-300 outline-none appearance-none cursor-pointer focus:border-indigo-500/50 hover:bg-slate-900 transition-all"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt: any, idx: number) => (
        <option key={`${opt.value}-${idx}`} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    <div className="absolute left-2.5 top-2.5 text-slate-500 pointer-events-none">
      {icon}
    </div>
  </div>
);

export default Explainability;
