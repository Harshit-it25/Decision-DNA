import React from 'react';
import { 
  Cpu, Activity, Play, RefreshCw, 
  Database, ShieldCheck, AlertTriangle, BarChart
} from 'lucide-react';
import { ModelMetadata, ModelStatus, ModelType } from '../types';

interface ModelManagementProps {
  models: ModelMetadata[];
  setModels: any;
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
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Model Repository</h2>
          <p className="text-slate-500 text-sm">Manage, train, and deploy decision engines.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={onLoadRealData} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2">
            <Database size={14} /> Ingest Dataset.csv
          </button>
          <button onClick={onTrainAll} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl border border-indigo-400/30 transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20">
            <RefreshCw size={14} /> Retrain All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {models.map(model => (
          <div key={model.id} className={`bg-slate-900 border rounded-3xl p-6 transition-all ${activeModelId === model.id ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-slate-800'}`}>
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex gap-6">
                <div className={`p-4 rounded-2xl border ${activeModelId === model.id ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                  {model.type === ModelType.RANDOM_FOREST ? <BarChart size={32} /> : <Activity size={32} />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-white">{model.type}</h3>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[8px] font-black uppercase rounded border border-slate-700">v{model.version}</span>
                    {model.role && (
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded border ${
                        model.role === 'Production' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      }`}>
                        {model.role}
                      </span>
                    )}
                    {model.status === ModelStatus.ACTIVE && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase rounded border border-emerald-500/20">Active</span>}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mb-4">{model.fingerprint}</p>
                  <div className="flex gap-8">
                    <Metric label="Accuracy" value={`${(model.metrics.accuracy * 100).toFixed(1)}%`} />
                    <Metric label="Precision" value={`${(model.metrics.precision * 100).toFixed(1)}%`} />
                    <Metric label="Recall" value={`${(model.metrics.recall * 100).toFixed(1)}%`} />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-center gap-3">
                {activeModelId !== model.id ? (
                  <button onClick={() => setActiveModelId(model.id)} className="px-6 py-2 bg-slate-800 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                    <Play size={14} /> Deploy to Production
                  </button>
                ) : (
                  <div className="px-6 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/20 flex items-center justify-center gap-2">
                    <ShieldCheck size={14} /> Currently Serving
                  </div>
                )}
                <button onClick={() => onRunTest(model.id)} className="px-6 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-xl border border-slate-800 transition-all">
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

const Metric = ({ label, value }: any) => (
  <div>
    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{label}</p>
    <p className="text-lg font-bold text-slate-200">{value}</p>
  </div>
);

export default ModelManagement;
