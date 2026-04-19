import React from 'react';
import { motion } from 'motion/react';
import { Scissors, Search, Loader2 } from 'lucide-react';

interface HeroSectionProps {
  url: string;
  setUrl: (url: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function HeroSection({ url, setUrl, isLoading, onSubmit }: HeroSectionProps) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-12">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-8"
      >
        <Scissors className="w-8 h-8 text-blue-400" />
      </motion.div>
      <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6 tracking-tight">
        Clip YouTube Videos
      </h1>
      <p className="text-xl text-gray-400 mb-10 font-light">
        The fastest way to download, trim, and save YouTube highlights
      </p>

      <form onSubmit={onSubmit} className="relative group max-w-2xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative flex items-center bg-gray-900/90 border border-white/10 rounded-2xl p-2 backdrop-blur-xl transition-all focus-within:border-blue-500/50 shadow-2xl">
          <Search className="w-6 h-6 text-gray-400 ml-4 hidden sm:block" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube URL here..."
            className="flex-1 bg-transparent border-none outline-none text-white px-4 py-4 text-lg placeholder-gray-500 w-full"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!url || isLoading}
            className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="hidden sm:inline">Loading...</span>
              </>
            ) : (
              'Start Clipping'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}