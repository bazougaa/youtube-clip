import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, FileVideo } from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';

import { VideoQuality } from '../types/video';
import { getYouTubeThumbnailUrl, parseTimeInput, formatPreciseTime } from '../utils/youtube';
import { HeroSection } from '../components/home/HeroSection';
import { VideoPlayer } from '../components/home/VideoPlayer';
import { TrimControls } from '../components/home/TrimControls';
import { DownloadGrid } from '../components/home/DownloadGrid';
import { SEOSection } from '../components/home/SEOSection';

export default function Home() {
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

    const nextEmbedUrl = `/api/stream.mp4?url=${encodeURIComponent(videoUrl)}`;
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
      // Enforce the use of the official YouTube iFrame embed for reliable previews
      const embed = getYouTubeClipEmbedUrl(videoUrl, startTime, endTime);
      setEmbedUrl(embed || `/api/stream.mp4?url=${encodeURIComponent(videoUrl)}`);
      setIsPlayerReady(false);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [endTime, startTime, videoUrl]);

  // Handle URL changes
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = inputUrl.trim();
    if (!trimmedUrl) {
      setError("Please provide a YouTube link.");
      return;
    }
    
    // Convert short URLs to standard watch URLs for consistent parsing
    let normalizedUrl = trimmedUrl;
    if (normalizedUrl.includes('youtu.be/')) {
      const id = normalizedUrl.split('youtu.be/')[1]?.split('?')[0];
      if (id) normalizedUrl = `https://www.youtube.com/watch?v=${id}`;
    } else if (normalizedUrl.includes('/shorts/')) {
      const id = normalizedUrl.split('/shorts/')[1]?.split('?')[0];
      if (id) normalizedUrl = `https://www.youtube.com/watch?v=${id}`;
    }
    
    setVideoUrl(normalizedUrl);
    setError(null);
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
    setTimeout(() => setEmbedUrl(`/api/stream.mp4?url=${encodeURIComponent(videoUrl)}`), 50);
  };

  const pollJobStatus = async (jobId: string, onComplete: (jobId: string) => void) => {
    try {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/job-status/${jobId}`);
          if (!response.ok) throw new Error("Failed to check job status");
          
          const data = await response.json();
          if (data.state === "completed") {
            clearInterval(interval);
            onComplete(jobId);
          } else if (data.state === "failed") {
            clearInterval(interval);
            setError(`Job failed: ${data.failedReason || "Unknown error"}`);
            setIsTrimming(false);
            setActiveDownload(null);
          }
        } catch (err) {
          clearInterval(interval);
          setError("Lost connection to the server while checking job status.");
          setIsTrimming(false);
          setActiveDownload(null);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to start polling.");
      setIsTrimming(false);
      setActiveDownload(null);
    }
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
      
      const response = await fetch(`/api/trim?${params.toString()}`);
      if (!response.ok) {
        let errorMessage = "Failed to start clip download.";
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = errorData.error;
        } catch {}
        throw new Error(errorMessage);
      }

      const { jobId } = await response.json();
      if (!jobId) throw new Error("Server did not return a Job ID");

      // Poll for completion
      pollJobStatus(jobId, (completedJobId) => {
        window.location.href = `/api/download-file/${completedJobId}`;
        setIsTrimming(false);
      });
      
    } catch (err: any) {
      setError(err.message || "Failed to download clip. YouTube might be blocking the request.");
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

      const response = await fetch(`/api/download-media?${params.toString()}`);
      if (!response.ok) {
        let errorMessage = "Failed to start media download.";
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = errorData.error;
        } catch {}
        throw new Error(errorMessage);
      }

      const { jobId } = await response.json();
      if (!jobId) throw new Error("Server did not return a Job ID");

      // Poll for completion
      pollJobStatus(jobId, (completedJobId) => {
        window.location.href = `/api/download-file/${completedJobId}`;
        setActiveDownload(null);
      });
      
    } catch (err: any) {
      setError(err.message || "Failed to start download.");
      setActiveDownload(null);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <SEO 
        title="Cut YouTube videos free tool | Zynclipa" 
        description="Zynclipa is the best cut YouTube videos free tool. Trim, download, and analyze YouTube clips easily with no watermarks and no registration required." 
      />
      {/* Hero Section */}
      <div className="w-full text-center space-y-2 mt-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red text-sm font-medium"
        >
          <Video className="w-4 h-4" />
          Zynclipa
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
          Cut YouTube videos free tool
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto">
          Paste a YouTube URL, preview the video, choose your timestamps, and download a trimmed clip.
        </p>
      </div>

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
                    <video
                      src={embedUrl}
                      controls
                      autoPlay
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-contain bg-black"
                      onLoadedData={() => setIsPlayerReady(true)}
                      onPlaying={() => setIsPlayerReady(true)}
                      onError={(e) => {
                        console.error("Native Video Error:", e);
                        setIsPlayerReady(true);
                        setEmbedUrl(getYouTubeClipEmbedUrl(videoUrl, startTime, endTime));
                      }}
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

      {/* SEO Content Section */}
      <section className="w-full max-w-4xl mx-auto pt-24 pb-12 space-y-16 text-zinc-300">
        
        {/* Main SEO Block 1 */}
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Download Videos Online for Free with Zynclipa (Fast & Easy)
          </h2>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Download videos online quickly and easily with Zynclipa, a powerful and free video downloader that works with popular platforms. Save videos and music directly to your device without installing any software.
          </p>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Zynclipa is designed to be the fastest and simplest online video downloader, allowing you to download any video in just a few seconds. Simply copy the video URL, paste it into the download box, and click the download button — it’s that easy.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            {['Free video downloader online', 'No registration required', 'No software installation', 'Works on mobile and desktop', 'Fast and secure downloads'].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SEO Grid Section */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-zinc-900/50 border border-zinc-800/50 p-8 rounded-2xl space-y-4 hover:border-zinc-700 transition-colors">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
              <Video className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Download MP4 Videos in HD Quality</h3>
            <p className="text-zinc-400">
              Looking for a reliable MP4 video downloader? Zynclipa allows you to download videos in high-quality MP4 format while preserving the original resolution.
            </p>
            <ul className="space-y-2 text-zinc-400 text-sm mt-4">
              <li className="flex items-start gap-2"><span className="text-brand-red">•</span> Download HD and Full HD videos</li>
              <li className="flex items-start gap-2"><span className="text-brand-red">•</span> Save videos for offline viewing</li>
              <li className="flex items-start gap-2"><span className="text-brand-red">•</span> Convert videos to MP4 format easily</li>
              <li className="flex items-start gap-2"><span className="text-brand-red">•</span> Build your own offline video library</li>
            </ul>
            <p className="text-sm text-zinc-500 mt-4 italic">Enjoy your favorite content anytime, even without an internet connection.</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/50 p-8 rounded-2xl space-y-4 hover:border-zinc-700 transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
              <MonitorSmartphone className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Download Videos in All Resolutions</h3>
            <p className="text-zinc-400">
              Zynclipa supports downloading videos in multiple resolutions, from standard quality to Ultra HD.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-black/50 border border-zinc-800 p-2 rounded-lg text-center text-sm font-medium">480p (SD)</div>
              <div className="bg-black/50 border border-zinc-800 p-2 rounded-lg text-center text-sm font-medium">720p (HD)</div>
              <div className="bg-black/50 border border-zinc-800 p-2 rounded-lg text-center text-sm font-medium">1080p (Full HD)</div>
              <div className="bg-black/50 border border-zinc-800 p-2 rounded-lg text-center text-sm font-medium">2K & 4K Ultra HD</div>
            </div>
            <p className="text-sm text-zinc-500 mt-4 italic">The available quality depends on the original video, ensuring you always get the best possible version.</p>
          </div>
        </div>

        {/* Feature List Section */}
        <div className="space-y-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-sm font-medium">
                <ShieldCheck className="w-4 h-4 text-green-400" /> Safe & Secure
              </div>
              <h3 className="text-2xl font-bold text-white">Fast, Secure, and Easy-to-Use</h3>
              <p className="text-zinc-400">
                Zynclipa is a top-rated online video downloader that works directly from your browser — no apps or extensions required. Whether you're looking for a free video downloader or a fast way to save videos, Zynclipa is the perfect solution.
              </p>
              <ul className="space-y-2 mt-4">
                {['Safe and secure', 'No installation needed', 'Beginner-friendly interface', 'Works instantly online'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-brand-red flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-sm font-medium">
                <Globe className="w-4 h-4 text-blue-400" /> Universal Access
              </div>
              <h3 className="text-2xl font-bold text-white">Compatible with All Browsers</h3>
              <p className="text-zinc-400">
                Zynclipa works smoothly across all major browsers and devices. You can download videos بسهولة on Android, iPhone, tablets, and desktop computers.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {['Google Chrome', 'Mozilla Firefox', 'Safari', 'Opera', 'All Chromium browsers'].map((browser, i) => (
                  <span key={i} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300">
                    {browser}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA Block */}
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-purple/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-8">Why Choose Zynclipa?</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto text-sm">
              {[
                { icon: <Zap className="w-5 h-5 mx-auto mb-2 text-yellow-500" />, text: "Free & unlimited" },
                { icon: <Video className="w-5 h-5 mx-auto mb-2 text-blue-500" />, text: "High-quality MP4" },
                { icon: <Zap className="w-5 h-5 mx-auto mb-2 text-brand-red" />, text: "Fast performance" },
                { icon: <MonitorSmartphone className="w-5 h-5 mx-auto mb-2 text-purple-500" />, text: "All devices" },
                { icon: <ShieldCheck className="w-5 h-5 mx-auto mb-2 text-green-500" />, text: "No sign-up" }
              ].map((feature, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-4 bg-black/50 border border-zinc-800/50 rounded-xl hover:border-zinc-700 transition-colors">
                  {feature.icon}
                  <span className="text-zinc-300 font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

    </div>
  );
}
