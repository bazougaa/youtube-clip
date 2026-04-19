import React from 'react';
import { Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  isPlayerReady: boolean;
  setIsPlayerReady: (ready: boolean) => void;
  embedUrl: string | null;
  previewRange: { start: number; end: number } | null;
  setError: (error: string) => void;
}

export function VideoPlayer({ 
  isPlayerReady, 
  setIsPlayerReady, 
  embedUrl, 
  previewRange, 
  setError 
}: VideoPlayerProps) {
  return (
    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-900 border border-white/10 shadow-2xl mb-12">
      {!isPlayerReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      )}
      {embedUrl ? (
        previewRange ? (
          <video 
            src={embedUrl}
            className="w-full h-full object-contain bg-black"
            controls
            autoPlay
            onCanPlay={() => setIsPlayerReady(true)}
            onError={() => {
              setError("Failed to load video stream. YouTube may have blocked the request. Try again later or use full download.");
              setIsPlayerReady(true);
            }}
          />
        ) : (
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsPlayerReady(true)}
          />
        )
      ) : null}
    </div>
  );
}