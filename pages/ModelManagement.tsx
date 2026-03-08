
import React, { useState } from 'react';
import { ModelMetadata, ModelStatus, ModelType } from '../types';
import { Plus, Check, Trash2, ShieldCheck, Clock, Layers, Hash, ShieldAlert, Search, RefreshCw, Zap, RotateCcw, Database, Info, X, FileText, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModelManagementProps {
  models: ModelMetadata[];
  setModels: React.Dispatch<React.SetStateAction<ModelMetadata[]>>;
  activeModelId: string;
  setActiveModelId: (id: string) => void;
  onTrain: () => void;
  onLoadRealData: () => void;
}

const ModelManagement: React.FC<ModelManagementProps> = ({ models, setModels, activeModelId, setActiveModelId, onTrain, onLoadRealData }) => {
  const [isTraining, setIsTraining] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [selectedModelForMeta, setSelectedModelForMeta] = useState<ModelMetadata | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, 'verified' | 'discrepancy' | null>>({});
  const isVerifyingAny = verifyingId !== null;

  // Known secure baselines (simulated registry)
  const [secureRegistry, setSecureRegistry] = useState<Record<string, string>>({
    'm1': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'm2': 'ac5169992323e2a7e7542d45a982992497046e7f97542d45a982992497046e7f'
  });

  const handleTrainModel = () => {
    setIsTraining(true);
    onTrain();
    setTimeout(() => {
      setIsTraining(false);
    }, 2000);
  };

  const verifyIntegrity = (model: ModelMetadata) => {
    setVerifyingId(model.id);
    
    // Simulate network delay for verification
    setTimeout(() => {
      const baseline = secureRegistry[model.id];
      
      if (!baseline) {
        // If not in registry, we consider it a discrepancy until "Authorized"
        setVerificationResults(prev => ({ ...prev, [model.id]: 'discrepancy' }));
      } else if (baseline === model.fingerprint) {
        setVerificationResults(prev => ({ ...prev, [model.id]: 'verified' }));
      } else {
        setVerificationResults(prev => ({ ...prev, [model.id]: 'discrepancy' }));
      }
      
      setVerifyingId(null);
    }, 1500);
  };

  const authorizeBaseline = (model: ModelMetadata) => {
    setSecureRegistry(prev => ({ ...prev, [model.id]: model.fingerprint }));
    setVerificationResults(prev => ({ ...prev, [model.id]: 'verified' }));
  };

  const handleRollback = () => {
    const stableModel = models.find(m => m.status === ModelStatus.STABLE_BASELINE);
    if (stableModel) {
      setActiveModelId(stableModel.id);
      alert(`System rolled back to Stable Baseline: ${stableModel.type} v${stableModel.version}`);
    }
  };

  const deleteModel = (id: string) => {
    if (id === activeModelId) return;
    setModels(models.filter(m => m.id !== id));
  };

  // Create a copy before sorting to avoid mutating state directly
  const sortedModels = [...models].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Model Repository</h2>
          <p className="text-sm text-slate-400">Manage, train and verify model versions</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={async () => {
              setIsLoadingData(true);
              await onLoadRealData();
              setIsLoadingData(false);
            }}
            disabled={isLoadingData}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-400 text-sm font-bold transition-all shadow-lg shadow-indigo-500/5"
          >
            {isLoadingData ? <RefreshCw size={18} className="animate-spin" /> : <Database size={18} />}
            {isLoadingData ? 'Ingesting...' : 'Load Trusted Dataset (5,000 Records)'}
          </button>
          <button 
            onClick={() => models.forEach(m => verifyIntegrity(m))}
            disabled={isVerifyingAny}
            className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-300 text-sm font-semibold transition-colors"
          >
            <Search size={18} />
            Verify All
          </button>
          <button 
            onClick={handleTrainModel}
            disabled={isTraining}
            className={`flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-sm font-semibold transition-colors ${isTraining ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isTraining ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
            {isTraining ? 'Training Model...' : 'Train New Version'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedModels.map(model => {
          const vStatus = verificationResults[model.id];
          const isVerifying = verifyingId === model.id;

          return (
            <div 
              key={model?.id} 
              className={`bg-slate-900 border ${
                model?.id === activeModelId ? 'border-emerald-500/50 bg-emerald-500/[0.02]' : 
                vStatus === 'discrepancy' ? 'border-rose-500/50 bg-rose-500/[0.02]' :
                'border-slate-800'
              } rounded-xl p-5 flex flex-col md:flex-row gap-6 items-start md:items-center transition-all hover:border-slate-700`}
            >
              <div className={`p-3 rounded-xl border ${
                model?.id === activeModelId ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                vStatus === 'discrepancy' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                <Layers size={24} />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg text-white">{model?.type || 'Unknown Model'}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono border border-slate-700">v{model?.version || '0.0.0'}</span>
                  {model?.id === activeModelId && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <Check size={12} /> Active
                    </span>
                  )}
                  {vStatus === 'verified' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <ShieldCheck size={12} /> Integrity Verified
                    </span>
                  )}
                  {vStatus === 'discrepancy' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 animate-pulse">
                      <ShieldAlert size={12} /> Discrepancy Detected
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5"><Clock size={14} /> {model?.createdAt ? new Date(model.createdAt).toLocaleDateString() : 'Date Unknown'}</div>
                  <div className="flex items-center gap-1.5 font-mono"><Hash size={14} /> {model?.fingerprint?.substring(0, 16) || 'N/A'}...</div>
                  <div className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> Accuracy: {model?.accuracy ? (model.accuracy * 100).toFixed(1) : '0.0'}%</div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={() => verifyIntegrity(model)}
                  disabled={isVerifying}
                  className={`flex-1 md:flex-none px-4 py-2 border rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    vStatus === 'discrepancy' ? 'bg-rose-600 border-rose-500 text-white hover:bg-rose-500' :
                    'border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {isVerifying ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                  {isVerifying ? 'Verifying...' : vStatus === 'discrepancy' ? 'Re-Verify' : 'Verify Integrity'}
                </button>

                {vStatus === 'discrepancy' && (
                  <button 
                    onClick={() => authorizeBaseline(model)}
                    className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm text-white font-semibold transition-colors"
                  >
                    Authorize Baseline
                  </button>
                )}

                {model?.status !== ModelStatus.STABLE_BASELINE && (
                  <button 
                    onClick={handleRollback}
                    className="flex-1 md:flex-none px-4 py-2 border border-rose-500/30 hover:bg-rose-500/10 rounded-lg text-sm text-rose-400 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw size={14} /> Rollback
                  </button>
                )}

                {model?.id !== activeModelId && !vStatus && (
                  <button 
                    onClick={() => setActiveModelId(model.id)}
                    className="flex-1 md:flex-none px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-300 transition-colors"
                  >
                    Select & Run
                  </button>
                )}

                {model?.id === activeModelId && (
                  <button 
                    onClick={() => alert(`Executing validation test for ${model.type} v${model.version}...`)}
                    className="flex-1 md:flex-none px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 rounded-lg text-sm text-indigo-400 font-bold transition-all flex items-center gap-2"
                  >
                    <Zap size={14} /> Run Test
                  </button>
                )}
                
                <button 
                  onClick={() => setSelectedModelForMeta(model)}
                  className="p-2 rounded-lg border border-slate-800 hover:bg-indigo-500/10 hover:border-indigo-500/20 hover:text-indigo-400 text-slate-500 transition-all"
                  title="View Metadata"
                >
                  <Info size={18} />
                </button>

                <button 
                  onClick={() => deleteModel(model.id)}
                  disabled={model?.id === activeModelId || model?.status === ModelStatus.STABLE_BASELINE}
                  className={`p-2 rounded-lg border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 text-slate-500 transition-all ${ (model?.id === activeModelId || model?.status === ModelStatus.STABLE_BASELINE) ? 'opacity-20 cursor-not-allowed' : '' }`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedModelForMeta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Model Documentation</h3>
                    <p className="text-xs text-slate-400">Metadata and performance parameters for v{selectedModelForMeta.version}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedModelForMeta(null)}
                  className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  <MetaItem label="Model ID" value={selectedModelForMeta.id} icon={<Hash size={14} />} />
                  <MetaItem label="Architecture" value={selectedModelForMeta.type} icon={<Layers size={14} />} />
                  <MetaItem label="Created At" value={new Date(selectedModelForMeta.createdAt).toLocaleString()} icon={<Clock size={14} />} />
                  <MetaItem label="Accuracy" value={`${(selectedModelForMeta.accuracy * 100).toFixed(2)}%`} icon={<BarChart2 size={14} />} />
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <BarChart2 size={14} /> Training Report
                  </h4>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Dataset Source:</span>
                      <span className="text-xs text-indigo-300 font-mono">dataset.csv (5,000 Records)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Training Date:</span>
                      <span className="text-xs text-indigo-300 font-mono">{new Date(selectedModelForMeta.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Validation Split:</span>
                      <span className="text-xs text-indigo-300 font-mono">20% (Hold-out)</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">Final Accuracy:</span>
                        <span className="text-sm font-black text-emerald-400">{(selectedModelForMeta.accuracy * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Zap size={14} /> Training Parameters
                  </h4>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono text-xs text-indigo-300 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500">learning_rate:</span> 0.00125
                    </div>
                    <div>
                      <span className="text-slate-500">batch_size:</span> 64
                    </div>
                    <div>
                      <span className="text-slate-500">optimizer:</span> adam_weighted
                    </div>
                    <div>
                      <span className="text-slate-500">regularization:</span> l2_0.01
                    </div>
                    <div>
                      <span className="text-slate-500">epochs:</span> 45
                    </div>
                    <div>
                      <span className="text-slate-500">loss_function:</span> binary_crossentropy
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <BarChart2 size={14} /> Feature Importance
                  </h4>
                  <div className="space-y-3">
                    {selectedModelForMeta.featureImportance.map((feat, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-medium">{feat.feature}</span>
                          <span className="text-indigo-400 font-mono">{(feat.weight * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${feat.weight * 100}%` }}
                            className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex gap-4">
                  <ShieldCheck className="text-emerald-400 shrink-0" size={20} />
                  <div>
                    <h5 className="text-sm font-bold text-emerald-400">Immutable Fingerprint</h5>
                    <p className="text-[10px] text-slate-400 font-mono break-all mt-1">{selectedModelForMeta.fingerprint}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-end">
                <button 
                  onClick={() => setSelectedModelForMeta(null)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-all"
                >
                  Close Documentation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MetaItem = ({ label, value, icon }: any) => (
  <div className="space-y-1">
    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
      {icon} {label}
    </div>
    <div className="text-sm text-white font-medium">{value}</div>
  </div>
);

export default ModelManagement;
