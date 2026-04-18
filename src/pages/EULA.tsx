import React from 'react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';

export default function EULA() {
  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-4xl mx-auto text-zinc-300">
      <SEO 
        title="End-User License Agreement (EULA) | Zynclipa" 
        description="End-User License Agreement for Zynclipa. Read the licensing terms for our cut YouTube videos free tool." 
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-8 mt-12 pb-24"
      >
        <div className="text-center border-b border-zinc-800 pb-8 mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-wide">ZYNCLIPA™ END-USER LICENSE AGREEMENT</h1>
        </div>
        
        <div className="prose prose-invert prose-zinc max-w-none text-sm md:text-base leading-relaxed space-y-6">
          <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
            <p className="font-bold text-white uppercase text-sm tracking-wider mb-4">Notice to User:</p>
            <p className="uppercase text-zinc-400 font-medium">
              THIS IS A CONTRACT. THIS END USER LICENSE AGREEMENT IS A LEGALLY BINDING CONTRACT THAT SHOULD BE READ IN ITS ENTIRETY. BY USING THE ZYNCLIPA WEBSITE ("THE PRODUCT"), YOU AGREE TO BE BOUND BY THE TERMS AND CONDITIONS OF THIS AGREEMENT. IF YOU DO NOT AGREE TO THE TERMS AND CONDITIONS OF THIS AGREEMENT, DO NOT USE OR ACCESS THE PRODUCT.
            </p>
          </div>

          <p>
            This End-User License Agreement (the "<strong>Agreement</strong>") is a legal agreement between you (either an individual or an entity) (the "<strong>Licensee</strong>") and Zynclipa (the "<strong>Licensor</strong>" or "<strong>we</strong>") regarding the software and web-based services provided by Zynclipa.
          </p>
          <p>
            By accessing, downloading, storing, loading, installing, executing, displaying, copying the Product into the memory of a computer or otherwise benefiting from using the functionality of the Product in accordance with the Documentation ("<strong>Operating</strong>"), you agree to be bound by the terms of this Agreement.
          </p>

          <h2 className="text-xl font-bold text-white pt-4 border-b border-zinc-800 pb-2">1. Proprietary Rights and Non-Disclosure</h2>
          <p><strong>1.1. Ownership Rights.</strong> You agree that the Product and the authorship, systems, ideas, methods of operation, documentation and other information contained in the Product, are our proprietary intellectual properties. You may not claim any rights to the Product or its intellectual property. Your possession, installation, or use of the Product does not transfer to you any title to the intellectual property in the Product.</p>
          <p><strong>1.2. Source Code.</strong> You acknowledge that the source code for the Product is proprietary to us and our suppliers. You agree not to modify, adapt, translate, reverse engineer, decompile, disassemble or otherwise attempt to discover the source code of the Product in any way.</p>
          <p><strong>1.3. Confidential Information.</strong> You agree that, unless otherwise specifically provided herein, the Product, including the specific design and structure of individual programs and the Product, constitute our confidential proprietary information. You agree not to transfer, copy, disclose, provide or otherwise make available such confidential information in any form to any third party.</p>
          <p><strong>1.4. No Modification.</strong> You agree not to modify or alter the Product in any way. You may not remove or alter any copyright notices or other proprietary notices on any copies of the Product.</p>

          <h2 className="text-xl font-bold text-white pt-4 border-b border-zinc-800 pb-2">2. Grant of License</h2>
          <p><strong>2.1. License.</strong> We grant you the non-exclusive and non-transferable license to store, load, install, execute, and display (to "Use") the Product solely for your personal, non-commercial purposes. If the software was designed as a "Web Service" (operated over the Internet), you may use it according to its standard functionality.</p>
          <p><strong>2.2. Prohibited Uses.</strong> You agree that you will not:</p>
          <ul className="list-disc pl-8 space-y-2 text-zinc-400">
            <li>Engage in any act that we deem to be reasonably described as in conflict with the spirit or intent of this Agreement.</li>
            <li>Use the Product, intentionally or unintentionally, in connection with any violation of any applicable law or regulation.</li>
            <li>Institute, assist, or become involved in any type of attack, including without limitation distribution of a virus, denial of service attacks upon the Product, or other attempts to disrupt the related service.</li>
            <li>Make available through the Product any material or information that infringes any copyright, trademark, patent, trade secret, or other right of any party.</li>
            <li>Use the Product in connection with any unauthorized third-party software that intercepts, mines, or otherwise collects information from or through the Product.</li>
          </ul>

          <h2 className="text-xl font-bold text-white pt-4 border-b border-zinc-800 pb-2">3. User Responsibility & Third-Party Content</h2>
          <p><strong>3.1. Third-Party Materials.</strong> When using the Product, you may be able to access or download third-party materials, including without limitation materials downloaded from YouTube ("Third-Party Materials"). Third-Party Materials are not under our control, and we are not responsible for the content of any Third-Party Materials. You assume all responsibility and risk for your use of Third-Party Materials.</p>
          <p><strong>3.2. Legal Conduct.</strong> You agree to use the Product strictly in compliance with all applicable laws and regulations. WE ARE NOT RESPONSIBLE FOR ANY VIOLATION OF APPLICABLE LAWS, RULES, OR REGULATIONS COMMITTED BY YOU OR A THIRD PARTY AT YOUR BEHEST. IT IS YOUR RESPONSIBILITY TO ENSURE THAT YOUR USE OF THE PRODUCT DOES NOT CONTRAVENE APPLICABLE LAWS.</p>

          <h2 className="text-xl font-bold text-white pt-4 border-b border-zinc-800 pb-2">4. Disclaimer of Warranties</h2>
          <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800 uppercase text-xs md:text-sm text-zinc-400">
            <p>
              NO IMPLIED OR OTHER WARRANTIES: EXCEPT FOR ANY WARRANTY CONDITION, REPRESENTATION OR TERM TO THE EXTENT TO WHICH THE SAME CANNOT OR MAY NOT BE EXCLUDED OR LIMITED BY LAW APPLICABLE TO YOU IN YOUR JURISDICTION, THE PRODUCT IS PROVIDED "AS-IS" WITHOUT ANY WARRANTY WHATSOEVER AND WE MAKE NO PROMISES, REPRESENTATIONS OR WARRANTIES, WHETHER EXPRESSED OR IMPLIED, WHETHER BY STATUTE, COMMON LAW, CUSTOM, USAGE OR OTHERWISE, REGARDING OR RELATING TO THE PRODUCT OR CONTENT THEREIN OR TO ANY OTHER MATERIAL FURNISHED OR PROVIDED TO YOU PURSUANT TO THIS AGREEMENT OR OTHERWISE. YOU ASSUME ALL RISKS AND RESPONSIBILITIES FOR SELECTION OF THE PRODUCT TO ACHIEVE YOUR INTENDED RESULTS, AND FOR THE INSTALLATION OF, USE OF, AND RESULTS OBTAINED FROM THE PRODUCT.
            </p>
          </div>

          <h2 className="text-xl font-bold text-white pt-4 border-b border-zinc-800 pb-2">5. Limitation of Liability</h2>
          <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800 uppercase text-xs md:text-sm text-zinc-400">
            <p>
              NO LIABILITY FOR CONSEQUENTIAL OR INCIDENTAL DAMAGES: YOU ASSUME THE ENTIRE COST OF ANY DAMAGE RESULTING FROM THE INFORMATION CONTAINED IN OR COMPILED BY THE PRODUCT. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL WE BE LIABLE FOR ANY DAMAGES WHATSOEVER (INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS OF BUSINESS PROFITS, BUSINESS INTERRUPTION, LOSS OF BUSINESS INFORMATION, LOSS OF DATA, LOSS OF GOODWILL, OR OTHER PECUNIARY LOSS) ARISING OUT OF THE USE OR INABILITY TO USE THE PRODUCT, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
          </div>

          <h2 className="text-xl font-bold text-white pt-4 border-b border-zinc-800 pb-2">6. Miscellaneous</h2>
          <p><strong>6.1. Entire Agreement.</strong> This Agreement constitutes the entire agreement between you and Zynclipa relating to the Product and supersedes all prior or contemporaneous oral or written communications, proposals, and representations with respect to the Product.</p>
          <p><strong>6.2. Contact Information.</strong> If you have any questions concerning this Agreement, or if you desire to contact us for any reason, please contact us at support@zynclipa.com.</p>
        </div>
      </motion.div>
    </div>
  );
}
