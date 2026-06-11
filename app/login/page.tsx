"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Zap, ShieldAlert, ArrowRight, Lock, Key } from "lucide-react";

function LoginScreenContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050510] text-[#e2e8f0] font-dm-sans flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Immersive Background */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-cyan-600/10 blur-[180px] rounded-full" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] bg-purple-600/10 blur-[180px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-pink-600/5 blur-[150px] rounded-full" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Lock Screen UI Container */}
      <div className="w-full max-w-md z-10 flex flex-col items-center text-center">
        {/* Futuristic digital clock */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-12"
        >
          <h1 className="text-7xl font-bold font-syne tracking-tight text-white/90 tabular-nums select-none drop-shadow-[0_0_20px_rgba(0,245,255,0.3)]">
            {time || "12:00"}
          </h1>
          <p className="text-sm font-medium text-white/40 uppercase tracking-[0.25em] mt-2 font-mono">
            {date || "System Booting..."}
          </p>
        </motion.div>

        {/* Glassmorphic Login Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          className="w-full bg-[#0a0a24]/50 border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Top glowing bar */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* OS Icon & Status */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 relative group">
              <Zap size={24} className="text-white animate-pulse" fill="white" />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-pink-500 rounded-2xl blur-md opacity-30 -z-10 group-hover:opacity-60 transition-opacity" />
            </div>
            <h2 className="font-syne font-bold text-lg text-white mt-4 tracking-wide uppercase">
              SPARK OS Node-01
            </h2>
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-white/30 font-mono tracking-widest uppercase">
              <Lock size={10} className="text-cyan-400" /> System Locked
            </div>
          </div>

          {/* Auth Rejection Notice */}
          {error === "AccessDenied" && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-left flex gap-3 items-start"
            >
              <ShieldAlert size={18} className="shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-bold">Access Refused</p>
                <p className="text-white/60 mt-1">
                  Spark OS only authorizes local Google accounts ending with{" "}
                  <span className="text-red-300 font-mono font-bold">.iitj.ac.in</span>.
                </p>
              </div>
            </motion.div>
          )}

          {/* Unlock Button */}
          <div className="space-y-4">
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-pink-500/15 border border-white/10 hover:border-cyan-400/40 rounded-xl font-semibold text-sm text-cyan-200 hover:text-white flex items-center justify-center gap-2 group transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(0,245,255,0.15)] cursor-pointer"
            >
              <Key size={16} className="text-cyan-400 group-hover:rotate-12 transition-transform" />
              Unlock with Google Account
              <ArrowRight size={16} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-[10px] text-white/20 font-mono leading-relaxed mt-2">
              SPARK IDENTITY ROUTER v1.2 // SECURED VIA OAuth 2.0
              <br />
              AUTHORIZED PORTAL ONLY &bull; NO GUEST ACCESS
            </p>
          </div>
        </motion.div>
      </div>

      {/* Floating System Stats Footer */}
      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/20 font-mono uppercase tracking-[0.2em] whitespace-nowrap">
        SPARK OS // CRYPTO CORE ACTIVE // NODE_01_PORT_3000
      </footer>
    </div>
  );
}

export default function LoginScreen() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050510] text-[#e2e8f0] flex items-center justify-center font-mono text-xs">
        INITIALIZING CORE AUTH STACK...
      </div>
    }>
      <LoginScreenContent />
    </Suspense>
  );
}
