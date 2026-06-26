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
    <div className="fixed inset-0 z-[200] bg-neutral-text/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-neutral-border w-full max-w-3xl rounded-2xl p-8 shadow-xl scale-in-center overflow-y-auto max-h-[90vh] font-sans text-neutral-text">
        <div className="flex justify-between items-start mb-8 border-b border-neutral-border pb-6">
          <div>
            <h3 className="text-2xl font-bold text-neutral-text flex items-center gap-2">
              <FileText className="text-burgundy" /> Decision Analytics Report
            </h3>
            <p className="text-neutral-secondary text-sm mt-1">Aggregated insights on model throughput and rejections.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-bg rounded-full transition-colors text-neutral-secondary hover:text-neutral-text">
            <X size={20} />
          </button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 bg-neutral-bg p-1 rounded-xl border border-neutral-border">
            <button 
              onClick={() => setTimeframe('Weekly')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${timeframe === 'Weekly' ? 'bg-burgundy text-white border-burgundy shadow-sm' : 'text-neutral-secondary border-transparent hover:text-burgundy'}`}
            >
              <Calendar size={14} /> 7 Days
            </button>
            <button 
              onClick={() => setTimeframe('Monthly')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${timeframe === 'Monthly' ? 'bg-burgundy text-white border-burgundy shadow-sm' : 'text-neutral-secondary border-transparent hover:text-burgundy'}`}
            >
              <Calendar size={14} /> 30 Days
            </button>
          </div>

          <button 
            onClick={handleExportCSV}
            disabled={relevantApplicants.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-neutral-bg disabled:opacity-50 disabled:cursor-not-allowed text-neutral-text text-[10px] font-bold uppercase tracking-widest rounded-lg border border-neutral-border transition-all shadow-sm"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Volume" value={reportData.total} />
          <StatCard title="Approved" value={reportData.approved} color="text-success" />
          <StatCard title="Rejected" value={reportData.rejected} color="text-danger" />
          <StatCard title="Approval Rate" value={`${reportData.approvalRate}%`} />
        </div>

        {/* Reason Analysis */}
        <div className="bg-neutral-bg border border-neutral-border rounded-xl p-6">
          <h4 className="text-[10px] font-bold text-neutral-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
            <PieChart size={14} className="text-burgundy" /> Rejection Analysis Breakdown
          </h4>
          
          <div className="space-y-4">
            <ReasonBar 
              label="Low Credit Score (< 640)" 
              count={reportData.reasons.lowCredit} 
              total={reportData.rejected} 
              color="bg-warning"
            />
            <ReasonBar 
              label="High Debt-to-Income (> 45%)" 
              count={reportData.reasons.highDebt} 
              total={reportData.rejected} 
              color="bg-danger"
            />
            <ReasonBar 
              label="Insufficient Income (< $30k)" 
              count={reportData.reasons.insufficientIncome} 
              total={reportData.rejected} 
              color="bg-gold"
            />
            <ReasonBar 
              label="Risk Model Safety Threshold" 
              count={reportData.reasons.modelConfidence} 
              total={reportData.rejected} 
              color="bg-burgundy"
            />
          </div>

          {reportData.rejected === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-neutral-secondary">
              <TrendingDown size={32} className="mb-2 opacity-50 text-burgundy" />
              <p className="text-xs uppercase tracking-widest font-bold">No Rejections Recorded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color = "text-neutral-text" }: any) => (
  <div className="bg-neutral-bg border border-neutral-border p-4 rounded-xl flex flex-col items-center justify-center text-center hover:border-burgundy/25 transition-colors shadow-sm">
    <span className="text-[9px] font-bold text-neutral-secondary uppercase tracking-widest mb-1">{title}</span>
    <span className={`text-3xl font-black ${color}`}>{value}</span>
  </div>
);

const ReasonBar = ({ label, count, total, color }: { label: string, count: number, total: number, color: string }) => {
  const percentage = total > 0 ? ((count / total) * 100) : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-end text-xs">
        <span className="text-neutral-text font-bold">{label}</span>
        <span className="text-neutral-secondary font-mono">{count} <span className="text-[10px] ml-1">({percentage.toFixed(1)}%)</span></span>
      </div>
      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-neutral-border">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};
