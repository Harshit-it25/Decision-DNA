import React, { useState, useMemo } from 'react';
import { FileText, X, Calendar, Download, PieChart, AlertTriangle, TrendingDown } from 'lucide-react';
import { Applicant } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicants: Applicant[];
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, applicants }) => {
  const [timeframe, setTimeframe] = useState<'Weekly' | 'Monthly'>('Weekly');

  const relevantApplicants = useMemo(() => {
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    const thresholdDate = timeframe === 'Weekly' ? now - (7 * msInDay) : now - (30 * msInDay);

    return applicants.filter(app => (app.timestamp || 0) >= thresholdDate);
  }, [applicants, timeframe]);

  const reportData = useMemo(() => {
    const approved = relevantApplicants.filter(app => app.decision?.toLowerCase() === 'approve');
    const rejected = relevantApplicants.filter(app => app.decision?.toLowerCase() === 'reject');
    
    const approvalRate = relevantApplicants.length > 0 
      ? ((approved.length / relevantApplicants.length) * 100).toFixed(1) 
      : '0.0';

    // Detailed rejection reasons
    let lowCredit = 0;
    let highDebt = 0;
    let insufficientIncome = 0;
    let modelConfidence = 0;

    rejected.forEach(app => {
      // Simplistic rationale mapping mimicking a real rule-engine
      if (app.creditScore < 640) {
        lowCredit++;
      } else if (app.debtRatio > 0.45) {
        highDebt++;
      } else if (app.income < 30000) {
        insufficientIncome++;
      } else {
        modelConfidence++;
      }
    });

    return {
      total: relevantApplicants.length,
      approved: approved.length,
      rejected: rejected.length,
      approvalRate,
      reasons: {
        lowCredit,
        highDebt,
        insufficientIncome,
        modelConfidence
      }
    };

  }, [relevantApplicants]);

  const handleExportCSV = () => {
    if (relevantApplicants.length === 0) return;

    const headers = ["ID", "Name", "Nationality", "Income", "Debt Ratio", "Credit Score", "Loan Amount", "Gender", "Age", "Risk Probability", "Decision", "Reason", "Timestamp"];
    const rows = relevantApplicants.map(app => [
      app.id,
      `"${app.name}"`,
      app.nationality,
      app.income,
      app.debtRatio.toFixed(4),
      app.creditScore,
      app.loanAmount,
      app.gender,
      app.age,
      app.riskProbability.toFixed(4),
      app.decision,
      `"${app.reason || 'N/A'}"`,
      app.timestamp ? new Date(app.timestamp).toISOString() : 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `decision_report_${timeframe.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl p-8 shadow-2xl scale-in-center overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-start mb-8 border-b border-slate-800 pb-6">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              <FileText className="text-indigo-400" /> Decision Analytics Report
            </h3>
            <p className="text-slate-500 text-sm mt-1">Aggregated insights on model throughput and rejections.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setTimeframe('Weekly')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${timeframe === 'Weekly' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Calendar size={14} /> 7 Days
            </button>
            <button 
              onClick={() => setTimeframe('Monthly')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${timeframe === 'Monthly' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Calendar size={14} /> 30 Days
            </button>
          </div>

          <button 
            onClick={handleExportCSV}
            disabled={relevantApplicants.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-700 transition-all"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Volume" value={reportData.total} />
          <StatCard title="Approved" value={reportData.approved} color="text-emerald-400" />
          <StatCard title="Rejected" value={reportData.rejected} color="text-rose-400" />
          <StatCard title="Approval Rate" value={`${reportData.approvalRate}%`} />
        </div>

        {/* Reason Analysis */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <PieChart size={14} /> Rejection Analysis Breakdown
          </h4>
          
          <div className="space-y-4">
            <ReasonBar 
              label="Low Credit Score (< 640)" 
              count={reportData.reasons.lowCredit} 
              total={reportData.rejected} 
              color="bg-amber-500"
            />
            <ReasonBar 
              label="High Debt-to-Income (> 45%)" 
              count={reportData.reasons.highDebt} 
              total={reportData.rejected} 
              color="bg-rose-500"
            />
            <ReasonBar 
              label="Insufficient Income (< $30k)" 
              count={reportData.reasons.insufficientIncome} 
              total={reportData.rejected} 
              color="bg-orange-500"
            />
            <ReasonBar 
              label="Risk Model Safety Threshold" 
              count={reportData.reasons.modelConfidence} 
              total={reportData.rejected} 
              color="bg-indigo-500"
            />
          </div>

          {reportData.rejected === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-slate-600">
              <TrendingDown size={32} className="mb-2 opacity-50" />
              <p className="text-xs uppercase tracking-widest font-bold">No Rejections Recorded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color = "text-slate-100" }: any) => (
  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center hover:border-slate-700 transition-colors">
    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</span>
    <span className={`text-3xl font-black ${color}`}>{value}</span>
  </div>
);

const ReasonBar = ({ label, count, total, color }: { label: string, count: number, total: number, color: string }) => {
  const percentage = total > 0 ? ((count / total) * 100) : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-end text-xs">
        <span className="text-slate-300 font-bold">{label}</span>
        <span className="text-slate-500 font-mono">{count} <span className="text-[10px] ml-1">({percentage.toFixed(1)}%)</span></span>
      </div>
      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};
