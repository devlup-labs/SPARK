"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion, AnimatePresence,
  useMotionValue, useSpring, useTransform, useScroll,
} from "framer-motion";
import Link from "next/link";
import ContactPanel from "./ContactPanel";

const navLinks = [
  { label: "Home",     href: "#home"     },
  { label: "Features", href: "#features" },
  { label: "Services", href: "#services" },
];

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
interface SparkData {
  id: number; x: number; y: number;
  angle: number; speed: number; life: number; size: number;
}

/* ══════════════════════════════════════════
   SPARK PARTICLE — elongated ember streak
══════════════════════════════════════════ */
function SparkParticle({ s, onDone }: { s: SparkData; onDone: (id: number) => void }) {
  const tx = Math.cos(s.angle) * s.speed;
  const ty = Math.sin(s.angle) * s.speed;
  return (
    <motion.span
      initial={{ opacity: 1, x: 0, y: 0, scaleX: 1 }}
      animate={{ opacity: 0, x: tx, y: ty, scaleX: 0.08 }}
      transition={{ duration: s.life / 1000, ease: [0.2, 0, 1, 1] as [number,number,number,number] }}
      onAnimationComplete={() => onDone(s.id)}
      aria-hidden
      style={{
        position: "fixed", left: s.x, top: s.y,
        width: s.size * 5, height: s.size * 0.8,
        borderRadius: "50%",
        background: "linear-gradient(90deg, #ffffff 0%, #00f5ff 60%, transparent 100%)",
        boxShadow: "0 0 5px #00f5ffcc",
        pointerEvents: "none", zIndex: 9999,
        transform: `rotate(${(s.angle * 180) / Math.PI}deg)`,
        transformOrigin: "left center",
        translateX: "-50%", translateY: "-50%",
      }}
    />
  );
}

/* ══════════════════════════════════════════
   ELECTRIC ARC — jittery SVG lightning
══════════════════════════════════════════ */
function ElectricArc({ active }: { active: boolean }) {
  const [path, setPath] = useState("");
  useEffect(() => {
    if (!active) { setPath(""); return; }
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const segs = 9; const w = 48; const amp = 4;
      const pts = Array.from({ length: segs + 1 }, (_, i) => {
        const x = (i / segs) * w;
        const y = i === 0 || i === segs ? 0 : (Math.random() - 0.5) * amp * 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      setPath(`M ${pts.join(" L ")}`);
      t = setTimeout(tick, 35 + Math.random() * 35);
    };
    tick();
    return () => clearTimeout(t);
  }, [active]);

  if (!active || !path) return null;
  return (
    <svg aria-hidden width={52} height={8} viewBox="0 -4 52 8"
      style={{ position:"absolute", left:"100%", top:"50%", overflow:"visible",
               pointerEvents:"none", transform:"translateY(-50%)", marginLeft:3 }}>
      <path d={path} fill="none" stroke="#00f5ff" strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ filter:"drop-shadow(0 0 4px #00f5ff)" }} />
      <path d={path} fill="none" stroke="white" strokeWidth="0.5"
        strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
    </svg>
  );
}

/* ══════════════════════════════════════════
   HUD CORNER BRACKETS — gaming overlay
══════════════════════════════════════════ */
function HudCorners({ visible }: { visible: boolean }) {
  const corners = [
    { pos: "top-1 left-3",    clipPath: "inset(0 50% 50% 0)" },
    { pos: "top-1 right-3",   clipPath: "inset(0 0 50% 50%)" },
    { pos: "bottom-1 left-3", clipPath: "inset(50% 50% 0 0)"  },
    { pos: "bottom-1 right-3",clipPath: "inset(50% 0 0 50%)"  },
  ];
  return (
    <>
      {corners.map((c, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.6 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
          className={`absolute ${c.pos} pointer-events-none`}
          style={{ width: 12, height: 12 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d={i === 0 ? "M1 6 L1 1 L6 1" :
                 i === 1 ? "M6 1 L11 1 L11 6" :
                 i === 2 ? "M1 6 L1 11 L6 11" :
                            "M6 11 L11 11 L11 6"}
              stroke="#00f5ff" strokeWidth="1.2" strokeLinecap="square"
              style={{ filter: "drop-shadow(0 0 3px #00f5ff)" }}
            />
          </svg>
        </motion.span>
      ))}
    </>
  );
}

/* ══════════════════════════════════════════
   SCAN LINE — sweeps across header while scrolled
══════════════════════════════════════════ */
function ScanLine({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.span
          key="scan"
          aria-hidden
          initial={{ x: "-100%", opacity: 0.6 }}
          animate={{ x: "120%", opacity: [0.6, 0.9, 0.6] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: "linear", repeat: Infinity, repeatDelay: 3.5 }}
          style={{
            position: "absolute", top: 0, left: 0,
            width: "30%", height: "100%",
            background: "linear-gradient(90deg, transparent 0%, rgba(0,245,255,0.04) 40%, rgba(0,245,255,0.09) 50%, rgba(0,245,255,0.04) 60%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════
   NAV LINK
══════════════════════════════════════════ */
function NavLink({ label, href, compact }: { label: string; href: string; compact: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative flex flex-col items-center select-none"
      style={{
        color: hov ? "#ffffff" : "rgba(255,255,255,0.42)",
        transition: "color 0.18s",
        fontSize: compact ? 10 : 11,
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      }}
    >
      {label}
      {/* Cyan underline — scale from centre */}
      <motion.span
        animate={{ scaleX: hov ? 1 : 0, opacity: hov ? 1 : 0 }}
        transition={{ duration: 0.18, ease: [0.22,1,0.36,1] as [number,number,number,number] }}
        style={{
          position:"absolute", bottom:-3, left:0, right:0, height:1,
          background:"linear-gradient(90deg,transparent,#00f5ff 35%,#00f5ff 65%,transparent)",
          transformOrigin:"center", boxShadow:"0 0 7px rgba(0,245,255,0.9)",
        }}
      />
      {/* Micro sparks */}
      <AnimatePresence>
        {hov && (
          <>
            {[-12, 12].map((dx, idx) => (
              <motion.span key={idx}
                initial={{ x:0, y:0, opacity:1, scale:1 }}
                animate={{ x:dx, y:-4, opacity:0, scale:0 }}
                transition={{ duration:0.32, ease:"easeOut" }}
                style={{
                  position:"absolute", bottom:-2, left:"50%",
                  width:2.5, height:2.5, borderRadius:"50%",
                  background:"#00f5ff", boxShadow:"0 0 5px #00f5ff",
                  pointerEvents:"none",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </Link>
  );
}

/* ══════════════════════════════════════════
   SCROLL DIRECTION INDICATOR — thin side pill
══════════════════════════════════════════ */
function ScrollPulse({ dir }: { dir: "up" | "down" | null }) {
  return (
    <AnimatePresence>
      {dir && (
        <motion.span
          key={dir}
          initial={{ opacity:0, scaleY:0 }}
          animate={{ opacity:1, scaleY:1 }}
          exit={{   opacity:0, scaleY:0 }}
          transition={{ duration:0.25 }}
          aria-hidden
          style={{
            position:"absolute", right:0, top:"15%", bottom:"15%",
            width:2, borderRadius:4,
            background: dir === "up"
              ? "linear-gradient(to top, transparent, #00f5ff, transparent)"
              : "linear-gradient(to bottom, transparent, #00f5ff, transparent)",
            boxShadow:"0 0 8px #00f5ff88",
            transformOrigin: dir === "up" ? "bottom" : "top",
          }}
        />
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════
   MAIN NAVBAR
══════════════════════════════════════════ */
export default function Navbar() {
  const [panelOpen,  setPanelOpen]  = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [scrollDir,  setScrollDir]  = useState<"up"|"down"|null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoHover,  setLogoHover]  = useState(false);
  const [ctaHover,   setCtaHover]   = useState(false);
  const [sparks,     setSparks]     = useState<SparkData[]>([]);

  const sparkId    = useRef(0);
  const headerRef  = useRef<HTMLElement>(null);
  const lastY      = useRef(0);
  const scrollDirTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Mouse spotlight */
  const mouseX  = useMotionValue(0);
  const mouseY  = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 100, damping: 18 });
  const smoothY = useSpring(mouseY, { stiffness: 100, damping: 18 });

  /* Page scroll progress — spring the number then transform to % string */
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  const progressWidth  = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  /* Shrink values driven by spring — 0=top, 1=scrolled */
  const rawScroll = useMotionValue(0);
  const springScroll = useSpring(rawScroll, { stiffness: 160, damping: 26 });

  /* Derived animated values */
  const headerHeight  = useTransform(springScroll, [0, 1], [72, 52]);
  const logoPx        = useTransform(springScroll, [0, 1], [22, 17]);
  const navGap        = useTransform(springScroll, [0, 1], [40, 28]);
  const ctaPadX       = useTransform(springScroll, [0, 1], [20, 12]);
  const ctaPadY       = useTransform(springScroll, [0, 1], [10, 6]);
  const headerPadX    = useTransform(springScroll, [0, 1], [48, 32]);

  /* ── Scroll behaviour ── */
  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      const dy = y - lastY.current;
      const isScrolled = y > 10;
      setScrolled(isScrolled);
      rawScroll.set(isScrolled ? 1 : 0);

      /* Direction pulse indicator */
      if (Math.abs(dy) > 2) {
        setScrollDir(dy > 0 ? "down" : "up");
        if (scrollDirTimer.current) clearTimeout(scrollDirTimer.current);
        scrollDirTimer.current = setTimeout(() => setScrollDir(null), 600);
      }

      lastY.current = y;
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [rawScroll]);

  /* ── Mouse tracking ── */
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const r = headerRef.current?.getBoundingClientRect();
    if (!r) return;
    mouseX.set(e.clientX - r.left);
    mouseY.set(e.clientY - r.top);
  }, [mouseX, mouseY]);

  /* ── Spark burst ── */
  const burst = useCallback((cx: number, cy: number, count = 18) => {
    setSparks((prev) => [
      ...prev,
      ...Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        return {
          id: ++sparkId.current,
          x: cx, y: cy, angle,
          speed: 30 + Math.random() * 55,
          life:  280 + Math.random() * 300,
          size:  1.4 + Math.random() * 2.2,
        };
      }),
    ]);
  }, []);

  const killSpark = useCallback((id: number) =>
    setSparks((p) => p.filter((s) => s.id !== id)), []);

  return (
    <>
      {/* Spark particles */}
      <AnimatePresence>
        {sparks.map((s) => <SparkParticle key={s.id} s={s} onDone={killSpark} />)}
      </AnimatePresence>

      <motion.header
        ref={headerRef}
        onMouseMove={onMouseMove}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.38, ease: [0.76,0,0.24,1] as [number,number,number,number] }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between overflow-hidden"
        style={{
          height: headerHeight,
          paddingLeft: headerPadX,
          paddingRight: headerPadX,
          background: scrolled ? "rgba(4,4,12,0.96)" : "rgba(4,4,12,0.5)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(22px) saturate(200%)",
          WebkitBackdropFilter: "blur(22px) saturate(200%)",
          boxShadow: scrolled
            ? "0 2px 48px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(0,245,255,0.12)"
            : "none",
          transition: "background 0.3s, box-shadow 0.3s",
        }}
      >
        {/* ── Scroll-progress bar (thicker glow when scrolled) ── */}
        <motion.span
          aria-hidden
          style={{
            position:"absolute", top:0, left:0,
            height: scrolled ? 2 : 1.5,
            width: progressWidth,
            background:"linear-gradient(90deg, #00f5ff 0%, rgba(0,245,255,0.4) 80%, transparent 100%)",
            boxShadow: scrolled ? "0 0 12px #00f5ff, 0 0 24px rgba(0,245,255,0.5)" : "0 0 6px #00f5ff88",
            transition: "height 0.3s, box-shadow 0.3s",
          }}
        />

        {/* ── Progress bar tip spark ── */}
        <motion.span
          aria-hidden
          style={{
            position: "absolute", top: 0,
            left: progressWidth,
            width: 4, height: scrolled ? 2 : 1.5,
            background: "#ffffff",
            boxShadow: "0 0 6px #ffffff, 0 0 12px #00f5ff",
            transform: "translateX(-50%)",
          }}
        />

        {/* ── HUD gaming corners (appear on scroll) ── */}
        <HudCorners visible={scrolled} />

        {/* ── Scan-line sweep ── */}
        <ScanLine active={scrolled} />

        {/* ── Scroll direction side pulse ── */}
        <ScrollPulse dir={scrollDir} />

        {/* ── Mouse spotlight ── */}
        <motion.span
          aria-hidden
          style={{
            position:"absolute", width:300, height:300, borderRadius:"50%",
            background:"radial-gradient(circle, rgba(0,245,255,0.045) 0%, transparent 68%)",
            pointerEvents:"none",
            x: smoothX, y: smoothY,
            translateX:"-50%", translateY:"-50%",
            zIndex: 0,
          }}
        />

        {/* ── Bottom border — glows brighter when scrolled ── */}
        <motion.span
          aria-hidden
          animate={{
            opacity: scrolled ? 1 : 0.3,
            background: scrolled
              ? "linear-gradient(90deg,transparent 0%,rgba(0,245,255,0.55) 50%,transparent 100%)"
              : "rgba(255,255,255,0.06)",
          }}
          transition={{ duration: 0.4 }}
          style={{ position:"absolute", bottom:0, left:0, right:0, height:1 }}
        />

        {/* ════════ LOGO ════════ */}
        <Link
          href="#home"
          className="relative flex items-center gap-3 select-none"
          style={{ zIndex: 2 }}
          onMouseEnter={() => setLogoHover(true)}
          onMouseLeave={() => setLogoHover(false)}
          onClick={(e) => {
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            burst(r.left + r.width / 2, r.top + r.height / 2, 24);
          }}
        >
          {/* Wordmark — shrinks with scroll */}
          <motion.span
            animate={logoHover
              ? { letterSpacing:"0.13em", opacity:1 }
              : { letterSpacing:"0.06em", opacity:0.88 }}
            transition={{ duration:0.22 }}
            style={{
              fontFamily:"var(--font-syne)", fontWeight:800,
              fontSize: logoPx, color:"#ffffff", lineHeight:1,
              textShadow: logoHover
                ? "0 0 20px rgba(0,245,255,0.6), 0 0 50px rgba(0,245,255,0.18)"
                : "0 0 8px rgba(0,245,255,0.15)",
              transition:"text-shadow 0.25s",
            }}
          >
            SPARK
          </motion.span>

          {/* Lightning arc */}
          <ElectricArc active={logoHover} />

          {/* Glowing dot — shrinks with scroll */}
          <motion.span
            animate={logoHover
              ? { scale:[1,2,1.4], opacity:1 }
              : { scale:1, opacity:0.6 }}
            transition={{ duration:0.38, ease:"easeOut" }}
            style={{
              width: scrolled ? 5 : 7,
              height: scrolled ? 5 : 7,
              borderRadius:"50%", flexShrink:0,
              background:"#00f5ff",
              boxShadow: logoHover
                ? "0 0 12px #00f5ff, 0 0 32px rgba(0,245,255,0.7)"
                : "0 0 4px #00f5ff44",
              transition: "width 0.3s, height 0.3s",
            }}
          />
        </Link>

        {/* ════════ NAV LINKS ════════ */}
        <motion.nav
          className="hidden md:flex items-center"
          style={{ gap: navGap, zIndex: 2 }}
        >
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} compact={scrolled} />
          ))}
        </motion.nav>

        {/* ════════ RIGHT ════════ */}
        <div className="flex items-center gap-3" style={{ zIndex: 2 }}>
          {/* ── CTA — shrinks with scroll ── */}
          <motion.button
            onHoverStart={() => setCtaHover(true)}
            onHoverEnd={()   => setCtaHover(false)}
            whileHover={{ scale:1.04 }}
            whileTap={{   scale:0.95 }}
            onClick={(e) => {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              burst(r.left + r.width / 2, r.top + r.height / 2, 22);
              setPanelOpen(true);
            }}
            className="relative hidden md:flex items-center gap-2 rounded-xl text-[12px] font-bold tracking-widest uppercase cursor-pointer overflow-hidden"
            style={{
              paddingLeft: ctaPadX, paddingRight: ctaPadX,
              paddingTop: ctaPadY, paddingBottom: ctaPadY,
              background:  "transparent",
              border:      `1px solid ${ctaHover ? "rgba(0,245,255,0.6)" : "rgba(255,255,255,0.15)"}`,
              color:       "#ffffff",
              fontFamily:  "var(--font-syne)",
              boxShadow:   ctaHover
                ? "0 0 20px rgba(0,245,255,0.22), inset 0 0 20px rgba(0,245,255,0.05)"
                : "none",
              transition:  "border-color 0.2s, box-shadow 0.2s",
            }}
          >
            {/* Shimmer sweep */}
            {ctaHover && (
              <motion.span aria-hidden
                initial={{ x:"-120%" }}
                animate={{ x:"220%" }}
                transition={{ duration:0.48, ease:"linear", repeat:Infinity, repeatDelay:0.12 }}
                style={{
                  position:"absolute", top:0, left:0,
                  width:"55%", height:"100%",
                  background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)",
                  pointerEvents:"none",
                }}
              />
            )}
            {/* Star icon — hidden when compact */}
            {!scrolled && (
              <motion.svg aria-hidden width={12} height={12} viewBox="0 0 12 12" fill="none"
                animate={ctaHover ? { rotate:[0,20,-8,0], scale:1.25 } : { rotate:0, scale:1 }}
                transition={{ duration:0.38 }}>
                <path d="M6 0 L7.2 4.8 L12 6 L7.2 7.2 L6 12 L4.8 7.2 L0 6 L4.8 4.8 Z"
                  fill={ctaHover ? "#00f5ff" : "rgba(255,255,255,0.55)"}
                  style={{ transition:"fill 0.2s" }} />
              </motion.svg>
            )}
            {scrolled ? "Talk" : "Let\u2019s Talk"}
          </motion.button>

          {/* Mobile hamburger */}
          <button className="md:hidden flex flex-col gap-[5px] p-2"
            onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
            {[0,1,2].map((i) => (
              <motion.span key={i}
                animate={{
                  rotate:  mobileOpen && i===0 ? 45 : mobileOpen && i===2 ? -45 : 0,
                  y:       mobileOpen && i===0 ? 7  : mobileOpen && i===2 ? -7  : 0,
                  opacity: mobileOpen && i===1 ? 0  : 1,
                  width:   i===1 ? (mobileOpen ? 20 : 14) : 20,
                }}
                transition={{ duration:0.22 }}
                style={{ display:"block", height:2, background:"#ffffff", borderRadius:2, transformOrigin:"center" }}
              />
            ))}
          </button>
        </div>
      </motion.header>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity:0, y:-10 }}
            animate={{ opacity:1, y:0 }}
            exit={{    opacity:0, y:-10 }}
            transition={{ duration:0.22, ease:[0.22,1,0.36,1] as [number,number,number,number] }}
            className="fixed top-[72px] left-0 right-0 z-40 flex flex-col px-6 py-4 md:hidden"
            style={{
              background:"rgba(4,4,12,0.97)",
              borderBottom:"1px solid rgba(0,245,255,0.12)",
              backdropFilter:"blur(24px)",
            }}
          >
            {navLinks.map((link, i) => (
              <motion.div key={link.href}
                initial={{ opacity:0, x:-14 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay:i*0.05 }}
              >
                <Link href={link.href} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-4 py-3.5 text-sm font-semibold tracking-widest uppercase border-b"
                  style={{ color:"rgba(255,255,255,0.58)", borderColor:"rgba(255,255,255,0.06)" }}
                >
                  <span className="text-[10px] font-mono" style={{ color:"#00f5ff", opacity:0.65 }}>0{i+1}</span>
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <motion.button
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:navLinks.length*0.05 }}
              onClick={() => { setMobileOpen(false); setPanelOpen(true); }}
              className="mt-4 w-full py-3 rounded-xl text-sm font-bold tracking-widest uppercase"
              style={{
                background:"rgba(255,255,255,0.03)",
                border:"1px solid rgba(0,245,255,0.32)",
                color:"#ffffff", fontFamily:"var(--font-syne)",
              }}
            >
              Let&apos;s Talk
            </motion.button>
          </motion.nav>
        )}
      </AnimatePresence>

      <ContactPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
}
