"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  IconDeviceDesktop,
  IconDatabase,
  IconPlayerPlay,
  IconShieldLock,
  IconChartBar,
  IconWorldWww,
} from "@tabler/icons-react";
import Link from "next/link";

type AccentColor = "cyan" | "orange" | "red";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: AccentColor;
  tag: string;
  href: string;
}

const accentVars: Record<AccentColor, {
  color: string;
  rgb: string;
  iconFrom: string;
  iconTo: string;
  hoverShadow: string;
}> = {
  cyan: {
    color: "#00f5ff",
    rgb: "0,245,255",
    iconFrom: "rgba(0,245,255,0.12)",
    iconTo: "rgba(0,245,255,0.04)",
    hoverShadow: "0 0 28px rgba(0,245,255,0.35), inset 0 0 28px rgba(0,245,255,0.04)",
  },
  orange: {
    color: "#ff6a00",
    rgb: "255,106,0",
    iconFrom: "rgba(255,106,0,0.12)",
    iconTo: "rgba(255,106,0,0.04)",
    hoverShadow: "0 0 28px rgba(255,106,0,0.35), inset 0 0 28px rgba(255,106,0,0.04)",
  },
  red: {
    color: "#ff2020",
    rgb: "255,32,32",
    iconFrom: "rgba(255,32,32,0.12)",
    iconTo: "rgba(255,32,32,0.04)",
    hoverShadow: "0 0 28px rgba(255,32,32,0.35), inset 0 0 28px rgba(255,32,32,0.04)",
  },
};

const features: Feature[] = [
  {
    icon: <IconDeviceDesktop size={26} />,
    title: "Device Manager",
    description:
      "Monitor and manage connected devices across the SPARK ecosystem with centralized control, system health tracking, and remote administration powered by CasaOS.",
    accent: "cyan",
    tag: "SYS.01",
    href: "/devices",
  },
  {
    icon: <IconDatabase size={26} />,
    title: "NAS Functionality",
    description:
      "A self-hosted cloud storage system enabling secure file access, synchronization, and sharing through a centralized DATA filesystem architecture.",
    accent: "orange",
    tag: "SYS.02",
    href: "/cloud",
  },
  {
    icon: <IconPlayerPlay size={26} />,
    title: "Media Streaming",
    description:
      "Stream music, videos, and personal media seamlessly across devices, transforming SPARK into a private entertainment platform accessible worldwide.",
    accent: "red",
    tag: "SYS.03",
    href: "/media",
  },
  {
    icon: <IconShieldLock size={26} />,
    title: "Authentication & Access",
    description:
      "Role-based access control ensures secure collaboration between admins, developers, maintainers, and users while protecting services through authentication layers.",
    accent: "cyan",
    tag: "SYS.04",
    href: "/admin",
  },
  {
    icon: <IconChartBar size={26} />,
    title: "System Analytics",
    description:
      "Real-time monitoring of server performance, network activity, and service health to maintain uptime and optimize infrastructure efficiency.",
    accent: "orange",
    tag: "SYS.05",
    href: "/analytics",
  },
  {
    icon: <IconWorldWww size={26} />,
    title: "Secure Remote Access",
    description:
      "Cloudflare Tunnel and reverse proxy architecture provide encrypted remote connectivity without exposing ports, ensuring secure global access.",
    accent: "red",
    tag: "SYS.06",
    href: "/services",
  },
];

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 0.61, 0.36, 1] } },
};

/* ── Single feature card ── */
function FeatureCard({ feature }: { feature: Feature }) {
  const [hovered, setHovered] = useState(false);
  const a = accentVars[feature.accent];

  return (
    <Link href={feature.href} className="block">
      <motion.div
        variants={cardVariants}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="relative p-7 overflow-hidden group cursor-pointer h-full"
        style={{
          background: "var(--glass-bg)",
          border: `1px solid rgba(${a.rgb},${hovered ? "0.3" : "0.1"})`,
          borderLeft: `2px solid rgba(${a.rgb},${hovered ? "0.8" : "0.35"})`,
          boxShadow: hovered ? a.hoverShadow : "none",
          transition: "border-color 0.25s, box-shadow 0.25s",
          clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
        }}
      >
        {/* Corner notch accent */}
        <div
          className="absolute top-0 right-0 pointer-events-none"
          style={{
            width: 24, height: 24,
            background: `rgba(${a.rgb},0.12)`,
            clipPath: "polygon(100% 0, 0 0, 100% 100%)",
          }}
        />

        {/* Scan line on hover */}
        {hovered && (
          <motion.div
            className="absolute left-0 right-0 pointer-events-none"
            style={{ height: 1, background: `rgba(${a.rgb},0.3)` }}
            initial={{ top: "0%" }}
            animate={{ top: "100%" }}
            transition={{ duration: 1.4, ease: "linear", repeat: Infinity }}
          />
        )}

        {/* Tag */}
        <div
          className="absolute top-4 right-6 text-[9px] tracking-widest"
          style={{ color: `rgba(${a.rgb},0.45)`, fontFamily: "var(--font-dm-sans)", letterSpacing: "0.14em" }}
        >
          {feature.tag}
        </div>

        {/* Icon — clipped hex container */}
        <div
          className="w-12 h-12 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${a.iconFrom}, ${a.iconTo})`,
            border: `1px solid rgba(${a.rgb},0.3)`,
            clipPath: "polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)",
            color: a.color,
            boxShadow: hovered ? `0 0 16px rgba(${a.rgb},0.4)` : "none",
            transition: "box-shadow 0.25s",
          }}
        >
          {feature.icon}
        </div>

        {/* Title */}
        <h3
          className="text-base font-bold mt-5 tracking-wide"
          style={{ fontFamily: "var(--font-syne)", color: "var(--text-primary)", letterSpacing: "0.04em" }}
        >
          {feature.title}
        </h3>

        {/* Description */}
        <p
          className="text-[13px] leading-relaxed mt-2"
          style={{ fontFamily: "var(--font-dm-sans)", color: "var(--text-secondary)" }}
        >
          {feature.description}
        </p>

        {/* Bottom accent bar */}
        <div className="mt-5 flex items-center gap-2">
          <div
            style={{
              width: hovered ? "48px" : "24px",
              height: "2px",
              background: a.color,
              boxShadow: `0 0 8px ${a.color}`,
              transition: "width 0.3s ease",
            }}
          />
          <div
            style={{ flex: 1, height: "1px", background: `rgba(${a.rgb},0.1)` }}
          />
        </div>
      </motion.div>
    </Link>
  );
}

export default function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <section id="features" className="py-32 px-6 md:px-12 lg:px-24 relative overflow-hidden">
      {/* Section ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "20%", left: "50%", transform: "translateX(-50%)",
          width: 600, height: 300,
          background: "radial-gradient(ellipse, rgba(0,245,255,0.04) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.55 }}
          className="text-center mb-16"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-3 mb-4">
            <div style={{ width: 24, height: "1px", background: "rgba(0,245,255,0.4)" }} />
            <span
              className="text-[10px] font-semibold tracking-[0.2em] uppercase"
              style={{ fontFamily: "var(--font-dm-sans)", color: "var(--eyebrow-color)" }}
            >
              SYSTEM MODULES
            </span>
            <div style={{ width: 24, height: "1px", background: "rgba(0,245,255,0.4)" }} />
          </div>

          <h2
            className="text-4xl md:text-5xl font-extrabold mt-2 tracking-tight"
            style={{ fontFamily: "var(--font-syne)", color: "var(--section-heading-color)" }}
          >
            SPARK CORE &amp;{" "}
            <span
              className="bg-gradient-to-r from-[#00f5ff] to-[#00c8ff] bg-clip-text text-transparent gradient-heading"
            >
              CAPABILITIES
            </span>
          </h2>

          <p
            className="mt-4 max-w-md mx-auto text-sm"
            style={{ fontFamily: "var(--font-dm-sans)", color: "var(--text-secondary)" }}
          >
            A high-performance homelab orchestration layer delivering complete data control and self-hosted reliability.
          </p>

          {/* Decorative separator */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <div style={{ width: 40, height: "1px", background: "rgba(0,245,255,0.2)" }} />
            <div style={{ width: 5, height: 5, background: "#00f5ff", transform: "rotate(45deg)", boxShadow: "0 0 8px #00f5ff" }} />
            <div style={{ width: 40, height: "1px", background: "rgba(0,245,255,0.2)" }} />
          </div>
        </motion.div>

        {/* Card grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
