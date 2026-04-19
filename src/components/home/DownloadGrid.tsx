import React from 'react';
import { Video, Download, Music } from 'lucide-react';
import { VideoQuality } from '../../types/video';
import { formatBytes } from '../../utils/formatters';

interface DownloadGridProps {
  videoQualities: VideoQuality[];
  activeDownload: string | null;
  downloadMedia: (kind: "video" | "audio", quality?: string) => void;
}

function ButtonProgress() {
  return (
    <span className="relative inline-flex h-5 w-5 items-center justify-center">
      <span className="absolute inset-0 rounded-full border-2 border-current/25" />
      <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin" />
    </span>
  );
}

export function DownloadGrid({ videoQualities, activeDownload, downloadMedia }: DownloadGridProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Video className="w-5 h-5 text-brand-purple" />
        <h2 className="text-xl font-bold text-white">Full Video Download</h2>
      </div>

      <div className="space-y-4">
        {videoQualities.length > 0 ? (
          <div className="grid gap-3">
            {videoQualities.map((quality) => (
              <div 
                key={quality.height}
                className="flex items-center justify-between p-4 rounded-xl border border-zinc-800/50 bg-black/50 hover:bg-zinc-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-brand-purple transition-colors">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      {quality.label} MP4
                      {quality.fps && quality.fps > 30 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">
                          {quality.fps}fps
                        </span>
                      )}
                    </div>
                    {quality.approxSize && (
                      <div className="text-xs text-zinc-500 mt-0.5">
                        ~{formatBytes(quality.approxSize)}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => downloadMedia("video", quality.label)}
                  disabled={activeDownload !== null}
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                  title={`Download ${quality.label} video`}
                >
                  {activeDownload === `video-${quality.label}` ? (
                    <ButtonProgress />
                  ) : (
                    <Download className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-zinc-800 bg-black/50 text-center text-zinc-500 text-sm">
            Fetching available qualities...
          </div>
        )}

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-zinc-900 px-4 text-xs font-medium text-zinc-500 uppercase tracking-widest">
              Audio Only
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-800/50 bg-black/50 hover:bg-zinc-800/50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-blue-400 transition-colors">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-white">Best Quality Audio</div>
              <div className="text-xs text-zinc-500 mt-0.5">MP3 / M4A format</div>
            </div>
          </div>
          <button
            onClick={() => downloadMedia("audio")}
            disabled={activeDownload !== null}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group/btn"
            title="Download audio only"
          >
            {activeDownload === "audio" ? (
              <ButtonProgress />
            ) : (
              <Download className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
