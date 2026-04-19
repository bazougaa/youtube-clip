import React from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';

interface HeroSectionProps {
  inputUrl: string;
  setInputUrl: (url: string) => void;
  onSearch: (e: React.FormEvent) => void;
  isLoadingInfo: boolean;
}

export function HeroSection({ inputUrl, setInputUrl, onSearch, isLoadingInfo }: HeroSectionProps) {
  return (
    <div className="relative pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-red/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-purple/10 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-4xl mx-auto w-full"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></span>
          <span className="text-sm text-zinc-300">YouTube Video Downloader & Trimmer</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          Download YouTube Videos <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-purple">
            Fast & Free
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
          The ultimate tool to download, trim, and save YouTube videos in high quality MP4 or extract audio as MP3. No registration required.
        </p>

        <form onSubmit={onSearch} className="relative max-w-2xl mx-auto group">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-red to-brand-purple rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-2 transition-all duration-300 focus-within:border-zinc-700 focus-within:bg-zinc-900/80 shadow-2xl">
            <div className="pl-4 pr-2">
              <Search className="w-6 h-6 text-zinc-500" />
            </div>
            <input
              type="url"
              placeholder="Paste YouTube URL here..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1 bg-transparent border-none text-white px-2 py-4 outline-none placeholder:text-zinc-600 text-lg w-full"
              required
            />
            <button
              type="submit"
              disabled={!inputUrl || isLoadingInfo}
              className="bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isLoadingInfo ? 'Loading...' : 'Start'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
