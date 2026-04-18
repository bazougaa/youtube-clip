import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-4xl mx-auto text-zinc-300">
      <SEO 
        title="About Zynclipa | Cut YouTube videos free tool" 
        description="Learn about Zynclipa, the premier cut YouTube videos free tool. We provide a fast, reliable, and completely free way to extract the perfect moments from any YouTube video." 
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-8 mt-12"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">About Zynclipa</h1>
          <p className="text-xl text-zinc-400">The premier "Cut YouTube videos free tool" for creators.</p>
        </div>

        <div className="prose prose-invert prose-lg max-w-none mt-12 space-y-6">
          <p>
            Welcome to Zynclipa, your go-to destination for the best <strong>Cut YouTube videos free tool</strong> on the web. Our mission is to provide content creators, students, educators, and everyday users with a fast, reliable, and completely free way to extract the perfect moments from any YouTube video.
          </p>

          <h2 className="text-2xl font-bold text-white">Why We Built This</h2>
          <p>
            We realized that finding a good, free tool to trim YouTube videos without downloading sketchy software or dealing with massive watermarks was incredibly frustrating. So, we built this web application from the ground up to solve that exact problem. No sign-ups, no hidden fees, and absolutely no watermarks.
          </p>

          <h2 className="text-2xl font-bold text-white">Our Technology</h2>
          <p>
            Our tool leverages the power of advanced media processing libraries (like FFmpeg and yt-dlp) running on blazing fast servers. We process the highest quality video and audio streams available from YouTube, precisely slice them based on your exact timestamps, and deliver the final `.mp4` directly to your device.
          </p>

          <h2 className="text-2xl font-bold text-white">Get Started</h2>
          <p>
            Ready to give it a try? Head back to our <Link to="/" className="text-brand-red hover:underline">homepage</Link> and paste your first link into our "Cut YouTube videos free tool" to experience how fast and easy clipping can be!
          </p>
        </div>
      </motion.div>
    </div>
  );
}
