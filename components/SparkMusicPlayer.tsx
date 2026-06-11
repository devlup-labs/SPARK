"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, VolumeX, Volume1, Volume2, Repeat, Shuffle, Infinity } from "lucide-react";

interface SparkMusicPlayerProps {
  src: string;
  title: string;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function SparkMusicPlayer({
  src,
  title,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
}: SparkMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    setIsPlaying(true); // Autoplay when src changes
  }, [src]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 1;
        setVolume(volume || 1);
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleEnded = () => {
    if (repeatMode === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (onNext && hasNext) {
      onNext();
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-[#0a0f1a]/80 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        autoPlay
      />

      {/* Progress Bar */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs text-white/50 font-mono w-10 text-right">{formatTime(currentTime)}</span>
        <div className="relative flex-1 group h-2 bg-white/5 rounded-full cursor-pointer flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
          />
          <motion.div
            className="absolute left-0 h-full bg-orange-500 rounded-full z-10"
            style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
            layout
            transition={{ type: "tween", ease: "linear", duration: 0.1 }}
          />
          {/* Thumb indicator (shows on hover) */}
          <div
            className="absolute h-3 w-3 bg-white rounded-full opacity-0 group-hover:opacity-100 z-30 transform -translate-y-1/2 top-1/2 -ml-1.5 shadow-md shadow-orange-500/50"
            style={{ left: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
          />
        </div>
        <span className="text-xs text-white/50 font-mono w-10">{formatTime(duration)}</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Track Info (Left) */}
        <div className="flex-1 flex min-w-0 justify-start">
          <div className="truncate">
            <h3 className="font-syne font-bold text-white text-base truncate">{title}</h3>
            <p className="text-xs text-orange-400 mt-1 truncate">Spark Media Server</p>
          </div>
        </div>

        {/* Controls (Center) */}
        <div className="flex items-center gap-4 justify-center">
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`p-2 rounded-full transition-colors ${isShuffle ? "text-orange-400" : "text-white/40 hover:text-white/80"}`}
          >
            <Shuffle size={18} />
          </button>
          
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className={`p-2 rounded-full transition-colors ${hasPrev ? "text-white/80 hover:text-white hover:bg-white/10" : "text-white/20 cursor-not-allowed"}`}
          >
            <SkipBack size={20} />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] shadow-orange-500/50"
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`p-2 rounded-full transition-colors ${hasNext ? "text-white/80 hover:text-white hover:bg-white/10" : "text-white/20 cursor-not-allowed"}`}
          >
            <SkipForward size={20} />
          </button>

          <button
            onClick={() => setRepeatMode(prev => prev === "off" ? "all" : prev === "all" ? "one" : "off")}
            className={`p-2 rounded-full transition-colors relative ${repeatMode !== "off" ? "text-orange-400" : "text-white/40 hover:text-white/80"}`}
          >
            {repeatMode === "one" ? <Infinity size={18} /> : <Repeat size={18} />}
            {repeatMode !== "off" && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full" />}
          </button>
        </div>

        {/* Volume (Right) */}
        <div className="flex-1 flex items-center justify-end gap-3 hidden sm:flex">
          <button onClick={toggleMute} className="text-white/40 hover:text-white transition-colors">
            {isMuted || volume === 0 ? <VolumeX size={18} /> : volume < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} />}
          </button>
          <div className="w-24 group relative h-1.5 bg-white/5 rounded-full cursor-pointer flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
            />
            <div
              className="absolute left-0 h-full bg-white/40 group-hover:bg-orange-400 rounded-full z-10 transition-colors"
              style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}