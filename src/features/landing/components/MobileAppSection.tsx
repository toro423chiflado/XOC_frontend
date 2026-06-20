import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function MobileAppSection() {
  const containerRef = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end center"]
  });

  const videoY = useTransform(scrollYProgress, [0, 1], [150, -30]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.7], [0, 1]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [0.95, 1.05]);

  const textY = useTransform(scrollYProgress, [0, 1], [250, -30]);
  const textOpacity = useTransform(scrollYProgress, [0.2, 0.9], [0, 1]);

  return (
    <section ref={containerRef} className="py-24 px-6 bg-[#0a0a0a] relative overflow-hidden">
      {/* Dynamic Background Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-neon-green/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.3fr_0.7fr] gap-12 items-center relative z-10">
        {/* Video Card - Left (Larger) */}
        <motion.div 
          style={{ 
            y: videoY,
            opacity: videoOpacity,
            scale: videoScale
          }}
          className="relative rounded-[2.5rem] overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black"
        >
          <div className="relative rounded-[2.5rem] overflow-hidden">
            <video
              src="/XOC-Dashboard.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="block w-full h-auto opacity-90 group-hover:opacity-100 transition-all duration-1000 saturate-[1.1] group-hover:saturate-[1.8] brightness-[1.0] group-hover:brightness-[1.2] contrast-[1.1] group-hover:contrast-[1.2]"
            />
          </div>
        </motion.div>

        {/* Text Card - Right (Centered & Offset Up) */}
        <motion.div 
          style={{ 
            y: textY,
            opacity: textOpacity
          }}
          className="lg:translate-x-12 rounded-[2.5rem] border border-white/5 bg-white/[0.01] backdrop-blur-3xl p-8 md:p-12 shadow-2xl relative flex flex-col items-center text-center"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
          
          <div className="flex items-center justify-center mb-6">
            <span className="px-4 py-1.5 rounded-full border border-neon-green/20 bg-neon-green/5 text-neon-green text-[9px] font-black uppercase tracking-[0.3em]">
              Ecosistema Digital
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6 leading-[0.95]">
            XOC AHORA <br className="hidden md:block"/> <span className="text-neon-green">EN MOBILE</span>
          </h2>
          
          <p className="text-gray-500 text-sm md:text-base mb-10 font-medium leading-relaxed max-w-[280px]">
            Lleva el control de tus operaciones SecOps a cualquier lugar. XOC está disponible en Web, iOS y Android.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            <motion.a
              href="https://apps.apple.com/uy/app/xoc/id6759814234"
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-40 md:w-44 transition-all"
            >
              <img 
                src="/Download_on_the_App_Store_Badge.svg.png" 
                alt="Download on App Store" 
                className="w-full h-auto"
              />
            </motion.a>
            <motion.a
              href="https://play.google.com/store/apps/details?id=com.vibecode.xocapp"
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-40 md:w-44 transition-all"
            >
              <img 
                src="/Google_Play_Store_badge_EN.svg.png" 
                alt="Get it on Google Play" 
                className="w-full h-auto"
              />
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
