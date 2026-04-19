import React from 'react';
import { Download, Music, Video, Loader2 } from 'lucide-react';
import { formatBytes } from '../../utils/formatters';
import { VideoQuality } from '../../types/video';

function ButtonProgress() {
  return (
    <span className="flex items-center gap-2">
      <Loader2 className="w-5 h-5 animate-spin" /> Processing...
    </span>
  );
}

interface DownloadGridProps {
  qualities: VideoQuality[];
  activeDownload: string | null;
  onDownload: (kind: "video" | "audio", quality: string) => void;
}

export function DownloadGrid({ qualities, activeDownload, onDownload }: DownloadGridProps) {
  return (
    <div className="bg-gray-900/50 rounded-2xl p-8 border border-white/5 mb-16 backdrop-blur-xl">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Download className="w-6 h-6 text-purple-400" /> Full Video Download
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {qualities.map((q) => {
          const isDownloading = activeDownload === `video-${q.label}`;
          return (
            <button
              key={q.label}
              onClick={() => onDownload("video", q.label)}
              disabled={activeDownload !== null}
              className={`flex items-center justify-between px-6 py-4 rounded-xl border transition-all ${
                isDownloading
                  ? "bg-purple-500/20 border-purple-500 text-purple-300"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 opacity-70" />
                <div className="text-left">
                  <div className="font-semibold">{q.label}</div>
                  <div className="text-xs opacity-50 flex gap-2">
                    {q.fps && <span>{q.fps}fps</span>}
                    {q.approxSize && <span>{formatBytes(q.approxSize, 0)}</span>}
                  </div>
                </div>
              </div>
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 opacity-50" />}
            </button>
          );
        })}

        <button
          onClick={() => onDownload("audio", "best")}
          disabled={activeDownload !== null}
          className={`flex items-center justify-between px-6 py-4 rounded-xl border transition-all ${
            activeDownload === "audio"
              ? "bg-blue-500/20 border-blue-500 text-blue-300"
              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-500/50 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          <div className="flex items-center gap-3">
            <Music className="w-5 h-5 opacity-70 text-blue-400" />
            <div className="text-left">
              <div className="font-semibold">Audio Only</div>
              <div className="text-xs opacity-50">MP3 / M4A</div>
            </div>
          </div>
          {activeDownload === "audio" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 opacity-50 text-blue-400" />}
        </button>
      </div>
    </div>
  );
}