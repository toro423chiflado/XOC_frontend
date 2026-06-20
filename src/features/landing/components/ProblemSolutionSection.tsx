import { motion } from 'framer-motion';
import { Layers, Activity, Zap } from 'lucide-react';

export default function ProblemSolutionSection() {
  return (
    <section id="solucion" className="py-20 px-6 border-t border-white/5 relative bg-[#0a0a0a] overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-neon-green/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded overflow-hidden shadow-lg mb-8">
              <span className="text-neon-green text-[9px] font-black tracking-[.3em] uppercase">Control Operativo</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black mb-8 uppercase tracking-tight text-white leading-tight">
              El problema no es la <br />
              <span className="text-neon-green drop-shadow-[0_0_15px_rgba(0,255,159,0.2)]">fragmentación. Es la seguridad.</span>
            </h2>

            <p className="text-base text-gray-400 mb-10 max-w-xl leading-relaxed font-medium">
              XOC unifica SOC, NOC, APM y telemetría de experiencia digital en un solo flujo convergente para una respuesta coordinada y autónoma.
            </p>
            
            <div className="space-y-4">
              {[
                {
                  p: "Herramientas desconectadas", 
                  s: "Integración nativa de señales en un contexto operativo único.",
                  icon: <Layers className="w-5 h-5 text-gray-500 group-hover:text-neon-green transition-colors" />
                },
                { 
                  p: "Exceso de alertas", 
                  s: "IA especializada que prioriza riesgos reales y reduce el ruido operacional.",
                  icon: <Activity className="w-5 h-5 text-gray-500 group-hover:text-neon-green transition-colors" />
                },
                { 
                  p: "Respuesta lenta", 
                  s: "Cerebro operativo que orquesta y ejecuta remediación en tiempo real.",
                  icon: <Zap className="w-5 h-5 text-gray-500 group-hover:text-neon-green transition-colors" />
                }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ x: 5 }}
                  className="flex gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-neon-green/20 transition-all group backdrop-blur-sm"
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-neon-green/40 transition-all">
                    {item.icon}
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1.5 line-through decoration-red-500/40">{item.p}</h4>
                    <p className="text-white font-bold text-sm md:text-base leading-snug group-hover:text-neon-green transition-colors">
                       {item.s}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative mt-12 lg:mt-0">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent shadow-2xl"
            >
                <div className="bg-[#0c0c0c] p-8 md:p-10 rounded-[2.45rem] border border-white/5 relative overflow-hidden backdrop-blur-3xl">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-neon-green/5 blur-[60px]" />
                    
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 tracking-[0.3em] uppercase">XOC Response Engine v2.4</span>
                    </div>
                    
                    <div className="space-y-4 font-mono text-[11px] md:text-sm">
                        <p className="text-white/40 flex items-center gap-2">
                          <span className="text-neon-green">$</span> xoc-ai --monitor-converged
                        </p>
                        <div className="pl-4 border-l border-white/10 space-y-3.5 py-1">
                          <p className="text-gray-500 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-gray-500/50 rounded-full animate-pulse" />
                             Analizando perímetros de infraestructura...
                          </p>
                          <p className="text-red-400 font-bold">
                             [ALERT] Anomalía crítica detectada en Cloud Gateway.
                          </p>
                          <p className="text-white">
                             [EXEC] Aplicando políticas de aislamiento dinámico.
                          </p>
                          <p className="text-neon-green font-bold">
                             [OK] Amenaza neutralizada. Impacto en UX: 0ms.
                          </p>
                        </div>
                        <div className="h-px bg-white/5 w-full my-6 flex overflow-hidden">
                           <div className="w-1/3 h-full bg-neon-green/30" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-white/[0.03] p-3 rounded-xl border border-white/5">
                              <p className="text-gray-500 text-[9px] uppercase tracking-wider mb-1">MTTR Reducido</p>
                              <p className="text-neon-green font-bold text-lg">-72.4%</p>
                           </div>
                           <div className="bg-white/[0.03] p-3 rounded-xl border border-white/5">
                              <p className="text-gray-500 text-[9px] uppercase tracking-wider mb-1">Operational Score</p>
                              <p className="text-neon-green font-bold text-lg">99.8</p>
                           </div>
                        </div>
                    </div>
                </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
