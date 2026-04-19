import React from 'react';
import { Scissors, Loader2, RotateCcw } from 'lucide-react';
import { formatTime, formatPreciseTime } from '../../utils/formatters';

interface TrimControlsProps {
  duration: number;
  startTime: number;
  endTime: number;
  startInput: string;
  endInput: string;
  editingInput: "start" | "end" | null;
  isTrimming: boolean;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  activeHandle: "start" | "end" | null;
  setStartInput: (val: string) => void;
  setEndInput: (val: string) => void;
  setEditingInput: (val: "start" | "end" | null) => void;
  setActiveHandle: (val: "start" | "end" | null) => void;
  applyStartInput: () => void;
  applyEndInput: () => void;
  previewSelectedClip: () => void;
  handleDownloadClip: () => void;
}

function ButtonProgress() {
  return (
    <span className="relative inline-flex h-5 w-5 items-center justify-center">
      <span className="absolute inset-0 rounded-full border-2 border-current/25" />
      <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin" />
    </span>
  );
}

export function TrimControls({
  duration,
  startTime,
  endTime,
  startInput,
  endInput,
  editingInput,
  isTrimming,
  timelineRef,
  activeHandle,
  setStartInput,
  setEndInput,
  setEditingInput,
  setActiveHandle,
  applyStartInput,
  applyEndInput,
  previewSelectedClip,
  handleDownloadClip
}: TrimControlsProps) {
  const getPercentage = (time: number) => (duration > 0 ? (time / duration) * 100 : 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Scissors className="w-5 h-5 text-brand-red" />
        <h2 className="text-xl font-bold text-white">Trim Video</h2>
      </div>

      <div className="space-y-8">
        <div className="relative pt-6 pb-2">
          {/* Timeline track */}
          <div 
            ref={timelineRef}
            className="h-16 bg-zinc-800/50 rounded-lg relative cursor-pointer overflow-hidden border border-zinc-800"
          >
            <div 
              className="absolute top-0 bottom-0 bg-brand-red/20 border-y border-brand-red/50 transition-all duration-75"
              style={{
                left: `${getPercentage(startTime)}%`,
                width: `${getPercentage(endTime - startTime)}%`
              }}
            />
            
            {/* Start handle */}
            <div
              className="absolute top-0 bottom-0 w-4 -ml-2 group touch-none"
              style={{ left: `${getPercentage(startTime)}%` }}
              onPointerDown={(e) => {
                e.preventDefault();
                setActiveHandle("start");
              }}
            >
              <div className={`w-1.5 h-full mx-auto rounded-full transition-colors ${
                activeHandle === "start" ? "bg-white" : "bg-brand-red group-hover:bg-brand-red/80"
              }`} />
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-800 text-xs py-1 px-2 rounded font-mono text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                {formatTime(startTime)}
              </div>
            </div>

            {/* End handle */}
            <div
              className="absolute top-0 bottom-0 w-4 -ml-2 group touch-none"
              style={{ left: `${getPercentage(endTime)}%` }}
              onPointerDown={(e) => {
                e.preventDefault();
                setActiveHandle("end");
              }}
            >
              <div className={`w-1.5 h-full mx-auto rounded-full transition-colors ${
                activeHandle === "end" ? "bg-white" : "bg-brand-red group-hover:bg-brand-red/80"
              }`} />
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-800 text-xs py-1 px-2 rounded font-mono text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                {formatTime(endTime)}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-zinc-500 mt-2 font-mono">
            <span>0:00</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-zinc-400 font-medium">Start Time</label>
            <input
              type="text"
              value={editingInput === "start" ? startInput : formatPreciseTime(startTime)}
              onFocus={() => {
                setEditingInput("start");
                setStartInput(formatPreciseTime(startTime));
              }}
              onChange={(e) => setStartInput(e.target.value)}
              onBlur={applyStartInput}
              onKeyDown={(e) => e.key === "Enter" && applyStartInput()}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono text-lg focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-400 font-medium">End Time</label>
            <input
              type="text"
              value={editingInput === "end" ? endInput : formatPreciseTime(endTime)}
              onFocus={() => {
                setEditingInput("end");
                setEndInput(formatPreciseTime(endTime));
              }}
              onChange={(e) => setEndInput(e.target.value)}
              onBlur={applyEndInput}
              onKeyDown={(e) => e.key === "Enter" && applyEndInput()}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono text-lg focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={previewSelectedClip}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Preview Clip
          </button>
          
          <button
            onClick={handleDownloadClip}
            disabled={isTrimming}
            className="flex-[2] bg-brand-red hover:bg-red-700 text-white px-6 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-red/20"
          >
            {isTrimming ? (
              <>
                <ButtonProgress />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Scissors className="w-5 h-5" />
                <span>Download Clip ({formatTime(endTime - startTime)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
