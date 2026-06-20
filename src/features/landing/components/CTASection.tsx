import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-6 bg-[#0a0a0a] relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-[#121212] via-[#0d0d0d] to-[#0a0a0a] text-white p-10 md:p-20 text-center relative overflow-hidden shadow-2xl border border-white/5 backdrop-blur-md"
      >
          {/* Dynamic Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-neon-green/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-neon-green/10 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />
          
          <h2 className="text-3xl md:text-6xl font-black mb-8 relative z-10 leading-tight uppercase tracking-tight">
               ¿Listo para el <br className="hidden md:block" />
               <span className="text-neon-green drop-shadow-[0_0_15px_rgba(0,255,159,0.2)]">futuro del SOC?</span>
          </h2>
          <p className="text-base md:text-lg mb-12 text-gray-400 font-medium max-w-2xl mx-auto relative z-10 leading-relaxed">
               Ver XOC en acción. Recibe una demo guiada en menos de 30 minutos y conoce el impacto real en tu operación.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 relative z-10">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-10 py-5 bg-neon-green text-black font-black rounded-xl shadow-[0_0_20px_rgba(0,255,159,0.3)] uppercase tracking-widest text-[11px] transition-colors hover:bg-neon-green/90"
              >
                  Ver XOC en acción
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,255,159,0.05)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open('https://wa.me/51999379845?text=Hola%2C%20quiero%20agendar%20una%20demo%20del%20XOC%20y%20conocer%20c%C3%B3mo%20puede%20mejorar%20la%20seguridad%20y%20operaci%C3%B3n%20de%20mi%20empresa', '_blank', 'noopener,noreferrer')}
                className="w-full sm:w-auto px-10 py-5 border border-white/20 text-white font-black rounded-xl transition-all uppercase tracking-widest text-[11px] hover:border-neon-green/50 hover:text-neon-green"
              >
                  Hablar con ventas
              </motion.button>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-3 relative z-10">
             <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
             <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500">Sin compromisos • Configuración en 1 hora</p>
             <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
          </div>
      </motion.div>
    </section>
  );
}
