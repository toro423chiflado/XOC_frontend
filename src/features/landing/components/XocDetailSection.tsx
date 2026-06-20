import { motion } from 'framer-motion';

export default function XocDetailSection() {
  return (
    <section className="py-16 px-6 relative overflow-hidden bg-[#0a0a0a]">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-neon-green/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <span className="text-neon-green text-[10px] font-black tracking-[0.4em] uppercase block mb-4 antialiased">Qué es XOC</span>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-5 leading-tight">
            La capa de control para <br className="hidden md:block"/> operaciones de ciberseguridad
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg font-medium leading-relaxed">
            XOC es una plataforma de convergencia operativa que coordina seguridad, red y 
            experiencia digital con trazabilidad total en tiempo real.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { tag: 'Convergencia', text: 'Unifica señales de SOC, NOC y APM en un único contexto para eliminar silos operativos.' },
            { tag: 'Decisión', text: 'Prioriza riesgos reales con IA y transforma miles de eventos en decisiones accionables.' },
            { tag: 'Ejecución', text: 'Orquesta respuesta y remediación automática con evidencia auditada e impacto medible.' }
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5, borderColor: 'rgba(0,255,159,0.3)' }}
              className="rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-md p-7 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(0,255,159,0.05)]"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-green mb-4 opacity-80 group-hover:opacity-100 transition-opacity">{item.tag}</p>
              <p className="text-sm text-gray-400 group-hover:text-gray-200 leading-relaxed font-medium transition-colors">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>
        
        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mt-10">
          Resultados referenciales según tipo de operación y nivel de madurez
        </p>
      </div>
    </section>
  );
}
