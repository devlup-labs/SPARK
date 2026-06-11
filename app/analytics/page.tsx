"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Download,
  Cpu,
  HardDrive,
  Wifi,
  Database,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ToastProvider";

const timeRanges = ["1H", "6H", "24H", "7D", "30D"];

interface MetricCard {
  label: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
  sparkline: number[];
}

const initialMetrics: MetricCard[] = [
  {
    label: "CPU Average",
    value: "Loading...",
    change: 0,
    icon: Cpu,
    color: "#00f5ff",
    sparkline: Array(8).fill(0),
  },
  {
    label: "Memory Used",
    value: "Loading...",
    change: 0,
    icon: HardDrive,
    color: "#bf00ff",
    sparkline: Array(8).fill(0),
  },
  {
    label: "Network I/O",
    value: "Loading...",
    change: 0,
    icon: Wifi,
    color: "#4ade80",
    sparkline: Array(8).fill(0),
  },
  {
    label: "Disk Usage",
    value: "Loading...",
    change: 0,
    icon: Database,
    color: "#f97316",
    sparkline: Array(8).fill(0),
  },
];

const MiniSparkline = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 40;
  const width = 100;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="opacity-60">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
};

export default function AnalyticsPage() {
  const { addToast } = useToast();
  const [activeRange, setActiveRange] = useState("24H");
  const [metrics, setMetrics] = useState<MetricCard[]>(initialMetrics);
  const [cpuChart, setCpuChart] = useState<number[]>([]);
  const [networkChart, setNetworkChart] = useState<number[]>([]);
  
  const [activities, setActivities] = useState<Array<{ timestamp: number; event: string; type: string }>>([
    { timestamp: Date.now() - 2 * 60000, event: "System monitoring initialized", type: "info" }
  ]);

  // Load history from localStorage or pre-populate on mount to avoid flat charts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedCpu = localStorage.getItem("spark_cpu_chart");
      const cachedNet = localStorage.getItem("spark_network_chart");
      
      if (cachedCpu) {
        try { setCpuChart(JSON.parse(cachedCpu)); } catch {
          setCpuChart(Array(12).fill(0).map(() => Math.round(2 + Math.random() * 5)));
        }
      } else {
        setCpuChart(Array(12).fill(0).map(() => Math.round(2 + Math.random() * 5)));
      }

      if (cachedNet) {
        try { setNetworkChart(JSON.parse(cachedNet)); } catch {
          setNetworkChart(Array(12).fill(0).map(() => Math.round(5 + Math.random() * 10)));
        }
      } else {
        setNetworkChart(Array(12).fill(0).map(() => Math.round(5 + Math.random() * 10)));
      }
    }
  }, []);

  // Real-time metric fetch from API
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/system");
        const data = await res.json();

        setMetrics(prev => prev.map(m => {
          let newValue = m.value;
          let newSparkVal = m.sparkline[m.sparkline.length - 1]; // default fallback
          
          if (m.label === "CPU Average" && data.cpu) {
            newSparkVal = data.cpu.percentage;
            newValue = `${Math.round(newSparkVal)}%`;
          } else if (m.label === "Memory Used" && data.memory) {
            const usedGB = data.memory.used / (1024 ** 3);
            newSparkVal = data.memory.percentage;
            newValue = `${usedGB.toFixed(1)} GB`;
          } else if (m.label === "Network I/O" && data.network) {
            newSparkVal = data.network.percentage;
            newValue = data.network.value;
          } else if (m.label === "Disk Usage" && data.storage) {
            newSparkVal = data.storage.percentage;
            newValue = `${Math.round(data.storage.used)} GB`;
          }

          const lastVal = m.sparkline[m.sparkline.length - 1] || 1;
          const trend = ((newSparkVal - lastVal) / lastVal) * 100;
          return {
            ...m,
            value: newValue,
            sparkline: [...m.sparkline.slice(1), newSparkVal],
            change: +((m.change * 0.8) + trend * 0.2).toFixed(1), // Smooth rolling change
          };
        }));

        setCpuChart(prev => {
          if (!data.cpu) return prev;
          const next = [...prev.slice(1), Math.round(data.cpu.percentage)];
          if (typeof window !== "undefined") {
            localStorage.setItem("spark_cpu_chart", JSON.stringify(next));
          }
          return next;
        });
        
        setNetworkChart(prev => {
          if (!data.network) return prev;
          const next = [...prev.slice(1), Math.round(data.network.percentage)];
          if (typeof window !== "undefined") {
            localStorage.setItem("spark_network_chart", JSON.stringify(next));
          }
          return next;
        });

        // Dynamic recent activities
        if (data.cpu && data.cpu.percentage > 85) {
          setActivities(prev => {
            const hasRecentSpike = prev.some(a => a.event.includes("High CPU") && (Date.now() - a.timestamp) < 300000); // 5 min cooldown
            if (hasRecentSpike) return prev;
            return [{ timestamp: Date.now(), event: `High CPU utilization detected (${Math.round(data.cpu.percentage)}%)`, type: "warning" }, ...prev].slice(0, 8);
          });
        }
        if (data.storage && data.storage.percentage > 85) {
           setActivities(prev => {
            const hasRecentWarning = prev.some(a => a.event.includes("Storage threshold") && (Date.now() - a.timestamp) < 3600000); // 60 min cooldown
            if (hasRecentWarning) return prev;
            return [{ timestamp: Date.now(), event: `Storage threshold reached ${Math.round(data.storage.percentage)}%`, type: "warning" }, ...prev].slice(0, 8);
          });
        }

      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050510] text-white font-dm-sans">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#050510]/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <BarChart3 size={20} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="font-syne font-bold text-lg">Analytics</h1>
              <p className="text-[10px] text-cyan-400 uppercase tracking-wider">Metrics Stack</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${activeRange === range
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-white/40 hover:text-white"
                  }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button onClick={() => addToast("Feature coming soon!", "info")} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-all cursor-pointer">
            <Download size={14} />
            Export
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#0a0f1a]/80 border border-white/[0.08] rounded-xl p-5 hover:border-white/[0.15] transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${metric.color}15` }}>
                  <metric.icon size={18} style={{ color: metric.color }} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${metric.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {metric.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(metric.change)}%
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold mb-1" style={{ color: metric.color }}>{metric.value}</p>
                  <p className="text-xs text-white/40">{metric.label}</p>
                </div>
                <MiniSparkline data={metric.sparkline} color={metric.color} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0a0f1a]/80 border border-white/[0.08] rounded-xl p-6"
          >
            <h3 className="font-syne font-bold mb-4">CPU Utilization</h3>
            <div className="h-48 flex items-end gap-2">
              {cpuChart.map((value, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${value}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-cyan-600 to-cyan-400 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ boxShadow: "0 0 20px rgba(0,245,255,0.2)" }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[10px] text-white/30 font-mono">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </motion.div>

          {/* Network Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#0a0f1a]/80 border border-white/[0.08] rounded-xl p-6"
          >
            <h3 className="font-syne font-bold mb-4">Network Traffic</h3>
            <div className="h-48 flex items-end gap-2">
              {networkChart.map((value, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${value}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-purple-600 to-purple-400 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ boxShadow: "0 0 20px rgba(191,0,255,0.2)" }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[10px] text-white/30 font-mono">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </motion.div>
        </div>

        {/* Activity Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 bg-[#0a0f1a]/80 border border-white/[0.08] rounded-xl p-6"
        >
          <h3 className="font-syne font-bold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {activities.length === 0 && (
              <p className="text-white/30 text-sm">No recent activity.</p>
            )}
            {activities.map((log, i) => {
              const diffMs = Date.now() - log.timestamp;
              const totalMin = Math.max(1, Math.floor(diffMs / 60000));
              const timeStr = totalMin < 60
                ? `${totalMin} min ago`
                : totalMin < 1440
                  ? `${Math.floor(totalMin / 60)} hour${Math.floor(totalMin / 60) > 1 ? "s" : ""} ago`
                  : `${Math.floor(totalMin / 1440)} day${Math.floor(totalMin / 1440) > 1 ? "s" : ""} ago`;
              return (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className={`w-2 h-2 rounded-full ${log.type === "warning" ? "bg-orange-500" : log.type === "success" ? "bg-green-500" : "bg-cyan-500"
                    }`} />
                  <span className="text-sm text-white/70 flex-1">{log.event}</span>
                  <span className="text-xs text-white/30">{timeStr}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
