
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
    <div className="min-h-screen bg-neutral-bg flex items-center justify-center p-6 relative overflow-hidden font-sans text-neutral-text">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-burgundy/5 p-4 rounded-2xl border border-burgundy/15 mb-4 shadow-sm">
            <Shield className="w-12 h-12 text-burgundy" />
          </div>
          <h1 className="text-3xl font-extrabold text-burgundy tracking-tighter mb-2">DECISION DNA</h1>
          <p className="text-neutral-secondary text-sm font-medium uppercase tracking-[0.2em]">Enterprise ML Governance</p>
        </div>

        <div className="bg-white border border-neutral-border p-8 rounded-2xl shadow-lg relative group overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-secondary uppercase tracking-widest ml-1 flex items-center gap-2">
                <User size={12} className="text-burgundy" /> Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border border-neutral-border rounded-xl px-4 py-3 text-sm text-neutral-text outline-none focus:border-burgundy/50 focus:ring-4 focus:ring-burgundy/5 transition-all shadow-sm"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-secondary uppercase tracking-widest ml-1 flex items-center gap-2">
                <Lock size={12} className="text-burgundy" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-neutral-border rounded-xl px-4 py-3 text-sm text-neutral-text outline-none focus:border-burgundy/50 focus:ring-4 focus:ring-burgundy/5 transition-all shadow-sm"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-danger-light border border-danger/20 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-danger shrink-0" />
                <p className="text-xs font-bold text-danger">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-burgundy hover:bg-burgundy-hover disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group active:scale-[0.98]"
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

          <div className="mt-8 pt-6 border-t border-neutral-border">
            <div className="flex items-center gap-2 text-[10px] text-neutral-secondary font-bold uppercase tracking-widest">
              <Sparkles size={12} className="text-gold" /> System Access Levels (Demo Credentials)
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span 
                onClick={() => { setUsername('admin'); setPassword('decision_dna_2024'); }}
                className="px-2 py-1 bg-neutral-bg hover:bg-burgundy-light/40 border border-neutral-border hover:border-burgundy/20 rounded text-[9px] text-neutral-secondary hover:text-burgundy cursor-pointer transition-all"
                title="Click to autofill"
              >
                admin / decision_dna_2024
              </span>
              <span 
                onClick={() => { setUsername('officer'); setPassword('officer_pass_2024'); }}
                className="px-2 py-1 bg-neutral-bg hover:bg-burgundy-light/40 border border-neutral-border hover:border-burgundy/20 rounded text-[9px] text-neutral-secondary hover:text-burgundy cursor-pointer transition-all"
                title="Click to autofill"
              >
                officer / officer_pass_2024
              </span>
              <span 
                onClick={() => { setUsername('auditor'); setPassword('auditor_pass_2024'); }}
                className="px-2 py-1 bg-neutral-bg hover:bg-burgundy-light/40 border border-neutral-border hover:border-burgundy/20 rounded text-[9px] text-neutral-secondary hover:text-burgundy cursor-pointer transition-all"
                title="Click to autofill"
              >
                auditor / auditor_pass_2024
              </span>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-neutral-secondary text-[10px] font-medium uppercase tracking-[0.2em]">
          Secure Banking Grade Intercept Active
        </p>
      </div>
    </div>
  );
};

export default Login;
