"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useDragControls, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  IconCloud,
  IconDeviceTv,
  IconCpu,
  IconChartBar,
  IconShieldLock,
  IconNetwork,
  IconX,
  IconExternalLink,
  IconArrowUpRight,
  IconMinus,
  IconTerminal2,
} from "@tabler/icons-react";

/* ── Service definitions ── */
const services = [
  {
    id: "cloud",
    label: "Cloud",
    system: "Storage Service",
    description: "Your personal cloud storage — files, contacts and more, all self-hosted and private.",
    icon: IconCloud,
    accent: "cyan" as Accent,
    href: "/cloud",
    tag: "STORAGE",
    port: "4001",
  },
  {
    id: "media",
    label: "Media",
    system: "Custom Media Service",
    description: "Stream your entire media library — movies, shows, music — to any device, anywhere.",
    icon: IconDeviceTv,
    accent: "orange" as Accent,
    href: "/media",
    tag: "STREAMING",
    port: "4002",
  },
  {
    id: "devices",
    label: "Devices",
    system: "Monitoring Service",
    description: "Real-time monitoring of all connected devices, hardware health and network status.",
    icon: IconCpu,
    accent: "red" as Accent,
    href: "/devices",
    tag: "MONITORING",
    port: "9090",
  },
  {
    id: "analytics",
    label: "Analytics",
    system: "Metrics Stack",
    description: "Dashboards powered by Prometheus & Grafana — CPU, memory, disk and network metrics.",
    icon: IconChartBar,
    accent: "cyan" as Accent,
    href: "/analytics",
    tag: "METRICS",
    port: "3001",
  },
  {
    id: "admin",
    label: "Admin",
    system: "Admin Service",
    description: "Central control panel for your homelab — manage apps, storage and users from one place.",
    icon: IconShieldLock,
    accent: "orange" as Accent,
    href: "/admin",
    tag: "CONTROL",
    port: "4003",
  },
  {
    id: "services",
    label: "Services",
    system: "Reverse Proxy Overview",
    description: "Nginx Proxy Manager overview — all running services, domains and SSL certificates at a glance.",
    icon: IconNetwork,
    accent: "red" as Accent,
    href: "/services",
    tag: "NETWORK",
    port: "8081",
  },
];

type Service = (typeof services)[0];
type Accent = "cyan" | "orange" | "red";

const accentMap: Record<Accent, {
  hex: string;
  rgb: string;
  glow: string;
  border: string;
  bg: string;
}> = {
  cyan: { hex: "#00f5ff", rgb: "0,245,255", glow: "0 0 28px rgba(0,245,255,0.4)", border: "rgba(0,245,255,0.35)", bg: "rgba(0,245,255,0.07)" },
  orange: { hex: "#ff6a00", rgb: "255,106,0", glow: "0 0 28px rgba(255,106,0,0.4)", border: "rgba(255,106,0,0.35)", bg: "rgba(255,106,0,0.07)" },
  red: { hex: "#ff2020", rgb: "255,32,32", glow: "0 0 28px rgba(255,32,32,0.4)", border: "rgba(255,32,32,0.35)", bg: "rgba(255,32,32,0.07)" },
};

interface WindowState {
  service: Service;
  minimized: boolean;
  zIndex: number;
}

/* ── Flip-in/out variants ── */
const windowVariants: Variants = {
  hidden: {
    opacity: 0, scale: 0.1, rotateY: 90, rotateX: -20,
    transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] }
  },
  visible: {
    opacity: 1, scale: 1, rotateY: 0, rotateX: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  },
  exit: {
    opacity: 0, scale: 0.05, rotateY: -90, rotateX: 20,
    transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] }
  },
};

/* ── Minimize slide-down variants ── */
const minimizeVariants: Variants = {
  open: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  },
  minimized: {
    opacity: 0, scale: 0.15, y: 160,
    transition: { duration: 0.35, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] }
  },
};

/* ══════════════════════════════════════════
   SERVICE CARD
══════════════════════════════════════════ */
function ServiceCard({
  service, onOpen, index,
}: { service: Service; onOpen: () => void; index: number }) {
  const [hovered, setHovered] = useState(false);
  const a = accentMap[service.accent];
  const Icon = service.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      whileHover={{ y: -6 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex flex-col gap-4 p-6 overflow-hidden cursor-pointer"
      style={{
        background: "var(--glass-bg)",
        border: `1px solid rgba(${a.rgb},${hovered ? "0.3" : "0.1"})`,
        borderLeft: `2px solid rgba(${a.rgb},${hovered ? "0.9" : "0.4"})`,
        clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
        boxShadow: hovered ? a.glow : "none",
        transition: "border-color 0.25s, box-shadow 0.25s",
      }}
      onClick={onOpen}
    >
      {/* Corner notch fill */}
      <div
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: 24, height: 24,
          background: `rgba(${a.rgb},0.1)`,
          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
        }}
      />

      {/* Scan line sweep on hover */}
      {hovered && (
        <motion.div
          className="absolute left-0 right-0 pointer-events-none"
          style={{ height: 1, background: `rgba(${a.rgb},0.35)`, zIndex: 2 }}
          initial={{ top: "0%" }}
          animate={{ top: "100%" }}
          transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}
        />
      )}

      {/* Launch arrow — top right on hover */}
      <div
        className="absolute top-4 right-5 transition-all duration-200"
        style={{
          color: a.hex,
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translate(0,0)" : "translate(4px,-4px)",
        }}
      >
        <IconArrowUpRight size={16} />
      </div>

      {/* Header row: icon + tag */}
      <div className="flex items-start justify-between">
        <div
          className="w-11 h-11 flex items-center justify-center"
          style={{
            background: a.bg,
            border: `1px solid rgba(${a.rgb},0.3)`,
            clipPath: "polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)",
            color: a.hex,
            boxShadow: hovered ? `0 0 14px rgba(${a.rgb},0.5)` : "none",
            transition: "box-shadow 0.25s",
          }}
        >
          <Icon size={20} stroke={1.8} />
        </div>

        {/* Port tag */}
        <div className="flex flex-col items-end gap-0.5">
          <span
            className="text-[9px] font-bold tracking-[0.18em] px-2 py-0.5"
            style={{
              background: a.bg,
              color: a.hex,
              border: `1px solid rgba(${a.rgb},0.3)`,
              clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            {service.tag}
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              color: `rgba(${a.rgb},0.45)`,
              letterSpacing: "0.08em",
            }}
          >
            :{service.port}
          </span>
        </div>
      </div>

      {/* Title + system */}
      <div className="flex flex-col gap-0.5">
        <h3
          className="text-xl font-extrabold tracking-wide"
          style={{ fontFamily: "var(--font-syne)", color: "var(--text-primary)", letterSpacing: "0.03em" }}
        >
          {service.label}
        </h3>
        <p className="text-xs font-medium" style={{ color: a.hex }}>{service.system}</p>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {service.description}
      </p>

      {/* CTA button */}
      <div className="mt-auto pt-2">
        <div
          onClick={onOpen}
          className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 cursor-pointer hover:brightness-110 active:scale-95 transition-all"
          style={{
            background: a.bg,
            color: a.hex,
            border: `1px solid rgba(${a.rgb},0.3)`,
            clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
            fontFamily: "var(--font-syne)",
            letterSpacing: "0.08em",
          }}
        >
          <IconExternalLink size={12} stroke={2} />
          OPEN {service.label.toUpperCase()}
        </div>
      </div>

      {/* Bottom accent bar */}
      <div className="flex items-center gap-2 mt-1">
        <div style={{ width: hovered ? 36 : 16, height: 2, background: a.hex, boxShadow: `0 0 8px ${a.hex}`, transition: "width 0.3s" }} />
        <div style={{ flex: 1, height: 1, background: `rgba(${a.rgb},0.08)` }} />
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   FLOATING WINDOW
══════════════════════════════════════════ */
function ServiceWindow({
  win, index, onClose, onMinimize, onFocus,
}: {
  win: WindowState; index: number;
  onClose: () => void; onMinimize: () => void; onFocus: () => void;
}) {
  const { service } = win;
  const a = accentMap[service.accent];
  const Icon = service.icon;
  const dragControls = useDragControls();
  const router = useRouter();

  const handlePointerDown = (e: React.PointerEvent) => {
    onFocus();
    dragControls.start(e);
  };

  const offsetX = (index % 3) * 30 - 30;
  const offsetY = (index % 3) * 24 - 24;

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{ left: -600, right: 600, top: -400, bottom: 400 }}
      variants={minimizeVariants}
      animate={win.minimized ? "minimized" : "open"}
      className="fixed pointer-events-auto select-none overflow-hidden"
      style={{
        width: 400,
        top: `calc(50% + ${offsetY}px)`,
        left: `calc(50% + ${offsetX}px)`,
        marginLeft: "-200px",
        marginTop: "-190px",
        zIndex: win.zIndex,
        background: "rgba(3,4,13,0.96)",
        border: `1px solid rgba(${a.rgb},0.35)`,
        borderLeft: `2px solid ${a.hex}`,
        clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
        backdropFilter: "blur(32px) saturate(200%)",
        WebkitBackdropFilter: "blur(32px) saturate(200%)",
        boxShadow: `${a.glow}, 0 32px 80px rgba(0,0,0,0.75)`,
      }}
    >
      {/* Top accent line */}
      <div style={{ height: 1, background: `linear-gradient(to right, ${a.hex}, transparent)` }} />

      {/* Title bar */}
      <div
        onPointerDown={handlePointerDown}
        className="flex items-center justify-between px-4 py-3 cursor-default"
        style={{ borderBottom: `1px solid rgba(${a.rgb},0.12)` }}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="w-8 h-8 flex items-center justify-center"
            style={{
              background: a.bg,
              border: `1px solid rgba(${a.rgb},0.3)`,
              clipPath: "polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)",
              color: a.hex,
            }}
          >
            <Icon size={15} stroke={1.8} />
          </div>
          <div>
            <p
              className="font-extrabold text-sm leading-tight tracking-wide"
              style={{ fontFamily: "var(--font-syne)", color: "var(--text-primary)", letterSpacing: "0.06em" }}
            >
              {service.label.toUpperCase()}
            </p>
            <p className="text-[10px]" style={{ color: a.hex, fontFamily: "monospace" }}>{service.system}</p>
          </div>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimize}
            className="w-7 h-7 flex items-center justify-center transition-colors duration-150"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}
            title="Minimise"
          >
            <IconMinus size={12} />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center transition-colors duration-150 hover:bg-red-500/20 hover:text-red-400"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}
            title="Close"
          >
            <IconX size={12} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-5 flex flex-col gap-4">
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {service.description}
        </p>

        {/* Endpoint row */}
        <div
          className="flex items-center gap-3 px-4 py-2.5 text-xs"
          style={{
            background: a.bg,
            border: `1px solid rgba(${a.rgb},0.25)`,
            color: a.hex,
            clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
            style={{ background: a.hex, boxShadow: `0 0 6px ${a.hex}` }}
          />
          <span className="font-bold flex-shrink-0" style={{ fontFamily: "var(--font-syne)", letterSpacing: "0.08em", fontSize: "10px" }}>
            ENDPOINT
          </span>
          <code className="font-mono opacity-75 truncate text-[11px]">{service.href}</code>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(service.href);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold cursor-pointer active:scale-95 transition-transform"
            style={{
              background: a.hex,
              color: "#020408",
              clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
              fontFamily: "var(--font-syne)",
              letterSpacing: "0.1em",
            }}
          >
            <IconExternalLink size={13} stroke={2.5} /> LAUNCH
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="px-4 py-2.5 text-xs font-bold cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--text-secondary)",
              clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
              fontFamily: "var(--font-syne)",
              letterSpacing: "0.08em",
            }}
          >
            HIDE
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   TASKBAR CHIP
══════════════════════════════════════════ */
function TaskbarChip({ win, onRestore, onClose }: { win: WindowState; onRestore: () => void; onClose: () => void }) {
  const a = accentMap[win.service.accent];
  const Icon = win.service.icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -40, scale: 0.8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:brightness-125 transition-all"
      style={{
        background: "rgba(3,4,13,0.95)",
        border: `1px solid rgba(${a.rgb},0.3)`,
        borderLeft: `2px solid ${a.hex}`,
        clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
        backdropFilter: "blur(20px)",
      }}
      onClick={onRestore}
    >
      <div style={{ color: a.hex }}><Icon size={13} stroke={2} /></div>
      <span
        className="text-[11px] font-bold tracking-wide"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne)", letterSpacing: "0.06em" }}
      >
        {win.service.label.toUpperCase()}
      </span>
      <button
        className="w-4 h-4 flex items-center justify-center hover:text-red-400 transition-colors ml-1"
        style={{ color: "var(--text-secondary)" }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <IconX size={10} />
      </button>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   MAIN SECTION
══════════════════════════════════════════ */
export default function ServicesSection() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const zCounter = useRef(9200);

  const openWindow = (service: Service) => {
    setWindows((prev) => {
      const existing = prev.find((w) => w.service.id === service.id);
      if (existing) {
        return prev.map((w) =>
          w.service.id === service.id ? { ...w, minimized: false, zIndex: ++zCounter.current } : w
        );
      }
      return [...prev, { service, minimized: false, zIndex: ++zCounter.current }];
    });
  };

  const closeWindow = (id: string) => setWindows((p) => p.filter((w) => w.service.id !== id));
  const minimizeWin = (id: string) => setWindows((p) => p.map((w) => w.service.id === id ? { ...w, minimized: true } : w));
  const restoreWin = (id: string) => setWindows((p) => p.map((w) => w.service.id === id ? { ...w, minimized: false, zIndex: ++zCounter.current } : w));
  const focusWindow = (id: string) => setWindows((p) => p.map((w) => w.service.id === id ? { ...w, zIndex: ++zCounter.current } : w));

  const minimizedWins = windows.filter((w) => w.minimized);
  const openWins = windows.filter((w) => !w.minimized);

  return (
    <section id="services" className="relative py-24 px-6 md:px-12 lg:px-24 overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "10%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 300,
          background: "radial-gradient(ellipse, rgba(0,245,255,0.04) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="text-center mb-16 relative z-10"
      >
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-3 mb-4">
          <div style={{ width: 24, height: "1px", background: "rgba(0,245,255,0.4)" }} />
          <span
            className="text-[10px] font-semibold tracking-[0.2em] uppercase"
            style={{ fontFamily: "var(--font-dm-sans)", color: "var(--eyebrow-color)" }}
          >
            QUICK ACCESS
          </span>
          <div style={{ width: 24, height: "1px", background: "rgba(0,245,255,0.4)" }} />
        </div>

        <h2
          className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight"
          style={{ fontFamily: "var(--font-syne)", color: "var(--section-heading-color)" }}
        >
          YOUR{" "}
          <span
            className="bg-gradient-to-r from-[#00f5ff] to-[#00c8ff] bg-clip-text text-transparent gradient-heading"
          >
            SPARK
          </span>{" "}
          STACK
        </h2>

        <p className="mt-4 text-sm max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          Click any card to open it as a floating window. Open multiple at once, drag
          them around, minimise to the taskbar.
        </p>

        {/* Decorative separator */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <div style={{ width: 40, height: "1px", background: "rgba(0,245,255,0.2)" }} />
          <IconTerminal2 size={11} style={{ color: "rgba(0,245,255,0.45)" }} />
          <div style={{ width: 40, height: "1px", background: "rgba(0,245,255,0.2)" }} />
        </div>
      </motion.div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto relative z-10">
        {services.map((s, i) => (
          <ServiceCard key={s.id} service={s} index={i} onOpen={() => openWindow(s)} />
        ))}
      </div>

      {/* Floating windows */}
      <AnimatePresence>
        {openWins.map((win, i) => (
          <motion.div key={win.service.id} variants={windowVariants} initial="hidden" animate="visible" exit="exit">
            <ServiceWindow
              win={win}
              index={i}
              onClose={() => closeWindow(win.service.id)}
              onMinimize={() => minimizeWin(win.service.id)}
              onFocus={() => focusWindow(win.service.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Taskbar */}
      <AnimatePresence>
        {minimizedWins.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9300] flex items-center gap-2 px-4 py-2.5"
            style={{
              background: "rgba(3,4,13,0.92)",
              border: "1px solid rgba(0,245,255,0.15)",
              borderTop: "1px solid rgba(0,245,255,0.35)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 20px rgba(0,245,255,0.08)",
              clipPath: "polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% 100%, 0% 100%, 0% 8px)",
            }}
          >
            <span
              className="text-[9px] font-bold tracking-[0.18em] mr-1"
              style={{ color: "rgba(0,245,255,0.4)", fontFamily: "var(--font-dm-sans)" }}
            >
              MINIMISED
            </span>
            <div style={{ width: 1, height: 16, background: "rgba(0,245,255,0.15)", marginRight: 4 }} />
            <AnimatePresence>
              {minimizedWins.map((win) => (
                <TaskbarChip
                  key={win.service.id}
                  win={win}
                  onRestore={() => restoreWin(win.service.id)}
                  onClose={() => closeWindow(win.service.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
