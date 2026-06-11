"use client";

import { motion } from "framer-motion";
import { Activity, Cpu, HardDrive, Wifi, Clock, ThermometerSun } from "lucide-react";
import { useEffect, useState } from "react";

interface SystemMetric {
  label: string;
  value: string;
  percentage: number;
  icon: React.ReactNode;
  color: string;
}

export default function SystemStatusWidget() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([
    {
      label: "CPU Usage",
      value: "Loading...",
      percentage: 0,
      icon: <Cpu size={14} />,
      color: "#bf00ff",
    },
    {
      label: "Memory",
      value: "Loading...",
      percentage: 0,
      icon: <HardDrive size={14} />,
      color: "#00f5ff",
    },
    {
      label: "Network",
      value: "Loading...",
      percentage: 0,
      icon: <Wifi size={14} />,
      color: "#4ade80",
    },
    {
      label: "Temperature",
      value: "Loading...",
      percentage: 0,
      icon: <ThermometerSun size={14} />,
      color: "#f97316",
    },
  ]);

  // Uptime as a live seconds counter
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

  const formatUptime = (s: number) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  // Real-time metric fetch from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/system");
        const data = await res.json();

        if (data.uptime) setUptimeSeconds(data.uptime);

        setMetrics(prev => {
          return prev.map(m => {
            let newValue = m.value;
            let newPercentage = m.percentage;

            if (m.label === "CPU Usage" && data.cpu) {
              newPercentage = data.cpu.percentage;
              newValue = `${Math.round(newPercentage)}%`;
            } else if (m.label === "Memory" && data.memory) {
              newPercentage = data.memory.percentage;
              const usedGB = (data.memory.used / (1024 ** 3)).toFixed(1);
              const totalGB = (data.memory.total / (1024 ** 3)).toFixed(1);
              newValue = `${usedGB} / ${totalGB} GB`;
            } else if (m.label === "Network" && data.network) {
              newPercentage = data.network.percentage;
              newValue = data.network.value;
            } else if (m.label === "Temperature" && data.temperature) {
              newPercentage = data.temperature.percentage;
              newValue = data.temperature.value;
            }

            return { ...m, value: newValue, percentage: newPercentage };
          });
        });
      } catch (error) {
        console.error("Failed to fetch system stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  // Live uptime counter — increments every second
  useEffect(() => {
    const interval = setInterval(() => setUptimeSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0a0f1a]/80 backdrop-blur-xl border border-white/[0.08] rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-cyan-400" />
          <h3 className="font-syne text-sm font-bold uppercase tracking-widest text-white/60">
            System Status
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-white/30">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          ONLINE
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-white/50">
                <span style={{ color: metric.color }}>{metric.icon}</span>
                {metric.label}
              </span>
              <span className="font-mono" style={{ color: metric.color }}>
                {metric.value}
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metric.percentage}%` }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: metric.color,
                  boxShadow: `0 0 10px ${metric.color}50`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/30">
        <div className="flex items-center gap-1.5">
          <Clock size={10} />
          <span>Uptime: {formatUptime(uptimeSeconds)}</span>
        </div>
        <span className="text-cyan-400/60">{currentTime}</span>
      </div>
    </div>
  );
}
