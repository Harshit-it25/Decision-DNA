import React, { useState } from 'react';
import { PlusCircle, X, Fingerprint, Globe, DollarSign, Activity, TrendingUp, Briefcase, Users, Info, Mail } from 'lucide-react';
import { Applicant } from '../types';

interface CreateApplicantModalProps {
  onClose: () => void;
  onSubmit: (app: Applicant) => void;
}

const InputField = ({ label, icon, name, type = 'text', errors, ...props }: any) => (
  <div className="space-y-1.5 flex flex-col font-sans">
    <label className="text-[10px] font-bold text-neutral-secondary uppercase tracking-widest ml-1 flex items-center gap-2">
      <span className="text-burgundy">{icon}</span> {label}
    </label>
    <input 
      {...props}
      type={type}
      name={name}
      className={`w-full bg-white border rounded-xl px-4 py-3 text-sm text-neutral-text outline-none transition-all shadow-sm ${
        errors[name] ? 'border-danger bg-danger-light/30 shadow-sm' : 'border-neutral-border focus:border-burgundy/50'
      }`}
    />
    {errors[name] && <span className="text-[10px] text-danger font-bold ml-1 animate-in fade-in slide-in-from-left-2">{errors[name]}</span>}
  </div>
);

export const CreateApplicantModal: React.FC<CreateApplicantModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '',
    nationality: 'United States', 
    income: 50000, 
    debtRatio: 0.3, 
    creditScore: 700, 
    loanAmount: 150000,
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    age: 30
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const countries = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Japan', 'India', 'Brazil', 'Australia', 'Singapore', 'Netherlands', 'Sweden', 'Switzerland', 'Spain', 'Italy', 'South Korea', 'Mexico', 'United Arab Emirates', 'Norway', 'Denmark'];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    else if (formData.name.length < 3) newErrors.name = 'Name must be at least 3 characters';
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
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
        gender: formData.gender as 'Male' | 'Female' | 'Other',
        age: formData.age,
        riskProbability: Math.max(0, Math.min(1, 1 - scoreFactor)), 
        decision: (formData.creditScore > 657 && formData.debtRatio < 0.41) || (formData.creditScore > 717 && formData.debtRatio < 0.51) ? 'Approve' : 'Reject',
        timestamp: Date.now()
      };
      onSubmit(newApp);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-neutral-text/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-neutral-border w-full max-w-2xl rounded-2xl p-8 shadow-xl scale-in-center overflow-y-auto max-h-[90vh] font-sans text-neutral-text">
        <div className="flex justify-between items-start mb-8">
          <h3 className="text-2xl font-bold text-neutral-text flex items-center gap-2">
            <PlusCircle className="text-burgundy" /> Ingest Applicant
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral-bg rounded-full transition-colors text-neutral-secondary hover:text-neutral-text">
            <X size={20} />
          </button>
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

          <div className="md:col-span-2">
            <InputField 
              label="Email Address" 
              icon={<Mail size={12}/>} 
              name="email" 
              errors={errors}
              type="email"
              value={formData.email} 
              onChange={(e: any) => setFormData({...formData, email: e.target.value})} 
            />
          </div>
          
          <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-bold text-neutral-secondary uppercase tracking-widest ml-1 flex items-center gap-2">
              <span className="text-burgundy"><Globe size={12}/></span> Nationality
            </label>
            <select 
              value={formData.nationality} 
              onChange={(e: any) => setFormData({...formData, nationality: e.target.value})}
              className="w-full bg-white border border-neutral-border rounded-xl px-4 py-3 text-sm text-neutral-text outline-none focus:border-burgundy/50 shadow-sm"
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

          <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-bold text-neutral-secondary uppercase tracking-widest ml-1 flex items-center gap-2">
              <span className="text-burgundy"><Users size={12}/></span> Gender
            </label>
            <select 
              value={formData.gender} 
              onChange={(e: any) => setFormData({...formData, gender: e.target.value as any})}
              className="w-full bg-white border border-neutral-border rounded-xl px-4 py-3 text-sm text-neutral-text outline-none focus:border-burgundy/50 shadow-sm"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <InputField 
            label="Age" 
            icon={<Info size={12}/>} 
            name="age" 
            errors={errors}
            type="number" 
            value={formData.age} 
            onChange={(e: any) => setFormData({...formData, age: Number(e.target.value)})} 
          />

          <div className="md:col-span-2">
            <button type="submit" className="w-full py-4 bg-burgundy hover:bg-burgundy-hover text-white font-bold rounded-xl transition-all shadow-sm">
              Ingest Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
