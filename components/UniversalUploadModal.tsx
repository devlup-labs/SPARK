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
  X,
  Upload,
  CloudUpload,
  CheckCircle2,
  Plus,
  Film,
  Music,
  Clapperboard,
  Loader2,
  Image as FileImage,
} from "lucide-react";

export type MediaType = "movie" | "show" | "music" | "short" | "photo";

export interface MediaFile {
  file: File;
  id: string;
  previewUrl?: string;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  error?: string;
  title: string;
  category: string;
  tags: string[];
}

interface UniversalUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: MediaType;
  onUploadComplete: (files: MediaFile[]) => void;
}

const CATEGORIES: Record<MediaType, string[]> = {
  movie: ["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Documentary", "Animation"],
  show: ["Series", "Miniseries", "Reality", "News", "Talk Show"],
  music: ["Pop", "Rock", "Hip Hop", "Jazz", "Classical", "Electronic", "Lo-fi"],
  short: ["Abstract", "Nature", "Urban", "Tech", "Life"],
  photo: ["Nature", "Travel", "Architecture", "Portraits", "Night Sky", "Abstract"]
};

const ACCEPTED_TYPES: Record<MediaType, string[]> = {
  movie: ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"],
  show: ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"],
  music: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/aac"],
  short: ["video/mp4", "video/webm", "video/quicktime"],
  photo: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]
};

const TYPE_ICONS = {
  movie: Film,
  show: Clapperboard,
  music: Music,
  short: Clapperboard,
  photo: FileImage
};

const MAX_FILES = 20;

export default function UniversalUploadModal({
  isOpen,
  onClose,
  type,
  onUploadComplete,
}: UniversalUploadModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [globalCategory, setGlobalCategory] = useState(CATEGORIES[type][0]);
  const [globalTags, setGlobalTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const Icon = TYPE_ICONS[type];

  useEffect(() => {
    if (!isOpen) {
      // Cleanup previews only when closing
      files.forEach(f => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
      setFiles([]);
      setIsUploading(false);
      setGlobalTags([]);
      setTagInput("");
      setSelectionError(null);
    }
  // Only run when isOpen changes, not on every files change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const accepted = ACCEPTED_TYPES[type];
    const remainingSlots = MAX_FILES - files.length;
    const filteredFiles = Array.from(newFiles).filter(f => accepted.includes(f.type));

    if (remainingSlots <= 0) {
      setSelectionError(`You can upload up to ${MAX_FILES} files at a time.`);
      return;
    }

    const added: MediaFile[] = filteredFiles
      .slice(0, remainingSlots)
      .filter(f => accepted.includes(f.type))
      .map(f => ({
        file: f,
        id: Math.random().toString(36).substr(2, 9),
        status: "pending",
        progress: 0,
        title: f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        category: globalCategory,
        tags: [...globalTags],
        previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined
      }));

    setSelectionError(filteredFiles.length > remainingSlots ? `Only the first ${remainingSlots} file(s) were added. Maximum ${MAX_FILES} files per upload.` : null);
    setFiles(prev => [...prev, ...added]);
  }, [type, globalCategory, globalTags, files.length]);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragOver(true);
    else if (e.type === "dragleave") setDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const startUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setSelectionError(null);

    const baseUrl = process.env.NEXT_PUBLIC_MEDIA_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:4002` : "http://localhost:4002");

    const uploadingFiles = files.map((file) => ({
      ...file,
      status: "uploading" as const,
      progress: 30,
      error: undefined,
    }));
    setFiles(uploadingFiles);

    try {
      const formData = new FormData();
      files.forEach((item) => {
        formData.append("files", item.file);
      });

      const uploadType = type === "photo" ? "photo" : type === "short" ? "short" : "media";
      const response = await fetch(`${baseUrl}/upload?type=${uploadType}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      const uploadedFiles = Array.isArray(data.files) ? data.files : [];

      const completedUploads = uploadingFiles.map((item, index) => ({
        ...item,
        status: "completed" as const,
        progress: 100,
        id: uploadedFiles[index]?.filename ?? item.id,
      }));

      setFiles(completedUploads);
      onUploadComplete(completedUploads);
      setTimeout(onClose, 1200);
    } catch (error) {
      console.error("Upload error:", error);
      setFiles((prev) => prev.map((item) => ({
        ...item,
        status: "error" as const,
        progress: 0,
        error: "Upload failed",
      })));
      setSelectionError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      const removed = prev.find(f => f.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return filtered;
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !globalTags.includes(tagInput.trim())) {
      setGlobalTags([...globalTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-[#0a0a1a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 text-orange-400">
                <Icon size={24} />
              </div>
              <div>
                <h2 className="text-xl font-syne font-bold text-white uppercase tracking-tight">
                  Upload {type.charAt(0).toUpperCase() + type.slice(1)}s
                </h2>
                <p className="text-xs text-white/40">Multiple files supported</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Drag Zone */}
            {files.length === 0 ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`relative group cursor-pointer border-2 border-dashed rounded-3xl transition-all duration-300 flex flex-col items-center justify-center p-12 text-center
                  ${dragOver ? "border-orange-500 bg-orange-500/10 scale-[0.99]" : "border-white/10 hover:border-white/20 bg-white/2"}`}
              >
                <input
                  type="file"
                  ref={fileRef}
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                  multiple
                  accept={ACCEPTED_TYPES[type].join(",")}
                  className="hidden"
                />
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <CloudUpload size={40} className={dragOver ? "text-orange-400" : "text-white/20"} />
                </div>
                <h3 className="text-lg font-syne font-bold text-white mb-2">
                  Drop your {type}s here
                </h3>
                <p className="text-sm text-white/40 max-w-xs leading-relaxed">
                  Support for multiple files. Up to {MAX_FILES} files per batch.
                </p>
                {selectionError && (
                  <p className="mt-3 text-sm text-red-400">{selectionError}</p>
                )}
                <button className="mt-8 px-6 py-2.5 bg-white text-black font-bold rounded-xl text-sm hover:bg-orange-500 hover:text-white transition-all">
                  Browse Files
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Global Settings */}
                <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/5 h-fit">
                  <h3 className="text-sm font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                    <Plus size={14} /> Batch Settings
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-white/40 uppercase font-bold mb-1.5 block">Default Category</label>
                      <select 
                        value={globalCategory}
                        onChange={(e) => setGlobalCategory(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50"
                      >
                        {CATEGORIES[type].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-white/40 uppercase font-bold mb-1.5 block">Shared Tags</label>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addTag()}
                          placeholder="Add tag..."
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                        />
                        <button onClick={addTag} className="p-2 bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors">
                          <Plus size={20} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {globalTags.map(t => (
                          <span key={t} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] flex items-center gap-2 text-white/60">
                            #{t}
                            <button onClick={() => setGlobalTags(prev => prev.filter(x => x !== t))} className="hover:text-red-400"><X size={10} /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* File List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                     <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest">Selected Files ({files.length})</h3>
                     <button onClick={() => fileRef.current?.click()} className="text-xs text-orange-400 hover:underline flex items-center gap-1">
                        <Plus size={12} /> Add More
                     </button>
                  </div>
                  {selectionError && (
                    <p className="text-xs text-red-400">{selectionError}</p>
                  )}
                  <div className="space-y-2 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
                    {files.map((f) => (
                      <div key={f.id} className="group bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-4 relative overflow-hidden">
                        {f.status === "uploading" && (
                          <motion.div 
                            className="absolute bottom-0 left-0 h-0.5 bg-orange-500" 
                            initial={{ width: 0 }}
                            animate={{ width: `${f.progress}%` }}
                          />
                        )}
                        <div className="w-12 h-12 bg-black/40 rounded-lg flex items-center justify-center shrink-0 text-white/20 group-hover:text-orange-400 transition-colors">
                          {f.status === "completed" ? <CheckCircle2 size={24} className="text-green-500" /> : <Icon size={24} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">{f.title}</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-tight">{f.category} • {(f.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                        </div>
                        {!isUploading && (
                          <button onClick={() => removeFile(f.id)} className="p-1.5 hover:bg-red-500/20 text-white/20 hover:text-red-400 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 bg-white/5 flex items-center justify-end gap-4">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-6 py-2.5 text-sm font-bold text-white/40 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={startUpload}
              disabled={files.length === 0 || isUploading}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all
                ${files.length > 0 && !isUploading ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20" : "bg-white/5 text-white/20 cursor-not-allowed"}`}
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Start Batch Upload
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
