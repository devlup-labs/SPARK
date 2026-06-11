"use client";

import { motion } from "framer-motion";
import { ExternalLink, LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export interface ServiceCardProps {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  category: string;
  port: string;
  accentColor: string;
  href: string;
  isExternal?: boolean;
}

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  hover: { y: -4, transition: { duration: 0.2 } },
};

const ServiceCard = ({
  title,
  subtitle,
  description,
  icon: Icon,
  category,
  port,
  accentColor,
  href,
  isExternal = false,
}: ServiceCardProps) => {
  const router = useRouter();

  // Real-time ping and status state
  const [ping, setPing] = useState(0);
  const [status, setStatus] = useState<"online" | "offline" | "checking">("checking");

  useEffect(() => {
    let isActive = true;

    const checkPing = async () => {
      try {
        const cleanPort = port.replace(":", "");
        const res = await fetch(`/api/ping?port=${cleanPort}`);
        const data = await res.json();
        if (isActive) {
          if (data.status === "online") {
            setPing(data.ping);
            setStatus("online");
          } else {
            setPing(0);
            setStatus("offline");
          }
        }
      } catch (err) {
        if (isActive) {
          setPing(0);
          setStatus("offline");
        }
      }
    };

    // Initial check
    checkPing();

    // Recheck every 10 seconds
    const updateInterval = setInterval(checkPing, 10000);

    return () => {
      isActive = false;
      clearInterval(updateInterval);
    };
  }, [port]);

  const handleClick = () => {
    if (isExternal) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      router.push(href);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      onClick={handleClick}
      className="relative group h-full cursor-pointer"
    >
      {/* Glass Card */}
      <div className="h-full bg-[#0a0f1a]/80 backdrop-blur-xl border border-white/8 rounded-xl p-6 flex flex-col transition-all duration-300 hover:border-white/15 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] overflow-hidden">
        {/* Top Row: Icon + Category Badge */}
        <div className="flex items-start justify-between mb-5">
          {/* Icon Container */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              backgroundColor: `${accentColor}15`,
              border: `1px solid ${accentColor}30`,
              boxShadow: `0 0 20px ${accentColor}10`,
            }}
          >
            <Icon size={22} style={{ color: accentColor }} strokeWidth={1.5} />
          </div>

          {/* Category Badge */}
          <div className="flex flex-col items-end gap-1.5">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-md mb-0.5"
              style={{
                color: accentColor,
                backgroundColor: `${accentColor}15`,
                border: `1px solid ${accentColor}25`,
              }}
            >
              {category}
            </span>

            {/* Live Status Container */}
            <div className={`flex items-center gap-2 px-2 py-1 rounded border backdrop-blur-md ${status === 'online' ? 'bg-emerald-500/10 border-emerald-500/20' : status === 'offline' ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/5'}`}>
              <span className="relative flex h-2 w-2">
                {status === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'online' ? 'bg-emerald-500' : status === 'offline' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
              </span>
              <span className={`text-[10px] font-mono tracking-wider ${status === 'online' ? 'text-emerald-400/90' : status === 'offline' ? 'text-red-400/90' : 'text-gray-400'}`}>
                {status === 'online' ? `${ping}ms` : status === 'offline' ? 'ERR Out' : 'Checking'}
              </span>
            </div>

            <span className="text-[9px] font-mono text-white/30 tracking-wider">
              PORT {port}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-syne text-xl font-bold text-white/90 mb-1 tracking-tight">
          {title}
        </h3>

        {/* Subtitle */}
        <p
          className="text-xs font-medium mb-3"
          style={{ color: accentColor }}
        >
          {subtitle}
        </p>

        {/* Description */}
        <p className="text-sm text-white/40 leading-relaxed grow mb-5">
          {description}
        </p>

        {/* Action Label */}
        <span
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 w-fit group/btn"
          style={{
            color: accentColor,
            backgroundColor: `${accentColor}10`,
            border: `1px solid ${accentColor}30`,
          }}
        >
          <ExternalLink size={14} className="transition-transform group-hover:rotate-12" />
          Open {title}
        </span>

        {/* Bottom Accent Line */}
        <div
          className="absolute bottom-0 left-6 right-auto w-8 h-0.75 rounded-full transition-all duration-500 group-hover:w-16"
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        />

        {/* Hover Glow Effect */}
        <div
          className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${accentColor}08, transparent 40%)`,
          }}
        />
      </div>
    </motion.div>
  );
};

export default ServiceCard;
