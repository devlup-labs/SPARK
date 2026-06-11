"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Download,
  Star,
  Cloud,
  MonitorPlay,
  Shield,
  Database,
  MessageSquare,
  BookOpen,
  Camera,
  Music,
  Gamepad2,
  Code,
  Globe,
  Server,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

interface AppItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  color: string;
  installed: boolean;
  version: string;
  rating: number;
}

const appStore: AppItem[] = [
  { id: "1", name: "Nextcloud", description: "Self-hosted cloud storage & collaboration", category: "Storage", icon: Cloud, color: "#00f5ff", installed: true, version: "28.0.1", rating: 4.8 },
  { id: "2", name: "Jellyfin", description: "Free Software Media System", category: "Media", icon: MonitorPlay, color: "#f97316", installed: true, version: "10.9.0", rating: 4.9 },
  { id: "3", name: "Vaultwarden", description: "Lightweight Bitwarden server", category: "Security", icon: Shield, color: "#4ade80", installed: true, version: "1.30.0", rating: 4.7 },
  { id: "4", name: "PostgreSQL", description: "Advanced open source database", category: "Database", icon: Database, color: "#3b82f6", installed: false, version: "16.1", rating: 4.6 },
  { id: "5", name: "Matrix Synapse", description: "Decentralized communication server", category: "Communication", icon: MessageSquare, color: "#bf00ff", installed: false, version: "1.98.0", rating: 4.4 },
  { id: "6", name: "Calibre-Web", description: "Web-based ebook management", category: "Media", icon: BookOpen, color: "#ef4444", installed: false, version: "0.6.21", rating: 4.5 },
  { id: "7", name: "PhotoPrism", description: "AI-powered photo management", category: "Media", icon: Camera, color: "#ff00aa", installed: false, version: "231011", rating: 4.7 },
  { id: "8", name: "Navidrome", description: "Modern music server & streamer", category: "Media", icon: Music, color: "#22c55e", installed: false, version: "0.51.1", rating: 4.6 },
  { id: "9", name: "Retroarch Web", description: "Retro gaming in your browser", category: "Gaming", icon: Gamepad2, color: "#eab308", installed: false, version: "1.17.0", rating: 4.3 },
  { id: "10", name: "Code Server", description: "VS Code in the browser", category: "Development", icon: Code, color: "#0ea5e9", installed: true, version: "4.20.0", rating: 4.8 },
  { id: "11", name: "Nginx Proxy Manager", description: "Reverse proxy with SSL support", category: "Network", icon: Globe, color: "#ef4444", installed: true, version: "2.11.1", rating: 4.7 },
  { id: "12", name: "Portainer", description: "Container management UI", category: "System", icon: Server, color: "#06b6d4", installed: true, version: "2.19.4", rating: 4.8 },
];

const categories = ["All", "Storage", "Media", "Security", "Database", "Communication", "Development", "Network", "System", "Gaming"];

const AppCard = ({ app, onToggle }: { app: AppItem; onToggle: () => void }) => {
  const Icon = app.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-[#0a0f1a]/80 backdrop-blur-xl border border-white/[0.08] rounded-xl p-5 flex flex-col h-full transition-all duration-300 hover:border-white/[0.15] group"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: `${app.color}15`,
            border: `1px solid ${app.color}30`,
          }}
        >
          <Icon size={22} style={{ color: app.color }} />
        </div>
        
        {app.installed && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
            <CheckCircle2 size={10} /> INSTALLED
          </span>
        )}
      </div>
      
      <h3 className="font-syne font-bold text-white/90 mb-1">{app.name}</h3>
      <p className="text-xs text-white/40 mb-3 flex-grow">{app.description}</p>
      
      <div className="flex items-center justify-between text-[10px] text-white/30 mb-4">
        <span className="uppercase tracking-wider">{app.category}</span>
        <span className="flex items-center gap-1">
          <Star size={10} className="text-yellow-500" fill="#eab308" />
          {app.rating}
        </span>
      </div>
      
      <button
        onClick={onToggle}
        className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
          app.installed
            ? "bg-white/5 text-white/50 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
            : "text-white border hover:shadow-lg"
        }`}
        style={
          !app.installed
            ? {
                backgroundColor: `${app.color}15`,
                borderColor: `${app.color}30`,
                color: app.color,
              }
            : undefined
        }
      >
        {app.installed ? "Uninstall" : "Install"}
      </button>
    </motion.div>
  );
};

export default function AppsPage() {
  useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [apps, setApps] = useState(appStore);

  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleInstall = (id: string) => {
    setApps((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, installed: !app.installed } : app
      )
    );
  };

  const installedCount = apps.filter((a) => a.installed).length;

  return (
    <div className="min-h-screen bg-[#050510] text-white font-dm-sans">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/8 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/8 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#050510]/90 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} className="text-white/60" />
          </Link>
          <div>
            <h1 className="font-syne font-bold text-lg flex items-center gap-2">
              <Download size={18} className="text-cyan-400" />
              App Store
            </h1>
            <p className="text-xs text-white/40">{installedCount} apps installed</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-all"
          />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Categories */}
        <aside className="w-56 border-r border-white/5 p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto hidden lg:block">
          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-3 px-2">Categories</p>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Mobile Categories */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 lg:hidden scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-white/50">
              Showing <span className="text-white font-medium">{filteredApps.length}</span> apps
            </p>
          </div>

          {/* App Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredApps.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <AppCard app={app} onToggle={() => toggleInstall(app.id)} />
              </motion.div>
            ))}
          </div>

          {filteredApps.length === 0 && (
            <div className="text-center py-20">
              <p className="text-white/40">No apps found matching your criteria</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
