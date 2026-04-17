import React, { useState, useEffect, useRef } from 'react';
import { 
  Scissors, 
  Download, 
  Video, 
  Search, 
  AlertCircle,
  Loader2,
  FileVideo,
  RotateCcw,
  Music,
} from 'lucide-react';
import { motion } from 'motion/react';

import ReactPlayer from 'react-player';

function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id || null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const v = u.searchParams.get('v');
      if (v) return v;

      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts[0];
      if (idx === 'shorts' || idx === 'embed') {
        return parts[1] || null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function getYouTubeThumbnailUrl(url: string): string | null {
  const id = getYouTubeVideoId(url);
  if (!id) return null;
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
}

function getYouTubeClipEmbedUrl(url: string, start: number, end: number): string | null {
  const id = getYouTubeVideoId(url);
  if (!id) return null;

  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    controls: "1",
    autoplay: "1",
    start: String(Math.max(0, Math.floor(start))),
    end: String(Math.max(Math.floor(start) + 1, Math.ceil(end))),
  });

  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0:00";

  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds / 60) % 60).toString();
  const hours = Math.floor(totalSeconds / 3600);

  return hours ? `${hours}:${minutes.padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}

function formatPreciseTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0:00.0";

  const tenths = Math.round(totalSeconds * 10) % 10;
  const wholeSeconds = Math.floor(totalSeconds);
  const seconds = (wholeSeconds % 60).toString().padStart(2, "0");
  const minutes = Math.floor((wholeSeconds / 60) % 60).toString();
  const hours = Math.floor(wholeSeconds / 3600);

  return hours
    ? `${hours}:${minutes.padStart(2, "0")}:${seconds}.${tenths}`
    : `${minutes}:${seconds}.${tenths}`;
}

function parseTimeInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return NaN;

  if (!trimmed.includes(":")) {
    return Number(trimmed);
  }

  const parts = trimmed.split(":").map((part) => part.trim());
  if (parts.some((part) => part === "")) return NaN;

  const numbers = parts.map(Number);
  if (numbers.some((part) => !Number.isFinite(part))) return NaN;

  return numbers.reduce((total, part) => total * 60 + part, 0);
}

type VideoQuality = {
  height: number;
  label: string;
  width?: number;
  fps?: number;
  approxSize?: number;
};

function formatBytes(bytes?: number) {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return "";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}

function ButtonProgress() {
  return (
    <span className="relative inline-flex h-5 w-5 items-center justify-center">
      <span className="absolute inset-0 rounded-full border-2 border-current/25" />
      <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin" />
    </span>
  );
}

export default function App() {
  const [inputUrl, setInputUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [isTrimming, setIsTrimming] = useState(false);
  const [activeDownload, setActiveDownload] = useState<string | null>(null);
  const [videoQualities, setVideoQualities] = useState<VideoQuality[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [previewRange, setPreviewRange] = useState({ start: 0, end: 10 });
  const [activeHandle, setActiveHandle] = useState<"start" | "end" | null>(null);
  const [startInput, setStartInput] = useState(formatPreciseTime(0));
  const [endInput, setEndInput] = useState(formatPreciseTime(10));
  const [editingInput, setEditingInput] = useState<"start" | "end" | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const infoRequestIdRef = useRef(0);

  useEffect(() => {
    if (!videoUrl) {
      setIsPlayerReady(false);
      setThumbnailUrl(null);
      setEmbedUrl(null);
      setDuration(0);
      setVideoQualities([]);
      return;
    }

    const nextEmbedUrl = `/api/stream?url=${encodeURIComponent(videoUrl)}`;
    setIsPlayerReady(false);
    setThumbnailUrl(getYouTubeThumbnailUrl(videoUrl));
    setEmbedUrl(nextEmbedUrl);
    setDuration(0);
    setVideoQualities([]);
    setPreviewRange({ start: 0, end: 10 });

    if (!nextEmbedUrl) {
      setError("Please provide a valid YouTube link.");
      return;
    }

    const requestId = ++infoRequestIdRef.current;
    let isDisposed = false;
    const timeout = window.setTimeout(() => {
      if (isDisposed || infoRequestIdRef.current !== requestId) return;
      setIsLoadingInfo(false);
      setError("Reading video duration timed out. You can still preview and trim.");
    }, 15000);

    setIsLoadingInfo(true);
    fetch(`/api/video-info?url=${encodeURIComponent(videoUrl)}`)
      .then(async (response) => {
        let payload: { duration?: number; qualities?: VideoQuality[]; warning?: string; error?: string } = {};
        try {
          payload = (await response.json()) as typeof payload;
        } catch {
          // ignore JSON parse failures and fall back to status text
        }
        if (!response.ok) {
          throw new Error(payload.error || `Failed to read video info (${response.status})`);
        }
        return payload;
      })
      .then((info) => {
        if (isDisposed || infoRequestIdRef.current !== requestId) return;
        const nextDuration = Math.max(0, Number(info.duration) || 0);
        setDuration(nextDuration);
        setVideoQualities(info.qualities || []);
        const nextEnd = Math.min(10, nextDuration || 10);
        setEndTime(nextEnd);
        setPreviewRange({ start: 0, end: nextEnd });
        if (info.warning) {
          setError(info.warning);
        }
      })
      .catch((err: unknown) => {
        if (isDisposed || infoRequestIdRef.current !== requestId) return;
        const message = err instanceof Error ? err.message : "Loaded the preview, but could not read the video duration.";
        setError(message);
      })
      .finally(() => {
        // ALWAYS clear loading state, even if disposed or superseded, 
        // to prevent UI lockup if the user interacts before it finishes.
        window.clearTimeout(timeout);
        if (infoRequestIdRef.current === requestId) {
          setIsLoadingInfo(false);
        }
      });

    return () => {
      isDisposed = true;
      window.clearTimeout(timeout);
    };
  }, [videoUrl]);

  useEffect(() => {
    if (!duration) return;

    setStartTime((s) => Math.min(Math.max(0, s), Math.max(0, duration - 0.1)));
    setEndTime((e) => Math.min(Math.max(e, 0.1), duration));
  }, [duration]);

  useEffect(() => {
    if (editingInput !== "start") {
      setStartInput(formatPreciseTime(startTime));
    }
  }, [editingInput, startTime]);

  useEffect(() => {
    if (editingInput !== "end") {
      setEndInput(formatPreciseTime(endTime));
    }
  }, [editingInput, endTime]);

  useEffect(() => {
    if (!videoUrl) return;

    const timeout = window.setTimeout(() => {
      setPreviewRange({ start: startTime, end: endTime });
      setEmbedUrl(`/api/stream?url=${encodeURIComponent(videoUrl)}`);
      setIsPlayerReady(false);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [endTime, startTime, videoUrl]);

  // Handle URL changes
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = inputUrl.trim();
    if (trimmedUrl) {
      setVideoUrl(trimmedUrl);
      setError(null);
    } else {
      setError("Please provide a YouTube link.");
    }
  };

  const updateStartTime = (value: number) => {
    if (!Number.isFinite(value)) return;
    const minimumClipLength = 0.1;
    const currentClipLength = Math.max(minimumClipLength, endTime - startTime);
    const videoEnd = duration || Math.max(endTime, value + currentClipLength);
    const maxStart = Math.max(0, videoEnd - minimumClipLength);
    const nextStart = Math.min(Math.max(0, value), maxStart);
    setStartTime(Number(nextStart.toFixed(1)));

    if (nextStart >= endTime) {
      const nextEnd = Math.min(videoEnd, nextStart + currentClipLength);
      setEndTime(Number(nextEnd.toFixed(1)));
    }
  };

  const updateEndTime = (value: number) => {
    if (!Number.isFinite(value)) return;
    const minimumClipLength = 0.1;
    const currentClipLength = Math.max(minimumClipLength, endTime - startTime);
    const videoEnd = duration || Math.max(value, endTime);
    const nextEnd = Math.min(Math.max(minimumClipLength, value), videoEnd);
    setEndTime(Number(nextEnd.toFixed(1)));

    if (nextEnd <= startTime) {
      const nextStart = Math.max(0, nextEnd - currentClipLength);
      setStartTime(Number(nextStart.toFixed(1)));
    }
  };

  const applyStartInput = () => {
    const parsedTime = parseTimeInput(startInput);
    updateStartTime(parsedTime);
    setEditingInput(null);
    setStartInput(formatPreciseTime(Number.isFinite(parsedTime) ? parsedTime : startTime));
  };

  const applyEndInput = () => {
    const parsedTime = parseTimeInput(endInput);
    updateEndTime(parsedTime);
    setEditingInput(null);
    setEndInput(formatPreciseTime(Number.isFinite(parsedTime) ? parsedTime : endTime));
  };

  const timeFromPointer = (clientX: number) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect || !duration) return 0;

    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return Number((ratio * duration).toFixed(1));
  };

  const moveHandle = (handle: "start" | "end", clientX: number) => {
    const nextTime = timeFromPointer(clientX);

    if (handle === "start") {
      updateStartTime(nextTime);
    } else {
      updateEndTime(nextTime);
    }
  };

  useEffect(() => {
    if (!activeHandle) return;

    const handlePointerMove = (event: PointerEvent) => {
      moveHandle(activeHandle, event.clientX);
    };

    const handlePointerUp = () => {
      setActiveHandle(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [activeHandle, duration, endTime, startTime]);

  const previewSelectedClip = () => {
    if (!videoUrl) return;

    setPreviewRange({ start: startTime, end: endTime });
    setIsPlayerReady(false);
    // Force player to re-mount by momentarily setting it to null
    setEmbedUrl(null);
    setTimeout(() => setEmbedUrl(`/api/stream?url=${encodeURIComponent(videoUrl)}`), 50);
  };

  // Trimming logic
  const handleDownloadClip = async () => {
    if (!videoUrl) return;
    setIsTrimming(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        url: videoUrl,
        start: String(startTime),
        end: String(endTime),
      });
      
      // First, fetch the endpoint to check if it throws an error before triggering a download
      const response = await fetch(`/api/trim?${params.toString()}`);
      if (!response.ok) {
        let errorMessage = "Failed to download clip.";
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // ignore parse errors
        }
        throw new Error(errorMessage);
      }

      // If it's OK, we can trigger the actual browser download prompt.
      // Since we already fetched the response, we can create a blob URL to save it.
      const blob = await response.blob();
      
      // Extract filename from the Content-Disposition header if present
      let filename = "clip.mp4";
      const disposition = response.headers.get('Content-Disposition');
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      // Clean up the object URL after a short delay
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      
    } catch (err: any) {
      setError(err.message || "Failed to download clip. YouTube might be blocking the request.");
    } finally {
      setIsTrimming(false);
    }
  };

  const downloadMedia = async (kind: "video" | "audio", quality = "best") => {
    if (!videoUrl) return;

    const downloadKey = kind === "audio" ? "audio" : `video-${quality}`;
    setActiveDownload(downloadKey);
    setError(null);

    try {
      const params = new URLSearchParams({
        url: videoUrl,
        kind,
        quality,
      });
      const a = document.createElement('a');
      a.href = `/api/download-media?${params.toString()}`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setError("Failed to download media. Try a lower quality or another video.");
    } finally {
      // Keep brief visual feedback that the request was sent.
      window.setTimeout(() => setActiveDownload(null), 800);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="w-full text-center space-y-2">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red text-sm font-medium"
        >
          <Video className="w-4 h-4" />
          YouTube Clipper
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
          Clip and Download
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto">
          Paste a YouTube URL, preview the video, choose your timestamps, and download a trimmed clip.
        </p>
      </header>

      {/* URL Input */}
      <form onSubmit={handleUrlSubmit} className="w-full max-w-2xl relative group outline-none focus:outline-none focus-within:outline-none">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-red to-brand-purple rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center bg-zinc-900 rounded-xl p-2 outline-none ring-0 shadow-none focus-within:outline-none focus-within:ring-0 focus-within:shadow-none">
          <Search className="w-5 h-5 text-zinc-500 ml-3" />
          <input 
            type="text" 
            placeholder="Paste YouTube URL here..." 
            className="flex-1 appearance-none bg-transparent border-none text-white px-4 py-2 outline-none ring-0 shadow-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:shadow-none"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
          >
            Load
          </button>
        </div>
      </form>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-2 rounded-lg"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}

      {videoUrl && (
        <div className="w-full max-w-4xl">
          {/* Main Player Area */}
          <div className="space-y-6">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
              {thumbnailUrl && !isPlayerReady && (
                <img
                  src={thumbnailUrl}
                  alt="Video preview"
                  className="absolute inset-0 w-full h-full object-cover z-10"
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              )}
              {!isPlayerReady && !error && embedUrl && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-full px-4 py-2 text-sm text-white/90">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading player...
                  </div>
                </div>
              )}
              
              {embedUrl && (
                <div className="absolute inset-0 w-full h-full z-30">
                  {embedUrl.includes("youtube.com/embed") ? (
                    <iframe
                      src={embedUrl}
                      title="YouTube preview"
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      onLoad={() => setIsPlayerReady(true)}
                    />
                  ) : (
                    <ReactPlayer
                    // @ts-ignore - ReactPlayer types conflict with React 19 currently
                    url={embedUrl}
                    controls={true}
                    playing={true}
                      width="100%"
                      height="100%"
                      onReady={() => setIsPlayerReady(true)}
                      onError={(e) => {
                        console.error("ReactPlayer Error:", e);
                        // If the native proxy stream fails, fallback to the standard YouTube embed
                        // This ensures the player always works, even if YouTube blocks our backend proxy
                        setEmbedUrl(getYouTubeClipEmbedUrl(videoUrl, startTime, endTime));
                      }}
                      config={
                        {
                          file: {
                            forceVideo: true,
                            attributes: {
                              crossOrigin: "anonymous",
                              preload: "auto",
                            },
                          },
                        } as any
                      }
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-400">
              <div>
                Previewing {formatTime(previewRange.start)} to {formatTime(previewRange.end)}
              </div>
              <div className="rounded-lg border border-brand-red bg-brand-red/10 px-3 py-1.5 text-brand-red">
                {embedUrl && embedUrl.includes("youtube.com/embed") ? "Default Player (YouTube Embed)" : "Native Player (Proxy Stream)"}
              </div>
            </div>

            {/* Trimming Controls */}
            <div className="relative glass rounded-2xl p-6 space-y-6 overflow-hidden">
              {isTrimming && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-50">
                  <div className="flex items-center gap-3 text-white">
                    <ButtonProgress />
                    <span className="font-semibold tracking-wide">Trimming & Downloading...</span>
                  </div>
                  <p className="text-zinc-400 text-sm mt-2">Please wait, this may take a moment.</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-brand-red" />
                  <h3 className="font-display font-semibold">Trim Settings</h3>
                </div>
                <div className="text-sm font-mono text-zinc-400">
                  {isLoadingInfo ? "Reading video duration..." : `Video: ${formatTime(duration)} | Clip: ${formatTime(endTime - startTime)}`}
                </div>
              </div>

              <div className="space-y-8 py-4">
                <div
                  ref={timelineRef}
                  className="relative h-8 cursor-pointer touch-none"
                  onPointerDown={(e) => {
                    if (!duration) return;
                    const nextTime = timeFromPointer(e.clientX);
                    const handle = Math.abs(nextTime - startTime) <= Math.abs(nextTime - endTime) ? "start" : "end";
                    setActiveHandle(handle);
                    moveHandle(handle, e.clientX);
                  }}
                >
                  <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-zinc-800" />
                  <div 
                    className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-brand-red"
                    style={{ 
                      left: `${(startTime / (duration || 1)) * 100}%`, 
                      width: `${((endTime - startTime) / (duration || 1)) * 100}%` 
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Drag start time"
                    disabled={!duration}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setActiveHandle("start");
                      moveHandle("start", e.clientX);
                    }}
                    className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-red shadow-lg shadow-black/40 disabled:opacity-50"
                    style={{ left: `${(startTime / (duration || 1)) * 100}%` }}
                  />
                  <button
                    type="button"
                    aria-label="Drag end time"
                    disabled={!duration}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setActiveHandle("end");
                      moveHandle("end", e.clientX);
                    }}
                    className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-red shadow-lg shadow-black/40 disabled:opacity-50"
                    style={{ left: `${(endTime / (duration || 1)) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Start Time</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={startInput}
                      onChange={(e) => {
                        setStartInput(e.target.value);
                      }}
                      onFocus={() => setEditingInput("start")}
                      onBlur={applyStartInput}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                        if (e.key === "Escape") {
                          setEditingInput(null);
                          setStartInput(formatPreciseTime(startTime));
                          e.currentTarget.blur();
                        }
                      }}
                      className="w-full bg-zinc-800/50 border border-white/5 rounded-lg p-2 text-center font-mono text-white"
                    />
                    <p className="text-center text-xs text-zinc-500">Use seconds or mm:ss.s</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">End Time</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={endInput}
                      onChange={(e) => {
                        setEndInput(e.target.value);
                      }}
                      onFocus={() => setEditingInput("end")}
                      onBlur={applyEndInput}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                        if (e.key === "Escape") {
                          setEditingInput(null);
                          setEndInput(formatPreciseTime(endTime));
                          e.currentTarget.blur();
                        }
                      }}
                      className="w-full bg-zinc-800/50 border border-white/5 rounded-lg p-2 text-center font-mono text-white"
                    />
                    <p className="text-center text-xs text-zinc-500">Example: 1:23.4</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Clip Length</label>
                    <div className="bg-zinc-800/50 border border-white/5 rounded-lg p-2 text-center font-mono">
                      {(endTime - startTime).toFixed(1)}s
                    </div>
                    <p className="text-center text-xs text-zinc-500">{formatTime(endTime - startTime)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={previewSelectedClip}
                  disabled={!duration}
                  className="w-full py-3 rounded-xl border border-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  Preview Selected Clip
                </button>

                <button 
                  onClick={handleDownloadClip}
                  disabled={isTrimming || !duration}
                  className="w-full py-3 rounded-xl bg-white text-black font-semibold flex items-center justify-center gap-2 hover:bg-zinc-200 disabled:cursor-not-allowed transition-all"
                >
                  <Download className="w-5 h-5" />
                  Download Trimmed Clip
                </button>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-brand-red" />
                  <h3 className="font-display font-semibold">Download Available YouTube Qualities</h3>
                </div>
                <div className="text-sm text-zinc-400">
                  These options come from the loaded video.
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => downloadMedia("video", "best")}
                  disabled={Boolean(activeDownload)}
                  className="rounded-xl border border-brand-red bg-brand-red/10 px-4 py-3 text-sm font-semibold text-brand-red hover:bg-brand-red/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {activeDownload === "video-best" ? <ButtonProgress /> : <Video className="w-4 h-4" />}
                  Best
                </button>

                {videoQualities.map((option) => {
                  const quality = String(option.height);
                  const downloadKey = `video-${quality}`;
                  const isLoading = activeDownload === downloadKey;

                  return (
                    <button
                      key={`${option.height}-${option.fps || 30}`}
                      type="button"
                      onClick={() => downloadMedia("video", quality)}
                      disabled={Boolean(activeDownload)}
                      className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {isLoading ? <ButtonProgress /> : <Video className="w-4 h-4" />}
                        {option.label}
                      </span>
                      {(option.width || option.approxSize) && (
                        <span className="mt-1 block text-xs font-normal text-zinc-500">
                          {[option.width ? `${option.width}w` : "", formatBytes(option.approxSize)].filter(Boolean).join(" | ")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {!isLoadingInfo && videoQualities.length === 0 && (
                <p className="text-sm text-zinc-500">
                  No MP4 quality list was found yet. You can still try Best or Audio Only.
                </p>
              )}

              <button
                type="button"
                onClick={() => downloadMedia("audio")}
                disabled={Boolean(activeDownload)}
                className="w-full rounded-xl bg-brand-red text-white px-4 py-3 font-semibold hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {activeDownload === "audio" ? <ButtonProgress /> : <Music className="w-5 h-5" />}
                {activeDownload === "audio" ? "Downloading Audio..." : "Download Audio Only MP3"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!videoUrl && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 space-y-4 text-zinc-500"
        >
          <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
            <FileVideo className="w-10 h-10" />
          </div>
          <p className="text-sm">No video loaded. Enter a URL above to get started.</p>
        </motion.div>
      )}

      {/* Footer */}
      <footer className="w-full pt-12 pb-8 border-t border-white/5 text-center text-zinc-600 text-xs">
        &copy; 2026 YouTube Clipper
      </footer>
    </div>
  );
}
