import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert } from 'lucide-react';
import { SEO } from '../components/SEO';

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-4xl mx-auto text-zinc-300">
      <SEO 
        title="Terms of Service | Zynclipa" 
        description="Terms of Service and user responsibilities for Zynclipa's cut YouTube videos free tool. Read our guidelines for trimming and downloading YouTube videos." 
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-8 mt-12"
      >
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white">Terms of Service</h1>
        <p className="text-sm text-zinc-500">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">1. Introduction</h2>
          <p>Welcome to Zynclipa, the premier "Cut YouTube videos free tool". By using our website and services, you agree to comply with and be bound by these Terms of Service.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">2. Description of Service</h2>
          <p>Our service allows users to input YouTube URLs to trim, clip, and download video segments. The service is provided "as is" and "as available".</p>
        </section>

        <section className="space-y-4 p-6 bg-brand-red/10 border border-brand-red/20 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="text-brand-red w-6 h-6" />
            <h2 className="text-2xl font-semibold text-brand-red">3. User Responsibility Clause</h2>
          </div>
          <p className="text-zinc-300">
            By using Zynclipa's "Cut YouTube videos free tool", you acknowledge and agree that:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-300">
            <li>You are solely responsible for the content you process, trim, or download using our services.</li>
            <li>You must possess the necessary rights, permissions, or fair-use justifications to manipulate and download the specific YouTube content.</li>
            <li>You agree not to use this tool for copyright infringement, piracy, or downloading content that you do not have the legal right to access or modify.</li>
            <li>We do not store or host the downloaded videos permanently; we merely act as a temporary processing proxy. Any legal liability arising from the downloaded files rests entirely on the user.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">4. Modifications to Service</h2>
          <p>We reserve the right to modify or discontinue the service at any time without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.</p>
        </section>

      </motion.div>
    </div>
  );
}
