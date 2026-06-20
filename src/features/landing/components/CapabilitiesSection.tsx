import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Globe, MessageSquare, Shield, KeyRound, Fingerprint, Network, ScanSearch, Sparkles, Bot } from 'lucide-react';

const FEATURE_DATA = [
  {
    title: "SOPHIA AI Engine",
    desc: "Capa de decisión y ejecución basada en IA para operar SecOps con velocidad extrema y precisión quirúrgica. Transforma el ruido en acciones.",
    icon: <Sparkles className="w-6 h-6" />,
    size: "large",
    tag: "Core Engine"
  },
  {
    title: "Security Multi-tenant",
    desc: "Aislamiento estricto por empresa y gobernanza centralizada para entornos multinube dinámicos.",
    icon: <Globe className="w-5 h-5" />,
    size: "medium"
  },
  {
    title: "Robotización con IA",
    desc: "Acciones en tiempo real sin intervención manual para reducir tiempos de respuesta críticos.",
    icon: <Bot className="w-5 h-5" />,
    size: "small"
  },
  {
    title: "RBAC Enterprise",
    desc: "Gobernanza real por roles para controlar acceso, operación y segregación de funciones.",
    icon: <Fingerprint className="w-5 h-5" />,
    size: "small"
  },
  {
    title: "Tickets Inteligentes",
    desc: "De detección a resolución automática, con contexto unificado y trazabilidad completa.",
    icon: <MessageSquare className="w-5 h-5 " />,
    size: "medium"
  },
  {
    title: "Secret Management",
    desc: "Gestión segura de infraestructura con integración nativa Key Vault.",
    icon: <KeyRound className="w-5 h-5" />,
    size: "small"
  },
  {
    title: "Orquestación SOC",
    desc: "Coordinación avanzada de agentes para ejecutar flujos complejos.",
    icon: <Shield className="w-5 h-5" />,
    size: "medium"
  },
  {
    title: "Analítica Pentest",
    desc: "Ingesta y análisis de scanners (OpenVAS, Nessus, X1) con contexto.",
    icon: <ScanSearch className="w-5 h-5" />,
    size: "small"
  },
  {
    title: "Integración Nativa",
    desc: "Conecta tu stack existente sin romper procesos.",
    icon: <Network className="w-5 h-5" />,
    size: "small"
  }
];

function FeatureCard({ feature, mouseX, mouseY }: { feature: any, mouseX: any, mouseY: any }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const spotlightX = useTransform(mouseX, (value: number) => {
    if (!cardRef.current) return 0;
    const rect = cardRef.current.getBoundingClientRect();
    return value - rect.left;
  });

  const spotlightY = useTransform(mouseY, (value: number) => {
    if (!cardRef.current) return 0;
    const rect = cardRef.current.getBoundingClientRect();
    return value - rect.top;
  });

  const sizeClasses = {
    large: "md:col-span-2 md:row-span-2",
    medium: "md:col-span-1 md:row-span-1",
    small: "md:col-span-1 md:row-span-1"
  }[feature.size as 'large' | 'medium' | 'small'] || "";

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group relative rounded-[2rem] border border-white/5 bg-[#0d0d0d] overflow-hidden p-8 flex flex-col justify-between transition-all duration-500 ${sizeClasses} hover:border-neon-green/30 hover:shadow-[0_0_40px_rgba(0,255,159,0.05)]`}
    >
      {/* Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [spotlightX, spotlightY],
            ([x, y]) => `radial-gradient(350px circle at ${x}px ${y}px, rgba(0, 255, 159, 0.1), transparent 80%)`
          ),
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
            <div className={`p-3.5 rounded-2xl bg-white/5 border border-white/10 text-emerald-400 group-hover:text-neon-green group-hover:border-neon-green/40 transition-all ${feature.size === 'large' ? 'scale-110' : ''}`}>
                {feature.icon}
            </div>
            {feature.tag && (
                <span className="px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(0,255,159,0.1)]">
                    {feature.tag}
                </span>
            )}
        </div>

        <h3 className={`${feature.size === 'large' ? 'text-2xl md:text-4xl' : 'text-lg md:text-xl'} font-black uppercase text-white tracking-tight mb-4 leading-tight group-hover:text-neon-green transition-colors`}>
            {feature.title}
        </h3>
      </div>

      <p className={`relative z-10 text-gray-500 font-medium leading-relaxed group-hover:text-gray-300 transition-colors ${feature.size === 'large' ? 'text-lg' : 'text-sm'}`}>
        {feature.desc}
      </p>

      {/* Decorative Glow */}
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-neon-green/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}

export default function CapabilitiesSection() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ clientX, clientY }: React.MouseEvent) {
    mouseX.set(clientX);
    mouseY.set(clientY);
  }

  return (
    <section id="capacidades" className="py-24 px-6 bg-[#0a0a0a] relative overflow-hidden" onMouseMove={handleMouseMove}>
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neon-green/5 blur-[120px] rounded-full pointer-events-none -translate-x-1/4 -translate-y-1/4" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 md:mb-24">
          <div className="flex justify-center mb-6">
            <span className="px-4 py-1.5 text-[10px] font-bold tracking-[0.4em] uppercase bg-white/5 border border-white/10 rounded-full shadow-2xl flex items-center justify-center gap-2.5 antialiased">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse shadow-[0_0_8px_rgba(0,255,159,0.8)]" />
              Enterprise Ecosystem
            </span>
          </div>
          <h2 className="text-4xl md:text-7xl font-black mb-8 uppercase text-white tracking-tighter leading-[0.9] md:leading-[1]">
            CAPACIDADES <br className="hidden md:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-emerald-500">ULTRAPRO</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto font-medium text-base md:text-xl leading-relaxed">
            Plataforma de convergencia diseñada para operar infraestructuras críticas con seguridad autónoma.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURE_DATA.map((feature, idx) => (
            <FeatureCard key={idx} feature={feature} mouseX={mouseX} mouseY={mouseY} />
          ))}
        </div>
      </div>
    </section>
  );
}
