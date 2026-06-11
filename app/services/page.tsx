"use client";

import { motion } from "framer-motion";
import {
  Network,
  Globe,
  Shield,
  Lock,
  ArrowLeft,
  Plus,
  Search,
  ExternalLink,
  CheckCircle,
  RefreshCw,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

interface ProxyHost {
  id: string;
  domain: string;
  target: string;
  port: string;
  ssl: boolean;
  status: "online" | "error" | "pending";
  trafficVal: number; // Storing as number for easier real-time simulation
}

const initialHosts: ProxyHost[] = [
  { id: "1", domain: "cloud.spark.local", target: "storage-service:4001", port: "4001", ssl: true, status: "pending", trafficVal: 1200 }, // in MB
  { id: "2", domain: "media.spark.local", target: "media-service:4002", port: "4002", ssl: true, status: "pending", trafficVal: 45800 },
  { id: "3", domain: "grafana.spark.local", target: "grafana-analytics:3001", port: "3001", ssl: true, status: "pending", trafficVal: 256 },
  { id: "4", domain: "api.spark.local", target: "admin-service:4003", port: "4003", ssl: true, status: "pending", trafficVal: 892 },
  { id: "5", domain: "dev.spark.local", target: "dashboard-dev:3000", port: "3000", ssl: false, status: "pending", trafficVal: 12 },
];

const formatTraffic = (mb: number) => {
  if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
};

export default function ServicesPage() {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [hosts, setHosts] = useState<ProxyHost[]>(initialHosts);

  // Derive SSL stats live from hosts — no hardcoded values
  const sslStats = {
    valid: hosts.filter(h => h.ssl && h.status === "online").length,
    expiringSoon: hosts.filter(h => h.ssl && h.status === "pending").length,
    expired: hosts.filter(h => h.status === "error").length,
  };

  // Real-time proxy status checking & traffic simulation
  useEffect(() => {
    const checkHosts = async () => {
      try {
        const updated = await Promise.all(
          hosts.map(async (host) => {
            try {
              const res = await fetch(`/api/ping?port=${host.port}`);
              const data = await res.json();
              return {
                ...host,
                status: (data.status === "online" ? "online" : "error") as "online" | "error" | "pending"
              };
            } catch {
              return { ...host, status: "error" as const };
            }
          })
        );

        setHosts(prev => updated.map((host, idx) => {
          if (host.status !== "online") return host;
          
          const trafficBump = host.domain.includes("media") 
            ? Math.random() * 50 
            : Math.random() * 5;

          return { ...host, trafficVal: prev[idx].trafficVal + trafficBump };
        }));
      } catch (err) {
        console.error("Failed to ping proxy hosts:", err);
      }
    };

    checkHosts();
    const updateInterval = setInterval(checkHosts, 5000); // Check statuses every 5 seconds

    return () => clearInterval(updateInterval);
  }, []);

  const filteredHosts = hosts.filter(
    (h) => h.domain.toLowerCase().includes(searchQuery.toLowerCase()) || h.target.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTrafficMB = hosts.reduce((acc, host) => acc + host.trafficVal, 0);

  return (
    <div className="min-h-screen bg-[#050510] text-white font-dm-sans">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-600/10 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#050510]/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <Network size={20} className="text-red-400" />
            </div>
            <div>
              <h1 className="font-syne font-bold text-lg">Services</h1>
              <p className="text-[10px] text-red-400 uppercase tracking-wider">Reverse Proxy Overview</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => addToast("Feature coming soon!", "info")} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-all cursor-pointer">
            <RefreshCw size={14} />
            Refresh
          </button>
          <button onClick={() => addToast("Feature coming soon!", "info")} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-all cursor-pointer">
            <Plus size={16} />
            New Proxy Host
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Proxy Hosts", value: hosts.length, icon: Globe, color: "#ef4444" },
            { label: "Online Services", value: hosts.filter((h) => h.status === "online").length, icon: CheckCircle, color: "#4ade80" },
            { label: "SSL Certificates", value: sslStats.valid, icon: Lock, color: "#00f5ff" },
            { label: "Total Traffic", value: formatTraffic(totalTrafficMB), icon: Network, color: "#bf00ff" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#0a0f1a]/80 border border-white/[0.08] rounded-xl p-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                  <stat.icon size={22} style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-white/40">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* SSL Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0a0f1a]/80 border border-white/[0.08] rounded-xl p-5 mb-6"
        >
          <h3 className="font-syne font-bold mb-4 flex items-center gap-2">
            <Shield size={18} className="text-cyan-400" />
            SSL Certificate Status
          </h3>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-white/60">Valid: <span className="text-white font-medium">{sslStats.valid}</span></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-sm text-white/60">Expiring Soon: <span className="text-white font-medium">{sslStats.expiringSoon}</span></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-white/60">Expired: <span className="text-white font-medium">{sslStats.expired}</span></span>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search domains or targets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-red-500/50 transition-all"
            />
          </div>
        </div>

        {/* Proxy Hosts List */}
        <div className="space-y-3">
          {filteredHosts.map((host, i) => (
            <motion.div
              key={host.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="bg-[#0a0f1a]/80 border border-white/[0.08] rounded-xl p-5 hover:border-white/[0.15] transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    host.status === "online" ? "bg-green-500" : host.status === "error" ? "bg-red-500" : "bg-orange-500"
                  } ${host.status === "online" ? "animate-pulse" : ""}`} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{host.domain}</span>
                      {host.ssl && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                          <Lock size={10} /> SSL
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/40">
                      → <span className="font-mono">{host.target}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatTraffic(host.trafficVal)}</p>
                    <p className="text-xs text-white/30">Traffic</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
                    host.status === "online"
                      ? "bg-green-500/20 text-green-400"
                      : host.status === "error"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-orange-500/20 text-orange-400"
                  }`}>
                    {host.status}
                  </span>
                  <button onClick={() => addToast("Feature coming soon!", "info")} className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
                    <ExternalLink size={16} className="text-white/40" />
                  </button>
                  <button onClick={() => addToast("Feature coming soon!", "info")} className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
                    <Settings size={16} className="text-white/40" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
