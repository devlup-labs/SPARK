"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandX,
  IconBrandDribbble,
  IconPoint,
} from "@tabler/icons-react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Services", href: "#services" },
];

const socialLinks = [
  { icon: <IconBrandGithub size={18} />, href: "https://github.com", label: "GitHub" },
  { icon: <IconBrandX size={18} />, href: "https://x.com", label: "X / Twitter" },
];

/* ── Live system clock ── */
function SystemClock() {
  const [time, setTime] = useState("00:00:00");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(0,245,255,0.6)", letterSpacing: "0.08em" }}>
      {time}
    </span>
  );
}

/* ── Status pill ── */
function StatusPill({ label, active = true }: { label: string; active?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", color: active ? "rgba(0,245,255,0.7)" : "rgba(255,32,32,0.7)" }}>
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: active ? "#00f5ff" : "#ff2020",
          boxShadow: active ? "0 0 6px #00f5ff" : "0 0 6px #ff2020",
          animation: "pulse 2s infinite",
        }}
      />
      {label}
    </span>
  );
}

export default function Footer() {
  const [sysStatus, setSysStatus] = useState("ONLINE");
  const [lat, setLat] = useState("28°36'36\"N");
  const [lon, setLon] = useState("77°13'48\"E");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/system");
        const data = await res.json();
        setSysStatus(data.uptime ? "ONLINE" : "OFFLINE");
      } catch (e) {
        setSysStatus("OFFLINE");
      }
    };
    fetchStats();
    
    // Simulate slight coordinate drift for "realism"
    const interval = setInterval(() => {
      const dLat = (Math.random() - 0.5) * 0.0001;
      const dLon = (Math.random() - 0.5) * 0.0001;
      // Just visually updating them slightly if we wanted to be fancy, 
      // but let's just keep them stable or realistic.
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <footer
      className="relative overflow-hidden border-t px-6 md:px-12 pt-10 pb-6"
      style={{
        background: "var(--bg-layer)",
        borderColor: "rgba(0,245,255,0.1)",
      }}
    >
      {/* ── Decorative top edge line ── */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{ height: "1px", background: "linear-gradient(to right, transparent, rgba(0,245,255,0.4) 30%, rgba(0,245,255,0.4) 70%, transparent)" }}
      />

      {/* ── HUD corner top-left ── */}
      <svg className="absolute top-3 left-3 opacity-20" width="20" height="20" viewBox="0 0 20 20">
        <path d="M2 18 L2 2 L18 2" stroke="#00f5ff" strokeWidth="1.2" fill="none" />
      </svg>
      {/* ── HUD corner top-right ── */}
      <svg className="absolute top-3 right-3 opacity-20" width="20" height="20" viewBox="0 0 20 20" style={{ transform: "rotate(90deg)" }}>
        <path d="M2 18 L2 2 L18 2" stroke="#00f5ff" strokeWidth="1.2" fill="none" />
      </svg>

      <div className="max-w-7xl mx-auto">
        {/* ── Top status bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-5" style={{ borderBottom: "1px solid rgba(0,245,255,0.07)" }}>
          <div className="flex items-center gap-5">
            <StatusPill label={`SYSTEM: ${sysStatus}`} active={sysStatus === "ONLINE"} />
            <StatusPill label="SERVICES: RUNNING" active={true} />
          </div>
          <div className="flex items-center gap-4">
            <span style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(0,245,255,0.3)", letterSpacing: "0.1em" }}>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
            <SystemClock />
            <span style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(0,245,255,0.3)", letterSpacing: "0.1em" }}>v2.6.1</span>
          </div>
        </div>

        {/* ── Main row ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div style={{ width: 3, height: 20, background: "#00f5ff", boxShadow: "0 0 8px #00f5ff" }} />
              <span
                className="font-extrabold text-base tracking-wider"
                style={{ fontFamily: "var(--font-syne)", color: "var(--text-primary)", letterSpacing: "0.12em" }}
              >
                SPARK
              </span>
            </div>
            <p
              className="text-[12px] leading-relaxed"
              style={{ fontFamily: "var(--font-dm-sans)", color: "var(--text-secondary)", maxWidth: 200 }}
            >
              Self-Hosted Personal Access Remote Kit — own your infrastructure.
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <IconPoint size={10} style={{ color: "rgba(0,245,255,0.4)" }} />
              <span style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(0,245,255,0.4)", letterSpacing: "0.08em" }}>
                ACCESS FILES ANYWHERE
              </span>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex flex-col gap-1">
            <span
              className="text-[9px] tracking-[0.2em] mb-3"
              style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(0,245,255,0.4)", letterSpacing: "0.2em" }}
            >
              NAVIGATION
            </span>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-2 py-0.5 text-[13px] transition-colors duration-200"
                style={{ fontFamily: "var(--font-dm-sans)", color: "var(--text-secondary)" }}
              >
                <span
                  className="group-hover:w-3 transition-all duration-200"
                  style={{ display: "inline-block", width: 8, height: "1px", background: "rgba(0,245,255,0.5)" }}
                />
                <span className="group-hover:text-[#00f5ff] transition-colors duration-200">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Social + coords */}
          <div className="flex flex-col gap-3">
            <span
              className="text-[9px] tracking-[0.2em] mb-1"
              style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(0,245,255,0.4)", letterSpacing: "0.2em" }}
            >
              NETWORK
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  whileHover={{ scale: 1.12, boxShadow: "0 0 16px rgba(0,245,255,0.45)" }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 flex items-center justify-center transition-colors duration-200"
                  style={{
                    background: "rgba(0,245,255,0.05)",
                    border: "1px solid rgba(0,245,255,0.15)",
                    color: "rgba(0,245,255,0.6)",
                    clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
                  }}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
            {/* Coordinate decorations */}
            <div className="mt-auto flex flex-col gap-0.5">
              <span style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(0,245,255,0.25)", letterSpacing: "0.08em" }}>LAT: {lat}</span>
              <span style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(0,245,255,0.25)", letterSpacing: "0.08em" }}>LON: {lon}</span>
            </div>
          </div>
        </div>


        {/* ── Bottom bar ── */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5"
          style={{ borderTop: "1px solid rgba(0,245,255,0.07)" }}
        >
          <p
            className="text-[11px]"
            style={{ fontFamily: "monospace", color: "rgba(0,245,255,0.3)", letterSpacing: "0.08em" }}
          >
            © 2026 SPARK — BUILT WITH NEXT.JS &amp; ⚡
          </p>
          <div className="flex items-center gap-4">
            <span style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(0,245,255,0.2)", letterSpacing: "0.08em" }}>NODE: ACTIVE</span>
            <div style={{ width: 1, height: 12, background: "rgba(0,245,255,0.15)" }} />
            <span style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(0,245,255,0.2)", letterSpacing: "0.08em" }}>BUILD: STABLE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
