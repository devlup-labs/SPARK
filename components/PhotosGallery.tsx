"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  DragEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  LayoutGrid,
  List,
  Search,
  Heart,
  Share2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  ZoomIn,
  Calendar,
  MapPin,
  Camera,
  Folder,
  SlidersHorizontal,
  CloudUpload,
} from "lucide-react";
import UniversalUploadModal from "./UniversalUploadModal";

interface Photo {
  id: string;
  title: string;
  album: string;
  date: string;
  location?: string;
  camera?: string;
  resolution: string;
  size: string;
  liked: boolean;
  starred: boolean;
  accent: string;
  gradient: string;
  tags: string[];
  aspectRatio: "portrait" | "landscape" | "square";
  previewUrl?: string;
  src?: string;
}

const ALBUMS_UPLOAD = ["Nature", "Travel", "Architecture", "Portraits", "Night Sky", "Abstract", "Street", "Other"];
const ALBUMS = ["All Photos", ...ALBUMS_UPLOAD];

const ACCENT_POOL = ["#f97316", "#8b5cf6", "#06b6d4", "#f59e0b", "#a855f7", "#10b981", "#3b82f6", "#f43f5e"];
const GRAD_POOL = [
  "linear-gradient(135deg,rgba(249,115,22,0.35) 0%,rgba(124,58,237,0.2) 100%)",
  "linear-gradient(135deg,rgba(139,92,246,0.35) 0%,rgba(6,182,212,0.2) 100%)",
  "linear-gradient(135deg,rgba(6,182,212,0.35) 0%,rgba(59,130,246,0.2) 100%)",
  "linear-gradient(135deg,rgba(245,158,11,0.35) 0%,rgba(249,115,22,0.2) 100%)",
  "linear-gradient(135deg,rgba(168,85,247,0.35) 0%,rgba(16,185,129,0.15) 100%)",
  "linear-gradient(135deg,rgba(16,185,129,0.35) 0%,rgba(6,182,212,0.15) 100%)",
  "linear-gradient(135deg,rgba(244,63,94,0.35) 0%,rgba(249,115,22,0.15) 100%)",
];


const SORT_OPTIONS = ["Date (Newest)", "Date (Oldest)", "Title A-Z", "Size (Largest)"];
const MEDIA_API_BASE = process.env.NEXT_PUBLIC_MEDIA_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:4002` : "http://localhost:4002");

function fmtBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / 1024).toFixed(0) + " KB";
}

function pickAccent(idx: number) { return ACCENT_POOL[idx % ACCENT_POOL.length]; }
function pickGrad(idx: number) { return GRAD_POOL[idx % GRAD_POOL.length]; }

/* ═════════════════════ Main Gallery ═════════════════════ */
export default function PhotosGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);

  const [view, setView] = useState<"grid" | "masonry">("masonry");
  const [selectedAlbum, setSelectedAlbum] = useState("All Photos");
  const [search, setSearch] = useState("");
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [globalDrag, setGlobalDrag] = useState(false);
  const globalDragRef = useRef(0);

  const refreshPhotos = useCallback(async () => {
    try {
      const response = await fetch(`${MEDIA_API_BASE}/files/photos`);
      if (!response.ok) return;

      const data = await response.json();
      const uploadedPhotos: Photo[] = data.map((file: { name: string; size: number; modified: string }, index: number) => ({
        id: file.name,
        title: file.name.replace(/^\d+-/, "").replace(/\.[^/.]+$/, ""),
        album: "Other",
        date: new Date(file.modified).toISOString().split("T")[0],
        resolution: "Uploaded",
        size: fmtBytes(file.size),
        liked: false,
        starred: false,
        accent: pickAccent(index),
        gradient: pickGrad(index),
        tags: ["uploaded"],
        aspectRatio: "landscape",
        src: `${MEDIA_API_BASE}/stream/photos/${encodeURIComponent(file.name)}`,
      }));

      setPhotos(uploadedPhotos);
    } catch (error) {
      console.error("Failed to fetch uploaded photos", error);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch(`${MEDIA_API_BASE}/files/photos`);
        if (!response.ok || !active) return;

        const data = await response.json();
        if (!active) return;

        const uploadedPhotos: Photo[] = data.map((file: { name: string; size: number; modified: string }, index: number) => ({
          id: file.name,
          title: file.name.replace(/^\d+-/, "").replace(/\.[^/.]+$/, ""),
          album: "Other",
          date: new Date(file.modified).toISOString().split("T")[0],
          resolution: "Uploaded",
          size: fmtBytes(file.size),
          liked: false,
          starred: false,
          accent: pickAccent(index),
          gradient: pickGrad(index),
          tags: ["uploaded"],
          aspectRatio: "landscape",
          src: `${MEDIA_API_BASE}/stream/photos/${encodeURIComponent(file.name)}`,
        }));

        setPhotos(uploadedPhotos);
      } catch (error) {
        console.error("Failed to fetch uploaded photos", error);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }, []);

  const onGlobalDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    globalDragRef.current += 1;
    setGlobalDrag(true);
  }, []);
  const onGlobalDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    globalDragRef.current -= 1;
    if (globalDragRef.current <= 0) { globalDragRef.current = 0; setGlobalDrag(false); }
  }, []);
  const onGlobalDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    globalDragRef.current = 0;
    setGlobalDrag(false);
    if (e.dataTransfer.files.length) setShowUpload(true);
  }, []);

  const allTags = Array.from(new Set(photos.flatMap((p) => p.tags)));

  const filteredPhotos = photos
    .filter((p) => {
      const matchAlbum = selectedAlbum === "All Photos" || p.album === selectedAlbum;
      const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.tags.some((t) => t.includes(search.toLowerCase()));
      const matchTags = selectedTags.length === 0 || selectedTags.some((t) => p.tags.includes(t));
      return matchAlbum && matchSearch && matchTags;
    })
    .sort((a, b) => {
      if (sortBy === "Date (Newest)") return b.date.localeCompare(a.date);
      if (sortBy === "Date (Oldest)") return a.date.localeCompare(b.date);
      if (sortBy === "Title A-Z") return a.title.localeCompare(b.title);
      if (sortBy === "Size (Largest)") return parseFloat(b.size) - parseFloat(a.size);
      return 0;
    });

  const toggleLike = (id: string) => {
    setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, liked: !p.liked } : p));
    const photo = photos.find((p) => p.id === id);
    showToast(photo?.liked ? "Removed from liked" : "Added to liked ❤️");
  };
  const toggleStar = (id: string) => {
    setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, starred: !p.starred } : p));
    const photo = photos.find((p) => p.id === id);
    showToast(photo?.starred ? "Removed from favourites" : "Added to favourites ⭐");
  };

  const openLightbox = (photo: Photo) => setLightbox(photo);
  const closeLightbox = () => setLightbox(null);
  const lightboxNav = (dir: 1 | -1) => {
    if (!lightbox) return;
    const idx = filteredPhotos.findIndex((p) => p.id === lightbox.id);
    const next = filteredPhotos[idx + dir];
    if (next) setLightbox(next);
  };
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const albumCounts = ALBUMS.reduce<Record<string, number>>((acc, album) => {
    acc[album] = album === "All Photos" ? photos.length : photos.filter((p) => p.album === album).length;
    return acc;
  }, {});

  return (
    <div
      className="flex flex-col h-full relative"
      onDragEnter={onGlobalDragEnter}
      onDragLeave={onGlobalDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onGlobalDrop}
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-6 z-200 px-4 py-2 rounded-full text-sm font-medium shadow-lg pointer-events-none"
            style={{ background: "rgba(249,115,22,0.95)", backdropFilter: "blur(12px)" }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global drag hint */}
      <AnimatePresence>
        {globalDrag && !showUpload && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-140 pointer-events-none flex items-center justify-center"
            style={{ background: "rgba(249,115,22,0.05)", border: "3px dashed rgba(249,115,22,0.38)" }}
          >
            <div className="px-8 py-6 rounded-3xl flex flex-col items-center gap-3" style={{ background: "rgba(5,5,18,0.92)", border: "1px solid rgba(249,115,22,0.3)" }}>
              <CloudUpload size={40} className="text-orange-400" />
              <p className="font-bold text-lg text-orange-300">Drop to upload</p>
              <p className="text-sm text-white/50">Release to open upload panel</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload modal */}
      <AnimatePresence>
        {showUpload && (
          <UniversalUploadModal
            isOpen={showUpload}
            onClose={() => setShowUpload(false)}
            type="photo"
            onUploadComplete={(uploadedFiles) => {
              showToast(`${uploadedFiles.length} photo${uploadedFiles.length === 1 ? "" : "s"} uploaded successfully 📸`);
              void refreshPhotos();
              setShowUpload(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-40 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text" placeholder="Search photos..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full pl-8 pr-4 py-2 text-sm focus:outline-none focus:border-orange-500/40 transition-colors"
          />
        </div>
        <select
          value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 focus:outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((s) => <option key={s} value={s} className="bg-[#050510]">{s}</option>)}
        </select>
        <button
          onClick={() => setShowFilter((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors ${showFilter ? "bg-orange-500/15 border-orange-500/40 text-orange-400" : "bg-white/5 border-white/10 text-white/60 hover:text-white"}`}
        >
          <SlidersHorizontal size={15} />
          Filter
          {selectedTags.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold">{selectedTags.length}</span>}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-[1.03] active:scale-100"
            style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.85),rgba(168,85,247,0.75))", border: "1px solid rgba(249,115,22,0.4)", boxShadow: "0 2px 16px rgba(249,115,22,0.2)" }}
          >
            <CloudUpload size={15} />
            Upload
          </button>
          <div className="flex overflow-hidden rounded-xl border border-white/10">
            <button onClick={() => setView("masonry")} className={`px-3 py-2 transition-colors ${view === "masonry" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setView("grid")} className={`px-3 py-2 transition-colors ${view === "grid" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}>
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tag chips */}
      <AnimatePresence>
        {showFilter && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-5">
            <div className="flex flex-wrap gap-2 pb-4 border-b border-white/5">
              {allTags.map((tag) => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${selectedTags.includes(tag) ? "bg-orange-500/20 border-orange-500/50 text-orange-300" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Album sidebar + gallery */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Albums */}
        <div className="hidden lg:flex flex-col gap-1 w-44 shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-white/25 mb-2 px-2">Albums</p>
          {ALBUMS.map((album) => (
            <button
              key={album} onClick={() => setSelectedAlbum(album)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${selectedAlbum === album ? "bg-orange-500/15 text-orange-400 border border-orange-500/25" : "text-white/50 hover:text-white hover:bg-white/5"}`}
            >
              <div className="flex items-center gap-2 truncate">
                <Folder size={14} className="shrink-0" />
                <span className="truncate">{album}</span>
              </div>
              <span className="text-[10px] text-white/30 shrink-0">{albumCounts[album] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Gallery */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-white/30 gap-3">
              <ImageIcon size={40} className="opacity-40" />
              <p className="text-sm">No photos found</p>
              <button
                onClick={() => setShowUpload(true)}
                className="text-xs px-4 py-2 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25 transition-colors"
              >
                Upload your first photo
              </button>
            </div>
          ) : view === "masonry" ? (
            <div className="columns-2 md:columns-3 xl:columns-4 gap-3 space-y-3">
              {filteredPhotos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="break-inside-avoid group relative rounded-xl overflow-hidden cursor-pointer"
                  style={{ aspectRatio: photo.aspectRatio === "portrait" ? "2/3" : photo.aspectRatio === "landscape" ? "3/2" : "1/1" }}
                  onClick={() => openLightbox(photo)}
                >
                  {photo.src || photo.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.src || photo.previewUrl} alt={photo.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="absolute inset-0" style={{ background: photo.gradient }} />
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)" }} />
                    </>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn size={28} className="text-white/80" />
                  </div>
                  {photo.starred && (
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center">
                      <Star size={12} fill="#f97316" stroke="none" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); toggleLike(photo.id); }} className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                      <Heart size={13} fill={photo.liked ? "#ef4444" : "none"} stroke={photo.liked ? "#ef4444" : "white"} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleStar(photo.id); }} className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                      <Star size={13} fill={photo.starred ? "#f97316" : "none"} stroke={photo.starred ? "#f97316" : "white"} />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-linear-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-semibold truncate">{photo.title}</p>
                    <p className="text-[10px] text-white/50">{photo.album}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPhotos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/3 border border-white/6 hover:bg-white/6 hover:border-orange-500/20 transition-all cursor-pointer group"
                  onClick={() => openLightbox(photo)}
                >
                  <div className="w-14 h-14 rounded-lg shrink-0 relative overflow-hidden" style={{ background: photo.gradient }}>
                    {photo.src || photo.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.src || photo.previewUrl} alt={photo.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5) 0%, transparent 60%)" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{photo.title}</p>
                      {photo.starred && <Star size={12} fill="#f97316" stroke="none" />}
                      {photo.liked && <Heart size={12} fill="#ef4444" stroke="none" />}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-white/40">
                      <span className="flex items-center gap-1"><Folder size={10} />{photo.album}</span>
                      {photo.location && <span className="flex items-center gap-1"><MapPin size={10} />{photo.location}</span>}
                      <span className="flex items-center gap-1"><Calendar size={10} />{photo.date}</span>
                    </div>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {photo.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">#{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); toggleLike(photo.id); }} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Heart size={16} fill={photo.liked ? "#ef4444" : "none"} stroke={photo.liked ? "#ef4444" : "rgba(255,255,255,0.5)"} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleStar(photo.id); }} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Star size={16} fill={photo.starred ? "#f97316" : "none"} stroke={photo.starred ? "#f97316" : "rgba(255,255,255,0.5)"} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); showToast("Download started!"); }} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Download size={16} className="text-white/50" />
                    </button>
                  </div>
                  <div className="text-right text-[10px] text-white/30 space-y-0.5 shrink-0">
                    <p>{photo.resolution}</p>
                    <p>{photo.size}</p>
                    {photo.camera && <p className="flex items-center gap-1 justify-end"><Camera size={9} />{photo.camera}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-150 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)" }}
            onClick={closeLightbox}
          >
            <button className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10" onClick={closeLightbox}>
              <X size={20} />
            </button>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10 disabled:opacity-30"
              onClick={(e) => { e.stopPropagation(); lightboxNav(-1); }}
              disabled={filteredPhotos.findIndex((p) => p.id === lightbox.id) === 0}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10 disabled:opacity-30"
              onClick={(e) => { e.stopPropagation(); lightboxNav(1); }}
              disabled={filteredPhotos.findIndex((p) => p.id === lightbox.id) === filteredPhotos.length - 1}
            >
              <ChevronRight size={22} />
            </button>

            <motion.div
              key={lightbox.id}
              initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-4xl w-full mx-16 rounded-3xl overflow-hidden shadow-2xl"
              style={{ border: `1px solid ${lightbox.accent}30` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="relative w-full"
                style={{
                  aspectRatio: lightbox.aspectRatio === "portrait" ? "2/3" : lightbox.aspectRatio === "landscape" ? "16/9" : "1/1",
                  maxHeight: "65vh", background: lightbox.gradient, overflow: "hidden",
                }}
              >
                {lightbox.src || lightbox.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lightbox.src || lightbox.previewUrl} alt={lightbox.title} className="w-full h-full object-contain" />
                ) : (
                  <>
                    <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6) 0%, transparent 55%)" }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-2xl flex items-center justify-center opacity-30" style={{ background: `${lightbox.accent}30`, border: `1px solid ${lightbox.accent}50` }}>
                        <ImageIcon size={36} style={{ color: lightbox.accent }} />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="px-6 py-5" style={{ background: "rgba(5,5,18,0.97)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-bold text-xl">{lightbox.title}</h2>
                    <div className="flex items-center gap-3 mt-1 text-sm text-white/50">
                      <span className="flex items-center gap-1.5"><Folder size={13} />{lightbox.album}</span>
                      {lightbox.location && <span className="flex items-center gap-1.5"><MapPin size={13} />{lightbox.location}</span>}
                      <span className="flex items-center gap-1.5"><Calendar size={13} />{lightbox.date}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleLike(lightbox.id)}
                      className="p-2.5 rounded-xl transition-all"
                      style={{ background: photos.find((p) => p.id === lightbox.id)?.liked ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <Heart size={18} fill={photos.find((p) => p.id === lightbox.id)?.liked ? "#ef4444" : "none"} stroke={photos.find((p) => p.id === lightbox.id)?.liked ? "#ef4444" : "rgba(255,255,255,0.6)"} />
                    </button>
                    <button
                      onClick={() => toggleStar(lightbox.id)}
                      className="p-2.5 rounded-xl transition-all"
                      style={{ background: photos.find((p) => p.id === lightbox.id)?.starred ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <Star size={18} fill={photos.find((p) => p.id === lightbox.id)?.starred ? "#f97316" : "none"} stroke={photos.find((p) => p.id === lightbox.id)?.starred ? "#f97316" : "rgba(255,255,255,0.6)"} />
                    </button>
                    <button onClick={() => showToast("Share link copied!")} className="p-2.5 rounded-xl bg-white/6 border border-white/10 hover:bg-white/10 transition-colors">
                      <Share2 size={18} className="text-white/60" />
                    </button>
                    <button onClick={() => showToast("Download started!")} className="p-2.5 rounded-xl bg-white/6 border border-white/10 hover:bg-white/10 transition-colors">
                      <Download size={18} className="text-white/60" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-[12px] text-white/40 mb-3">
                  {lightbox.camera && <span><span className="text-white/60 font-medium">Camera:</span> {lightbox.camera}</span>}
                  <span><span className="text-white/60 font-medium">Resolution:</span> {lightbox.resolution}</span>
                  <span><span className="text-white/60 font-medium">Size:</span> {lightbox.size}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {lightbox.tags.map((tag) => (
                    <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/8">#{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
