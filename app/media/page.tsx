"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  MonitorPlay,
  Play,
  Film,
  Tv,
  Music,
  Library,
  Clock,
  Star,
  Search,
  ArrowLeft,
  Settings,
  ChevronRight,
  Clapperboard,
  Image as ImageIcon,
  X,
  Download,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { RefreshCw, Plus } from "lucide-react";
import ShortsViewer from "@/components/ShortsViewer";
import PhotosGallery from "@/components/PhotosGallery";
import UniversalUploadModal, { MediaType } from "@/components/UniversalUploadModal";
import SparkVideoPlayer from "@/components/SparkVideoPlayer";
import SparkMusicPlayer from "@/components/SparkMusicPlayer";

interface MediaItem {
  id: string;
  title: string;
  type: "video" | "music";
  size: string;
  modified: string;
  modifiedDate: Date;
  year?: string;
}

interface ServerMediaFile {
  name: string;
  size: number;
  modified: string;
}

const categories = [
  { id: "all", label: "All Media", icon: Library },
  { id: "movies", label: "Movies", icon: Film },
  { id: "shows", label: "TV Shows", icon: Tv },
  { id: "music", label: "Music", icon: Music },
  { id: "shorts", label: "Shorts", icon: Clapperboard },
  { id: "photos", label: "Photos", icon: ImageIcon },
  { id: "recent", label: "Recently Added", icon: Clock },
  { id: "favorites", label: "Favorites", icon: Star },
];

export default function MediaPage() {
  const { addToast } = useToast();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<MediaType>("movie");
  const [libraryVersion, setLibraryVersion] = useState(0);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal, setStorageTotal] = useState(0);
  const [nowPlaying, setNowPlaying] = useState<MediaItem | null>(null);
  const [mediaCount, setMediaCount] = useState({ videos: 0, audio: 0, total: 0 });

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_MEDIA_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:4002` : "http://localhost:4002");

      let serverMedia: ServerMediaFile[] = [];
      try {
        const res = await fetch(`${baseUrl}/files/media`);
        if (res.ok) {
          serverMedia = await res.json();
        } else {
          // Fallback to old endpoint
          const oldRes = await fetch(`${baseUrl}/media`);
          if (oldRes.ok) serverMedia = await oldRes.json();
        }
      } catch {
        console.warn("Media server unreachable, showing only local items");
      }

      const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      };

      const mappedServerMedia: MediaItem[] = serverMedia
        .map((f) => {
          const modDate = new Date(f.modified);
          const isVideo = !!f.name.match(/\.(mp4|webm|mov|mkv|avi)$/i);
          return {
            id: f.name,
            title: f.name
              .replace(/^\d+-/, "")
              .replace(/\.[^/.]+$/, "")
              .replace(/_/g, " "),
            type: (isVideo ? "video" : "music") as "video" | "music",
            size: formatSize(f.size),
            modified: modDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            modifiedDate: modDate,
            year: modDate.getFullYear().toString(),
          };
        })
        .sort((a, b) => b.modifiedDate.getTime() - a.modifiedDate.getTime());

      setMedia(mappedServerMedia);
      setMediaCount({
        videos: mappedServerMedia.filter(m => m.type === "video").length,
        audio: mappedServerMedia.filter(m => m.type === "music").length,
        total: mappedServerMedia.length,
      });
    } catch {
      addToast("Failed to fetch media library", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void fetchMedia();

    // Fetch initial storage format
    const fetchSystemData = async () => {
      try {
        const res = await fetch("/api/system");
        const data = await res.json();
        if (data.storage) {
          setStorageUsed(data.storage.used);
          setStorageTotal(data.storage.total);
        }
      } catch (err) {
        console.error("Failed to fetch system data from media page", err);
      }
    };

    fetchSystemData();

    const interval = setInterval(() => {
      fetchSystemData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchMedia]);

  const MEDIA_API_BASE = process.env.NEXT_PUBLIC_MEDIA_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:4002` : "http://localhost:4002");

  const handlePlay = (item: MediaItem) => {
    setNowPlaying(item);
  };

  const getStreamUrl = (filename: string) => {
    let typePath = "media";
    if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) typePath = "photos";
    return `${MEDIA_API_BASE}/stream/${typePath}/${encodeURIComponent(filename)}`;
  };

  const handleDownloadMedia = (filename: string) => {
    window.open(getStreamUrl(filename), '_blank');
    addToast(`Downloading ${filename}`, "success");
  };

  const isVideoFile = (filename: string) => !!filename.match(/\.(mp4|webm|mov|mkv|avi)$/i);
  const isAudioFile = (filename: string) => !!filename.match(/\.(mp3|wav|ogg|flac|aac|m4a)$/i);

  const audioFiles = media.filter(m => isAudioFile(m.id));
  const currentAudioIndex = nowPlaying ? audioFiles.findIndex(m => m.id === nowPlaying.id) : -1;
  const hasNextAudio = currentAudioIndex >= 0 && currentAudioIndex < audioFiles.length - 1;
  const hasPrevAudio = currentAudioIndex > 0;

  const handleNextAudio = () => {
    if (hasNextAudio) {
      setNowPlaying(audioFiles[currentAudioIndex + 1]);
    }
  };

  const handlePrevAudio = () => {
    if (hasPrevAudio) {
      setNowPlaying(audioFiles[currentAudioIndex - 1]);
    }
  };

  // Recently added: items from last 7 days, sorted newest first
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentlyAdded = media.filter(m => m.modifiedDate > sevenDaysAgo);

  // Filtered media based on active category
  const filteredMedia = media.filter((item) => {
    // Text search filter
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    // Category filter
    if (activeCategory === "all" || activeCategory === "continue") return true;
    if (activeCategory === "movies" || activeCategory === "shows") return item.type === "video";
    if (activeCategory === "music") return item.type === "music";
    if (activeCategory === "recent") return recentlyAdded.some(r => r.id === item.id);
    return true;
  });

  // Latest 5 items for the highlight row
  const latestItems = media.slice(0, 5);

  const openUpload = (type: MediaType) => {
    setUploadType(type);
    setIsUploadOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white font-dm-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#050510]/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <MonitorPlay size={20} className="text-orange-400" />
            </div>
            <div>
              <h1 className="font-syne font-bold text-lg">Media</h1>
              <p className="text-[10px] text-orange-400 uppercase tracking-wider">Jellyfin Container</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-orange-500/50 transition-all"
            />
          </div>
          <button onClick={fetchMedia} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white cursor-pointer">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => addToast("Feature coming soon!", "info")} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white cursor-pointer">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 min-h-[calc(100vh-4rem)] border-r border-white/5 p-4">
          <nav className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeCategory === cat.id
                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
              >
                <cat.icon size={18} />
                {cat.label}
              </button>
            ))}
          </nav>

          {/* Storage & Stream Info */}
          <div className="mt-8 space-y-4">
            <div className="p-4 bg-white/3 rounded-xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-bl-full border-b border-l border-orange-500/20 flex items-start justify-end p-2">
                <div className={`w-2 h-2 rounded-full ${mediaCount.total > 0 ? "bg-green-500" : "bg-white/20"}`} />
              </div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Media Library</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-white">{mediaCount.total}</span>
                <span className="text-xs text-white/40">Items</span>
              </div>
              <p className="text-[10px] text-orange-400 font-mono">{mediaCount.videos} videos · {mediaCount.audio} audio</p>
            </div>

            <div className="p-4 bg-white/3 rounded-xl border border-white/5">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Media Storage</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold text-orange-400">{storageUsed.toFixed(1)}</span>
                <span className="text-sm text-white/40">GB used</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                  style={{ width: `${storageTotal > 0 ? (storageUsed / storageTotal) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-white/30 mt-2">{storageTotal >= 1000 ? (storageTotal / 1024).toFixed(1) + ' TB' : storageTotal.toFixed(0) + ' GB'} Total Capacity</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">

          {/* ── Shorts Feed ── */}
          {activeCategory === "shorts" && (
            <motion.div
              key="shorts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                    <Clapperboard size={18} className="text-orange-400" />
                  </div>
                  <div>
                    <h2 className="font-syne text-xl font-bold">Shorts</h2>
                    <p className="text-[11px] text-white/40">Scroll • Double-tap to like • Arrow keys to navigate</p>
                  </div>
                </div>
                <button
                  onClick={() => openUpload("short")}
                  className="px-4 py-1.5 bg-orange-500 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                >
                  <Plus size={16} /> Upload Shorts
                </button>
              </div>
              <ShortsViewer key={`shorts-${libraryVersion}`} />
            </motion.div>
          )}

          {/* ── Photos Gallery ── */}
          {activeCategory === "photos" && (
            <motion.div
              key="photos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <ImageIcon size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <h2 className="font-syne text-xl font-bold">Photos</h2>
                    <p className="text-[11px] text-white/40">Browse, organise and manage your photo library</p>
                  </div>
                </div>
                <button
                  onClick={() => openUpload("photo")}
                  className="px-4 py-1.5 bg-purple-500 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-600 transition-colors shadow-lg shadow-purple-500/20"
                >
                  <Plus size={16} /> Upload Photos
                </button>
              </div>
              <PhotosGallery key={`photos-${libraryVersion}`} />
            </motion.div>
          )}

          {/* ── Default: Latest + Full Library ── */}
          {activeCategory !== "shorts" && activeCategory !== "photos" && (
            <>
              {/* Latest Added (top 5, hero-sized cards) */}
              {latestItems.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-syne text-xl font-bold">Latest Added</h2>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openUpload(activeCategory === "music" ? "music" : activeCategory === "shows" ? "show" : "movie")}
                        className="px-4 py-1.5 bg-orange-500 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                      >
                        <Plus size={16} /> Upload {activeCategory === "music" ? "Music" : "Media"}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {latestItems.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => handlePlay(item)}
                        className="group relative aspect-2/3 rounded-xl overflow-hidden bg-white/5 cursor-pointer"
                      >
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-10" />
                        <div className="absolute inset-0 bg-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                        <div className={`absolute inset-0 ${item.type === "video" ? "bg-linear-to-br from-orange-900/30 to-purple-900/30" : "bg-linear-to-br from-purple-900/30 to-blue-900/30"}`} />
                        {item.type === "video" && (
                          <video
                            src={getStreamUrl(item.id) + "#t=2.0"}
                            preload="metadata"
                            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity mix-blend-overlay"
                            muted
                            playsInline
                          />
                        )}
                        {/* Type badge */}
                        <div className="absolute top-2 left-2 z-20">
                          <div className={`px-2 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm ${item.type === "video" ? "bg-orange-500/30 text-orange-300" : "bg-purple-500/30 text-purple-300"}`}>
                            {item.type === "video" ? "🎬 Video" : "🎵 Audio"}
                          </div>
                        </div>
                        {/* Size badge */}
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-bold text-white/60 z-20">
                          {item.size}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/50">
                            <Play size={24} fill="white" className="ml-1" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                          <h3 className="font-semibold text-sm mb-1 truncate">{item.title}</h3>
                          <p className="text-[10px] text-white/40">{item.modified}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Recently Added (last 7 days) */}
              {recentlyAdded.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h2 className="font-syne text-xl font-bold">Added This Week</h2>
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full border border-green-500/20">
                        {recentlyAdded.length} new
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {recentlyAdded.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handlePlay(item)}
                        className="group cursor-pointer"
                      >
                        <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-white/5 mb-2">
                          <div className={`absolute inset-0 ${item.type === "video" ? "bg-linear-to-br from-orange-900/20 to-purple-900/20" : "bg-linear-to-br from-purple-900/20 to-blue-900/20"}`} />
                          {item.type === "video" && (
                            <video
                              src={getStreamUrl(item.id) + "#t=2.0"}
                              preload="metadata"
                              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-40 transition-opacity mix-blend-overlay"
                              muted
                              playsInline
                            />
                          )}
                          <div className="absolute inset-0 bg-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-orange-500/90 flex items-center justify-center">
                              <Play size={20} fill="white" className="ml-0.5" />
                            </div>
                          </div>
                          {/* Type icon */}
                          <div className="absolute top-2 left-2">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${item.type === "video" ? "bg-orange-500/20" : "bg-purple-500/20"}`}>
                              {item.type === "video" ? <Film size={12} className="text-orange-400" /> : <Music size={12} className="text-purple-400" />}
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[9px] font-mono text-white/50">
                            {item.size}
                          </div>
                        </div>
                        <h3 className="font-medium text-sm text-white/80 group-hover:text-white truncate">{item.title}</h3>
                        <p className="text-[10px] text-white/40">{item.modified}</p>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Full Library */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="font-syne text-xl font-bold">Full Library</h2>
                    <span className="text-xs text-white/30">{filteredMedia.length} items</span>
                  </div>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center h-32 gap-3">
                    <RefreshCw size={22} className="animate-spin text-orange-400 opacity-60" />
                    <span className="text-sm text-white/30">Loading library…</span>
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-3">
                    <p className="text-sm text-white/30">No media found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {filteredMedia.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => handlePlay(item)}
                        className="group cursor-pointer"
                      >
                        <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-white/5 mb-2">
                          <div className={`absolute inset-0 ${item.type === "video" ? "bg-linear-to-br from-orange-900/20 to-purple-900/20" : "bg-linear-to-br from-purple-900/20 to-blue-900/20"}`} />
                          {item.type === "video" && (
                            <video
                              src={getStreamUrl(item.id) + "#t=2.0"}
                              preload="metadata"
                              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-40 transition-opacity mix-blend-overlay"
                              muted
                              playsInline
                            />
                          )}
                          <div className="absolute inset-0 bg-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-orange-500/90 flex items-center justify-center">
                              <Play size={20} fill="white" className="ml-0.5" />
                            </div>
                          </div>
                          <div className="absolute top-2 left-2">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${item.type === "video" ? "bg-orange-500/20" : "bg-purple-500/20"}`}>
                              {item.type === "video" ? <Film size={12} className="text-orange-400" /> : <Music size={12} className="text-purple-400" />}
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[9px] font-mono text-white/50">
                            {item.size}
                          </div>
                        </div>
                        <h3 className="font-medium text-sm text-white/80 group-hover:text-white truncate">{item.title}</h3>
                        <p className="text-[10px] text-white/40">{item.modified}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>

      {/* ── Inline Media Player Modal ── */}
      <AnimatePresence>
        {nowPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setNowPlaying(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ ease: [0.25, 0.46, 0.45, 0.94], duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] bg-[#07071a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
                    {isVideoFile(nowPlaying.id) ? <Video size={16} className="text-orange-400" /> : <Music size={16} className="text-orange-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-syne font-bold text-sm truncate">{nowPlaying.title}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{nowPlaying.year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownloadMedia(nowPlaying.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-all cursor-pointer"
                  >
                    <Download size={13} /> Download
                  </button>
                  <button
                    onClick={() => setNowPlaying(null)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Player Content */}
              <div className="flex-1 overflow-auto p-5">
                {isVideoFile(nowPlaying.id) ? (
                  <SparkVideoPlayer
                    src={getStreamUrl(nowPlaying.id)}
                    title={nowPlaying.title}
                  />
                ) : isAudioFile(nowPlaying.id) ? (
                  <div className="flex flex-col items-center justify-center gap-10 py-12">
                    <div className="relative group perspective-1000">
                      <motion.div
                        animate={{ rotateY: 0, rotateX: 0 }}
                        whileHover={{ rotateY: -10, rotateX: 5 }}
                        className="w-48 h-48 sm:w-64 sm:h-64 rounded-3xl bg-linear-to-br from-orange-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(249,115,22,0.15)] shadow-orange-500/50 backdrop-blur-3xl overflow-hidden relative"
                      >
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                        <Music size={80} className="text-orange-400/80 drop-shadow-2xl mb-4 group-hover:scale-110 transition-transform duration-500 z-10" />
                        <div className="absolute bottom-4 left-4 right-4 z-10">
                          <p className="text-xl font-syne font-bold truncate text-center text-white drop-shadow-md">{nowPlaying.title}</p>
                          <p className="text-xs text-orange-300 text-center font-medium tracking-widest uppercase mt-1">Now Playing</p>
                        </div>
                      </motion.div>
                    </div>

                    <SparkMusicPlayer
                      src={getStreamUrl(nowPlaying.id)}
                      title={nowPlaying.title}
                      onNext={handleNextAudio}
                      onPrev={handlePrevAudio}
                      hasNext={hasNextAudio}
                      hasPrev={hasPrevAudio}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                    <p className="text-sm text-white/40">Unsupported media format</p>
                    <button
                      onClick={() => handleDownloadMedia(nowPlaying.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/20 transition-all cursor-pointer"
                    >
                      <Download size={15} /> Download to open
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <UniversalUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        type={uploadType}
        onUploadComplete={(files) => {
          addToast(`Uploaded ${files.length} items to library! ✨`, "success");
          fetchMedia();
          setLibraryVersion((value) => value + 1);
        }}
      />
    </div>
  );
}
