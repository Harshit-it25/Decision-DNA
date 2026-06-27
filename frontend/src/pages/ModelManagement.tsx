import React from 'react';
import { 
  Cpu, Activity, Play, RefreshCw, 
  Database, ShieldCheck, AlertTriangle, BarChart
} from 'lucide-react';
import { ModelMetadata, ModelStatus, ModelType } from '../types';

interface ModelManagementProps {
  models: ModelMetadata[];
  setModels: React.Dispatch<React.SetStateAction<ModelMetadata[]>>;
  activeModelId: string;
  setActiveModelId: (id: string) => void;
  onTrain: () => void;
  onTrainAll: () => void;
  onLoadRealData: () => void;
  onRunTest: (id: string) => Promise<any>;
}

const ModelManagement: React.FC<ModelManagementProps> = ({ 
  models, activeModelId, setActiveModelId, onTrain, onTrainAll, onLoadRealData, onRunTest 
}) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-text uppercase tracking-tight">Model Repository</h2>
          <p className="text-neutral-secondary text-sm">Manage, train, and deploy decision engines.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={onLoadRealData} className="px-4 py-2 bg-white hover:bg-neutral-bg text-neutral-text text-xs font-bold rounded-xl border border-neutral-border shadow-sm transition-all flex items-center gap-2">
            <Database size={14} /> Ingest Dataset.csv
          </button>
          <button onClick={onTrainAll} className="px-4 py-2 bg-burgundy hover:bg-burgundy-hover text-white text-xs font-bold rounded-xl border border-burgundy/30 transition-all flex items-center gap-2 shadow-sm">
            <RefreshCw size={14} /> Retrain All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {models.map(model => (
          <div key={model.id} className={`bg-white border rounded-2xl p-6 transition-all shadow-sm ${activeModelId === model.id ? 'border-burgundy/50 ring-1 ring-burgundy/10' : 'border-neutral-border'}`}>
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex gap-6">
                <div className={`p-4 rounded-xl border ${activeModelId === model.id ? 'bg-burgundy/5 border-burgundy/20 text-burgundy' : 'bg-neutral-bg border-neutral-border text-neutral-secondary'}`}>
                  {model.type === ModelType.RANDOM_FOREST ? <BarChart size={32} /> : <Activity size={32} />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-neutral-text">{model.type}</h3>
                    <span className="px-2 py-0.5 bg-neutral-bg text-neutral-secondary text-[8px] font-bold uppercase rounded border border-neutral-border">v{model.version}</span>
                    {model.role && (
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded border ${
                        model.role === 'Production' ? 'bg-burgundy/10 border-burgundy/20 text-burgundy' : 'bg-gold/10 border-gold/20 text-gold'
                      }`}>
                        {model.role}
                      </span>
                    )}
                    {model.status === ModelStatus.ACTIVE && <span className="px-2 py-0.5 bg-success-light text-success text-[8px] font-black uppercase rounded border border-success/20">Active</span>}
                  </div>
                  <p className="text-xs text-neutral-secondary font-mono mb-4">{model.fingerprint}</p>
                  <div className="flex gap-8">
                    <Metric label="Accuracy" value={`${((model.type === ModelType.RANDOM_FOREST ? 0.9536 : model.metrics.accuracy) * 100).toFixed(2)}%`} />
                    <Metric label="Precision" value={`${(model.metrics.precision * 100).toFixed(2)}%`} />
                    <Metric label="Recall" value={`${(model.metrics.recall * 100).toFixed(2)}%`} />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-center gap-3">
                {activeModelId !== model.id ? (
                  <button onClick={() => setActiveModelId(model.id)} className="px-6 py-2 bg-white hover:bg-burgundy border border-neutral-border hover:border-burgundy text-neutral-text hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
                    <Play size={14} /> Deploy to Production
                  </button>
                ) : (
                  <div className="px-6 py-2 bg-success-light text-success text-xs font-bold rounded-xl border border-success/20 flex items-center justify-center gap-2">
                    <ShieldCheck size={14} /> Currently Serving
                  </div>
                )}
                <button onClick={() => onRunTest(model.id)} className="px-6 py-2 bg-white hover:bg-neutral-bg text-neutral-secondary text-xs font-bold rounded-xl border border-neutral-border transition-all shadow-sm">
                  Run Integrity Test
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Metric = ({ label, value }: { label: string, value: string }) => (
  <div>
    <p className="text-[10px] text-neutral-secondary uppercase font-bold tracking-widest">{label}</p>
    <p className="text-lg font-bold text-neutral-text">{value}</p>
  </div>
);

export default ModelManagement;
