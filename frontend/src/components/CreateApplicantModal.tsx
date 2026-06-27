import React, { useState } from 'react';
import { PlusCircle, X, Fingerprint, Globe, IndianRupee, Activity, TrendingUp, Briefcase, Users, Info, Mail, Scale, Landmark, ShieldCheck } from 'lucide-react';
import { Applicant } from '../types';
import { getFinancialIndicators } from '../services/governanceUtils';

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
    age: 30,
    totalAssets: 337500, 
    totalLiabilities: 109500
  });

  const [hasManuallyEditedAssets, setHasManuallyEditedAssets] = useState(false);
  const [hasManuallyEditedLiabilities, setHasManuallyEditedLiabilities] = useState(false);
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
    
    if (formData.totalAssets < 0) newErrors.totalAssets = 'Assets cannot be negative';
    if (formData.totalLiabilities < 0) newErrors.totalLiabilities = 'Liabilities cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      
      if (['income', 'creditScore', 'loanAmount'].includes(name) && !hasManuallyEditedAssets) {
        next.totalAssets = Math.round(next.income * (4.2 + (next.creditScore - 600) / 80) + next.loanAmount * 0.25);
      }
      if (['income', 'debtRatio', 'loanAmount'].includes(name) && !hasManuallyEditedLiabilities) {
        next.totalLiabilities = Math.round(next.income * next.debtRatio * 2.8 + next.loanAmount * 0.45);
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const normalizedScore = (formData.creditScore - 300) / 550;
      const normalizedDebt = 1 - formData.debtRatio;
      const scoreFactor = (normalizedScore * 0.6) + (normalizedDebt * 0.4);
      
      const financial = getFinancialIndicators(formData as any);
      
      const newApp: Applicant = { 
        ...formData, 
        id: `app-user-${Date.now()}`, 
        gender: formData.gender as 'Male' | 'Female' | 'Other',
        age: formData.age,
        riskProbability: Math.max(0, Math.min(1, 1 - scoreFactor)), 
        decision: (formData.creditScore > 657 && formData.debtRatio < 0.41) || (formData.creditScore > 717 && formData.debtRatio < 0.51) ? 'Approve' : 'Reject',
        timestamp: Date.now(),
        totalAssets: formData.totalAssets,
        totalLiabilities: formData.totalLiabilities,
        netWorth: financial.netWorth,
        assetLiabilityRatio: financial.assetLiabilityRatio,
        financialStrength: financial.financialStrength,
        debtBurden: financial.debtBurden,
        assetCoverage: financial.assetCoverage,
        overallPosition: financial.overallPosition
      };
      onSubmit(newApp);
    }
  };

  // Live indicators computed on the fly
  const currentFinancials = getFinancialIndicators(formData as any);

  // Status color helper for financial preview
  const getStatusColor = (val: string) => {
    if (['High', 'Low-Risk', 'Strong', 'Low'].includes(val)) return 'text-success bg-success/5 border border-success/15';
    if (['Medium', 'Stable', 'Moderate'].includes(val)) return 'text-gold bg-gold/5 border border-gold/15';
    return 'text-danger bg-danger/5 border border-danger/15';
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
              onChange={(e: any) => handleFieldChange('name', e.target.value)} 
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
              onChange={(e: any) => handleFieldChange('email', e.target.value)} 
            />
          </div>
          
          <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-bold text-neutral-secondary uppercase tracking-widest ml-1 flex items-center gap-2">
              <span className="text-burgundy"><Globe size={12}/></span> Nationality
            </label>
            <select 
              value={formData.nationality} 
              onChange={(e: any) => handleFieldChange('nationality', e.target.value)}
              className="w-full bg-white border border-neutral-border rounded-xl px-4 py-3 text-sm text-neutral-text outline-none focus:border-burgundy/50 shadow-sm"
            >
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <InputField 
            label="Annual Income (INR)" 
            icon={<IndianRupee size={12}/>} 
            name="income" 
            errors={errors}
            type="number" 
            value={formData.income} 
            onChange={(e: any) => handleFieldChange('income', Number(e.target.value))} 
          />

          <InputField 
            label="Credit Score (300-850)" 
            icon={<Activity size={12}/>} 
            name="creditScore" 
            errors={errors}
            type="number" 
            value={formData.creditScore} 
            onChange={(e: any) => handleFieldChange('creditScore', Number(e.target.value))} 
          />

          <InputField 
            label="Debt-to-Income Ratio (0-1)" 
            icon={<TrendingUp size={12}/>} 
            name="debtRatio" 
            errors={errors}
            type="number" 
            step="0.01"
            value={formData.debtRatio} 
            onChange={(e: any) => handleFieldChange('debtRatio', Number(e.target.value))} 
          />

          <InputField 
            label="Loan Amount Requested (INR)" 
            icon={<Briefcase size={12}/>} 
            name="loanAmount" 
            errors={errors}
            type="number" 
            value={formData.loanAmount} 
            onChange={(e: any) => handleFieldChange('loanAmount', Number(e.target.value))} 
          />

          <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-bold text-neutral-secondary uppercase tracking-widest ml-1 flex items-center gap-2">
              <span className="text-burgundy"><Users size={12}/></span> Gender
            </label>
            <select 
              value={formData.gender} 
              onChange={(e: any) => handleFieldChange('gender', e.target.value)}
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
            onChange={(e: any) => handleFieldChange('age', Number(e.target.value))} 
          />

          {/* Financial Assessment Divider */}
          <div className="md:col-span-2 border-t border-neutral-border pt-4 mt-2">
            <h4 className="text-xs font-bold text-burgundy uppercase tracking-widest mb-4 flex items-center gap-2">
              <Landmark size={14} /> Financial Portfolio Assessment
            </h4>
          </div>

          <InputField 
            label="Total Assets (INR)" 
            icon={<IndianRupee size={12}/>} 
            name="totalAssets" 
            errors={errors}
            type="number" 
            value={formData.totalAssets} 
            onChange={(e: any) => {
              setHasManuallyEditedAssets(true);
              handleFieldChange('totalAssets', Number(e.target.value));
            }} 
          />

          <InputField 
            label="Total Liabilities (INR)" 
            icon={<IndianRupee size={12}/>} 
            name="totalLiabilities" 
            errors={errors}
            type="number" 
            value={formData.totalLiabilities} 
            onChange={(e: any) => {
              setHasManuallyEditedLiabilities(true);
              handleFieldChange('totalLiabilities', Number(e.target.value));
            }} 
          />

          {/* Expanded 3x2 Financial Health Summary Live Preview Panel */}
          <div className="md:col-span-2 bg-neutral-bg p-6 rounded-2xl border border-neutral-border space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-border pb-2">
              <span className="text-[10px] font-black text-neutral-text uppercase tracking-widest flex items-center gap-1.5">
                <Scale size={12} className="text-burgundy" /> Financial Health Summary (Live)
              </span>
              <span className="text-[9px] font-bold text-neutral-secondary font-mono">Calculated Real-Time</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-neutral-secondary uppercase">Net Worth</span>
                <span className={`text-sm font-black mt-0.5 ${currentFinancials.netWorth >= 0 ? 'text-success' : 'text-danger'}`}>
                  INR {currentFinancials.netWorth.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-neutral-secondary uppercase">Asset/Liability Ratio</span>
                <span className="text-sm font-black text-neutral-text mt-0.5">
                  {currentFinancials.assetLiabilityRatio.toFixed(2)}x
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-neutral-secondary uppercase">Financial Strength</span>
                <span className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded text-center w-fit ${getStatusColor(currentFinancials.financialStrength)}`}>
                  {currentFinancials.financialStrength.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-neutral-secondary uppercase">Debt Burden</span>
                <span className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded text-center w-fit ${getStatusColor(currentFinancials.debtBurden)}`}>
                  {currentFinancials.debtBurden.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-neutral-secondary uppercase">Asset Coverage</span>
                <span className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded text-center w-fit ${getStatusColor(currentFinancials.assetCoverage)}`}>
                  {currentFinancials.assetCoverage.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-neutral-secondary uppercase">Overall Position</span>
                <span className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded text-center w-fit ${getStatusColor(currentFinancials.overallPosition)}`}>
                  {currentFinancials.overallPosition.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 mt-4">
            <button type="submit" className="w-full py-4 bg-burgundy hover:bg-burgundy-hover text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]">
              Ingest Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
