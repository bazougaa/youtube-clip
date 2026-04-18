import React from 'react';
import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="w-full border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="Zynclipa - Cut YouTube videos free tool" className="h-8 md:h-10 w-auto object-contain" />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-sm font-medium text-zinc-400">
          <Link to="/how-it-works" className="hover:text-white transition-colors">How it Works</Link>
          <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
        </nav>
      </div>
    </header>
  );
}
