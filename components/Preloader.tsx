"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── One animated "spark" particle ── */
function SparkParticle({ angle, delay }: { angle: number; delay: number }) {
  const rad = (angle * Math.PI) / 180;
  const tx = Math.cos(rad) * 80;
  const ty = Math.sin(rad) * 80;

  return (
    <motion.div
      initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], x: tx, y: ty, scale: [0, 1.4, 0] }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className="absolute w-1.5 h-1.5 rounded-full"
      style={{
        background: "linear-gradient(135deg, #00f5ff, #bf00ff)",
        boxShadow: "0 0 6px #00f5ff, 0 0 12px #bf00ff",
        top: "50%",
        left: "50%",
        marginTop: "-3px",
        marginLeft: "-3px",
      }}
    />
  );
}

/* ── Orbiting ring segment ── */
function OrbitRing({ radius, duration, clockwise = true }: { radius: number; duration: number; clockwise?: boolean }) {
  return (
    <motion.div
      animate={{ rotate: clockwise ? 360 : -360 }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
      className="absolute rounded-full"
      style={{
        width: radius * 2,
        height: radius * 2,
        top: "50%",
        left: "50%",
        marginTop: -radius,
        marginLeft: -radius,
        border: "1px solid transparent",
        borderTopColor: "#00f5ff",
        borderRightColor: "rgba(0,245,255,0.2)",
        filter: "drop-shadow(0 0 4px #00f5ff)",
      }}
    />
  );
}

/* ── Single circuit line tick ── */
function CircuitLine({ x, y, w, rotate = 0, delay }: { x: number | string; y: number | string; w: number; rotate?: number; delay: number }) {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: [0, 0.7, 0.4] }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="absolute h-px origin-left"
      style={{
        left: x,
        top: y,
        width: w,
        transform: `rotate(${rotate}deg)`,
        background: "linear-gradient(90deg, #00f5ff, transparent)",
        boxShadow: "0 0 6px rgba(0,245,255,0.5)",
      }}
    />
  );
}

const SPARK_PARTICLES = Array.from({ length: 12 }, (_, i) => i * 30);

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  /* Phase 0 = boot lines, 1 = logo in, 2 = spark burst, 3 = text reveal, 4 = exit */
  const [phase, setPhase] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    
    // Check if we've already seen the preloader this session
    const hasSeenPreloader = sessionStorage.getItem("spark-preloader-seen");
    if (hasSeenPreloader) {
      onComplete();
      return;
    }

    started.current = true;
    setIsVisible(true);

    const timers = [
      setTimeout(() => setPhase(1), 100),   // logo fades in
      setTimeout(() => setPhase(2), 300),   // spark burst
      setTimeout(() => setPhase(3), 500),  // tagline appears
      setTimeout(() => {
        setPhase(4);
        sessionStorage.setItem("spark-preloader-seen", "true");
      }, 800),  // exit wipe
      setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 1000), // unmount
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {phase < 4 && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "#050510" }}
        >
          {/* ── Radial glow backdrop ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,245,255,0.07) 0%, rgba(191,0,255,0.05) 40%, transparent 70%)",
            }}
          />

          {/* ── Circuit lines (phase 0+) ── */}
          <div className="absolute inset-0 pointer-events-none">
            <CircuitLine x="10%" y="38%" w={120} delay={0.0} />
            <CircuitLine x="10%" y="38%" w={60}  rotate={90} delay={0.15} />
            <CircuitLine x="10%" y="62%" w={100} delay={0.1} />
            <CircuitLine x="10%" y="62%" w={40}  rotate={-90} delay={0.25} />
            <CircuitLine x="72%" y="36%" w={130} rotate={180} delay={0.05} />
            <CircuitLine x="72%" y="36%" w={50}  rotate={270} delay={0.2} />
            <CircuitLine x="75%" y="63%" w={110} rotate={180} delay={0.12} />
            <CircuitLine x="75%" y="63%" w={45}  rotate={90}  delay={0.28} />
            <CircuitLine x="30%" y="20%" w={80}  delay={0.3} />
            <CircuitLine x="58%" y="80%" w={90}  rotate={180} delay={0.35} />
          </div>

          {/* ── Orbit rings ── */}
          {phase >= 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="absolute"
            >
              <OrbitRing radius={72}  duration={3.5} clockwise={true} />
              <OrbitRing radius={96}  duration={5}   clockwise={false} />
              <OrbitRing radius={120} duration={8}   clockwise={true} />
            </motion.div>
          )}

          {/* ── Central logo ── */}
          <div className="relative flex flex-col items-center justify-center" style={{ width: 260, height: 260 }}>

            {/* Spark burst particles (phase 2) */}
            {phase >= 2 && SPARK_PARTICLES.map((angle, i) => (
              <SparkParticle key={angle} angle={angle} delay={i * 0.03} />
            ))}

            {/* Core glow pulse */}
            {phase >= 1 && (
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 80,
                  height: 80,
                  background: "radial-gradient(circle, rgba(0,245,255,0.35) 0%, rgba(191,0,255,0.15) 60%, transparent 80%)",
                  filter: "blur(8px)",
                }}
              />
            )}

            {/* SPARK logo and wordmark */}
            {phase >= 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 flex flex-col items-center gap-6"
              >
                {/* Custom Animated Spark Logo SVG */}
                <motion.svg
                  width="80"
                  height="80"
                  viewBox="0 0 100 100"
                  initial="hidden"
                  animate="visible"
                  className="mb-2"
                >
                  <motion.path
                    d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z"
                    fill="none"
                    stroke="url(#spark-grad)"
                    strokeWidth="2"
                    variants={{
                      hidden: { pathLength: 0, opacity: 0 },
                      visible: { 
                        pathLength: 1, 
                        opacity: 1,
                        transition: { duration: 1.5, ease: "easeInOut" }
                      }
                    }}
                  />
                  <defs>
                    <linearGradient id="spark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00f5ff" />
                      <stop offset="100%" stopColor="#bf00ff" />
                    </linearGradient>
                  </defs>
                  {/* Glowing center point */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="2"
                    fill="#fff"
                    animate={{ scale: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </motion.svg>

                {/* Letter-by-letter S P A R K */}
                <div className="flex items-center gap-2">
                  {"SPARK".split("").map((letter, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className="text-6xl font-black leading-none italic"
                      style={{
                        fontFamily: "var(--font-syne)",
                        background: "linear-gradient(135deg, #00f5ff 0%, #bf00ff 50%, #ff00aa 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        filter: "drop-shadow(0 0 15px rgba(0,245,255,0.7))",
                      }}
                    >
                      {letter}
                    </motion.span>
                  ))}
                </div>

                {/* Glowing scanning underline */}
                <div className="relative w-64 h-px mt-2 bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ left: "-100%" }}
                    animate={{ left: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-1/3 h-full"
                    style={{
                      background: "linear-gradient(90deg, transparent, #00f5ff, transparent)",
                      boxShadow: "0 0 10px #00f5ff",
                    }}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Tagline (phase 3) ── */}
          {phase >= 3 && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute text-sm tracking-[0.25em] uppercase"
              style={{
                fontFamily: "var(--font-dm-sans)",
                color: "#8888aa",
                marginTop: "180px",
              }}
            >
              Self-Hosted · Private · Yours
            </motion.p>
          )}

          {/* ── Bottom loading bar ── */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 h-px rounded-full overflow-hidden"
            style={{ width: 180, background: "rgba(255,255,255,0.08)" }}
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2.0, ease: "easeInOut" }}
              className="h-full origin-left rounded-full"
              style={{
                background: "linear-gradient(90deg, #00f5ff, #bf00ff, #ff00aa)",
                boxShadow: "0 0 8px rgba(0,245,255,0.6)",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
