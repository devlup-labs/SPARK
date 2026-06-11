"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud,
  ArrowLeft,
  ChevronRight,
  X,
  Search,
  Settings,
  Upload,
  FolderPlus,
  LayoutGrid,
  List,
  Folder,
  File,
  Image as ImageIcon,
  Video,
  Music,
  Download,
  Trash2,
  Share2,
  Star,
  Clock,
  HardDrive,
  RefreshCw,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import SparkVideoPlayer from "@/components/SparkVideoPlayer";

const STORAGE_API_BASE = process.env.NEXT_PUBLIC_STORAGE_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:4001` : "http://localhost:4001");

interface FileItem {
  id: string;
  name: string;
  path?: string;
  type: "folder" | "file" | "image" | "video" | "audio";
  size: string;
  modified: string;
  color: string;
  isFavorite?: boolean;
}

const FileIcon = ({ type, color }: { type: string; color: string }) => {
  const iconProps = { size: 24, style: { color } };
  switch (type) {
    case "folder": return <Folder {...iconProps} fill={`${color}30`} />;
    case "image": return <ImageIcon {...iconProps} />;
    case "video": return <Video {...iconProps} />;
    case "audio": return <Music {...iconProps} />;
    default: return <File {...iconProps} />;
  }
};

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick?: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${active ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-white/40 hover:text-white/80 hover:bg-white/5"
    }`}>
    <Icon size={18} />
    {label}
  </button>
);

export default function CloudStoragePage() {
  const { addToast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal, setStorageTotal] = useState(512);
  const [activeSync, setActiveSync] = useState({ active: false, progress: 0, filename: "" });
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [previewContent, setPreviewContent] = useState<{ text?: string; type: "text" | "image" | "video" | "audio" | "binary" } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sideNavMode, setSideNavMode] = useState<"files" | "favorites" | "recent" | "trash">("files");

  const fetchFiles = async (pathSegments: string[] = currentPath, forcedMode?: typeof sideNavMode) => {
    try {
      setLoading(true);
      const activeMode = forcedMode ?? sideNavMode;
      let url = "";
      if (activeMode === "trash") {
        url = `${STORAGE_API_BASE}/trash`;
      } else if (activeMode === "favorites") {
        url = `${STORAGE_API_BASE}/favorites`;
      } else if (activeMode === "recent") {
        url = `${STORAGE_API_BASE}/recent`;
      } else {
        const subPath = pathSegments.join("/");
        url = subPath
          ? `${STORAGE_API_BASE}/files?path=${encodeURIComponent(subPath)}`
          : `${STORAGE_API_BASE}/files`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const mappedFiles = data.map((f: any) => ({
        id: f.path || f.name,
        name: f.name,
        path: f.path,
        type: f.isDirectory ? "folder" : (f.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? "image" : (f.name.match(/\.(mp3|wav|ogg|flac|aac)$/i) ? "audio" : (f.name.match(/\.(mp4|webm|mov|mkv|avi)$/i) ? "video" : "file"))),
        size: f.size < 1024 ? f.size + " B" : f.size < 1024 * 1024 ? (f.size / 1024).toFixed(1) + " KB" : (f.size / 1024 / 1024).toFixed(2) + " MB",
        modified: new Date(f.modified).toLocaleDateString(),
        color: f.isDirectory ? "#00f5ff" : "#bf00ff",
        isFavorite: f.isFavorite ?? false,
      }));
      setFiles(mappedFiles);
    } catch {
      addToast("Failed to fetch files — is the storage service running?", "error");
    } finally {
      setLoading(false);
    }
  };

  const navigateInto = (file: FileItem) => {
    let newPath;
    if (file.path) {
      newPath = file.path.split("/").filter(Boolean);
    } else {
      newPath = [...currentPath, file.name];
    }
    setCurrentPath(newPath);
    setSideNavMode("files");
    fetchFiles(newPath, "files");
  };

  const navigateTo = (index: number) => {
    // index = -1 means root
    const newPath = index < 0 ? [] : currentPath.slice(0, index + 1);
    setCurrentPath(newPath);
    setSideNavMode("files");
    fetchFiles(newPath, "files");
  };

  useEffect(() => {
    const pathToUse = sideNavMode !== "files" ? [] : currentPath;
    if (sideNavMode !== "files") setCurrentPath([]);
    // Pass mode explicitly to avoid stale closure issues
    fetchFiles(pathToUse, sideNavMode);

    const fetchStorage = () => {
      fetch("/api/system")
        .then(res => res.json())
        .then(data => {
          if (data.storage) {
            setStorageUsed(data.storage.used);
            setStorageTotal(data.storage.total);
          }
        })
        .catch(console.error);
    };

    fetchStorage();
    const interval = setInterval(fetchStorage, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sideNavMode]);

  const openPreview = async (file: FileItem) => {
    if (file.type === "folder") { navigateInto(file); return; }
    setPreviewFile(file);
    setPreviewContent(null);
    setPreviewLoading(true);
    const subPath = currentPath.join("/");
    try {
      const url = subPath
        ? `${STORAGE_API_BASE}/content/${encodeURIComponent(file.name)}?path=${encodeURIComponent(subPath)}`
        : `${STORAGE_API_BASE}/content/${encodeURIComponent(file.name)}`;
      const res = await fetch(url);
      if (!res.ok) { setPreviewContent({ type: "binary" }); return; }
      const data = await res.json();
      if (data.encoding === "text") {
        setPreviewContent({ type: "text", text: data.content });
      } else if (file.type === "image") {
        setPreviewContent({ type: "image" });
      } else if (file.type === "video") {
        setPreviewContent({ type: "video" });
      } else if (file.type === "audio") {
        setPreviewContent({ type: "audio" });
      } else {
        setPreviewContent({ type: "binary" });
      }
    } catch {
      setPreviewContent({ type: "binary" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleNewFolder = () => {
    setNewFolderName("");
    setNewFolderOpen(true);
  };

  const handleCreateFolder = async () => {
    const folderName = newFolderName.trim();
    if (!folderName) return;
    setNewFolderOpen(false);

    try {
      const res = await fetch(`${STORAGE_API_BASE}/mkdir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName, parentPath: currentPath.join("/") }),
      });
      if (res.ok) {
        addToast(`Created folder '${folderName}'`, "success");
        fetchFiles();
      } else {
        const error = await res.text();
        addToast(error || "Failed to create folder", "error");
      }
    } catch {
      addToast("Connection error — is the storage service running?", "error");
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setActiveSync({ active: true, progress: 0, filename: file.name });

    const interval = setInterval(() => {
      setActiveSync(prev => ({ ...prev, progress: Math.min(prev.progress + 10, 90) }));
    }, 200);

    const subPath = currentPath.join("/");
    const uploadUrl = subPath
      ? `${STORAGE_API_BASE}/upload?path=${encodeURIComponent(subPath)}`
      : `${STORAGE_API_BASE}/upload`;

    fetch(uploadUrl, { method: "POST", body: formData })
      .then(res => res.json())
      .then(() => {
        clearInterval(interval);
        setActiveSync({ active: false, progress: 0, filename: "" });
        addToast("File uploaded successfully", "success");
        fetchFiles();
      })
      .catch(() => {
        clearInterval(interval);
        setActiveSync({ active: false, progress: 0, filename: "" });
        addToast("Upload failed", "error");
      });
  };

  const handleDownload = (filename: string) => {
    const subPath = currentPath.join("/");
    const url = subPath
      ? `${STORAGE_API_BASE}/download/${filename}?path=${encodeURIComponent(subPath)}`
      : `${STORAGE_API_BASE}/download/${filename}`;
    window.open(url, '_blank');
    addToast(`Downloading ${filename}`, "success");
  };

  const handleDelete = async (filename: string) => {
    try {
      const subPath = currentPath.join("/");
      const endpoint = sideNavMode === "trash" ? "trash" : "files";
      const url = sideNavMode === "files" && subPath
        ? `${STORAGE_API_BASE}/${endpoint}/${filename}?path=${encodeURIComponent(subPath)}`
        : `${STORAGE_API_BASE}/${endpoint}/${filename}`;

      await fetch(url, { method: "DELETE" });
      addToast(sideNavMode === "trash" ? "Permanently deleted" : "Moved to trash", "success");
      fetchFiles();
    } catch {
      addToast("Failed to delete item", "error");
    }
  };

  const handleToggleFavorite = async (file: FileItem) => {
    const filePath = file.path || file.name;
    try {
      const res = await fetch(`${STORAGE_API_BASE}/favorites/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath })
      });
      if (res.ok) {
        const { isFavorite } = await res.json();
        addToast(isFavorite ? "Added to favorites" : "Removed from favorites", "success");
        fetchFiles();
      }
    } catch {
      addToast("Failed to update favorite", "error");
    }
  };

  const handleShare = (file: FileItem) => {
    const subPath = currentPath.join("/");
    const filename = encodeURIComponent(file.name);
    const pathQuery = subPath ? `?path=${encodeURIComponent(subPath)}` : "";
    const publicLink = `${STORAGE_API_BASE}/download/${filename}${pathQuery}`;

    navigator.clipboard.writeText(publicLink);
    addToast("Share link copied to clipboard!", "success");
  };

  const handleRestore = async (filename: string) => {
    try {
      const res = await fetch(`${STORAGE_API_BASE}/trash/restore/${encodeURIComponent(filename)}`, {
        method: "POST"
      });
      if (res.ok) {
        addToast("Item restored", "success");
        fetchFiles();
      } else {
        addToast("Failed to restore", "error");
      }
    } catch {
      addToast("Connection error", "error");
    }
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );





  return (
    <div className="min-h-screen bg-[#050510] text-white font-dm-sans">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#050510]/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Cloud size={20} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="font-syne font-bold text-lg">Cloud Storage</h1>
              <p className="text-[10px] text-cyan-400 uppercase tracking-wider">Storage Container</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>
          <button onClick={() => addToast("Settings feature coming soon", "info")} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white cursor-pointer">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 border-r border-white/5 p-4 flex-col">
          <div className="space-y-1 mb-6">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-4 mb-3">Quick Access</p>
            <SidebarItem icon={HardDrive} label="All Files" active={sideNavMode === "files"} onClick={() => setSideNavMode("files")} />
            <SidebarItem icon={Star} label="Favorites" active={sideNavMode === "favorites"} onClick={() => setSideNavMode("favorites")} />
            <SidebarItem icon={Clock} label="Recent" active={sideNavMode === "recent"} onClick={() => setSideNavMode("recent")} />
            <SidebarItem icon={Share2} label="Shared" onClick={() => addToast("Shared files coming soon", "info")} />
            <SidebarItem icon={Trash2} label="Trash" active={sideNavMode === "trash"} onClick={() => setSideNavMode("trash")} />
          </div>

          <div className="mt-auto p-4 bg-white/[0.03] rounded-xl border border-white/5 space-y-4">
            {/* Active Sync Widget */}
            <AnimatePresence>
              {activeSync.active && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pb-4 border-b border-white/5 overflow-hidden"
                >
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
                    <span className="text-cyan-400 flex items-center gap-1.5">
                      <RefreshCw size={10} className="animate-spin" /> Syncing
                    </span>
                    <span className="text-white/40">{Math.min(100, activeSync.progress)}%</span>
                  </div>
                  <p className="text-xs text-white/70 truncate">{activeSync.filename}</p>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, activeSync.progress)}%` }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Storage Readout */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Storage Used</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold text-cyan-400">{storageUsed.toFixed(1)}</span>
                <span className="text-sm text-white/40">/ {storageTotal >= 1000 ? (storageTotal / 1024).toFixed(1) + " TB" : storageTotal.toFixed(0) + " GB"}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(0,245,255,0.5)]"
                  animate={{ width: `${(storageTotal > 0 ? (storageUsed / storageTotal) * 100 : 0)}%` }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-all cursor-pointer">
                <Upload size={16} />
                Upload
                <input type="file" className="hidden" onChange={handleUpload} />
              </label>
              <button onClick={handleNewFolder} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-all cursor-pointer">
                <FolderPlus size={16} />
                New Folder
              </button>
              <button onClick={() => fetchFiles()} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white cursor-pointer">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
              <button onClick={async () => {
                try {
                  const res = await fetch(`${STORAGE_API_BASE}/files`);
                  if (res.ok) addToast("Storage Service Reachable!", "success");
                  else addToast("Storage Service returned " + res.status, "warning");
                } catch (e) {
                  addToast("Storage Service UNREACHABLE", "error");
                  console.error(e);
                }
              }} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white cursor-pointer" title="Test Connection">
                <Wifi size={16} />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-all cursor-pointer ${viewMode === "grid" ? "bg-cyan-500/20 text-cyan-400" : "text-white/40 hover:text-white"}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all cursor-pointer ${viewMode === "list" ? "bg-cyan-500/20 text-cyan-400" : "text-white/40 hover:text-white"}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-white/40 mb-6 flex-wrap">
            <button
              onClick={() => navigateTo(-1)}
              className={`hover:text-white transition-colors cursor-pointer ${currentPath.length === 0 ? "text-white" : ""}`}
            >
              Home
            </button>
            {currentPath.map((segment, idx) => (
              <React.Fragment key={segment + idx}>
                <ChevronRight size={14} className="text-white/20" />
                <button
                  onClick={() => navigateTo(idx)}
                  className={`hover:text-white transition-colors cursor-pointer ${idx === currentPath.length - 1 ? "text-white" : ""}`}
                >
                  {segment}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Files Grid/List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <RefreshCw size={28} className="animate-spin text-cyan-400 opacity-60" />
              <p className="text-sm text-white/30">Loading files…</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                <Folder size={28} className="text-white/20" />
              </div>
              <p className="text-sm text-white/30">This folder is empty</p>
              <button
                onClick={handleNewFolder}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/20 transition-all cursor-pointer"
              >
                <FolderPlus size={15} />
                Create a folder here
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredFiles.map((file, i) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group p-4 bg-[#0a0f1a]/60 border border-white/5 rounded-xl hover:border-cyan-500/30 hover:bg-white/[0.03] transition-all relative cursor-pointer"
                  onClick={() => openPreview(file)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 relative">
                      <FileIcon type={file.type} color={file.color} />
                      <div className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-30 transition-opacity" style={{ backgroundColor: file.color }} />
                    </div>
                    <span className="text-sm font-medium text-white/80 group-hover:text-white truncate w-full">{file.name}</span>
                    <span className="text-[10px] text-white/30 mt-1">{file.size}</span>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {sideNavMode !== "trash" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleFavorite(file); }}
                        className={`p-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors ${file.isFavorite ? "text-yellow-400" : "text-white/40"}`}
                        title="Favorite"
                      >
                        <Star size={14} fill={file.isFavorite ? "currentColor" : "none"} />
                      </button>
                    )}
                    {sideNavMode !== "trash" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleShare(file); }}
                        className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer text-white/40 hover:text-white"
                        title="Share"
                      >
                        <Share2 size={14} />
                      </button>
                    )}
                    {sideNavMode === "files" && file.type !== "folder" && <button onClick={(e) => { e.stopPropagation(); handleDownload(file.name); }} className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer text-cyan-400"><Download size={14} /></button>}
                    {sideNavMode === "trash" && <button onClick={(e) => { e.stopPropagation(); handleRestore(file.name); }} className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer text-green-400" title="Restore"><RefreshCw size={14} /></button>}
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(file.name); }} className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer text-red-500" title={sideNavMode === "trash" ? "Permanently Delete" : "Move to Trash"}><Trash2 size={14} /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file, i) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group flex items-center gap-4 p-3 bg-[#0a0f1a]/60 border border-white/5 rounded-xl hover:border-cyan-500/30 hover:bg-white/[0.03] transition-all cursor-pointer"
                  onClick={() => openPreview(file)}
                >
                  <FileIcon type={file.type} color={file.color} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-white/80 group-hover:text-white truncate block">{file.name}</span>
                  </div>
                  <span className="text-xs text-white/30 hidden sm:block">{file.modified}</span>
                  <span className="text-xs text-white/40 w-20 text-right">{file.size}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {file.type !== "folder" && <button onClick={(e) => { e.stopPropagation(); handleDownload(file.name); }} className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer"><Download size={14} className="text-cyan-400" /></button>}
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(file.name); }} className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer"><Trash2 size={14} className="text-red-500" /></button>
                    <button onClick={(e) => { e.stopPropagation(); addToast(`Share link copied!`, "success"); }} className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer"><Share2 size={14} className="text-white/40" /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* File Preview Panel */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => { setPreviewFile(null); setPreviewContent(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ ease: [0.25, 0.46, 0.45, 0.94], duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[85vh] bg-[#07071a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <FileIcon type={previewFile.type} color={previewFile.color} />
                  <div className="min-w-0">
                    <p className="font-syne font-bold text-sm truncate">{previewFile.name}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{previewFile.size} · {previewFile.modified}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {previewFile.type !== "folder" && (
                    <button
                      onClick={() => handleDownload(previewFile.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-all cursor-pointer"
                    >
                      <Download size={13} /> Download
                    </button>
                  )}
                  <button
                    onClick={() => { setPreviewFile(null); setPreviewContent(null); }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-5">
                {previewLoading ? (
                  <div className="flex items-center justify-center h-48 gap-3">
                    <RefreshCw size={22} className="animate-spin text-cyan-400 opacity-60" />
                    <span className="text-sm text-white/30">Loading…</span>
                  </div>
                ) : previewContent?.type === "text" ? (
                  <pre className="text-xs text-white/70 font-mono whitespace-pre-wrap break-words leading-relaxed bg-black/30 rounded-xl p-4 border border-white/5 max-h-[60vh] overflow-auto">{previewContent.text}</pre>
                ) : previewContent?.type === "image" ? (
                  <div className="flex items-center justify-center">
                    <img
                      src={`${STORAGE_API_BASE}/view/${encodeURIComponent(previewFile.name)}${currentPath.length ? `?path=${encodeURIComponent(currentPath.join("/"))}` : ""}`}
                      alt={previewFile.name}
                      className="max-w-full max-h-[60vh] rounded-xl object-contain"
                    />
                  </div>
                ) : previewContent?.type === "video" ? (
                  <SparkVideoPlayer
                    src={`${STORAGE_API_BASE}/view/${encodeURIComponent(previewFile.name)}${currentPath.length ? `?path=${encodeURIComponent(currentPath.join("/"))}` : ""}`}
                    title={previewFile.name}
                  />
                ) : previewContent?.type === "audio" ? (
                  <div className="flex flex-col items-center justify-center gap-6 py-10">
                    <div className="w-24 h-24 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <Music size={36} className="text-purple-400" />
                    </div>
                    <audio controls className="w-full max-w-md"
                      src={`${STORAGE_API_BASE}/view/${encodeURIComponent(previewFile.name)}${currentPath.length ? `?path=${encodeURIComponent(currentPath.join("/"))}` : ""}`}
                    />
                  </div>
                ) : previewContent?.type === "binary" ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <File size={28} className="text-white/30" />
                    </div>
                    <p className="text-sm text-white/40">Preview not available for this file type.</p>
                    <button
                      onClick={() => handleDownload(previewFile.name)}
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/20 transition-all cursor-pointer"
                    >
                      <Download size={15} /> Download to open
                    </button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Folder Modal */}
      <AnimatePresence>
        {newFolderOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setNewFolderOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ ease: [0.25, 0.46, 0.45, 0.94], duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm mx-4 bg-[#0a0a1f] border border-white/[0.12] rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <FolderPlus size={18} className="text-cyan-400" />
                </div>
                <h2 className="font-syne font-bold text-lg">New Folder</h2>
              </div>
              <input
                autoFocus
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") setNewFolderOpen(false);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-all mb-5"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setNewFolderOpen(false)}
                  className="px-4 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="px-5 py-2 text-sm font-medium bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
