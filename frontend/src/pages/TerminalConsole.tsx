import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Shield, Cpu, Activity, AlertCircle, RefreshCw } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

const TerminalConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [commandValue, setCommandValue] = useState('');
  const [uptime, setUptime] = useState('00:00:00');
  const [cpu, setCpu] = useState('4.2');
  const [mem, setMem] = useState('128.0');
  const scrollRef = useRef<HTMLDivElement>(null);

  const getHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('decision_dna_token') || localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const diff = Date.now() - startTime;
      const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setUptime(`${hours}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/system/logs', { headers: getHeaders() });
        const data = await response.json();
        if (data.status === 'success') {
          setLogs(data.logs);
        }
      } catch (err) {
        console.error("Failed to fetch system logs", err);
      }
    };

    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/system/metrics', { headers: getHeaders() });
        const data = await response.json();
        if (data.status === 'success') {
          setCpu(data.cpu.toString());
          setMem(data.mem.toString());
        }
      } catch (err) {
        console.error("Failed to fetch system metrics", err);
      }
    };

    if (isLive) {
      fetchLogs();
      fetchMetrics();
      interval = setInterval(() => {
        fetchLogs();
        fetchMetrics();
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [isLive]);

  useEffect(() => {
    if (scrollRef.current && isLive) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isLive, searchTerm]);

  const executeCommand = async (cmdStr: string) => {
    const cmd = cmdStr.trim().toLowerCase();
    
    if (cmd === 'clear') {
      setLogs([]);
    } else if (cmd === 'help') {
      const helpMsg: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Available commands: clear, help, status, reload, train, harden'
      };
      setLogs(prev => [...prev, helpMsg]);
    } else if (cmd === 'reload') {
      window.location.reload();
    } else {
      // Remote execution
      try {
        const response = await fetch('/api/system/command', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...getHeaders()
          },
          body: JSON.stringify({ command: cmd })
        });
        const data = await response.json();
        
        const responseMsg: LogEntry = {
          timestamp: new Date().toISOString(),
          level: data.status === 'error' ? 'ERROR' : 'INFO',
          message: data.message
        };
        setLogs(prev => [...prev, responseMsg]);
      } catch (err) {
        const errorMsg: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          message: 'Failed to communicate with backend command processor.'
        };
        setLogs(prev => [...prev, errorMsg]);
      }
    }
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(commandValue);
    setCommandValue('');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-rose-500';
      case 'WARNING': return 'text-amber-500';
      case 'INFO': return 'text-indigo-400';
      default: return 'text-slate-400';
    }
  };

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Terminal className="text-indigo-500" />
            SYSTEM CONSOLE
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Live kernel & API event stream</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
             <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live Stream</span>
             <button 
                onClick={() => setIsLive(!isLive)}
                className={`ml-2 p-1 rounded-lg transition-all ${isLive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}
             >
                <RefreshCw size={14} className={isLive ? 'animate-spin-slow' : ''} />
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-slate-900/50 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="flex gap-1.5 mr-4">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 font-bold tracking-widest uppercase">
              <span className="text-indigo-400">UPTIME: {uptime}</span>
              <span className="hidden md:inline">CPU: {cpu}%</span>
              <span className="hidden md:inline">MEM: {mem}MB</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <input 
                type="text" 
                placeholder="FILTER LOGS..." 
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-[10px] text-indigo-400 placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 w-40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
            <Cpu size={14} className="text-slate-700" />
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 p-6 font-mono text-sm overflow-y-auto terminal-scroll bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent)] scroll-smooth"
        >
          <div className="space-y-1.5">
            {filteredLogs.length === 0 ? (
              <div className="flex items-center gap-3 text-slate-600 italic">
                {searchTerm ? 'No logs match filter.' : 'Initializing kernel log buffers...'}
              </div>
            ) : (
              filteredLogs.map((log, i) => (
                <div key={i} className="group flex gap-4 hover:bg-white/5 p-1 rounded transition-colors border-l-2 border-transparent hover:border-indigo-500/30">
                  <span className="text-slate-700 select-none shrink-0 w-20">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`font-bold shrink-0 w-16 ${getLevelColor(log.level)}`}>{log.level}</span>
                  <span className="text-slate-300 break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <form onSubmit={handleCommand} className="bg-slate-900/50 px-6 py-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-indigo-500 font-mono font-bold">$</span>
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none focus:ring-0 font-mono text-sm text-slate-300 placeholder:text-slate-700 outline-none"
              placeholder="Type or select a command..."
              value={commandValue}
              onChange={(e) => setCommandValue(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest hidden md:inline">Quick Actions:</span>
            {['help', 'status', 'clear', 'train', 'harden'].map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => executeCommand(cmd)}
                className="text-[10px] bg-slate-800 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 border border-slate-700 hover:border-indigo-500/30 px-2 py-1 rounded transition-colors font-mono uppercase"
              >
                {cmd}
              </button>
            ))}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <LogMetricCard icon={<Activity size={18} />} label="Total Events" value={logs.length.toString()} color="indigo" />
        <LogMetricCard icon={<AlertCircle size={18} />} label="Error Count" value={logs.filter(l => l.level === 'ERROR').length.toString()} color="rose" />
        <LogMetricCard icon={<Shield size={18} />} label="Security Events" value={logs.filter(l => l.message.toLowerCase().includes('security') || l.message.toLowerCase().includes('attack')).length.toString()} color="amber" />
      </div>
    </div>
  );
};

const LogMetricCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) => (
  <div className={`bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 transition-all hover:border-${color}-500/30`}>
    <div className={`p-2 rounded-xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  </div>
);

export default TerminalConsole;
