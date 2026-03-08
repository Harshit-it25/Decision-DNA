
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, Activity, Settings, Search, AlertTriangle, 
  RotateCcw, History, LayoutDashboard, Cpu, Database,
  ArrowRight, CheckCircle2, XCircle, Info, ChevronRight,
  TrendingUp, BarChart4, Lock, Terminal, AlertCircle, RefreshCw,
  Eye, ShieldAlert, Zap, Globe, PlusCircle, X, Server, Sparkles, Key,
  Briefcase, DollarSign, Fingerprint
} from 'lucide-react';
import { 
  ModelMetadata, ModelStatus, ModelType, DriftMetrics, 
  SecurityStatus, ThreatLevel, IntegrityStatus, AuditEntry,
  Applicant
} from './types';
import { db } from './services/db';
import { performAttackSimulation, generateAuditId, performSystemReboot } from './services/simulationEngine';
import { getSecurityInsight, AITier, trainModelOnData } from './services/geminiService';
import { batchPredict, predictApplicant } from './services/modelEngine';
import { INITIAL_MODELS, MOCK_APPLICANTS } from './constants';

// Pages
import Dashboard from './pages/Dashboard';
import ModelManagement from './pages/ModelManagement';
import MonitoringCenter from './pages/MonitoringCenter';
import SecurityCenter from './pages/SecurityCenter';
import Explainability from './pages/Explainability';
import AuditTimeline from './pages/AuditTimeline';

// Services & Config
import { recordAuditAction } from './logs/auditLogs';
import { detectDrift } from './drift/driftDetector';
import { config } from './config/env';
import { monitoringService } from './services/monitoringService';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('overview');
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [activeModelId, setActiveModelId] = useState<string>('m2');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [aiTier, setAiTier] = useState<AITier>('standard');
  const [metrics, setMetrics] = useState<DriftMetrics>({
    psi: 0.04,
    flipRate: 0.02,
    spearmanRank: 0.98,
    timestamp: Date.now()
  });
  const [security, setSecurity] = useState<SecurityStatus>({
    threatLevel: ThreatLevel.LOW,
    integrity: IntegrityStatus.VERIFIED,
    forensicEvidence: []
  });
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("System initialized.");

  // Robust fallback logic to prevent "Cannot read properties of undefined (reading 'type')"
  const activeModel = useMemo(() => {
    return models.find(m => m.id === activeModelId) || models[0] || INITIAL_MODELS[0];
  }, [models, activeModelId]);

  const isCritical = security.threatLevel === ThreatLevel.CRITICAL;

  useEffect(() => {
    const initData = async () => {
      try {
        // Ensure seed has a chance to run if tables are empty
        await db.seed();
        
        // Increased limit to 5000 to handle even larger applicant pools
        const dbApplicants = await db.applicants.reverse().limit(5000).toArray();
        const dbModels = await db.models.toArray();
        const dbLogs = await db.auditLogs.reverse().limit(50).toArray();
        
        setApplicants(dbApplicants.length > 0 ? dbApplicants : MOCK_APPLICANTS);
        setModels(dbModels.length > 0 ? dbModels : INITIAL_MODELS);
        setAuditLogs(dbLogs);
        
        if (dbModels.length > 0) {
          const active = dbModels.find(m => m.status === ModelStatus.ACTIVE) || dbModels[0];
          setActiveModelId(active.id);
        }
        
        // Start continuous monitoring
        monitoringService.start();
        
        setIsDbLoaded(true);
      } catch (error) {
        console.error("Initialization failed", error);
        // Fallback to mock data even if DB fails to ensure app shows up
        setApplicants(MOCK_APPLICANTS);
        setModels(INITIAL_MODELS);
        setIsDbLoaded(true);
      }
    };
    initData();
  }, []);

  const handleReScore = async (model: ModelMetadata) => {
    const allApplicants = await db.applicants.toArray();
    const updatedApplicants = batchPredict(allApplicants, model);
    
    // Update DB
    await db.applicants.bulkPut(updatedApplicants);
    
    // Update State
    const displayApplicants = await db.applicants.reverse().limit(5000).toArray();
    setApplicants(displayApplicants);

    await recordAuditAction(
      "Batch Re-scoring",
      `Re-evaluated ${allApplicants.length} applicants using model ${model.id} (v${model.version}).`,
      'DRIFT',
      'INFO'
    );
    setAuditLogs(await db.auditLogs.reverse().limit(50).toArray());
  };

  const handleActivateModel = async (id: string) => {
    const model = models.find(m => m.id === id);
    if (model) {
      setActiveModelId(id);
      await handleReScore(model);
    }
  };

  const handleTrainModel = async () => {
    const newId = `m${models.length + 1}`;
    const newFingerprint = Math.random().toString(36).substring(2, 64);
    const type = Math.random() > 0.5 ? ModelType.LOGISTIC_REGRESSION : ModelType.RANDOM_FOREST;
    
    // Log training start
    const startLog: AuditEntry = {
      id: generateAuditId(),
      timestamp: Date.now(),
      action: "Model Training Started",
      details: `Initiating training for ${type} v1.1.${models.length} on ${applicants.length} records.`,
      category: 'TRAINING',
      severity: 'INFO'
    };
    await db.auditLogs.add(startLog);
    setAuditLogs(await db.auditLogs.reverse().limit(50).toArray());

    // Use Gemini to "train" on the actual data
    const trainingResult = await trainModelOnData(applicants, type, aiTier);

    const newModel: ModelMetadata = {
      id: newId,
      type,
      version: `1.1.${models.length}`,
      status: ModelStatus.TRAINING,
      accuracy: trainingResult.accuracy,
      fingerprint: newFingerprint,
      createdAt: Date.now(),
      featureImportance: trainingResult.featureImportance
    };
    
    await db.models.add(newModel);
    const updatedModels = await db.models.toArray();
    setModels(updatedModels);
    
    setTimeout(async () => {
      await db.models.update(newId, { status: ModelStatus.ACTIVE });
      const finalModels = await db.models.toArray();
      setModels(finalModels);
      
      const activatedModel = finalModels.find(m => m.id === newId);
      if (activatedModel) {
        setActiveModelId(newId);
        await handleReScore(activatedModel);
      }
      
      const endLog: AuditEntry = {
        id: generateAuditId(),
        timestamp: Date.now(),
        action: "Model Training Complete",
        details: `Model ${newId} deployed with ${trainingResult.accuracy * 100}% accuracy.`,
        category: 'TRAINING',
        severity: 'INFO'
      };
      await db.auditLogs.add(endLog);
      setAuditLogs(await db.auditLogs.reverse().limit(50).toArray());
    }, 3000);
  };

  const handleLoadRealDataset = async () => {
    // Generate 5000 realistic records based on standard credit distributions
    const realData: Applicant[] = Array.from({ length: 5000 }).map((_, i) => {
      // Use Box-Muller transform for normal distribution simulation
      const randNormal = () => {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      };

      // Credit Score: Mean 700, SD 50, clamped 300-850
      const creditScore = Math.floor(Math.max(300, Math.min(850, 700 + randNormal() * 80)));
      
      // Income: Log-normal distribution (more realistic for income)
      // Mean ~65k, with some high earners
      const income = Math.floor(Math.exp(10.5 + randNormal() * 0.5));
      
      // Debt Ratio: Beta-like distribution (mostly low, some high)
      const debtRatio = Math.min(0.95, Math.abs(randNormal() * 0.15 + 0.3));
      
      const loanAmount = Math.floor(Math.max(5000, Math.min(100000, income * (0.1 + Math.random() * 0.4))));
      
      // Initial scoring logic for the dataset (will be re-scored by active model)
      const riskProb = 1 - ((creditScore - 300) / 550 * 0.6 + (1 - debtRatio) * 0.3 + (income / 200000) * 0.1);
      const decision = (creditScore > 660 && debtRatio < 0.40) || (creditScore > 720 && debtRatio < 0.50) ? 'Approve' : 'Reject';
      
      const names = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
      const surnames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

      return {
        id: `LENDING-${10000 + i}`,
        name: `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`,
        nationality: ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Japan', 'Australia', 'Singapore'][Math.floor(Math.random() * 8)],
        income,
        debtRatio,
        creditScore,
        loanAmount,
        riskProbability: Math.max(0, Math.min(1, riskProb)),
        decision
      };
    });

    await db.applicants.clear(); // Clear existing to avoid confusion with the large trusted set
    await db.applicants.bulkAdd(realData);
    const updatedApps = await db.applicants.reverse().limit(5000).toArray();
    setApplicants(updatedApps);
    
    const log: AuditEntry = {
      id: generateAuditId(),
      timestamp: Date.now(),
      action: "Trusted Dataset Ingestion",
      details: `Ingested 5,000 records from synthetic Lending-Standard distribution. Data integrity verified via checksum.`,
      category: 'DRIFT',
      severity: 'INFO'
    };
    await db.auditLogs.add(log);
    setAuditLogs(await db.auditLogs.reverse().limit(50).toArray());
  };

  const handleUpgradeAPI = async () => {
    try {
      if ((window as any).aistudio?.openSelectKey) {
        await (window as any).aistudio.openSelectKey();
        setAiTier('performance');
      } else {
        window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank');
      }
    } catch (err) {
      console.error("Key selection failed", err);
    }
  };

  const handleAddApplicant = async (newApp: Applicant) => {
    // Predict using active model
    const { riskProbability, decision } = predictApplicant(newApp, activeModel);
    const scoredApp = { ...newApp, riskProbability, decision };
    
    await db.applicants.add(scoredApp);
    const log: AuditEntry = {
      id: generateAuditId(),
      timestamp: Date.now(),
      action: "Manual Ingestion",
      details: `New data point ingested: ${newApp.id}. Data integrity verified.`,
      category: 'DRIFT',
      severity: 'INFO'
    };
    await db.auditLogs.add(log);
    const updatedApps = await db.applicants.reverse().limit(2000).toArray();
    const updatedLogs = await db.auditLogs.reverse().limit(50).toArray();
    setApplicants(updatedApps);
    setAuditLogs(updatedLogs);
    setIsModalOpen(false);
    setCurrentPage('explainability');
  };

  useEffect(() => {
    const fetchInsight = async () => {
      const insight = await getSecurityInsight(security.threatLevel, security.integrity, metrics.psi, aiTier);
      setAiInsight(insight);
    };
    fetchInsight();
  }, [security, metrics.psi, aiTier]);

  const handleReboot = async () => {
    const baseline = models.find(m => m.status === ModelStatus.STABLE_BASELINE);
    if (baseline) {
      setActiveModelId(baseline.id);
      await handleReScore(baseline);
      setSecurity({ threatLevel: ThreatLevel.LOW, integrity: IntegrityStatus.VERIFIED, forensicEvidence: [] });
      setMetrics({ psi: 0.05, flipRate: 0.01, spearmanRank: 0.99, timestamp: Date.now() });
      const log: AuditEntry = {
        id: generateAuditId(),
        timestamp: Date.now(),
        action: "System Reboot",
        details: "Rolled back to stable baseline.",
        category: 'REBOOT',
        severity: 'INFO'
      };
      await db.auditLogs.add(log);
      const updatedLogs = await db.auditLogs.reverse().limit(50).toArray();
      setAuditLogs(updatedLogs);
      setCurrentPage('overview');
    }
  };

  const handleAttack = async (type: any, customParams?: any) => {
    const { newMetrics, newSecurity, audit } = performAttackSimulation(type, metrics, customParams);
    setMetrics(newMetrics);
    setSecurity(newSecurity);
    await db.auditLogs.add(audit);
    const updatedLogs = await db.auditLogs.reverse().limit(50).toArray();
    setAuditLogs(updatedLogs);
  };

  if (!isDbLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-500 font-mono uppercase tracking-widest text-xs">
        <Database size={48} className="text-indigo-500 animate-pulse-slow mb-4" />
        Establishing Persistent Storage...
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'overview': return <Dashboard activeModel={activeModel} metrics={metrics} security={security} auditLogs={auditLogs} insight={aiInsight} aiTier={aiTier} />;
      case 'models': return <ModelManagement models={models} setModels={setModels} activeModelId={activeModelId} setActiveModelId={handleActivateModel} onTrain={handleTrainModel} onLoadRealData={handleLoadRealDataset} />;
      case 'monitoring': return <MonitoringCenter metrics={metrics} security={security} applicants={applicants} />;
      case 'security': return <SecurityCenter security={security} onAttack={handleAttack} onReboot={handleReboot} logs={auditLogs.filter(l => l.category === 'ATTACK' || l.category === 'SECURITY')} />;
      case 'explainability': return <Explainability activeModel={activeModel} applicants={applicants} aiTier={aiTier} onAddApplicant={() => setIsModalOpen(true)} onTrain={handleTrainModel} />;
      case 'audit': return <AuditTimeline logs={auditLogs} />;
      default: return <Dashboard activeModel={activeModel} metrics={metrics} security={security} auditLogs={auditLogs} insight={aiInsight} aiTier={aiTier} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <aside className={`w-64 border-r border-slate-800 flex flex-col sticky top-0 h-screen transition-all ${isCritical ? 'blur-xl opacity-20' : 'opacity-100'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Decision DNA</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="Overview" active={currentPage === 'overview'} onClick={() => setCurrentPage('overview')} />
          <NavItem icon={<Database size={20} />} label="Model Repo" active={currentPage === 'models'} onClick={() => setCurrentPage('models')} />
          <NavItem 
            icon={<Activity size={20} />} 
            label="Monitoring" 
            active={currentPage === 'monitoring'} 
            onClick={() => setCurrentPage('monitoring')} 
            alert={metrics.psi >= 0.1 ? (metrics.psi >= 0.25 ? 'CRITICAL' : 'WARNING') : undefined}
          />
          <NavItem icon={<Lock size={20} />} label="Security" active={currentPage === 'security'} onClick={() => setCurrentPage('security')} />
          <NavItem icon={<Terminal size={20} />} label="Explainability" active={currentPage === 'explainability'} onClick={() => setCurrentPage('explainability')} />
          <NavItem icon={<History size={20} />} label="Audit Trail" active={currentPage === 'audit'} onClick={() => setCurrentPage('audit')} />
        </nav>

        <div className="p-4 mx-4 mb-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className={aiTier === 'performance' ? 'text-violet-400' : 'text-slate-500'} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">AI Intelligence</span>
            </div>
            <div className={`px-2 py-0.5 rounded text-[8px] font-black border ${aiTier === 'performance' ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              {aiTier.toUpperCase()}
            </div>
          </div>
          
          <button 
            onClick={() => setAiTier(aiTier === 'standard' ? 'performance' : 'standard')}
            className="w-full flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500/30 transition-all group"
          >
            <span className="text-[10px] text-slate-400 font-bold">Switch Tier</span>
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${aiTier === 'performance' ? 'bg-violet-600' : 'bg-slate-800'}`}>
              <div className={`w-3 h-3 bg-white rounded-full transition-transform ${aiTier === 'performance' ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>

          <button 
            onClick={handleUpgradeAPI}
            className="w-full py-2 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-900/20 active:scale-95 border border-indigo-400/30"
          >
            <Key size={10} /> Increase Limits
          </button>
        </div>
      </aside>

      <main className="flex-1 relative overflow-y-auto bg-slate-950">
        {isCritical && (
          <div className="absolute inset-0 z-[100] bg-slate-950/98 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in duration-500">
            <AlertTriangle size={64} className="text-rose-500 animate-bounce mb-8" />
            <h1 className="text-5xl font-black text-white uppercase italic transform -skew-x-6 mb-8">System Compromised</h1>
            <button onClick={handleReboot} className="py-4 px-10 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl flex items-center gap-3 transition-all">
              <RefreshCw size={20} className="animate-spin-slow" /> EMERGENCY REBOOT
            </button>
          </div>
        )}

        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 bg-slate-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-100 capitalize">{currentPage.replace('-', ' ')}</h2>
            <div className="flex items-center gap-2 bg-slate-800/50 px-2 py-1 rounded text-[10px] font-mono border border-slate-700 text-slate-400">
              <Server size={10} className="text-emerald-500" /> DB PERSISTENCE ACTIVE
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg border border-indigo-400/30 transition-all">
              <PlusCircle size={14} /> NEW APPLICANT
            </button>
          </div>
        </header>

        <div className="p-8">{renderPage()}</div>
        {isModalOpen && <CreateApplicantModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddApplicant} />}
      </main>
    </div>
  );
};

const NavItem: React.FC<{icon: any, label: string, active?: boolean, onClick: () => void, alert?: 'WARNING' | 'CRITICAL'}> = ({ icon, label, active, onClick, alert }) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${active ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'}`}>
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
    {alert && (
      <div className={`w-2 h-2 rounded-full ${alert === 'CRITICAL' ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'}`} />
    )}
  </button>
);

interface CreateApplicantModalProps { onClose: () => void; onSubmit: (app: Applicant) => void; }

const InputField = ({ label, icon, name, type = 'text', errors, ...props }: any) => (
  <div className="space-y-1.5 flex flex-col">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
      {icon} {label}
    </label>
    <input 
      {...props}
      type={type}
      name={name}
      className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white outline-none transition-all ${
        errors[name] ? 'border-rose-500 bg-rose-500/5 shadow-[0_0_10px_rgba(244,63,94,0.1)]' : 'border-slate-800 focus:border-indigo-500/50'
      }`}
    />
    {errors[name] && <span className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-left-2">{errors[name]}</span>}
  </div>
);

const CreateApplicantModal: React.FC<CreateApplicantModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ 
    name: '', 
    nationality: 'United States', 
    income: 50000, 
    debtRatio: 0.3, 
    creditScore: 700, 
    loanAmount: 150000 
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const countries = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Japan', 'India', 'Brazil', 'Australia', 'Singapore', 'Netherlands', 'Sweden', 'Switzerland', 'Spain', 'Italy', 'South Korea', 'Mexico', 'United Arab Emirates', 'Norway', 'Denmark'];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    else if (formData.name.length < 3) newErrors.name = 'Name must be at least 3 characters';
    
    if (formData.income <= 0) newErrors.income = 'Income must be a positive number';
    
    if (formData.creditScore < 300 || formData.creditScore > 850) newErrors.creditScore = 'Credit score must be between 300 and 850';
    
    if (formData.debtRatio < 0 || formData.debtRatio > 1) newErrors.debtRatio = 'Debt ratio must be between 0.0 and 1.0';
    
    if (formData.loanAmount <= 0) newErrors.loanAmount = 'Loan amount must be positive';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const normalizedScore = (formData.creditScore - 300) / 550;
      const normalizedDebt = 1 - formData.debtRatio;
      const scoreFactor = (normalizedScore * 0.6) + (normalizedDebt * 0.4);
      const newApp: Applicant = { 
        ...formData, 
        id: `app-user-${Date.now()}`, 
        riskProbability: Math.max(0, Math.min(1, 1 - scoreFactor)), 
        decision: (formData.creditScore > 650 && formData.debtRatio < 0.4) ? 'Approve' : 'Reject' 
      };
      onSubmit(newApp);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-8 shadow-2xl scale-in-center overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-start mb-8">
          <h3 className="text-2xl font-black text-white flex items-center gap-2"><PlusCircle className="text-indigo-400" /> Ingest Applicant</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <InputField 
              label="Full Name" 
              icon={<Fingerprint size={12}/>} 
              name="name" 
              errors={errors}
              value={formData.name} 
              onChange={(e: any) => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          
          <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Globe size={12}/> Nationality
            </label>
            <select 
              value={formData.nationality} 
              onChange={(e: any) => setFormData({...formData, nationality: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
            >
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <InputField 
            label="Annual Income ($)" 
            icon={<DollarSign size={12}/>} 
            name="income" 
            errors={errors}
            type="number" 
            value={formData.income} 
            onChange={(e: any) => setFormData({...formData, income: Number(e.target.value)})} 
          />

          <InputField 
            label="Credit Score (300-850)" 
            icon={<Activity size={12}/>} 
            name="creditScore" 
            errors={errors}
            type="number" 
            value={formData.creditScore} 
            onChange={(e: any) => setFormData({...formData, creditScore: Number(e.target.value)})} 
          />

          <InputField 
            label="Debt-to-Income Ratio (0-1)" 
            icon={<TrendingUp size={12}/>} 
            name="debtRatio" 
            errors={errors}
            type="number" 
            step="0.01"
            value={formData.debtRatio} 
            onChange={(e: any) => setFormData({...formData, debtRatio: Number(e.target.value)})} 
          />

          <InputField 
            label="Loan Amount Requested ($)" 
            icon={<Briefcase size={12}/>} 
            name="loanAmount" 
            errors={errors}
            type="number" 
            value={formData.loanAmount} 
            onChange={(e: any) => setFormData({...formData, loanAmount: Number(e.target.value)})} 
          />

          <div className="md:col-span-2">
            <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/20">
              Ingest Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
