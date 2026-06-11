"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  IconX,
  IconBug,
  IconHelp,
  IconBulb,
  IconAlertTriangle,
  IconServer,
  IconMessageCircle,
  IconSend,
  IconCheck,
  IconChevronRight,
  IconLoader2,
  IconBrandGoogle,
  IconLogout,
  IconUser,
} from "@tabler/icons-react";

/* ── Issue categories ── */
const categories = [
  { id: "bug",          label: "Bug Report",        description: "Something is broken or not working",         icon: IconBug,            accent: "red",    subject: "Bug Report"       },
  { id: "service-down", label: "Service Down",       description: "A service (Cloud, Media…) is unreachable",   icon: IconServer,         accent: "red",    subject: "Service Down"     },
  { id: "access",       label: "Access Issue",       description: "Cannot access a resource / permission issue", icon: IconAlertTriangle,  accent: "orange", subject: "Access Issue"     },
  { id: "feature",      label: "Feature Request",    description: "Suggest a new feature or improvement",       icon: IconBulb,           accent: "cyan",   subject: "Feature Request"  },
  { id: "question",     label: "General Question",   description: "Any question about SPARK or the homelab",    icon: IconHelp,           accent: "cyan",   subject: "General Question" },
  { id: "other",        label: "Other",              description: "Anything else you'd like to raise",          icon: IconMessageCircle,  accent: "orange", subject: "General Query"    },
];

type Accent = "cyan" | "orange" | "red";
type Category = (typeof categories)[0];
type Step = "auth" | "category" | "form" | "sent";

const accentMap: Record<Accent, { color: string; rgb: string; border: string; bg: string; glow: string }> = {
  cyan:   { color: "#00f5ff", rgb: "0,245,255",   border: "rgba(0,245,255,0.4)",   bg: "rgba(0,245,255,0.07)",   glow: "0 0 16px rgba(0,245,255,0.3)"   },
  orange: { color: "#ff6a00", rgb: "255,106,0",   border: "rgba(255,106,0,0.4)",   bg: "rgba(255,106,0,0.07)",   glow: "0 0 16px rgba(255,106,0,0.3)"   },
  red:    { color: "#ff2020", rgb: "255,32,32",   border: "rgba(255,32,32,0.4)",   bg: "rgba(255,32,32,0.07)",   glow: "0 0 16px rgba(255,32,32,0.3)"   },
};

interface ContactPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function ContactPanel({ open, onClose }: ContactPanelProps) {
  const { data: session, status } = useSession();

  const [step, setStep]         = useState<Step>("auth");
  const [selected, setSelected] = useState<Category | null>(null);
  const [name, setName]         = useState("");
  const [subject, setSubject]   = useState("");
  const [message, setMessage]   = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const [sending, setSending]   = useState(false);
  const [sendError, setSendError] = useState("");

  const userEmail = session?.user?.email ?? "";
  const userName  = session?.user?.name  ?? "";
  const userImage = session?.user?.image ?? "";

  // Update step if session changes
  useEffect(() => {
    if (status === "authenticated" && step === "auth") {
      setStep("category");
      if (userName) setName(userName);
    } else if (status === "unauthenticated") {
      setStep("auth");
    }
  }, [status, step, userName]);

  const reset = () => {
    setStep(session ? "category" : "auth");
    setSelected(null);
    setName(userName || "");
    setSubject("");
    setMessage("");
    setPriority("medium");
    setSendError("");
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 400);
  };

  const handleCategorySelect = (cat: Category) => {
    setSelected(cat);
    setSubject(`[SPARK] ${cat.subject}`);
    setStep("form");
  };

  const handleSend = async () => {
    if (!selected || !message.trim()) return;

    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selected.label,
          subject: subject || `[SPARK] ${selected.subject}`,
          name,
          message,
          priority
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message.");
      }

      setStep("sent");
    } catch (err: any) {
      setSendError(err.message || "An unexpected error occurred.");
    } finally {
      setSending(false);
    }
  };

  const a = selected ? accentMap[selected.accent as Accent] : accentMap.cyan;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[8000]"
            style={{ background: "rgba(3,4,13,0.7)", backdropFilter: "blur(4px)" }}
            onClick={handleClose}
          />

          {/* Slide-in panel */}
          <motion.aside
            key="panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
            className="fixed top-0 right-0 h-full z-[8100] flex flex-col overflow-hidden"
            style={{
              width: "min(440px, 100vw)",
              background: "rgba(3,4,13,0.97)",
              borderLeft: "1px solid rgba(0,245,255,0.12)",
              backdropFilter: "blur(32px) saturate(200%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent line */}
            <div style={{ height: 1, background: "linear-gradient(to right, #00f5ff, rgba(0,245,255,0.2), transparent)", flexShrink: 0 }} />

            {/* ── Header ── */}
            <div
              className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(0,245,255,0.08)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 flex items-center justify-center"
                  style={{
                    background: "rgba(0,245,255,0.08)",
                    border: "1px solid rgba(0,245,255,0.25)",
                    clipPath: "polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)",
                    color: "#00f5ff",
                  }}
                >
                  <IconMessageCircle size={16} stroke={1.8} />
                </div>
                <div>
                  <p className="font-extrabold text-sm tracking-wide" style={{ fontFamily: "var(--font-syne)", color: "var(--text-primary)", letterSpacing: "0.08em" }}>
                    LET&apos;S TALK
                  </p>
                  <p className="text-[10px] tracking-widest" style={{ color: "rgba(0,245,255,0.5)", fontFamily: "var(--font-dm-sans)", letterSpacing: "0.12em" }}>
                    SPARK SUPPORT &amp; FEEDBACK
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center hover:bg-white/10 transition-colors"
                style={{ color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <IconX size={14} />
              </button>
            </div>

            {/* Auth bar (always visible when signed in) */}
            {status === "authenticated" && (
              <div
                className="flex items-center justify-between px-6 py-3 flex-shrink-0"
                style={{
                  borderBottom: "1px solid rgba(0,245,255,0.06)",
                  background: "rgba(0,245,255,0.03)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  {userImage ? (
                    <img src={userImage} alt={userName} className="w-7 h-7 rounded-full" />
                  ) : (
                    <IconUser className="w-7 h-7 text-gray-400" />
                  )}
                  <div>
                    <p className="text-[11px] font-bold text-white tracking-wide" style={{ fontFamily: "var(--font-syne)" }}>{userName || "User"}</p>
                    <p className="text-[9px] text-gray-400 font-mono tracking-wider">{userEmail}</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-[10px] font-bold tracking-widest text-[#ff2020] hover:text-[#ff6a00] transition-colors flex items-center gap-1.5"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  <IconLogout size={12} stroke={2} /> SIGN OUT
                </button>
              </div>
            )}

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <AnimatePresence mode="wait">

                {/* ── STEP: AUTH ── */}
                {(!session || step === "auth") && status !== "loading" && (
                  <motion.div
                    key="auth"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center h-full text-center px-4"
                  >
                    <div
                      className="w-16 h-16 flex items-center justify-center mb-6"
                      style={{
                        background: "rgba(0,245,255,0.05)",
                        border: "1px solid rgba(0,245,255,0.2)",
                        color: "#00f5ff",
                        clipPath: "polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)",
                        boxShadow: "0 0 24px rgba(0,245,255,0.1)",
                      }}
                    >
                      <IconAlertTriangle size={28} stroke={1.5} />
                    </div>

                    <h3 className="text-sm font-extrabold mb-2 tracking-widest text-white" style={{ fontFamily: "var(--font-syne)" }}>
                      AUTHENTICATION REQUIRED
                    </h3>
                    <p className="text-xs text-gray-400 mb-8 max-w-[260px] leading-relaxed">
                      To prevent spam and ensure verified support channels, please sign in with your Google Workspace account.
                    </p>

                    <motion.button
                      whileHover={{ scale: 1.03, boxShadow: "0 0 24px rgba(0,245,255,0.25)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => signIn("google")}
                      className="flex items-center gap-3 w-full max-w-[240px] px-5 py-3.5 text-xs font-bold transition-all duration-200"
                      style={{
                        background: "rgba(0,245,255,0.1)",
                        border: "1px solid rgba(0,245,255,0.3)",
                        color: "#00f5ff",
                        clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
                        fontFamily: "var(--font-syne)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      <IconBrandGoogle size={16} />
                      CONTINUE WITH GOOGLE
                    </motion.button>
                  </motion.div>
                )}

                {/* Loading State */}
                {status === "loading" && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col flex-1 items-center justify-center text-center h-full gap-4"
                  >
                    <IconLoader2 size={28} className="animate-spin text-[#00f5ff]" />
                    <p className="text-[10px] tracking-[0.2em] text-[#00f5ff]" style={{ fontFamily: "var(--font-syne)" }}>WAITING FOR AUTH...</p>
                  </motion.div>
                )}

                {/* ── STEP: CATEGORY ── */}
                {session && step === "category" && (
                  <motion.div
                    key="category"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-3"
                  >
                    <p className="text-[11px] tracking-widest mb-2" style={{ color: "rgba(0,245,255,0.5)", fontFamily: "var(--font-dm-sans)", letterSpacing: "0.16em" }}>
                      SELECT TOPIC
                    </p>
                    {categories.map((cat) => {
                      const ca = accentMap[cat.accent as Accent];
                      const CatIcon = cat.icon;
                      return (
                        <motion.button
                          key={cat.id}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleCategorySelect(cat)}
                          className="w-full flex items-center gap-4 px-4 py-3.5 text-left overflow-hidden relative"
                          style={{
                            background: ca.bg,
                            border: `1px solid rgba(${ca.rgb},0.15)`,
                            borderLeft: `2px solid rgba(${ca.rgb},0.5)`,
                            clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                          }}
                        >
                          <div
                            className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                            style={{
                              clipPath: "polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)",
                              background: ca.bg,
                              color: ca.color,
                            }}
                          >
                            <CatIcon size={16} stroke={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold tracking-wide" style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne)", letterSpacing: "0.04em" }}>{cat.label}</p>
                            <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{cat.description}</p>
                          </div>
                          <IconChevronRight size={13} style={{ color: ca.color, flexShrink: 0 }} />
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}

                {/* ── STEP: FORM ── */}
                {session && step === "form" && selected && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-4"
                  >
                    {/* Back / selected category */}
                    <button
                      onClick={() => setStep("category")}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold w-fit"
                      style={{
                        background: a.bg,
                        border: `1px solid ${a.border}`,
                        color: a.color,
                        clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
                        fontFamily: "var(--font-syne)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {(() => { const I = selected.icon; return <I size={11} stroke={2} />; })()}
                      {selected.label.toUpperCase()}
                      <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>← change</span>
                    </button>

                    {/* Sender info card (read-only verified Google email) */}
                    <div
                      className="flex items-center gap-3 px-4 py-3"
                      style={{
                        background: "rgba(0,245,255,0.04)",
                        border: "1px solid rgba(0,245,255,0.15)",
                        clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)"
                      }}
                    >
                      {userImage ? (
                        <img src={userImage} alt={userName} className="w-8 h-8 rounded-full border border-[rgba(0,245,255,0.3)]" />
                      ) : (
                        <IconUser className="w-8 h-8 p-1 rounded-full border border-[rgba(0,245,255,0.3)] text-[#00f5ff]" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white truncate" style={{ fontFamily: "var(--font-syne)" }}>{userName || "User"}</p>
                        <p className="text-[9px] text-gray-400 font-mono truncate">{userEmail}</p>
                      </div>
                      <span className="text-[8px] font-bold text-[#00f5ff] tracking-widest px-2 py-1 bg-[rgba(0,245,255,0.1)] rounded-sm">
                        VERIFIED
                      </span>
                    </div>

                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-secondary)", letterSpacing: "0.14em" }}>
                        YOUR NAME
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full px-4 py-2.5 text-sm outline-none transition-all duration-200"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(0,245,255,0.1)",
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-dm-sans)",
                          clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = a.border)}
                        onBlur={(e)  => (e.target.style.borderColor = "rgba(0,245,255,0.1)")}
                      />
                    </div>

                    {/* Email (Read-only since authenticated) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-secondary)", letterSpacing: "0.14em" }}>
                        YOUR EMAIL
                      </label>
                      <input
                        type="email"
                        value={userEmail}
                        readOnly
                        className="w-full px-4 py-2.5 text-sm outline-none opacity-60 cursor-not-allowed"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(0,245,255,0.1)",
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-dm-sans)",
                          clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
                        }}
                      />
                    </div>

                    {/* Subject */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-secondary)", letterSpacing: "0.14em" }}>SUBJECT</label>
                      <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm outline-none transition-all duration-200"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(0,245,255,0.1)",
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-dm-sans)",
                          clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = a.border)}
                        onBlur={(e)  => (e.target.style.borderColor = "rgba(0,245,255,0.1)")}
                      />
                    </div>

                    {/* Priority */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-secondary)", letterSpacing: "0.14em" }}>PRIORITY</label>
                      <div className="flex gap-2">
                        {(["low", "medium", "high"] as const).map((p) => {
                          const cols: Record<string, string> = { low: "rgba(0,245,255,0.35)", medium: "rgba(255,106,0,0.35)", high: "rgba(255,32,32,0.45)" };
                          const textCols: Record<string, string> = { low: "#00f5ff", medium: "#ff6a00", high: "#ff2020" };
                          const active = priority === p;
                          return (
                            <button
                              key={p}
                              onClick={() => setPriority(p)}
                              className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200"
                              style={{
                                background: active ? cols[p] : "rgba(255,255,255,0.03)",
                                border: `1px solid ${active ? textCols[p] : "rgba(255,255,255,0.08)"}`,
                                color: active ? textCols[p] : "var(--text-secondary)",
                                clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
                                fontFamily: "var(--font-syne)",
                                letterSpacing: "0.1em",
                              }}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-secondary)", letterSpacing: "0.14em" }}>
                        MESSAGE <span className="text-[#ff2020]">*</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Describe your issue or query in detail..."
                        rows={5}
                        className="w-full px-4 py-3 text-sm outline-none transition-all duration-200 resize-none"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(0,245,255,0.1)",
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-dm-sans)",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = a.border)}
                        onBlur={(e)  => (e.target.style.borderColor = "rgba(0,245,255,0.1)")}
                      />
                      <p className="text-[10px]" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
                        Your message will be sent directly to our support team.
                      </p>
                      {sendError && (
                        <p className="text-xs mt-1" style={{ color: "#ff2020", fontFamily: "var(--font-dm-sans)" }}>
                          {sendError}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── STEP: SENT ── */}
                {step === "sent" && (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.22,1,0.36,1] as [number,number,number,number] }}
                    className="flex flex-col items-center justify-center gap-6 py-16 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.4, ease: [0.22,1,0.36,1] as [number,number,number,number] }}
                      className="w-16 h-16 flex items-center justify-center"
                      style={{
                        background: "rgba(0,245,255,0.08)",
                        border: "1px solid rgba(0,245,255,0.4)",
                        boxShadow: "0 0 32px rgba(0,245,255,0.2)",
                        clipPath: "polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%)",
                        color: "#00f5ff",
                      }}
                    >
                      <IconCheck size={26} stroke={2.5} />
                    </motion.div>
                    <div>
                      <p className="text-base font-extrabold mb-2 tracking-wide" style={{ fontFamily: "var(--font-syne)", color: "var(--text-primary)", letterSpacing: "0.06em" }}>
                        MESSAGE SENT
                      </p>
                      <p className="text-sm leading-relaxed max-w-[240px] mx-auto" style={{ color: "var(--text-secondary)" }}>
                        Your message has been securely sent to our support team. We will get back to you shortly.
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={reset}
                      className="px-6 py-2.5 text-xs font-bold"
                      style={{
                        background: "rgba(0,245,255,0.08)",
                        border: "1px solid rgba(0,245,255,0.3)",
                        color: "#00f5ff",
                        clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
                        fontFamily: "var(--font-syne)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      SEND ANOTHER
                    </motion.button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* ── Footer CTA (only on form step) ── */}
            {session && step === "form" && (
              <div
                className="px-6 py-4 flex-shrink-0"
                style={{ borderTop: "1px solid rgba(0,245,255,0.08)" }}
              >
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: message.trim() ? "0 0 28px rgba(0,245,255,0.4)" : "none" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                  className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: message.trim() ? "#00f5ff" : "rgba(255,255,255,0.06)",
                    color: message.trim() ? "#020408" : "var(--text-secondary)",
                    clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)",
                    fontFamily: "var(--font-syne)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {sending ? (
                    <>
                      <IconLoader2 className="animate-spin" size={14} stroke={2} /> SENDING...
                    </>
                  ) : (
                    <>
                      <IconSend size={14} stroke={2} /> SEND MESSAGE
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
