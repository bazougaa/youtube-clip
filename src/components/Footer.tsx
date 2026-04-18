import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="w-full mt-20 border-t border-zinc-800/50 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 flex flex-col md:flex-row justify-between gap-12">
        <div className="flex flex-col gap-6 max-w-sm">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Zynclipa - Cut YouTube videos free tool" className="h-10 w-auto object-contain" />
          </Link>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Zynclipa is the best "Cut YouTube videos free tool" online. Easily trim, download, and analyze YouTube clips with no watermarks and no registration required.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 md:gap-16 text-sm">
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-white mb-2">Explore</h3>
            <Link to="/" className="text-zinc-400 hover:text-white transition-colors">Home</Link>
            <Link to="/about" className="text-zinc-400 hover:text-white transition-colors">About</Link>
            <Link to="/how-it-works" className="text-zinc-400 hover:text-white transition-colors">How It Works</Link>
            <Link to="/faq" className="text-zinc-400 hover:text-white transition-colors">FAQ</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-white mb-2">Legal</h3>
            <Link to="/privacy" className="text-zinc-400 hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-zinc-400 hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/eula" className="text-zinc-400 hover:text-white transition-colors">EULA</Link>
          </div>
        </div>
      </div>
      
      <div className="w-full border-t border-zinc-800/50 py-6 text-center text-zinc-500 text-xs">
        <p>&copy; {new Date().getFullYear()} Zynclipa. All rights reserved.</p>
      </div>
    </footer>
  );
}
