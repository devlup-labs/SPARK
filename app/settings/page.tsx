"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Shield,
  Bell,
  Palette,
  HardDrive,
  Network,
  Key,
  Globe,
  Wifi,
  Server,
  Database,
  Save,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

interface SettingToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

const SettingToggle = ({ label, description, enabled, onToggle }: SettingToggleProps) => (
  <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
    <div>
      <p className="text-sm font-medium text-white/90">{label}</p>
      <p className="text-xs text-white/40 mt-0.5">{description}</p>
    </div>
    <button
      onClick={onToggle}
      className="cursor-pointer transition-all duration-300"
    >
      {enabled ? (
        <ToggleRight size={32} className="text-cyan-400" />
      ) : (
        <ToggleLeft size={32} className="text-white/30" />
      )}
    </button>
  </div>
);

interface SettingCardProps {
  icon: any;
  title: string;
  description: string;
  color: string;
  children?: React.ReactNode;
}

const SettingCard = ({ icon: Icon, title, description, color, children }: SettingCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#0a0f1a]/80 backdrop-blur-xl border border-white/[0.08] rounded-xl overflow-hidden"
  >
    <div className="p-5 border-b border-white/5 flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          backgroundColor: `${color}15`,
          border: `1px solid ${color}30`,
        }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <h3 className="font-syne font-bold text-white/90">{title}</h3>
        <p className="text-xs text-white/40">{description}</p>
      </div>
    </div>
    <div className="p-5">{children}</div>
  </motion.div>
);

const SettingRow = ({ icon: Icon, label, value, color, onClick }: { icon: any; label: string; value: string; color: string; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between py-3 border-b border-white/5 last:border-0 group cursor-pointer transition-all hover:bg-white/[0.02] px-2 -mx-2 rounded-lg"
  >
    <div className="flex items-center gap-3">
      <Icon size={16} style={{ color }} className="opacity-60 group-hover:opacity-100 transition-opacity" />
      <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/40">{value}</span>
      <ChevronRight size={14} className="text-white/20 group-hover:text-white/40 transition-colors" />
    </div>
  </button>
);

export default function SettingsPage() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    autoUpdate: true,
    analytics: false,
    remoteAccess: true,
    twoFactor: false,
    autoBackup: true,
    compression: true,
  });

  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal, setStorageTotal] = useState(512);
  const [networkInfo, setNetworkInfo] = useState({ ip: "192.168.1.100", interface: "eth0" });

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const res = await fetch("/api/system");
        const data = await res.json();
        if (data.storage) {
          setStorageUsed(data.storage.used);
          setStorageTotal(data.storage.total);
        }
        if (data.network) {
          setNetworkInfo({
            ip: data.network.ip || "192.168.1.100",
            interface: data.network.interface || "eth0"
          });
        }
      } catch (err) {
        console.error("Failed to fetch storage and network info", err);
      }
    };
    fetchStorage();
    const interval = setInterval(fetchStorage, 15000);
    return () => clearInterval(interval);
  }, []);

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
          <h1 className="font-syne font-bold text-lg">Settings</h1>
        </div>

        <button onClick={() => addToast("Feature coming soon!", "info")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all cursor-pointer">
          <Save size={14} />
          Save Changes
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile */}
        <SettingCard
          icon={User}
          title="Profile"
          description="Manage your account details"
          color="#00f5ff"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold">
              S
            </div>
            <div>
              <p className="font-syne font-bold text-lg">Spark Admin</p>
              <p className="text-sm text-white/40">admin@spark.local</p>
            </div>
          </div>
          <div className="space-y-0">
            <SettingRow icon={User} label="Display Name" value="Spark Admin" color="#00f5ff" />
            <SettingRow icon={Globe} label="Language" value="English" color="#00f5ff" />
            <SettingRow icon={Key} label="Change Password" value="••••••••" color="#00f5ff" />
          </div>
        </SettingCard>

        {/* Appearance */}
        <SettingCard
          icon={Palette}
          title="Appearance"
          description="Customize the look and feel"
          color="#bf00ff"
        >
          <SettingToggle
            label="Dark Mode"
            description="Use dark theme throughout the interface"
            enabled={settings.darkMode}
            onToggle={() => toggle("darkMode")}
          />
          <div className="py-4 border-b border-white/5">
            <p className="text-sm font-medium text-white/90 mb-3">Accent Color</p>
            <div className="flex gap-3">
              {["#00f5ff", "#bf00ff", "#f97316", "#4ade80", "#ef4444"].map((color, i) => (
                <button onClick={() => addToast("Feature coming soon!", "info")}
                  key={color}
                  className={`w-8 h-8 rounded-lg transition-all cursor-pointer hover:scale-110 ring-2 ring-offset-2 ring-offset-[#0a0f1a] ${i === 0 ? "ring-cyan-400" : "ring-transparent"
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </SettingCard>

        {/* Notifications */}
        <SettingCard
          icon={Bell}
          title="Notifications"
          description="Configure alerts and updates"
          color="#f97316"
        >
          <SettingToggle
            label="Push Notifications"
            description="Receive alerts for important events"
            enabled={settings.notifications}
            onToggle={() => toggle("notifications")}
          />
          <SettingToggle
            label="Auto Updates"
            description="Automatically install system updates"
            enabled={settings.autoUpdate}
            onToggle={() => toggle("autoUpdate")}
          />
          <SettingToggle
            label="Usage Analytics"
            description="Help improve SPARK by sharing usage data"
            enabled={settings.analytics}
            onToggle={() => toggle("analytics")}
          />
        </SettingCard>

        {/* Security */}
        <SettingCard
          icon={Shield}
          title="Security"
          description="Protect your system"
          color="#4ade80"
        >
          <SettingToggle
            label="Remote Access"
            description="Allow access from outside your network"
            enabled={settings.remoteAccess}
            onToggle={() => toggle("remoteAccess")}
          />
          <SettingToggle
            label="Two-Factor Authentication"
            description="Add an extra layer of security"
            enabled={settings.twoFactor}
            onToggle={() => toggle("twoFactor")}
          />
          <SettingRow icon={Key} label="API Keys" value="3 active" color="#4ade80" />
          <SettingRow icon={Shield} label="Active Sessions" value="2 devices" color="#4ade80" />
        </SettingCard>

        {/* Storage */}
        <SettingCard
          icon={HardDrive}
          title="Storage"
          description="Manage disks and backups"
          color="#ef4444"
        >
          <SettingToggle
            label="Auto Backup"
            description="Automatically backup data daily"
            enabled={settings.autoBackup}
            onToggle={() => toggle("autoBackup")}
          />
          <SettingToggle
            label="Compression"
            description="Compress files to save storage space"
            enabled={settings.compression}
            onToggle={() => toggle("compression")}
          />
          <div className="pt-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-white/50">Storage Used</span>
              <span className="text-white/70">{storageUsed.toFixed(1)} GB / {storageTotal >= 1000 ? (storageTotal / 1024).toFixed(1) + " TB" : storageTotal.toFixed(0) + " GB"}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${storageTotal > 0 ? (storageUsed / storageTotal) * 100 : 0}%`,
                  backgroundColor: "#ef4444",
                  boxShadow: "0 0 10px #ef4444",
                }}
              />
            </div>
          </div>
        </SettingCard>

        {/* Network */}
        <SettingCard
          icon={Network}
          title="Network"
          description="Configure network and server settings"
          color="#3b82f6"
        >
          <SettingRow icon={Wifi} label="Network Interface" value={`${networkInfo.interface} (${networkInfo.ip})`} color="#3b82f6" />
          <SettingRow icon={Globe} label="Domain" value={typeof window !== "undefined" ? window.location.hostname : "spark.local"} color="#3b82f6" />
          <SettingRow icon={Server} label="DNS Server" value="1.1.1.1" color="#3b82f6" />
          <SettingRow icon={Database} label="DDNS" value="Disabled" color="#3b82f6" />
        </SettingCard>

        {/* System Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0f1a]/50 backdrop-blur-xl border border-white/[0.05] rounded-xl p-6 text-center"
        >
          <p className="text-sm text-white/40">
            SPARK Home Cloud OS v1.0.0 • Built with Next.js
          </p>
          <p className="text-xs text-white/20 mt-1">
            © 2024 SPARK Project
          </p>
        </motion.div>
      </main>
    </div>
  );
}
