
import React, { useMemo, useEffect, useState } from 'react';
import { DriftMetrics, SecurityStatus, ThreatLevel, IntegrityStatus, DriftHistoryEntry } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Info, AlertTriangle, CheckCircle2, Zap, Bell, AlertCircle, Settings, Mail, MessageSquare, Globe, ShieldAlert, Activity, Play, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { detectDrift } from '../drift/driftDetector';
import { db } from '../services/db';
import { monitoringService } from '../services/monitoringService';

interface MonitoringCenterProps {
  metrics: DriftMetrics;
  security: SecurityStatus;
  applicants?: any[];
}

const MonitoringCenter: React.FC<MonitoringCenterProps> = ({ metrics, security, applicants = [] }) => {
  const [history, setHistory] = useState<DriftHistoryEntry[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [channels, setChannels] = React.useState({
    email: true,
    slack: true,
    webhook: false,
    sms: false
  });

  useEffect(() => {
    const fetchHistory = async () => {
      const data = await db.driftHistory.orderBy('timestamp').toArray();
      setHistory(data);
    };
    
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const toggleMonitoring = () => {
    if (isMonitoring) {
      monitoringService.stop();
    } else {
      monitoringService.start();
    }
    setIsMonitoring(!isMonitoring);
  };

  const driftResult = useMemo(() => {
    if (applicants.length < 100) return null;
    return detectDrift(applicants.slice(0, 50), applicants.slice(50, 100));
  }, [applicants]);

  const psiData = [
    { range: '0-200', count: 120, drift: 110 },
    { range: '200-400', count: 450, drift: 410 },
    { range: '400-600', count: 890, drift: 920 },
    { range: '600-800', count: 1200, drift: 1050 },
    { range: '800-1000', count: 400, drift: 350 },
  ];

  const status = metrics.psi < 0.1 ? 'Stable' : metrics.psi < 0.25 ? 'Warning' : 'Critical';

  // Granular Alert Logic
  const getGranularAlerts = () => {
    const alerts = [];
    
    if (metrics.psi >= 0.25) {
      alerts.push({
        id: 'psi-critical',
        type: 'CRITICAL',
        title: 'Critical Population Drift',
        message: `PSI is ${metrics.psi.toFixed(3)}. Model distribution has diverged significantly from baseline.`,
        icon: <Zap className="text-rose-400" />
      });
    } else if (metrics.psi >= 0.1) {
      alerts.push({
        id: 'psi-warning',
        type: 'WARNING',
        title: 'Significant Population Drift',
        message: `PSI is ${metrics.psi.toFixed(3)}. Monitoring required for distribution shift.`,
        icon: <AlertTriangle className="text-amber-400" />
      });
    }

    if (metrics.flipRate > 0.15) {
      alerts.push({
        id: 'flip-critical',
        type: 'CRITICAL',
        title: 'High Prediction Volatility',
        message: `Flip rate is ${(metrics.flipRate * 100).toFixed(1)}%. Predictions are unstable.`,
        icon: <ShieldAlert className="text-rose-400" />
      });
    }

    if (security.integrity === IntegrityStatus.COMPROMISED) {
      alerts.push({
        id: 'security-compromised',
        type: 'CRITICAL',
        title: 'Security Integrity Failure',
        message: 'Model fingerprint mismatch detected. Potential tampering or adversarial injection.',
        icon: <ShieldAlert className="text-rose-500" />
      });
    }

    if (security.threatLevel === ThreatLevel.CRITICAL && metrics.psi > 0.1) {
      alerts.push({
        id: 'combined-threat',
        type: 'CRITICAL',
        title: 'Systemic Failure Risk',
        message: 'Simultaneous high threat level and population drift detected. Immediate isolation recommended.',
        icon: <AlertCircle className="text-rose-600" />
      });
    }

    return alerts;
  };

  const activeAlerts = getGranularAlerts();

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {activeAlerts.length > 0 && (
          <div className="space-y-4 mb-8">
            {activeAlerts.map((alert) => (
              <motion.div 
                key={alert.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className={`p-5 rounded-2xl border flex items-start gap-4 shadow-xl ${
                  alert.type === 'CRITICAL' 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}
              >
                <div className={`p-2 rounded-lg ${alert.type === 'CRITICAL' ? 'bg-rose-500/20' : 'bg-amber-500/20'}`}>
                  {alert.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-black uppercase tracking-wider">{alert.title}</h3>
                    <span className="text-[9px] font-mono opacity-50">REF: {alert.id.toUpperCase()}</span>
                  </div>
                  <p className="text-xs opacity-80 leading-relaxed">{alert.message}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">Stability Analysis (PSI)</h2>
              <button 
                onClick={toggleMonitoring}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter transition-all ${
                  isMonitoring 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {isMonitoring ? <><Activity size={12} className="animate-pulse" /> Live Monitoring</> : <><Play size={12} /> Start Monitor</>}
              </button>
            </div>
            <p className="text-sm text-slate-400">Comparing current population against training baseline</p>
          </div>
          <div className={`px-6 py-4 rounded-2xl border flex flex-col items-center gap-1 ${
            status === 'Stable' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            status === 'Warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
            'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            <span className="text-xs font-bold uppercase tracking-wider">{status} Status</span>
            <span className="text-3xl font-bold font-mono">{metrics.psi.toFixed(3)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={psiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="range" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} 
                />
                <Bar dataKey="count" fill="#334155" radius={[4, 4, 0, 0]} name="Training Baseline" />
                <Bar dataKey="drift" fill="#10b981" radius={[4, 4, 0, 0]} name="Current Data" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
             <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                  <CheckCircle2 size={16} /> PSI Range 0.0 - 0.1
                </div>
                <p className="text-xs text-slate-500">Distribution is stable. Model behavior matches training expectations.</p>
             </div>
             <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                  <AlertTriangle size={16} /> PSI Range 0.1 - 0.25
                </div>
                <p className="text-xs text-slate-500">Significant shift detected. Prediction reliability may be degrading.</p>
             </div>
             <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold">
                  <Zap size={16} /> PSI Range 0.25+
                </div>
                <p className="text-xs text-slate-500">Critical drift. Model requires urgent retraining or rollback.</p>
             </div>
          </div>
        </div>
      </div>

      {/* Historical Trend Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white">Continuous Drift Tracking</h3>
          <p className="text-sm text-slate-400">Historical PSI trend captured by the automated monitoring service</p>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history.length > 0 ? history : [{ psi: 0.04, timestamp: Date.now() - 100000 }, { psi: 0.05, timestamp: Date.now() }]}>
              <defs>
                <linearGradient id="colorPsi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                stroke="#64748b" 
                fontSize={10} 
                tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              />
              <YAxis stroke="#64748b" fontSize={10} domain={[0, 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                labelFormatter={(t) => new Date(t).toLocaleString()}
              />
              <Area 
                type="monotone" 
                dataKey="psi" 
                stroke="#6366f1" 
                fillOpacity={1} 
                fill="url(#colorPsi)" 
                strokeWidth={3}
                name="PSI Score"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <MetricCard 
          title="Prediction Flip Rate" 
          description="Percentage of samples with different predictions vs baseline"
          value={`${(metrics.flipRate * 100).toFixed(1)}%`}
          trend={metrics.flipRate > 0.05 ? "UP" : "STABLE"}
          chart={<SimpleSparkline color="#f43f5e" data={[1,2,1.5,4,metrics.flipRate*100]} />}
        />
        <MetricCard 
          title="Ranking Stability (Spearman)" 
          description="Correlation of applicant ranking between model versions"
          value={metrics.spearmanRank.toFixed(3)}
          trend={metrics.spearmanRank < 0.9 ? "DOWN" : "STABLE"}
          chart={<SimpleSparkline color="#8b5cf6" data={[0.99, 0.98, 0.99, 0.97, metrics.spearmanRank]} />}
        />
      </div>

      {/* Notification Channels Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-800 rounded-lg">
            <Settings size={18} className="text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Notification Channels</h3>
            <p className="text-xs text-slate-400">Configure where drift and security alerts are dispatched</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ChannelToggle 
            icon={<Mail size={16} />} 
            label="Email Digest" 
            active={channels.email} 
            onClick={() => setChannels({...channels, email: !channels.email})} 
          />
          <ChannelToggle 
            icon={<MessageSquare size={16} />} 
            label="Slack Integration" 
            active={channels.slack} 
            onClick={() => setChannels({...channels, slack: !channels.slack})} 
          />
          <ChannelToggle 
            icon={<Globe size={16} />} 
            label="Webhook URL" 
            active={channels.webhook} 
            onClick={() => setChannels({...channels, webhook: !channels.webhook})} 
          />
          <ChannelToggle 
            icon={<Bell size={16} />} 
            label="SMS / Push" 
            active={channels.sms} 
            onClick={() => setChannels({...channels, sms: !channels.sms})} 
          />
        </div>
      </div>
    </div>
  );
};

const ChannelToggle = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
      active 
        ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400' 
        : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
    }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </div>
    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${active ? 'bg-indigo-500' : 'bg-slate-800'}`}>
      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
  </button>
);

const MetricCard = ({ title, description, value, trend, chart }: any) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${trend === 'UP' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
        {trend}
      </div>
    </div>
    <div className="flex-1 flex items-end justify-between mt-4">
      <div className="text-4xl font-bold font-mono text-white">{value}</div>
      <div className="w-32 h-12">
        {chart}
      </div>
    </div>
  </div>
);

const SimpleSparkline = ({ color, data }: { color: string, data: number[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data.map((v, i) => ({ v, i }))}>
      <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);

export default MonitoringCenter;
