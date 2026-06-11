"use client";

import { motion } from "framer-motion";
import {
  Bell,
  User,
  Search,
  Settings,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import ServiceGrid from "./ServiceGrid";
import SystemStatusWidget from "./SystemStatusWidget";
import StorageTile from "./StorageTile";

export default function SparkDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050510] text-[#e2e8f0] font-dm-sans overflow-x-hidden selection:bg-cyan-500/30">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/8 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/8 blur-[150px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-pink-600/5 blur-[120px] rounded-full" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 h-16 px-4 md:px-8 flex items-center justify-between border-b border-white/5 bg-[#050510]/80 backdrop-blur-xl">
        <div className="flex items-center gap-4 md:gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
                <Zap size={18} className="text-white" fill="white" />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-30 blur-md transition-opacity" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-syne font-bold text-lg tracking-tight text-white">
                SPARK
              </h1>
              <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] -mt-0.5">
                Home Cloud OS
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: "Dashboard", href: "/dashboard", active: true },
              { label: "Files", href: "/cloud" },
              { label: "Apps", href: "/apps" },
              { label: "Settings", href: "/settings" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${item.active
                    ? "text-cyan-400 bg-cyan-500/10"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              placeholder="Search Spark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 lg:w-64 bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full" />
          </button>

          {/* User Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-all">
            <User size={16} className="text-white/70" />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-16 left-0 right-0 bg-[#0a0f1a]/95 backdrop-blur-xl border-b border-white/5 z-40 p-4"
        >
          <nav className="flex flex-col gap-2">
            {["Dashboard", "Files", "Apps", "Settings"].map((item) => (
              <Link
                key={item}
                href={item === "Files" ? "/cloud" : `/${item.toLowerCase()}`}
                className="px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item}
              </Link>
            ))}
          </nav>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-8 py-8">
        {/* Page Header */}
        <div className="mb-10">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-syne text-3xl md:text-4xl font-bold text-white mb-2"
          >
            Welcome back
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/40"
          >
            Your self-hosted infrastructure is running smoothly
          </motion.p>
        </div>

        {/* Dashboard Layout */}
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Main Content Area */}
          <div className="flex-1 order-2 xl:order-1">
            <ServiceGrid />
          </div>

          {/* Sidebar Widgets */}
          <aside className="w-full xl:w-80 space-y-6 order-1 xl:order-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StorageTile />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <SystemStatusWidget />
            </motion.div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 px-8 border-t border-white/5">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between text-[10px] text-white/20 font-mono gap-2">
          <span>SPARK OS v1.0.4-BETA // NODE-01 ACTIVE</span>
          <span className="uppercase tracking-[0.15em]">
            Built with Next.js + Tailwind
          </span>
        </div>
      </footer>
    </div>
  );
}
