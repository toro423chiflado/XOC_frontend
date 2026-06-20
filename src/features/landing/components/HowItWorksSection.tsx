import { motion } from 'framer-motion';
import { Database, BrainCircuit, Rocket } from 'lucide-react';

const STEPS = [
  {
    title: 'Centraliza',
    description: 'Integra logs, vulnerabilidades y eventos en un solo lugar con trazabilidad total.',
    icon: Database
  },
  {
    title: 'Analiza',
    description: 'La IA de SOPHIA prioriza lo crítico, transformando el ruido en decisiones operativas.',
    icon: BrainCircuit
  },
  {
    title: 'Ejecuta',
    description: 'Automatiza respuesta y remediación con flujos orquestados listos para actuar.',
    icon: Rocket
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 px-6 bg-[#0a0a0a] relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-5">
            <span className="px-3 py-1 text-[10px] font-bold tracking-[0.3em] uppercase bg-white/5 border border-white/10 rounded overflow-hidden shadow-lg flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green/80 shadow-[0_0_5px_rgba(0,255,159,0.8)]" />
               FLUJO XOC
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-6 leading-tight">Cómo funciona XOC</h2>
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-[9px] font-black uppercase tracking-wider text-gray-500">
            <span className="px-3 py-1 rounded-md border border-white/5 bg-white/[0.02]">SOC Reactivo → XOC Autónomo</span>
            <span className="px-3 py-1 rounded-md border border-white/5 bg-white/[0.02]">Silos Separados → Convergencia</span>
            <span className="px-3 py-1 rounded-md border border-white/5 bg-white/[0.02]">Monitoreo → Experiencia Digital</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div 
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:bg-white/[0.04] hover:border-white/10 group"
              >
                <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center mb-8 group-hover:border-neon-green/30 transition-colors">
                  <Icon className="w-5 h-5 text-neon-green/80" />
                </div>
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-600 mb-2.5">Paso {idx + 1}</p>
                <h3 className="text-2xl font-black uppercase text-white mb-4 tracking-tight">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed font-medium transition-colors group-hover:text-gray-300">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
