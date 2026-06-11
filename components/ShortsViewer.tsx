"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UniversalUploadModal from "./UniversalUploadModal";
import {
  Heart,
  Share2,
  MessageCircle,
  Bookmark,
  Play,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Send,
  X,
  Plus,
} from "lucide-react";

interface Comment {
  user: string;
  avatar: string;
  text: string;
  time: string;
}

interface Short {
  id: string;
  title: string;
  creator: string;
  creatorAvatar: string;
  description: string;
  likes: number;
  shares: number;
  saves: number;
  views: string;
  tags: string[];
  accent: string;
  bgGradient: string;
  comments: Comment[];
  src?: string;
}

const MEDIA_API_BASE = process.env.NEXT_PUBLIC_MEDIA_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:4002` : "http://localhost:4002");



function fmtCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

interface ShortsViewerProps {
  onClose?: () => void;
}

export default function ShortsViewer({ onClose }: ShortsViewerProps) {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>({});
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [liveComments, setLiveComments] = useState<Record<string, Comment[]>>({});
  const [heartAnim, setHeartAnim] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "info" } | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const current = shorts[currentIndex] ?? shorts[0];

  const refreshShorts = useCallback(async () => {
    try {
      const response = await fetch(`${MEDIA_API_BASE}/files/shorts`);
      if (!response.ok) return;

      const data = await response.json();
      const uploadedShorts: Short[] = data.map((file: { name: string }, index: number) => ({
        id: file.name,
        title: file.name.replace(/^\d+-/, "").replace(/\.[^/.]+$/, ""),
        creator: "You",
        creatorAvatar: "Y",
        description: "Uploaded short",
        likes: 0,
        shares: 0,
        saves: 0,
        views: "New",
        tags: ["uploaded"],
        accent: ["#f97316", "#8b5cf6", "#06b6d4", "#10b981"][index % 4],
        bgGradient: [
          "linear-gradient(145deg, rgba(249,115,22,0.15) 0%, rgba(124,58,237,0.08) 100%)",
          "linear-gradient(145deg, rgba(139,92,246,0.15) 0%, rgba(16,185,129,0.06) 100%)",
          "linear-gradient(145deg, rgba(6,182,212,0.15) 0%, rgba(59,130,246,0.08) 100%)",
          "linear-gradient(145deg, rgba(16,185,129,0.15) 0%, rgba(249,115,22,0.06) 100%)",
        ][index % 4],
        comments: [],
        src: `${MEDIA_API_BASE}/stream/shorts/${encodeURIComponent(file.name)}`,
      }));

      setShorts(uploadedShorts);
      setLikeCounts((prev) => ({
        ...Object.fromEntries(uploadedShorts.map((short) => [short.id, short.likes])),
        ...prev,
      }));
      setSaveCounts((prev) => ({
        ...Object.fromEntries(uploadedShorts.map((short) => [short.id, short.saves])),
        ...prev,
      }));
      setLiveComments((prev) => ({
        ...Object.fromEntries(uploadedShorts.map((short) => [short.id, short.comments])),
        ...prev,
      }));
      setCurrentIndex(0);
    } catch (error) {
      console.error("Failed to fetch uploaded shorts", error);
    }
  }, []);

  const showToast = useCallback((msg: string, type: "success" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    let active = true;
    void refreshShorts().then(() => {
      if (!active) {
        // Component unmounted before fetch completed — state updates are safe
        // because refreshShorts sets state via setShorts etc. which are stable
      }
    });
    return () => {
      active = false;
    };
  }, [refreshShorts]);

  useEffect(() => {
    if (!current?.src || !videoRef.current) return;
    videoRef.current.muted = muted;
    if (playing) {
      void videoRef.current.play().catch(() => undefined);
    } else {
      videoRef.current.pause();
    }
  }, [current?.id, current?.src, muted, playing]);

  const goNext = useCallback(() => {
    setShowComments(false);
    setCurrentIndex((i) => Math.min(i + 1, shorts.length - 1));
  }, [shorts.length]);

  const goPrev = useCallback(() => {
    setShowComments(false);
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") goNext();
      if (e.key === "ArrowUp" || e.key === "k") goPrev();
      if (e.key === "Escape") onClose?.();
      if (e.key === " ") { e.preventDefault(); setPlaying((v) => !v); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  // Touch/swipe
  const onTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (delta > 60) goNext();
    else if (delta < -60) goPrev();
  };

  // Scroll wheel
  const onWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 40) goNext();
    else if (e.deltaY < -40) goPrev();
  };

  const toggleLike = (id: string) => {
    const wasLiked = liked[id];
    setLiked((prev) => ({ ...prev, [id]: !wasLiked }));
    setLikeCounts((prev) => ({ ...prev, [id]: prev[id] + (wasLiked ? -1 : 1) }));
    if (!wasLiked) {
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 700);
      showToast("Added to liked videos ❤️");
    }
  };

  const toggleSave = (id: string) => {
    const wasSaved = saved[id];
    setSaved((prev) => ({ ...prev, [id]: !wasSaved }));
    setSaveCounts((prev) => ({ ...prev, [id]: prev[id] + (wasSaved ? -1 : 1) }));
    showToast(wasSaved ? "Removed from favourites" : "Saved to favourites ✨", wasSaved ? "info" : "success");
  };

  const handleShare = (short: Short) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/media/shorts/${short.id}`);
    }
    showToast("Link copied to clipboard 🔗");
  };

  const postComment = (id: string) => {
    const text = (commentInputs[id] || "").trim();
    if (!text) return;
    setLiveComments((prev) => ({
      ...prev,
      [id]: [...(prev[id] || []), { user: "@you", avatar: "Y", text, time: "just now" }],
    }));
    setCommentInputs((prev) => ({ ...prev, [id]: "" }));
    showToast("Comment posted! 💬");
  };

  if (!shorts.length || !current) return (
    <div className="w-full h-full flex flex-col items-center justify-center text-white/40">
      <p>No shorts uploaded yet.</p>
      <button
        onClick={() => setIsUploadOpen(true)}
        className="mt-4 px-4 py-2 bg-orange-500 rounded-lg text-sm text-white font-bold"
      >
        Upload a Short
      </button>
      <UniversalUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        type="short"
        onUploadComplete={(files) => {
          showToast(`Successfully uploaded ${files.length} short${files.length === 1 ? "" : "s"}! ✨`, "success");
          void refreshShorts();
          setIsUploadOpen(false);
        }}
      />
    </div>
  );

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-200 px-4 py-2 rounded-full text-sm font-medium shadow-lg pointer-events-none"
            style={{
              background: toast.type === "success" ? "rgba(249,115,22,0.95)" : "rgba(255,255,255,0.12)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed container */}
      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
        className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl group/feed"
        style={{ height: "calc(100vh - 13rem)" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col"
            style={{ background: current.bgGradient, border: `1px solid ${current.accent}28` }}
          >
            {/* Grid bg texture */}
            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            {/* Double-tap like */}
            <AnimatePresence>
              {heartAnim && (
                <motion.div
                  key="heart"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.55 }}
                  className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                >
                  <Heart size={80} fill={current.accent} stroke="none" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Video placeholder / art */}
            <div
              className="flex-1 relative flex items-center justify-center cursor-pointer select-none"
              onDoubleClick={() => toggleLike(current.id)}
              onClick={() => setPlaying((v) => !v)}
            >
              {current.src && (
                <video
                  ref={videoRef}
                  key={current.id}
                  src={current.src}
                  className="absolute inset-0 w-full h-full object-cover"
                  loop
                  playsInline
                  muted={muted}
                />
              )}
              {/* Glow orb */}
              <div
                className="absolute w-48 h-48 rounded-full blur-[80px] opacity-30"
                style={{ background: current.accent }}
              />
              {/* Play/Pause icon in center */}
              <AnimatePresence>
                {!playing && (
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.4, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="z-10 w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: `${current.accent}33`, border: `2px solid ${current.accent}66` }}
                  >
                    <Play size={36} fill={current.accent} stroke="none" className="ml-1" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-18 left-0 right-0 h-0.5 bg-white/10">
              {playing && (
                <motion.div
                  key={current.id + "-progress"}
                  className="h-full rounded-full"
                  style={{ background: current.accent }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 30, ease: "linear" }}
                />
              )}
            </div>

            {/* Bottom info overlay */}
            <div className="absolute bottom-0 left-0 right-0 pb-5 px-4 pt-8 bg-linear-to-t from-black/70 via-black/30 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: `${current.accent}33`, border: `2px solid ${current.accent}66`, color: current.accent }}
                >
                  {current.creatorAvatar}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{current.creator}</p>
                  <p className="text-[10px] text-white/50">{current.views} views</p>
                </div>
                <button
                  className="ml-auto px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
                  style={{ borderColor: `${current.accent}60`, color: current.accent, background: `${current.accent}18` }}
                  onClick={(e) => { e.stopPropagation(); showToast("Followed!"); }}
                >
                  Follow
                </button>
              </div>
              <p className="text-sm text-white/90 leading-snug mb-2 line-clamp-2">{current.description}</p>
              <div className="flex gap-2 flex-wrap">
                {current.tags.map((tag) => (
                  <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-white/8 text-white/50">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav arrows */}
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 p-2 rounded-full transition-all disabled:opacity-20 -translate-y-2.5 group-hover/feed:translate-y-0 opacity-0 group-hover/feed:opacity-100"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
        >
          <ChevronUp size={20} />
        </button>
        <button
          onClick={goNext}
          disabled={currentIndex === shorts.length - 1}
          className="absolute bottom-22.5 left-1/2 -translate-x-1/2 z-30 p-2 rounded-full transition-all disabled:opacity-20 translate-y-2.5 group-hover/feed:translate-y-0 opacity-0 group-hover/feed:opacity-100"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
        >
          <ChevronDown size={20} />
        </button>

        {/* Upload Button Overlay */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsUploadOpen(true)}
          className="absolute top-4 right-4 z-40 w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 border border-white/10 opacity-0 group-hover/feed:opacity-100 transition-opacity"
        >
          <Plus size={20} />
        </motion.button>
      </div>

      <UniversalUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        type="short"
        onUploadComplete={(files) => {
          showToast(`Successfully uploaded ${files.length} short${files.length === 1 ? "" : "s"}! ✨`, "success");
          void refreshShorts();
          setIsUploadOpen(false);
        }}
      />

      {/* Action bar */}
      <div className="w-full max-w-sm mx-auto flex items-center justify-around px-4 py-3 mt-2 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Mute */}
        <button
          className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
          onClick={() => setMuted((v) => !v)}
        >
          {muted ? <VolumeX size={22} className="text-white/60" /> : <Volume2 size={22} />}
          <span className="text-[10px] text-white/40">{muted ? "Unmute" : "Mute"}</span>
        </button>

        {/* Like */}
        <button
          className="flex flex-col items-center gap-1 transition-all"
          onClick={() => toggleLike(current.id)}
        >
          <motion.div whileTap={{ scale: 0.7 }} transition={{ type: "spring", stiffness: 400, damping: 12 }}>
            <Heart
              size={26}
              fill={liked[current.id] ? current.accent : "none"}
              stroke={liked[current.id] ? current.accent : "currentColor"}
              className={liked[current.id] ? "" : "text-white/70"}
            />
          </motion.div>
          <span className="text-[11px] font-medium" style={{ color: liked[current.id] ? current.accent : "rgba(255,255,255,0.6)" }}>
            {fmtCount(likeCounts[current.id])}
          </span>
        </button>

        {/* Comment */}
        <button
          className="flex flex-col items-center gap-1 transition-all"
          onClick={() => setShowComments((v) => !v)}
        >
          <MessageCircle
            size={26}
            className={showComments ? "text-white" : "text-white/70"}
            fill={showComments ? "rgba(255,255,255,0.15)" : "none"}
          />
          <span className="text-[11px] text-white/60">
            {fmtCount(liveComments[current.id]?.length || 0)}
          </span>
        </button>

        {/* Share */}
        <button
          className="flex flex-col items-center gap-1 transition-all opacity-70 hover:opacity-100"
          onClick={() => handleShare(current)}
        >
          <Share2 size={24} />
          <span className="text-[11px] text-white/50">{fmtCount(current.shares)}</span>
        </button>

        {/* Save */}
        <button
          className="flex flex-col items-center gap-1 transition-all"
          onClick={() => toggleSave(current.id)}
        >
          <motion.div whileTap={{ scale: 0.7 }} transition={{ type: "spring", stiffness: 400, damping: 12 }}>
            <Bookmark
              size={26}
              fill={saved[current.id] ? current.accent : "none"}
              stroke={saved[current.id] ? current.accent : "currentColor"}
              className={saved[current.id] ? "" : "text-white/70"}
            />
          </motion.div>
          <span className="text-[11px] font-medium" style={{ color: saved[current.id] ? current.accent : "rgba(255,255,255,0.6)" }}>
            {fmtCount(saveCounts[current.id])}
          </span>
        </button>
      </div>

      {/* Dot indicator */}
      <div className="flex gap-1.5 mt-3">
        {shorts.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrentIndex(i); setShowComments(false); }}
            className="rounded-full transition-all"
            style={{
              width: i === currentIndex ? 20 : 6,
              height: 6,
              background: i === currentIndex ? current.accent : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>

      {/* Comments panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-100 rounded-t-3xl p-4 max-h-[55vh] flex flex-col"
            style={{
              background: "rgba(5,5,18,0.96)",
              backdropFilter: "blur(24px)",
              border: `1px solid ${current.accent}25`,
              borderBottom: "none",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-sm">
                Comments ({liveComments[current.id]?.length || 0})
              </span>
              <button onClick={() => setShowComments(false)}>
                <X size={18} className="text-white/50" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 mb-3">
              {(liveComments[current.id] || []).map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: `${current.accent}25`, color: current.accent }}
                  >
                    {c.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-white/60 mb-0.5">{c.user}</p>
                    <p className="text-sm text-white/85 leading-snug">{c.text}</p>
                    <p className="text-[10px] text-white/30 mt-1">{c.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Comment input */}
            <div className="flex gap-2 pt-2 border-t border-white/8">
              <input
                type="text"
                value={commentInputs[current.id] || ""}
                onChange={(e) => setCommentInputs((prev) => ({ ...prev, [current.id]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && postComment(current.id)}
                placeholder="Add a comment..."
                className="flex-1 bg-white/6 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
              />
              <button
                onClick={() => postComment(current.id)}
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors"
                style={{ background: `${current.accent}30`, border: `1px solid ${current.accent}50` }}
              >
                <Send size={15} style={{ color: current.accent }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
