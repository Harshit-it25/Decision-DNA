
import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { login } from '../api/modelApi';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await login(username, password);
    if (result.success) {
      // Fetch user info after successful login
      const { getCurrentUserInfo } = await import('../api/modelApi');
      const user = await getCurrentUserInfo();
      onLoginSuccess(user);
    } else {
      setError(result.error || 'Invalid credentials');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20 mb-4 shadow-2xl shadow-indigo-500/10">
            <Shield className="w-12 h-12 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">DECISION DNA</h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em]">Enterprise ML Governance</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative group overflow-hidden">
            {/* Subtle light sweep effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent pointer-events-none" />
            
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <User size={12} className="text-indigo-400" /> Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Lock size={12} className="text-indigo-400" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <p className="text-xs font-bold text-rose-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  AUTHENTICATE SYSTEM
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/50">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <Sparkles size={12} className="text-amber-400" /> System Access Levels (Demo Credentials)
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-slate-800/50 border border-slate-700 rounded text-[9px] text-slate-400">admin / decision_dna_2024</span>
              <span className="px-2 py-1 bg-slate-800/50 border border-slate-700 rounded text-[9px] text-slate-400">officer / officer_pass_2024</span>
              <span className="px-2 py-1 bg-slate-800/50 border border-slate-700 rounded text-[9px] text-slate-400">auditor / auditor_pass_2024</span>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-600 text-[10px] font-medium uppercase tracking-[0.2em]">
          Secure Quantum-Ready Intercept Active
        </p>
      </div>
    </div>
  );
};

export default Login;
