"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Volume1,
    Maximize,
    Minimize,
    SkipBack,
    SkipForward,
    PictureInPicture2,
    Gauge,
    Repeat,
    Repeat1,
} from "lucide-react";

interface SparkVideoPlayerProps {
    src: string;
    title?: string;
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SparkVideoPlayer({ src, title }: SparkVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [prevVolume, setPrevVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [buffered, setBuffered] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverX, setHoverX] = useState(0);
    const [loopMode, setLoopMode] = useState<"none" | "one">("none");
    const [showBigPlay, setShowBigPlay] = useState(true);
    const [volumeHover, setVolumeHover] = useState(false);

    // ── Auto-hide controls ──
    const resetHideTimer = useCallback(() => {
        setShowControls(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (isPlaying) {
            hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [isPlaying]);

    useEffect(() => {
        if (!isPlaying) {
            setShowControls(true);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        } else {
            resetHideTimer();
        }
    }, [isPlaying, resetHideTimer]);

    // ── Video event listeners ──
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;

        const onTimeUpdate = () => { if (!isSeeking) setCurrentTime(v.currentTime); };
        const onDurationChange = () => setDuration(v.duration);
        const onProgress = () => {
            if (v.buffered.length > 0) {
                setBuffered(v.buffered.end(v.buffered.length - 1));
            }
        };
        const onPlay = () => { setIsPlaying(true); setShowBigPlay(false); };
        const onPause = () => setIsPlaying(false);
        const onEnded = () => {
            if (loopMode === "one") {
                v.currentTime = 0;
                v.play();
            } else {
                setIsPlaying(false);
                setShowBigPlay(true);
            }
        };

        v.addEventListener("timeupdate", onTimeUpdate);
        v.addEventListener("durationchange", onDurationChange);
        v.addEventListener("progress", onProgress);
        v.addEventListener("play", onPlay);
        v.addEventListener("pause", onPause);
        v.addEventListener("ended", onEnded);

        return () => {
            v.removeEventListener("timeupdate", onTimeUpdate);
            v.removeEventListener("durationchange", onDurationChange);
            v.removeEventListener("progress", onProgress);
            v.removeEventListener("play", onPlay);
            v.removeEventListener("pause", onPause);
            v.removeEventListener("ended", onEnded);
        };
    }, [isSeeking, loopMode]);

    // ── Fullscreen listener ──
    useEffect(() => {
        const onFS = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", onFS);
        return () => document.removeEventListener("fullscreenchange", onFS);
    }, []);

    // ── Keyboard shortcuts ──
    useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
            // Only respond when the player is visible
            const v = videoRef.current;
            const c = containerRef.current;
            if (!v || !c) return;

            // Guard: only capture keys if player container is focused or hovered
            // This prevents conflicts with other keyboard-driven components (e.g. ShortsViewer)
            if (!c.matches(":hover") && !c.contains(document.activeElement)) return;

            // Prevent default for media keys
            const mediaKeys = ["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyM", "KeyF", "KeyL"];
            if (mediaKeys.includes(e.code)) e.preventDefault();

            switch (e.code) {
                case "Space":
                    togglePlay();
                    break;
                case "ArrowLeft":
                    v.currentTime = Math.max(0, v.currentTime - (e.shiftKey ? 10 : 5));
                    resetHideTimer();
                    break;
                case "ArrowRight":
                    v.currentTime = Math.min(v.duration, v.currentTime + (e.shiftKey ? 10 : 5));
                    resetHideTimer();
                    break;
                case "ArrowUp":
                    setVolume(prev => {
                        const nv = Math.min(1, prev + 0.1);
                        v.volume = nv;
                        return nv;
                    });
                    resetHideTimer();
                    break;
                case "ArrowDown":
                    setVolume(prev => {
                        const nv = Math.max(0, prev - 0.1);
                        v.volume = nv;
                        return nv;
                    });
                    resetHideTimer();
                    break;
                case "KeyM":
                    toggleMute();
                    break;
                case "KeyF":
                    toggleFullscreen();
                    break;
                case "KeyL":
                    setLoopMode(prev => prev === "none" ? "one" : "none");
                    break;
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [volume, isPlaying, resetHideTimer]);

    // ── Actions ──
    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) { v.play().catch(() => { }); } else { v.pause(); }
    };

    const toggleMute = () => {
        const v = videoRef.current;
        if (!v) return;
        if (isMuted) {
            v.muted = false;
            setIsMuted(false);
            v.volume = prevVolume;
            setVolume(prevVolume);
        } else {
            setPrevVolume(volume);
            v.muted = true;
            setIsMuted(true);
        }
    };

    const changeVolume = (val: number) => {
        const v = videoRef.current;
        if (!v) return;
        v.volume = val;
        v.muted = val === 0;
        setVolume(val);
        setIsMuted(val === 0);
    };

    const changeSpeed = (speed: number) => {
        const v = videoRef.current;
        if (!v) return;
        v.playbackRate = speed;
        setPlaybackSpeed(speed);
        setShowSpeedMenu(false);
    };

    const toggleFullscreen = () => {
        const c = containerRef.current;
        if (!c) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            c.requestFullscreen();
        }
    };

    const togglePiP = async () => {
        const v = videoRef.current;
        if (!v) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await v.requestPictureInPicture();
            }
        } catch { }
    };

    const skip = (seconds: number) => {
        const v = videoRef.current;
        if (!v) return;
        v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
        resetHideTimer();
    };

    // ── Progress bar interactions ──
    const getTimeFromPosition = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = progressRef.current?.getBoundingClientRect();
        if (!rect || !duration) return 0;
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        return (x / rect.width) * duration;
    };

    const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsSeeking(true);
        const t = getTimeFromPosition(e);
        setCurrentTime(t);

        const onMove = (me: MouseEvent) => {
            const rect = progressRef.current?.getBoundingClientRect();
            if (!rect || !duration) return;
            const x = Math.max(0, Math.min(me.clientX - rect.left, rect.width));
            setCurrentTime((x / rect.width) * duration);
        };

        const onUp = (me: MouseEvent) => {
            const rect = progressRef.current?.getBoundingClientRect();
            if (rect && duration && videoRef.current) {
                const x = Math.max(0, Math.min(me.clientX - rect.left, rect.width));
                videoRef.current.currentTime = (x / rect.width) * duration;
            }
            setIsSeeking(false);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = progressRef.current?.getBoundingClientRect();
        if (!rect || !duration) return;
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        setHoverTime((x / rect.width) * duration);
        setHoverX(x);
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;
    const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

    return (
        <div
            ref={containerRef}
            className="spark-player"
            onMouseMove={resetHideTimer}
            onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
            onClick={(e) => {
                // Only toggle play if click is on the video area, not controls
                if ((e.target as HTMLElement).closest(".spark-player-controls")) return;
                if ((e.target as HTMLElement).closest(".spark-speed-menu")) return;
                togglePlay();
                resetHideTimer();
            }}
            onDoubleClick={(e) => {
                if ((e.target as HTMLElement).closest(".spark-player-controls")) return;
                toggleFullscreen();
            }}
        >
            <video
                ref={videoRef}
                src={src}
                className="spark-player-video"
                playsInline
                preload="metadata"
            />

            {/* Big center play button */}
            {showBigPlay && !isPlaying && (
                <div className="spark-big-play">
                    <div className="spark-big-play-btn">
                        <Play size={40} fill="white" strokeWidth={0} />
                    </div>
                </div>
            )}

            {/* Gradient overlay for controls visibility */}
            <div className={`spark-player-gradient ${showControls ? "visible" : ""}`} />

            {/* Title bar */}
            {title && (
                <div className={`spark-player-title ${showControls ? "visible" : ""}`}>
                    <span>{title}</span>
                </div>
            )}

            {/* Controls layer */}
            <div className={`spark-player-controls ${showControls ? "visible" : ""}`}>
                {/* Progress bar */}
                <div
                    ref={progressRef}
                    className="spark-progress-container"
                    onMouseDown={handleProgressMouseDown}
                    onMouseMove={handleProgressHover}
                    onMouseLeave={() => setHoverTime(null)}
                >
                    {/* Buffered */}
                    <div className="spark-progress-buffered" style={{ width: `${bufferedPercent}%` }} />
                    {/* Played */}
                    <div className="spark-progress-played" style={{ width: `${progress}%` }}>
                        <div className="spark-progress-thumb" />
                    </div>
                    {/* Hover tooltip */}
                    {hoverTime !== null && (
                        <div className="spark-progress-tooltip" style={{ left: `${hoverX}px` }}>
                            {formatTime(hoverTime)}
                        </div>
                    )}
                </div>

                {/* Bottom controls */}
                <div className="spark-controls-row">
                    {/* Left section */}
                    <div className="spark-controls-left">
                        <button className="spark-ctrl-btn" onClick={(e) => { e.stopPropagation(); skip(-10); }} title="Rewind 10s">
                            <SkipBack size={18} />
                        </button>
                        <button className="spark-ctrl-btn spark-play-btn" onClick={(e) => { e.stopPropagation(); togglePlay(); }} title={isPlaying ? "Pause (Space)" : "Play (Space)"}>
                            {isPlaying ? <Pause size={22} fill="white" strokeWidth={0} /> : <Play size={22} fill="white" strokeWidth={0} />}
                        </button>
                        <button className="spark-ctrl-btn" onClick={(e) => { e.stopPropagation(); skip(10); }} title="Forward 10s">
                            <SkipForward size={18} />
                        </button>

                        {/* Volume */}
                        <div
                            className="spark-volume-group"
                            onMouseEnter={() => setVolumeHover(true)}
                            onMouseLeave={() => setVolumeHover(false)}
                        >
                            <button className="spark-ctrl-btn" onClick={(e) => { e.stopPropagation(); toggleMute(); }} title="Mute (M)">
                                <VolumeIcon size={18} />
                            </button>
                            <div className={`spark-volume-slider-wrap ${volumeHover ? "expanded" : ""}`}>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => { e.stopPropagation(); changeVolume(parseFloat(e.target.value)); }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="spark-volume-slider"
                                    style={{ "--vol-pct": `${(isMuted ? 0 : volume) * 100}%` } as React.CSSProperties}
                                />
                            </div>
                        </div>

                        {/* Time */}
                        <span className="spark-time-display">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* Right section */}
                    <div className="spark-controls-right">
                        {/* Loop */}
                        <button
                            className={`spark-ctrl-btn ${loopMode === "one" ? "active" : ""}`}
                            onClick={(e) => { e.stopPropagation(); setLoopMode(prev => prev === "none" ? "one" : "none"); }}
                            title="Loop (L)"
                        >
                            {loopMode === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
                        </button>

                        {/* Speed */}
                        <div className="spark-speed-wrap" onClick={(e) => e.stopPropagation()}>
                            <button
                                className={`spark-ctrl-btn spark-speed-btn ${playbackSpeed !== 1 ? "active" : ""}`}
                                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                title="Playback Speed"
                            >
                                <Gauge size={18} />
                                {playbackSpeed !== 1 && <span className="spark-speed-badge">{playbackSpeed}x</span>}
                            </button>
                            {showSpeedMenu && (
                                <div className="spark-speed-menu">
                                    <div className="spark-speed-menu-title">Playback Speed</div>
                                    {SPEED_OPTIONS.map(sp => (
                                        <button
                                            key={sp}
                                            className={`spark-speed-option ${playbackSpeed === sp ? "active" : ""}`}
                                            onClick={() => changeSpeed(sp)}
                                        >
                                            {sp === 1 ? "Normal" : `${sp}x`}
                                            {playbackSpeed === sp && <span className="spark-speed-check">✓</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* PiP */}
                        <button className="spark-ctrl-btn" onClick={(e) => { e.stopPropagation(); togglePiP(); }} title="Picture-in-Picture">
                            <PictureInPicture2 size={18} />
                        </button>

                        {/* Fullscreen */}
                        <button className="spark-ctrl-btn" onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} title="Fullscreen (F)">
                            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
