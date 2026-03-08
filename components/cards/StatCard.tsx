
import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  accent?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, accent }) => (
  <div className={`bg-slate-900 border ${accent ? 'border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.05)]' : 'border-slate-800'} rounded-2xl p-6 transition-all hover:border-slate-700`}>
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">{icon}</div>
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</span>
    </div>
    <div className="text-xl font-black text-white">{value}</div>
    <div className="text-[10px] text-slate-500 font-medium mt-1">{subtitle}</div>
  </div>
);

export default StatCard;
