
import React from 'react';
import { AlertTriangle, ShieldAlert, Info, Sparkles } from 'lucide-react';

interface SecurityAlertProps {
  type: 'info' | 'warning' | 'critical' | 'ai';
  title: string;
  message: string;
  onDismiss?: () => void;
}

const SecurityAlert: React.FC<SecurityAlertProps> = ({ type, title, message, onDismiss }) => {
  const getStyles = () => {
    switch (type) {
      case 'critical': return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      case 'warning': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'ai': return 'bg-violet-500/10 border-violet-500/30 text-violet-400';
      default: return 'bg-slate-900 border-slate-800 text-slate-300';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'critical': return <ShieldAlert size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'ai': return <Sparkles size={16} />;
      default: return <Info size={16} />;
    }
  };

  return (
    <div className={`p-4 border rounded-xl animate-in fade-in slide-in-from-top-2 ${getStyles()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          {getIcon()} {title}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-[9px] text-slate-500 hover:text-white uppercase font-bold">Dismiss</button>
        )}
      </div>
      <p className="text-sm leading-relaxed italic">"{message}"</p>
    </div>
  );
};

export default SecurityAlert;
