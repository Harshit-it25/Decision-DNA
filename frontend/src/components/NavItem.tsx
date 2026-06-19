import React from 'react';

export const NavItem: React.FC<{icon: any, label: string, active?: boolean, onClick: () => void, alert?: 'WARNING' | 'CRITICAL'}> = ({ icon, label, active, onClick, alert }) => (
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
