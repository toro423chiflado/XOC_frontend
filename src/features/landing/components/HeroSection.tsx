import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlobeBackground from './GlobeBackground';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-start justify-center pt-16 md:pt-20 pb-16 px-6 overflow-hidden bg-[#0a0a0a]">
      {/* 3D Globe Background */}
      <GlobeBackground />
      
      {/* Radial Gradient Overlay to ensure text readability */}
      <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-b from-[#0a0a0a]/60 via-transparent to-[#0a0a0a]/80 pointer-events-none z-10" />


      <div className="max-w-5xl mx-auto text-center relative z-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center space-y-3"
        >
          {/* Logo Burbuja Central - Similar al AuthLayout */}
          <div className="relative group mb-4">
              <motion.div
                  animate={{
                      opacity: [0.4, 0.7, 0.4],
                      scale: [0.95, 1.05, 0.95]
                  }}
                  transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-neon-green/40 blur-[40px] rounded-full"
              />
              <div className="bg-black/60 border border-neon-green/30 p-8 rounded-full backdrop-blur-xl relative z-10 shadow-[0_0_40px_rgba(0,255,159,0.2)]">
                  <img
                      src="./Logo_XOC_Vectorial.svg"
                      alt="XOC Logo Central"
                      className="w-24 h-24 lg:w-32 lg:h-32 object-contain mx-auto relative z-10 drop-shadow-[0_0_15px_rgba(0,255,159,0.5)]"
                  />
              </div>
          </div>
          
          {/* Top Pill */}
          <div className="flex items-center gap-2 px-4 py-1.5 mb-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl">
            <Bot className="w-4 h-4 text-gray-400" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-300">
              PLATFORM LAUNCH
            </span>
          </div>

          <div className="space-y-3 mt-1 mb-3">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-neon-green to-emerald-400 bg-[length:200%_auto] animate-[gradient_8s_linear_infinite] bg-clip-text text-transparent tracking-widest text-center drop-shadow-[0_0_20px_rgba(0,255,159,0.2)]">
              XOC Platform
            </h1>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight leading-[1.15] text-white">
               La evolución del SOC tradicional
            </h2>
            <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-gray-500 font-bold">Xperience Operation Center</p>
          </div>
          
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto mb-4 leading-relaxed font-light">
            Unifica SOC + NOC + APM en un solo centro de operaciones con ejecución automatizada.
          </p>

          <div className="mb-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="px-4 py-2 rounded-full border border-neon-green/30 bg-neon-green/10 text-neon-green text-xs md:text-sm font-black uppercase tracking-wider">
              Reduce el ruido operacional hasta en 60%
            </span>
            <span className="px-4 py-2 rounded-full border border-white/20 bg-white/5 text-gray-200 text-xs md:text-sm font-black uppercase tracking-wider">
              Menor MTTR desde el primer día
            </span>
          </div>

          <div className="flex items-center justify-center gap-4">
             <button 
                onClick={() => navigate('/adquirir')}
                className="px-6 py-3 bg-gradient-to-b from-white/10 to-transparent border border-white/20 text-white font-medium rounded-full hover:bg-white/10 transition-all shadow-lg"
              >
                Empezar Ahora
              </button>
              <button 
                onClick={() => {
                   document.getElementById('solucion')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-transparent border border-transparent hover:border-white/10 text-gray-300 font-medium rounded-full transition-all"
              >
                Saber Más
              </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
