import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { SEO } from '../components/SEO';

const faqs = [
  {
    q: "What is this tool?",
    a: 'Zynclipa is a "Cut YouTube videos free tool" that allows you to easily trim and download specific segments of any YouTube video directly from your browser, with absolutely no watermarks.'
  },
  {
    q: "Is it completely free?",
    a: "Yes! Zynclipa is 100% free to use. We do not require you to register, sign up, or pay any hidden fees."
  },
  {
    q: "What video quality can I download?",
    a: "We automatically detect and provide the best available video quality from YouTube, all the way up to 4K resolution (2160p) if it's available on the original video."
  },
  {
    q: "Can I download just the audio?",
    a: "Absolutely. Along with video clips, we provide an option to download the best quality audio track (usually M4A) of any YouTube video."
  },
  {
    q: "Are there any watermarks?",
    a: "No. Unlike other free tools, Zynclipa's 'Cut YouTube videos free tool' processes the original video stream directly, meaning the final clip is perfectly clean and has zero watermarks."
  },
  {
    q: "How long can my trimmed clip be?",
    a: "Currently, you can trim any segment from a YouTube video. There are no strict artificial limits on clip length, though longer clips will naturally take longer to process and download."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-3xl mx-auto text-zinc-300">
      <SEO 
        title="FAQ | Cut YouTube videos free tool" 
        description="Frequently asked questions about Zynclipa's cut YouTube videos free tool. Learn how to trim, clip, and download YouTube videos for free." 
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-8 mt-12"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-brand-red/10 rounded-full mb-2">
            <HelpCircle className="text-brand-red w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">Frequently Asked Questions</h1>
          <p className="text-lg text-zinc-400">Everything you need to know about Zynclipa, the premier "Cut YouTube videos free tool".</p>
        </div>

        <div className="space-y-4 mt-12">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden transition-colors hover:bg-zinc-900"
            >
              <button
                className="w-full text-left px-6 py-4 flex items-center justify-between focus:outline-none"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium text-lg text-white">{faq.q}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-brand-red flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-5 pt-1 text-zinc-400 leading-relaxed border-t border-zinc-800/50 mt-2">
                  <p className="mt-4">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
