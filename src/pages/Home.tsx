import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';
import { SEOSection } from '../components/home/SEOSection';
import { HeroSection } from '../components/home/HeroSection';
import { DownloadGrid } from '../components/home/DownloadGrid';
import { TrimControls } from '../components/home/TrimControls';
import { VideoPlayer } from '../components/home/VideoPlayer';
import { formatPreciseTime, parseTimeInput } from '../utils/formatters';
import { getYouTubeVideoId, getYouTubeEmbedUrl } from '../utils/youtube';
import { VideoQuality } from '../types/video';

export default function Home() {
  const [url, setUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(10);
  const [activeHandle, setActiveHandle] = useState<'start' | 'end' | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isTrimming, setIsTrimming] = useState(false);
  const [previewRange, setPreviewRange] = useState<{start: number, end: number} | null>(null);
  const [editingInput, setEditingInput] = useState<'start' | 'end' | null>(null);
  const [startInput, setStartInput] = useState("0:00.0");
  const [endInput, setEndInput] = useState("0:10.0");
  const [qualities, setQualities] = useState<VideoQuality[]>([]);
  const [activeDownload, setActiveDownload] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    setStartInput(formatPreciseTime(startTime));
    setEndInput(formatPreciseTime(endTime));
  }, [startTime, endTime]);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    const id = getYouTubeVideoId(url);
    if (!id) {
      setError('Invalid YouTube URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPreviewRange(null);
    setIsPlayerReady(false);

    try {
      const response = await fetch(`/api/video-info?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch video information');
      }

      const data = await response.json();
      const vidDuration = data.duration || 600;
      
      setDuration(vidDuration);
      setStartTime(0);
      setEndTime(Math.min(10, vidDuration));
      setVideoUrl(url);
      setEmbedUrl(getYouTubeEmbedUrl(url));
      setQualities(data.qualities || []);
      
      if (data.warning) {
        console.warn("Server warning:", data.warning);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load video. Please try again.');
      setVideoUrl(null);
      setEmbedUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStartTime = (value: number) => {
    if (!Number.isFinite(value)) return;
    const minimumClipLength = 0.1;
    const currentClipLength = Math.max(minimumClipLength, endTime - startTime);
    const videoEnd = duration || Math.max(value, endTime);
    const nextStart = Math.max(0, Math.min(value, videoEnd - minimumClipLength));
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
    if (handle === "start") updateStartTime(nextTime);
    else updateEndTime(nextTime);
  };

  useEffect(() => {
    if (!activeHandle) return;

    const handlePointerMove = (event: PointerEvent) => moveHandle(activeHandle, event.clientX);
    const handlePointerUp = () => setActiveHandle(null);

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
      const params = new URLSearchParams({ url: videoUrl, kind, quality });
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
    <>
      <SEO 
        title="YouTube Clipper & Downloader - Free HD Video Trimmer"
        description="Clip, trim, and download YouTube videos in HD. Extract exactly the moments you want or download full videos and audio. Fast, free, and secure."
        keywords="youtube clipper, trim youtube video, download youtube highlights, youtube to mp4, youtube clip maker"
      />
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-20 pb-16">
        
        <HeroSection 
          url={url}
          setUrl={setUrl}
          isLoading={isLoading}
          onSubmit={handleUrlSubmit}
        />

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 max-w-2xl mx-auto"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        {videoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <VideoPlayer 
              isPlayerReady={isPlayerReady}
              setIsPlayerReady={setIsPlayerReady}
              embedUrl={embedUrl}
              previewRange={previewRange}
              setError={setError}
            />

            <TrimControls 
              duration={duration}
              startTime={startTime}
              endTime={endTime}
              startInput={startInput}
              endInput={endInput}
              setStartInput={setStartInput}
              setEndInput={setEndInput}
              editingInput={editingInput}
              setEditingInput={setEditingInput}
              applyStartInput={applyStartInput}
              applyEndInput={applyEndInput}
              timelineRef={timelineRef}
              activeHandle={activeHandle}
              setActiveHandle={setActiveHandle}
              previewSelectedClip={previewSelectedClip}
              handleDownloadClip={handleDownloadClip}
              isTrimming={isTrimming}
            />

            <DownloadGrid 
              qualities={qualities}
              activeDownload={activeDownload}
              onDownload={downloadMedia}
            />
          </motion.div>
        )}

        <SEOSection />
        
      </div>
    </>
  );
}