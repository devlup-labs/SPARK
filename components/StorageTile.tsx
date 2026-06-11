"use client";

import { motion } from "framer-motion";
import { HardDrive, Server, Database, CloudRain, FolderPlus, Monitor, Info, CloudOff } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

const StorageTile = () => {
    const [activeTab, setActiveTab] = useState("local");

    // Local storage
    const [localUsed, setLocalUsed] = useState(0);
    const [localTotal, setLocalTotal] = useState(512);

    const localColor = "#bf00ff";
    const localGlow = "rgba(191, 0, 255, 0.4)";
    const percentage = localTotal > 0 ? (localUsed / localTotal) * 100 : 0;

    // Fetch real storage metrics
    useEffect(() => {
        const fetchStorage = async () => {
            try {
                const res = await fetch("/api/system");
                const data = await res.json();
                if (data.storage) {
                    setLocalUsed(parseFloat(data.storage.used.toFixed(1)));
                    setLocalTotal(Math.round(data.storage.total));
                }
            } catch (error) {
                console.error("Failed to fetch storage:", error);
            }
        };
        fetchStorage();
        const interval = setInterval(fetchStorage, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card overflow-hidden shadow-2xl relative group"
        >
            {/* Header / Tabs */}
            <div className="flex border-b border-white/5 bg-white/[0.02]">
                <button
                    onClick={() => setActiveTab("local")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${activeTab === "local" ? "text-purple-400 border-b-2 border-purple-500 bg-purple-500/5 shadow-[0_4px_10px_-4px_rgba(191,0,255,0.4)]" : "text-white/40 hover:text-white/60 hover:bg-white/5"
                        }`}
                >
                    <HardDrive size={14} /> LOCAL
                </button>
                <button
                    onClick={() => setActiveTab("cloud")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${activeTab === "cloud" ? "text-cyan-400 border-b-2 border-cyan-500 bg-cyan-500/5 shadow-[0_4px_10px_-4px_rgba(0,245,255,0.4)]" : "text-white/40 hover:text-white/60 hover:bg-white/5"
                        }`}
                >
                    <CloudRain size={14} /> CLOUD
                </button>
            </div>

            {/* Storage Info Content */}
            <div className="p-5 flex flex-col gap-5">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        <h4 className="font-syne text-lg font-bold text-white flex items-center gap-2">
                            {activeTab === "local" ? <Server size={18} className="text-purple-500" /> : <Database size={18} className="text-cyan-500/40" />}
                            {activeTab === "local" ? "SPARK_SYSTEM_01" : "CLOUD_STORAGE"}
                        </h4>
                        <span className="text-[10px] text-white/30 uppercase font-mono tracking-tighter">
                            {activeTab === "local" ? "NVMe SSD" : "Not Connected"}
                        </span>
                    </div>
                    <motion.button
                        whileHover={{ rotate: 15 }}
                        className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <Info size={14} className="text-white/40" />
                    </motion.button>
                </div>

                {/* Progress Bar — Local only; cloud shows not-connected state */}
                {activeTab === "local" ? (
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">Utilization</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-mono font-bold" style={{ color: localColor }}>
                                        {localUsed}
                                    </span>
                                    <span className="text-sm font-mono text-white/40">/ {localTotal} GB</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-bold font-syne" style={{ color: localColor }}>{Math.round(percentage)}%</span>
                            </div>
                        </div>

                        <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{
                                    backgroundColor: localColor,
                                    boxShadow: `0 0 20px -2px ${localGlow}`
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    /* Cloud — not configured, show 0 / 0 and a connect prompt */
                    <div className="flex flex-col items-center justify-center gap-3 py-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <CloudOff size={22} className="text-white/20" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-white/40">No cloud provider configured</p>
                            <p className="text-xs text-white/20 mt-1 font-mono">0 / 0 GB &nbsp;&bull;&nbsp; 0%</p>
                        </div>
                        <div className="h-2.5 w-full bg-white/5 rounded-full border border-white/10" />
                        <Link href="/settings" className="mt-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400/70 text-xs font-bold uppercase tracking-wider hover:bg-cyan-500/20 transition-all cursor-pointer">
                            Connect Cloud Storage
                        </Link>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Link href="/cloud" className="flex items-center justify-center gap-2 py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-tight hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
                        <FolderPlus size={14} className="text-white/40 group-hover:text-cyan-400 transition-colors" /> New Volume
                    </Link>
                    <Link href="/analytics" className="flex items-center justify-center gap-2 py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-tight hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
                        <Monitor size={14} className="text-white/40 group-hover:text-orange-400 transition-colors" /> Monitor
                    </Link>
                </div>
            </div>

            {/* Subtle glow highlight on hover */}
            <div
                className="absolute inset-x-0 bottom-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{
                    background: `linear-gradient(90deg, transparent, ${activeTab === "local" ? localColor : "#00f5ff40"}, transparent)`
                }}
            />
        </motion.div>
    );
};

export default StorageTile;
