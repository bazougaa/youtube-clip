import React from 'react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-4xl mx-auto text-zinc-300">
      <SEO 
        title="Privacy Policy | Zynclipa" 
        description="Privacy Policy for Zynclipa's cut YouTube videos free tool. Learn how we protect your data and privacy while you use our free YouTube trimmer." 
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-8 mt-12"
      >
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white">Privacy Policy</h1>
        <p className="text-sm text-zinc-500">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Introduction</h2>
          <p>Welcome to Zynclipa, the premier "Cut YouTube videos free tool". Your privacy is critically important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Information We Collect</h2>
          <p>We do not collect personal identifying information (PII) from users to operate the core functionality of our tool. When you use Zynclipa's "Cut YouTube videos free tool", we process the YouTube URLs you provide on our servers temporarily.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>To provide the service:</strong> We use the URLs to fetch, trim, and download the video clips you request.</li>
            <li><strong>Temporary Storage:</strong> Processed videos are stored on our servers only for the duration necessary to facilitate your download. Files are immediately or periodically deleted and never kept permanently.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Cookies and Tracking</h2>
          <p>Our website may use local storage or essential cookies to remember your preferences (like the last video you trimmed or UI settings). We do not use intrusive tracking or sell your data to third parties.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Contact Us</h2>
          <p>If you have any questions or concerns about our Privacy Policy, please visit our Contact page.</p>
        </section>
      </motion.div>
    </div>
  );
}
