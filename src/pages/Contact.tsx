import React from 'react';
import { motion } from 'motion/react';
import { Mail, MessageSquare } from 'lucide-react';
import { SEO } from '../components/SEO';

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-4xl mx-auto text-zinc-300">
      <SEO 
        title="Contact Us | Zynclipa" 
        description="Get in touch with Zynclipa. Have a question or feedback about our cut YouTube videos free tool? Send us a message and we'll respond within 24 hours." 
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-8 mt-12"
      >
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white">Contact Us</h1>
        <p className="text-lg text-zinc-400">
          Have a question about our "Cut YouTube videos free tool"? Found a bug, or want to suggest a new feature? We'd love to hear from you.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          {/* Contact Form */}
          <div className="bg-zinc-900 border border-zinc-800/50 p-6 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-6">Send us a message</h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
                <input 
                  type="text" 
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red transition-colors"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red transition-colors"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Message</label>
                <textarea 
                  rows={4}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red transition-colors resize-none"
                  placeholder="How can we help?"
                ></textarea>
              </div>
              <button className="w-full bg-brand-red hover:bg-brand-red/90 text-white font-medium py-2 px-4 rounded-lg transition-colors mt-2">
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="bg-brand-red/10 p-3 rounded-full h-fit">
                <Mail className="text-brand-red w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Email</h3>
                <p className="text-zinc-400 mt-1">support@zynclipa.com</p>
                <p className="text-sm text-zinc-500 mt-1">We usually respond within 24 hours.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-brand-purple/10 p-3 rounded-full h-fit">
                <MessageSquare className="text-brand-purple w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Feedback</h3>
                <p className="text-zinc-400 mt-1">Your feedback is what makes our "Cut YouTube videos free tool" the best on the internet. Don't hesitate to share your thoughts!</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
