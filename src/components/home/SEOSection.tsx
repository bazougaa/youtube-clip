import React from 'react';
import { Download, Scissors, CheckCircle2, Globe, MonitorSmartphone, Zap, ShieldCheck, Video } from 'lucide-react';

export function SEOSection() {
  return (
    <section className="mt-32 max-w-6xl mx-auto px-4 border-t border-zinc-800/50 pt-24 pb-12">
      <div className="grid md:grid-cols-3 gap-12 mb-24">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-brand-red/10 rounded-2xl flex items-center justify-center">
            <Download className="w-6 h-6 text-brand-red" />
          </div>
          <h3 className="text-xl font-bold text-white">Fast Downloads</h3>
          <p className="text-zinc-400 leading-relaxed">
            Download YouTube videos in MP4 format or extract MP3 audio in seconds. No registration required.
          </p>
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 bg-brand-purple/10 rounded-2xl flex items-center justify-center">
            <Scissors className="w-6 h-6 text-brand-purple" />
          </div>
          <h3 className="text-xl font-bold text-white">Precise Trimming</h3>
          <p className="text-zinc-400 leading-relaxed">
            Cut and trim YouTube videos before downloading. Save only the parts you need, down to the millisecond.
          </p>
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-white">High Quality</h3>
          <p className="text-zinc-400 leading-relaxed">
            Get the best possible quality available, up to 1080p and 4K when supported by the original video.
          </p>
        </div>
      </div>

      <div className="prose prose-invert max-w-none">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white m-0">How to Download YouTube Videos</h2>
            <p className="text-zinc-400 text-lg leading-relaxed m-0">
              Our free YouTube video downloader makes it incredibly easy to save your favorite content for offline viewing. Follow these simple steps:
            </p>
            <ol className="space-y-4 text-zinc-300 list-none p-0 m-0">
              <li className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-brand-red">1</span>
                <span><strong className="text-white">Copy the URL</strong> of the YouTube video you want to download</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-brand-red">2</span>
                <span><strong className="text-white">Paste the link</strong> into the search box at the top of this page</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-brand-red">3</span>
                <span><strong className="text-white">Select your quality</strong> (MP4) or choose Audio Only (MP3)</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-brand-red">4</span>
                <span><strong className="text-white">Click Download</strong> and your file will be ready in seconds</span>
              </li>
            </ol>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Supported Platforms</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-zinc-300">
                <MonitorSmartphone className="w-6 h-6 text-zinc-500" />
                <div>
                  <strong className="block text-white">All Devices Supported</strong>
                  <span className="text-sm text-zinc-500">Works on Windows, Mac, Linux, Android, and iOS</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-zinc-300">
                <Globe className="w-6 h-6 text-zinc-500" />
                <div>
                  <strong className="block text-white">No Installation Required</strong>
                  <span className="text-sm text-zinc-500">Everything runs directly in your web browser</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-800">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Supported Browsers</h4>
              <div className="flex flex-wrap gap-2 mt-4">
                {['Google Chrome', 'Mozilla Firefox', 'Safari', 'Opera', 'All Chromium browsers'].map((browser, i) => (
                  <span key={i} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300">
                    {browser}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Block */}
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 md:p-12 text-center space-y-6 relative overflow-hidden mt-24">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-purple/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-8">Why Choose Zynclipa?</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto text-sm">
            {[
              { icon: <Zap className="w-5 h-5 mx-auto mb-2 text-yellow-500" />, text: "Free & unlimited" },
              { icon: <Video className="w-5 h-5 mx-auto mb-2 text-blue-500" />, text: "High-quality MP4" },
              { icon: <Zap className="w-5 h-5 mx-auto mb-2 text-brand-red" />, text: "Fast performance" },
              { icon: <MonitorSmartphone className="w-5 h-5 mx-auto mb-2 text-purple-500" />, text: "All devices" },
              { icon: <ShieldCheck className="w-5 h-5 mx-auto mb-2 text-green-500" />, text: "No sign-up" }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-4 bg-black/50 border border-zinc-800/50 rounded-xl hover:border-zinc-700 transition-colors">
                {feature.icon}
                <span className="text-zinc-300 font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
