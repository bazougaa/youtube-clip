import React from 'react';
import { Scissors, CheckCircle2, MonitorSmartphone, Zap, ShieldCheck, Globe } from 'lucide-react';

export function SEOSection() {
  return (
    <div className="max-w-4xl mx-auto mt-24 text-left">
      <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">How to Clip YouTube Videos</h2>
        <ol className="list-decimal list-inside space-y-4 text-gray-300">
          <li><strong>Paste the URL:</strong> Find the YouTube video you want to clip and paste its URL into the search bar above.</li>
          <li><strong>Set the Time:</strong> Use our intuitive timeline slider or manually enter the start and end times for your perfect clip.</li>
          <li><strong>Preview:</strong> Click "Preview Clip" to ensure you've captured exactly the right moment.</li>
          <li><strong>Download:</strong> Hit the "Download Clip" button to get your high-quality MP4 file instantly.</li>
        </ol>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <MonitorSmartphone className="w-8 h-8 text-blue-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Cross-Platform</h3>
          <p className="text-gray-400">Our YouTube clipper works flawlessly on Windows, Mac, iOS, and Android devices. No installation required.</p>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <Zap className="w-8 h-8 text-purple-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Lightning Fast</h3>
          <p className="text-gray-400">Powered by advanced cloud rendering, your clips are generated and ready to download in seconds.</p>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <ShieldCheck className="w-8 h-8 text-green-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">100% Secure</h3>
          <p className="text-gray-400">We don't store your clips or track your downloads. Your privacy is our top priority.</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-8 rounded-2xl border border-blue-500/20 mb-16">
        <h2 className="text-2xl font-bold text-white mb-6">Why Use Our YouTube Clipper?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            "Create engaging social media content (TikTok, Reels, Shorts)",
            "Extract highlights from long podcasts or streams",
            "Share specific gaming moments with friends",
            "Create reaction GIFs and memes",
            "Save educational segments for offline studying",
            "Build compilation videos easily"
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
        
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-2">Is this YouTube clipper really free?</h3>
          <p className="text-gray-400">Yes! Our basic clipping and downloading service is 100% free to use. There are no hidden fees or subscriptions required to download standard quality clips.</p>
        </div>

        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-2">Are there any watermarks on the downloaded clips?</h3>
          <p className="text-gray-400">Absolutely not. We believe your content should be yours. Every video you clip and download is completely watermark-free.</p>
        </div>

        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-2">What is the maximum length for a clip?</h3>
          <p className="text-gray-400">Currently, you can create clips up to 10 minutes long. This covers 99% of use cases for social media, highlights, and memes.</p>
        </div>

        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-2">Can I download just the audio?</h3>
          <p className="text-gray-400">Yes! In the download options below the video player, you can select the "Audio Only" option to extract high-quality MP3/M4A audio from any YouTube video.</p>
        </div>
      </div>
    </div>
  );
}