"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { IconChevronDown, IconTerminal2, IconBolt } from "@tabler/icons-react";

/* ── HUD corner brackets ── */
function HudCorner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const rotate = { tl: 0, tr: 90, br: 180, bl: 270 }[pos];
  const cls = {
    tl: "top-6 left-6",
    tr: "top-6 right-6",
    br: "bottom-6 right-6",
    bl: "bottom-6 left-6",
  }[pos];
  return (
    <svg
      className={`absolute ${cls} opacity-30`}
      width="28" height="28" viewBox="0 0 28 28"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path d="M2 26 L2 2 L26 2" stroke="#00f5ff" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

/* ── Floating data tag ── */
function DataTag({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.4, duration: 0.5 }}
      className={`absolute hidden lg:flex flex-col gap-0.5 ${className}`}
    >
      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "9px", color: "rgba(0,245,255,0.5)", letterSpacing: "0.12em" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "rgba(0,245,255,0.85)", letterSpacing: "0.08em" }}>{value}</span>
      <div style={{ width: "100%", height: "1px", background: "rgba(0,245,255,0.2)" }} />
    </motion.div>
  );
}

/* ── Grid line decorations ── */
function GridLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Vertical accent lines */}
      {[18, 82].map((pct) => (
        <div
          key={pct}
          className="absolute top-0 bottom-0"
          style={{ left: `${pct}%`, width: "1px", background: "linear-gradient(to bottom, transparent, rgba(0,245,255,0.06) 30%, rgba(0,245,255,0.06) 70%, transparent)" }}
        />
      ))}
      {/* Horizontal accent lines */}
      {[25, 75].map((pct) => (
        <div
          key={pct}
          className="absolute left-0 right-0"
          style={{ top: `${pct}%`, height: "1px", background: "linear-gradient(to right, transparent, rgba(0,245,255,0.06) 30%, rgba(0,245,255,0.06) 70%, transparent)" }}
        />
      ))}
    </div>
  );
}

/* ── Stagger variants ── */
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 0.61, 0.36, 1] } },
};

export default function HeroSection() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [uptimeStr, setUptimeStr] = useState("Loading...");
  const [sysStatus, setSysStatus] = useState("SCANNING...");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      setCoords({
        x: Math.round(e.clientX - rect.left),
        y: Math.round(e.clientY - rect.top),
      });
    };
    window.addEventListener("mousemove", move);

    // Fetch system status and uptime
    const updateSystemStats = async () => {
      try {
        const res = await fetch("/api/system");
        const data = await res.json();
        
        if (data.uptime) {
          const s = data.uptime;
          const d = Math.floor(s / 86400);
          const h = Math.floor((s % 86400) / 3600);
          const m = Math.floor((s % 3600) / 60);
          setUptimeStr(`${d}d ${h}h ${m}m`);
          setSysStatus("ONLINE");
        } else {
          setSysStatus("OFFLINE");
        }
      } catch (err) {
        console.error(err);
        setSysStatus("ERROR");
      }
    };

    updateSystemStats();
    const interval = setInterval(updateSystemStats, 60000);

    return () => {
      window.removeEventListener("mousemove", move);
      clearInterval(interval);
    };
  }, []);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6"
    >
      {/* ── Grid lines ── */}
      <GridLines />

      {/* ── HUD corners ── */}
      <HudCorner pos="tl" />
      <HudCorner pos="tr" />
      <HudCorner pos="br" />
      <HudCorner pos="bl" />

      {/* ── Ambient glow pools ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "10%", left: "5%",
          width: 480, height: 480,
          background: "radial-gradient(ellipse, rgba(0,245,255,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "15%", right: "8%",
          width: 360, height: 360,
          background: "radial-gradient(ellipse, rgba(255,106,0,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* ── Floating data tags ── */}
      <DataTag label="SYS.STATUS" value={sysStatus} className="left-10 top-1/3" />
      <DataTag label="UPTIME" value={uptimeStr} className="right-10 top-1/3" />
      <DataTag label="CURSOR.POS" value={`X:${String(coords.x).padStart(4, "0")} Y:${String(coords.y).padStart(4, "0")}`} className="right-10 bottom-1/3" />


      {/* ── Main content ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center max-w-5xl"
      >
        {/* Eyebrow badge */}
        <motion.div variants={item}>
          <span
            className="inline-flex items-center gap-2.5 px-4 py-1.5 text-xs font-semibold mb-8 hero-badge"
            style={{
              background: "rgba(0,245,255,0.06)",
              border: "1px solid rgba(0,245,255,0.25)",
              color: "var(--eyebrow-color)",
              letterSpacing: "0.14em",
              fontFamily: "var(--font-dm-sans)",
              clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
            }}
          >
            <IconTerminal2 size={12} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f5ff] shadow-[0_0_6px_#00f5ff] animate-pulse" />
            Your Data Deserves a Home You Own
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          variants={item}
          className="text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.0] tracking-tight"
          style={{ fontFamily: "var(--font-syne)", color: "var(--text-primary)" }}
        >
          <span>
            OWN SERVER.
          </span>
          <br />
          <span
            className="relative inline-block bg-gradient-to-r from-[#00f5ff] via-[#00c8ff] to-[#00f5ff] bg-clip-text text-transparent gradient-heading"
            style={{ backgroundSize: "200% auto", animation: "gradShift 4s linear infinite" }}
          >
            CONTROL CLOUD.
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={item}
          className="text-base md:text-lg max-w-xl mx-auto leading-relaxed mt-6"
          style={{ fontFamily: "var(--font-dm-sans)", color: "var(--text-secondary)" }}
        >
          Your secure, personal cloud ecosystem. Access your storage, stream your personal media library, and orchestrate server services with absolute data sovereignty and zero external dependencies.
        </motion.p>

        {/* Stats row */}
        <motion.div
          variants={item}
          className="flex items-center gap-8 mt-8"
        >
          {[
            { val: "24/7", label: "AVAILABILITY" },
            { val: "100%", label: "OWNERSHIP" },
            { val: uptimeStr, label: "UPTIME" },
          ].map(({ val, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-syne)", color: "#00f5ff", textShadow: "0 0 20px rgba(0,245,255,0.5)" }}
              >
                {val}
              </span>
              <span
                className="text-[9px] tracking-widest"
                style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(0,245,255,0.45)", letterSpacing: "0.16em" }}
              >
                {label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Divider */}
        <motion.div
          variants={item}
          className="flex items-center gap-4 mt-8 w-64"
        >
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(0,245,255,0.3))" }} />
          <IconBolt size={12} style={{ color: "#00f5ff" }} />
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(0,245,255,0.3))" }} />
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          variants={item}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
        >
          {/* Primary — notched */}
          <motion.a
            href="#services"
            whileHover={{ scale: 1.03, boxShadow: "0 0 28px rgba(0,245,255,0.55), 0 0 60px rgba(0,245,255,0.2)" }}
            whileTap={{ scale: 0.97 }}
            className="relative px-8 py-3.5 text-sm font-bold text-[#020408] overflow-hidden"
            style={{
              background: "#00f5ff",
              clipPath: "polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)",
              fontFamily: "var(--font-syne)",
              letterSpacing: "0.1em",
            }}
          >
            {/* shine sweep */}
            <motion.span
              className="absolute inset-0 -translate-x-full"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)" }}
              animate={{ x: ["−100%", "220%"] }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 2 }}
            />
            GET STARTED
          </motion.a>

          {/* Ghost — angular */}
          <motion.a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03, borderColor: "#00f5ff", color: "#00f5ff" }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-3.5 text-sm font-bold border transition-colors duration-200 ghost-btn"
            style={{
              borderColor: "rgba(0,245,255,0.3)",
              color: "var(--text-primary)",
              clipPath: "polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)",
              fontFamily: "var(--font-syne)",
              letterSpacing: "0.1em",
            }}
          >
            DOCUMENTATION
          </motion.a>
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 scroll-indicator"
        style={{ color: "rgba(0,245,255,0.35)" }}
      >
        <span style={{ fontSize: "9px", letterSpacing: "0.16em", fontFamily: "var(--font-dm-sans)" }}>SCROLL</span>
        <IconChevronDown size={16} />
      </motion.div>

      {/* Keyframe for gradient shift */}
      <style>{`@keyframes gradShift { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }`}</style>
    </section>
  );
}
