import React from 'react';
import { Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  isPlayerReady: boolean;
  thumbnailUrl: string | null;
  embedUrl: string | null;
  previewRange: { start: number; end: number };
  setIsPlayerReady: (ready: boolean) => void;
}

export function VideoPlayer({ 
  isPlayerReady, 
  thumbnailUrl, 
  embedUrl, 
  previewRange, 
  setIsPlayerReady 
}: VideoPlayerProps) {
  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
      {!isPlayerReady && thumbnailUrl && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900">
          <img 
            src={thumbnailUrl} 
            alt="Video thumbnail" 
            className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm"
          />
          <Loader2 className="w-8 h-8 text-brand-red animate-spin relative z-20" />
        </div>
      )}
      
      {embedUrl ? (
        embedUrl.includes("/api/stream.mp4") ? (
          <video
            src={`${embedUrl}&t=${previewRange.start},${previewRange.end}`}
            className="w-full h-full"
            controls
            autoPlay
            onLoadedData={() => setIsPlayerReady(true)}
            onError={() => setIsPlayerReady(true)}
          />
        ) : (
          <iframe
            src={embedUrl}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
            onLoad={() => setIsPlayerReady(true)}
          />
        )
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <p className="text-zinc-500">Preview not available</p>
        </div>
      )}
    </div>
  );
}
