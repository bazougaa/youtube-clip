import React from 'react';
import { motion } from 'motion/react';
import { Search, Scissors, Download } from 'lucide-react';
import { SEO } from '../components/SEO';

export default function HowItWorks() {
  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-4xl mx-auto text-zinc-300">
      <SEO 
        title="How It Works | Cut YouTube videos free tool" 
        description="Master Zynclipa's cut YouTube videos free tool in 3 easy steps. Paste the URL, set your timestamps, and download your trimmed clip with zero watermarks." 
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-8 mt-12"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">How It Works</h1>
          <p className="text-xl text-zinc-400">Master Zynclipa, the premier "Cut YouTube videos free tool", in 3 easy steps.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-zinc-900 border border-zinc-800/50 p-8 rounded-2xl flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center">
              <Search className="text-brand-red w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">1. Paste the URL</h2>
            <p className="text-zinc-400">
              Find any YouTube video you want to clip. Copy the URL from your browser's address bar and paste it into Zynclipa's "Cut YouTube videos free tool" on the home page. We'll automatically load the video for you.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800/50 p-8 rounded-2xl flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-brand-purple/10 rounded-full flex items-center justify-center">
              <Scissors className="text-brand-purple w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">2. Set Timestamps</h2>
            <p className="text-zinc-400">
              Use our interactive preview player to find the exact moment you want to start and end your clip. Type in the timestamps or use the visual scrubber to fine-tune your selection.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800/50 p-8 rounded-2xl flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <Download className="text-green-500 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">3. Trim & Download</h2>
            <p className="text-zinc-400">
              Hit the 'Trim & Download Clip' button. Our powerful servers will process the original high-quality stream, slice the video precisely, and download it instantly to your device. Zero watermarks!
            </p>
          </div>
        </div>

        <div className="mt-16 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to start?</h2>
          <p className="text-zinc-400 mb-6">Zynclipa's "Cut YouTube videos free tool" is completely free and requires no sign-ups.</p>
          <a href="/" className="inline-block bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-zinc-200 transition-colors">
            Try it now
          </a>
        </div>
      </motion.div>
    </div>
  );
}
