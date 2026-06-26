import React from 'react';

export const NavItem: React.FC<{icon: any, label: string, active?: boolean, onClick: () => void, alert?: 'WARNING' | 'CRITICAL'}> = ({ icon, label, active, onClick, alert }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all ${
      active 
        ? 'bg-burgundy text-white shadow-sm font-medium' 
        : 'text-neutral-secondary hover:text-burgundy hover:bg-burgundy-light/30'
    }`}
  >
    <div className="flex items-center gap-3">
      <span className={active ? 'text-white' : 'text-neutral-secondary group-hover:text-burgundy'}>{icon}</span>
      <span className="text-sm">{label}</span>
    </div>
    {alert && (
      <div className={`w-2 h-2 rounded-full ${alert === 'CRITICAL' ? 'bg-danger animate-pulse shadow-[0_0_4px_rgba(220,38,38,0.4)]' : 'bg-warning shadow-[0_0_4px_rgba(245,158,11,0.4)]'}`} />
    )}
  </button>
);
