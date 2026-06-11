"use client";

import { motion } from "framer-motion";
import { IconSun, IconMoon, IconMinimize } from "@tabler/icons-react";
import { useTheme, type Theme } from "./ThemeProvider";

const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: "dark", icon: <IconMoon size={14} />, label: "Dark" },
  { value: "light", icon: <IconSun size={14} />, label: "Light" },
  { value: "minimalist", icon: <IconMinimize size={14} />, label: "Minimal" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex items-center rounded-xl p-1 gap-0.5"
      style={{
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {options.map((opt) => {
        const isActive = theme === opt.value;
        return (
          <motion.button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            whileTap={{ scale: 0.92 }}
            title={opt.label}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors duration-200"
            style={{
              color: isActive ? "var(--accent-text)" : "#8888aa",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            {isActive && (
              <motion.span
                layoutId="theme-pill"
                className="absolute inset-0 rounded-lg"
                style={{ background: "var(--pill-bg)" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{opt.icon}</span>
            <span className="relative z-10 hidden sm:inline">{opt.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
