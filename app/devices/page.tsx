"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Server,
  HardDrive,
  Cpu,
  ThermometerSun,
  RefreshCw,
  ArrowLeft,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

interface Device {
  id: string;
  name: string;
  type: "server" | "nas" | "router" | "iot";
  status: "online" | "offline" | "warning";
  ip: string;
  cpu?: number;
  memory?: number;
  temp?: number;
  uptime?: string;
}

const initialDevices: Device[] = [
  { id: "1", name: "SPARK-NODE-01", type: "server", status: "online", ip: "192.168.1.100", cpu: 24, memory: 42, temp: 45, uptime: "12d 4h" },
  { id: "2", name: "NAS-PRIMARY", type: "nas", status: "online", ip: "192.168.1.101", cpu: 12, memory: 68, temp: 38, uptime: "45d 12h" },
  { id: "3", name: "GATEWAY-MAIN", type: "router", status: "online", ip: "192.168.1.1", cpu: 8, memory: 32, uptime: "90d 2h" },
  { id: "4", name: "IOT-HUB-01", type: "iot", status: "warning", ip: "192.168.1.150", cpu: 65, memory: 78, temp: 52, uptime: "2d 8h" },
  { id: "5", name: "BACKUP-NODE", type: "server", status: "offline", ip: "192.168.1.102" },
];

const statusColors = {
  online: { bg: "#4ade8020", border: "#4ade8040", text: "#4ade80", dot: "#4ade80" },
  offline: { bg: "#ef444420", border: "#ef444440", text: "#ef4444", dot: "#ef4444" },
  warning: { bg: "#f9731620", border: "#f9731640", text: "#f97316", dot: "#f97316" },
};

export default function DevicesPage() {
  const { addToast } = useToast();
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(initialDevices[0].id);

  // Map device id → uptime in seconds (pre-seeded from initial uptime strings)
  const [uptimeMap, setUptimeMap] = useState<Record<string, number>>({
    "1": 12 * 86400 + 4 * 3600,      // 12d 4h
    "2": 45 * 86400 + 12 * 3600,     // 45d 12h
    "3": 90 * 86400 + 2 * 3600,      // 90d 2h
    "4": 2 * 86400 + 8 * 3600,       // 2d 8h
  });

  // Offline device — track seconds since last seen (2 hours = 7200s)
  const [offlineSince, setOfflineSince] = useState(7200);

  const formatUptime = (s: number) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatOffline = (s: number) => {
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  // Tick uptime counters every second (offline counter only, since main uptime is synced dynamically from os.uptime)
  useEffect(() => {
    const tick = setInterval(() => {
      setUptimeMap(prev => {
        const next = { ...prev };
        for (const key in next) {
          if (key !== "1") next[key] = next[key] + 1; // Sync key "1" (SPARK-NODE-01) directly from system uptime
        }
        return next;
      });
      setOfflineSince(s => s + 1);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || devices[0];
  const onlineCount = devices.filter(d => d.status === "online").length;
  const warningCount = devices.filter(d => d.status === "warning").length;

  // Fetch real host statistics for SPARK-NODE-01 and fluctuate others
  useEffect(() => {
    const fetchHostStats = async () => {
      try {
        const res = await fetch("/api/system");
        const data = await res.json();

        setDevices(prev => prev.map(device => {
          if (device.id === "1") { // SPARK-NODE-01 represents the active homelab host
            return {
              ...device,
              status: "online",
              cpu: Math.round(data.cpu.percentage),
              memory: Math.round(data.memory.percentage),
              temp: data.temperature ? Math.round(data.temperature.percentage) : 45,
            };
          }

          // Fluctuate other remote devices organically
          if (device.status === "offline") return device;
          const fluctuate = (val?: number) => {
            if (val === undefined) return val;
            const delta = (Math.random() - 0.5) * 4;
            return Math.max(0, Math.min(100, Math.round((val + delta) * 10) / 10));
          };

          return {
            ...device,
            cpu: fluctuate(device.cpu),
            memory: fluctuate(device.memory),
            temp: fluctuate(device.temp),
          };
        }));

        setUptimeMap(prev => ({
          ...prev,
          "1": Math.round(data.uptime) // Dynamically bind real system uptime
        }));

      } catch (err) {
        console.error("Failed to query host telemetry:", err);
      }
    };

    fetchHostStats();
    const interval = setInterval(fetchHostStats, 3000); // Sync telemetry every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050510] text-white font-dm-sans">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#050510]/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <Activity size={20} className="text-red-400" />
            </div>
            <div>
              <h1 className="font-syne font-bold text-lg">Devices</h1>
              <p className="text-[10px] text-red-400 uppercase tracking-wider">Monitoring Service</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => addToast("Feature coming soon!", "info")} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-all cursor-pointer">
            <RefreshCw size={14} />
            Refresh
          </button>
          <button onClick={() => addToast("Feature coming soon!", "info")} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white cursor-pointer">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Devices", value: devices.length, icon: Server, color: "#00f5ff" },
            { label: "Online", value: onlineCount, icon: CheckCircle, color: "#4ade80" },
            { label: "Warnings", value: warningCount, icon: AlertTriangle, color: "#f97316" },
            { label: "Offline", value: devices.length - onlineCount, icon: Activity, color: "#ef4444" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#0a0f1a]/80 border border-white/[0.08] rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                  <stat.icon size={18} style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Device List */}
          <div className="lg:w-1/2 space-y-3">
            <h2 className="font-syne text-lg font-bold mb-4">All Devices</h2>
            {devices.map((device, i) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedDeviceId(device.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedDeviceId === device.id
                    ? "bg-white/[0.05] border-red-500/30"
                    : "bg-[#0a0f1a]/60 border-white/[0.05] hover:border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full animate-pulse"
                      style={{ backgroundColor: statusColors[device.status].dot }}
                    />
                    <div>
                      <h3 className="font-semibold text-sm">{device.name}</h3>
                      <p className="text-xs text-white/40">{device.ip}</p>
                    </div>
                  </div>
                  <span
                    className="px-2 py-1 rounded-md text-[10px] font-bold uppercase"
                    style={{
                      backgroundColor: statusColors[device.status].bg,
                      color: statusColors[device.status].text,
                    }}
                  >
                    {device.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Device Details */}
          <div className="lg:w-1/2">
            <h2 className="font-syne text-lg font-bold mb-4">Device Details</h2>
            {selectedDevice ? (
              <motion.div
                key={selectedDevice.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0a0f1a]/80 border border-white/[0.08] rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-syne text-xl font-bold">{selectedDevice.name}</h3>
                    <p className="text-sm text-white/40">{selectedDevice.ip}</p>
                  </div>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: statusColors[selectedDevice.status].dot, boxShadow: `0 0 10px ${statusColors[selectedDevice.status].dot}` }}
                  />
                </div>

                {selectedDevice.status !== "offline" && (
                  <div className="space-y-5">
                    {/* CPU */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="flex items-center gap-2 text-white/60">
                          <Cpu size={14} className="text-cyan-400" /> CPU
                        </span>
                        <span className="font-mono text-cyan-400">{selectedDevice.cpu}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedDevice.cpu}%` }}
                          className="h-full bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(0,245,255,0.5)]"
                        />
                      </div>
                    </div>

                    {/* Memory */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="flex items-center gap-2 text-white/60">
                          <HardDrive size={14} className="text-purple-400" /> Memory
                        </span>
                        <span className="font-mono text-purple-400">{selectedDevice.memory}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedDevice.memory}%` }}
                          className="h-full bg-purple-500 rounded-full shadow-[0_0_10px_rgba(191,0,255,0.5)]"
                        />
                      </div>
                    </div>

                    {/* Temperature */}
                    {selectedDevice.temp && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="flex items-center gap-2 text-white/60">
                            <ThermometerSun size={14} className="text-orange-400" /> Temperature
                          </span>
                          <span className="font-mono text-orange-400">{selectedDevice.temp}°C</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedDevice.temp}%` }}
                            className="h-full bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Uptime */}
                    {selectedDevice.id in uptimeMap && (
                      <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-sm text-white/40">
                        <Clock size={14} />
                        Uptime: <span className="text-white/60">{formatUptime(uptimeMap[selectedDevice.id])}</span>
                      </div>
                    )}
                  </div>
                )}

                {selectedDevice.status === "offline" && (
                  <div className="text-center py-8">
                    <Activity size={40} className="mx-auto text-red-500/50 mb-3" />
                    <p className="text-white/40">Device is currently offline</p>
                    <p className="text-xs text-white/20 mt-1">Last seen: {formatOffline(offlineSince)}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="bg-[#0a0f1a]/80 border border-white/[0.08] rounded-xl p-8 text-center">
                <p className="text-white/40">Select a device to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
