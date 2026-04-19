import React from 'react';
import { Download, Scissors, RotateCcw, FileVideo, Loader2 } from 'lucide-react';
import { formatTime, formatPreciseTime } from '../../utils/formatters';

interface TrimControlsProps {
  duration: number;
  startTime: number;
  endTime: number;
  startInput: string;
  endInput: string;
  setStartInput: (val: string) => void;
  setEndInput: (val: string) => void;
  editingInput: 'start' | 'end' | null;
  setEditingInput: (val: 'start' | 'end' | null) => void;
  applyStartInput: () => void;
  applyEndInput: () => void;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  activeHandle: 'start' | 'end' | null;
  setActiveHandle: (val: 'start' | 'end' | null) => void;
  previewSelectedClip: () => void;
  handleDownloadClip: () => void;
  isTrimming: boolean;
}

export function TrimControls({
  duration,
  startTime,
  endTime,
  startInput,
  endInput,
  setStartInput,
  setEndInput,
  editingInput,
  setEditingInput,
  applyStartInput,
  applyEndInput,
  timelineRef,
  activeHandle,
  setActiveHandle,
  previewSelectedClip,
  handleDownloadClip,
  isTrimming
}: TrimControlsProps) {

  const formatTimelineLabel = (seconds: number) => {
    if (duration > 3600) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
      const s = Math.floor(seconds % 60).toString().padStart(2, "0");
      return `${h}:${m}:${s}`;
    }
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="bg-gray-900/50 rounded-2xl p-6 md:p-8 border border-white/5 backdrop-blur-xl mb-12">
      <div className="mb-12">
        <div className="flex justify-between text-sm text-gray-400 mb-6 font-medium tracking-wide">
          <span>{formatTime(0)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="relative h-14 bg-gray-800/80 rounded-xl select-none group border border-white/5" ref={timelineRef}>
          <div
            className="absolute h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20"
            style={{
              left: `${(startTime / duration) * 100}%`,
              width: `${((endTime - startTime) / duration) * 100}%`,
            }}
          />
          
          <div
            className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 border-y border-blue-400/50"
            style={{
              left: `${(startTime / duration) * 100}%`,
              width: `${((endTime - startTime) / duration) * 100}%`,
            }}
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30" />
          </div>

          <div
            className={`absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-16 bg-white rounded-md cursor-grab active:cursor-grabbing shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-transform hover:scale-110 flex items-center justify-center border-2 border-blue-500 z-10 ${
              activeHandle === "start" ? "scale-110 shadow-[0_0_20px_rgba(59,130,246,0.8)] ring-4 ring-blue-500/30" : ""
            }`}
            style={{ left: `${(startTime / duration) * 100}%` }}
            onPointerDown={(e) => {
              e.preventDefault();
              setActiveHandle("start");
            }}
          >
            <div className="w-1 h-6 bg-gray-300 rounded-full" />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 whitespace-nowrap font-medium shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTimelineLabel(startTime)}
            </div>
          </div>

          <div
            className={`absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-16 bg-white rounded-md cursor-grab active:cursor-grabbing shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-transform hover:scale-110 flex items-center justify-center border-2 border-purple-500 z-10 ${
              activeHandle === "end" ? "scale-110 shadow-[0_0_20px_rgba(168,85,247,0.8)] ring-4 ring-purple-500/30" : ""
            }`}
            style={{ left: `${(endTime / duration) * 100}%` }}
            onPointerDown={(e) => {
              e.preventDefault();
              setActiveHandle("end");
            }}
          >
            <div className="w-1 h-6 bg-gray-300 rounded-full" />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 whitespace-nowrap font-medium shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTimelineLabel(endTime)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
          <div className="bg-gray-800/80 p-4 rounded-xl border border-white/5 flex-1 min-w-[140px]">
            <label className="block text-sm text-gray-400 mb-2 font-medium">Start Time</label>
            {editingInput === "start" ? (
              <input
                autoFocus
                className="w-full bg-gray-900 text-white text-xl font-bold rounded-lg border border-blue-500/50 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                onBlur={applyStartInput}
                onKeyDown={(e) => e.key === "Enter" && applyStartInput()}
              />
            ) : (
              <div
                className="text-xl font-bold text-white px-3 py-2 border border-transparent hover:border-white/10 rounded-lg cursor-text transition-colors"
                onClick={() => {
                  setStartInput(formatPreciseTime(startTime));
                  setEditingInput("start");
                }}
              >
                {formatPreciseTime(startTime)}
              </div>
            )}
          </div>

          <div className="bg-gray-800/80 p-4 rounded-xl border border-white/5 flex-1 min-w-[140px]">
            <label className="block text-sm text-gray-400 mb-2 font-medium">End Time</label>
            {editingInput === "end" ? (
              <input
                autoFocus
                className="w-full bg-gray-900 text-white text-xl font-bold rounded-lg border border-purple-500/50 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/20"
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
                onBlur={applyEndInput}
                onKeyDown={(e) => e.key === "Enter" && applyEndInput()}
              />
            ) : (
              <div
                className="text-xl font-bold text-white px-3 py-2 border border-transparent hover:border-white/10 rounded-lg cursor-text transition-colors"
                onClick={() => {
                  setEndInput(formatPreciseTime(endTime));
                  setEditingInput("end");
                }}
              >
                {formatPreciseTime(endTime)}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={previewSelectedClip}
            className="w-full bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-xl font-bold transition-all border border-white/10 hover:border-white/20 flex items-center justify-center gap-3 group"
          >
            <RotateCcw className="w-5 h-5 group-hover:-rotate-90 transition-transform duration-300" />
            Preview Clip ({formatPreciseTime(endTime - startTime)}s)
          </button>

          <button
            onClick={handleDownloadClip}
            disabled={isTrimming}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-70 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/25"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            {isTrimming ? (
              <span className="flex items-center gap-2 relative z-10">
                <Loader2 className="w-5 h-5 animate-spin" /> Trimming & Downloading...
              </span>
            ) : (
              <span className="flex items-center gap-2 relative z-10">
                <FileVideo className="w-5 h-5" /> Download HD Clip
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}