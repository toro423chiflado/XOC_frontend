import { motion } from 'framer-motion';
import { Server } from 'lucide-react';

export default function ArchitectureSection() {
  return (
    <section id="arquitectura" className="py-20 px-6 border-t border-white/5 bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Flare */}
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-neon-green/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div className="relative order-2 lg:order-1">
                  <div className="absolute inset-0 bg-neon-green/10 blur-[120px] rounded-full" />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-black aspect-square max-w-sm mx-auto shadow-2xl flex flex-col items-center justify-center p-8 backdrop-blur-xl"
                  >
                      {/* Animated Tech Lines */}
                      <div className="absolute inset-0 opacity-20">
                          {[...Array(15)].map((_, i) => (
                              <div 
                                  key={i} 
                                  className="absolute bg-neon-green" 
                                  style={{
                                      width: Math.random() * 80 + '%',
                                      height: '1px',
                                      top: Math.random() * 100 + '%',
                                      left: 0,
                                      opacity: Math.random() * 0.5,
                                      animation: `pulse ${2 + Math.random() * 3}s infinite`
                                  }}
                              />
                          ))}
                      </div>
                      
                      <div className="relative z-10 flex flex-col items-center">
                          <div className="w-20 h-20 rounded-3xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(0,255,159,0.15)]">
                            <Server className="w-10 h-10 text-neon-green" />
                          </div>
                          <div className="space-y-1 text-center">
                              <span className="text-[9px] font-black tracking-[0.5em] text-neon-green uppercase block mb-2 antialiased">Infraestructura Segura</span>
                              <span className="text-xl md:text-2xl font-black tracking-tight text-white uppercase italic">Azure Core Engine</span>
                          </div>
                      </div>
                  </motion.div>
              </div>

              <div className="order-1 lg:order-2">
                  <div className="mb-10">
                    <span className="text-neon-green text-[10px] font-black tracking-[0.4em] uppercase block mb-4">Arquitectura</span>
                    <h2 className="text-3xl md:text-5xl font-black mb-6 uppercase text-white tracking-tight leading-tight">Diseñada para entornos <br className="hidden md:block"/> Enterprise</h2>
                    <p className="text-gray-400 font-medium leading-relaxed max-w-lg">
                       XOC se despliega sobre una base tecnológica de alta disponibilidad con segregación lógica y física de datos.
                    </p>
                  </div>

                  <div className="space-y-10">
                      {[
                          { title: "Aislamiento lógico por tenant", desc: "Cada cliente opera en un entorno segregado para garantizar la seguridad estricta de la información." },
                          { title: "Gestión avanzada de secretos", desc: "Credenciales y llaves administradas bajo estándares bancarios con cifrado en reposo y tránsito." },
                          { title: "Trazabilidad de auditoría", desc: "Registro inmutable de cada decisión y acción ejecutada para cumplimiento y análisis forense." }
                      ].map((item, idx) => (
                          <motion.div 
                             key={idx} 
                             initial={{ opacity: 0, x: 20 }}
                             whileInView={{ opacity: 1, x: 0 }}
                             viewport={{ once: true }}
                             transition={{ delay: idx * 0.1 }}
                             className="flex gap-6 group"
                          >
                              <div className="shrink-0 flex flex-col items-center">
                                  <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center font-black text-gray-500 text-xs group-hover:border-neon-green/40 group-hover:text-neon-green transition-all">
                                      {idx + 1}
                                  </div>
                                  {idx < 2 && <div className="w-px flex-1 bg-gradient-to-b from-white/10 to-transparent mt-4" />}
                              </div>
                              <div>
                                  <h4 className="font-black text-lg mb-2 uppercase tracking-tight text-white group-hover:text-neon-green transition-colors">{item.title}</h4>
                                  <p className="text-sm text-gray-500 font-medium leading-relaxed group-hover:text-gray-400 transition-colors">{item.desc}</p>
                              </div>
                          </motion.div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
    </section>
  );
}
