import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Shield, Zap, MessageSquare, Target, Settings, Rocket } from 'lucide-react';
import LandingNavbar from './LandingNavbar';
import LandingFooter from './LandingFooter';

export default function XocAcquisitionPage() {
  const navigate = useNavigate();

  const acquisitionSteps = [
    {
      icon: MessageSquare,
      title: "Contacto Inicial",
      description: "Iniciamos con una breve llamada o chat para entender los retos actuales de tu centro de operaciones."
    },
    {
      icon: Target,
      title: "Diagnóstico de Infraestructura",
      description: "Analizamos tus herramientas actuales (Wazuh, Zabbix, etc.) para asegurar una integración fluida."
    },
    {
      icon: Settings,
      title: "Propuesta Personalizada",
      description: "Diseñamos un plan basado en la cantidad de activos y el nivel de automatización requerido."
    },
    {
      icon: Rocket,
      title: "Despliegue y Onboarding",
      description: "Configuramos tu entorno XOC y entrenamos a tu equipo para maximizar la eficiencia operativa."
    }
  ];

  const modalities = [
    {
      title: "XOC Essential",
      icon: Zap,
      description: "Ideal para equipos que buscan centralizar y orquestar sus herramientas existentes en una sola interfaz inteligente.",
      features: [
        "Unificación de SOC + NOC",
        "Dashboard Centralizado en tiempo real",
        "Integración con herramientas Open Source",
        "Soporte técnico standard",
        "Alertas inteligentes"
      ],
      color: "border-blue-500/30 bg-blue-500/5",
      iconColor: "text-blue-400"
    },
    {
      title: "XOC Premium",
      icon: Shield,
      description: "La solución completa para organizaciones que demandan máxima automatización y respuesta inmediata ante incidentes.",
      features: [
        "Todo lo incluido en Essential",
        "Agente VICTOR (Respuesta Automatizada)",
        "Sophia AI con mayor capacidad de análisis",
        "Soporte VIP 24/7",
        "Informes ejecutivos automáticos",
        "Predictive Threat Analysis"
      ],
      color: "border-neon-green/30 bg-neon-green/5",
      iconColor: "text-neon-green"
    }
  ];

  const handleSalesClick = () => {
    window.open('https://wa.me/51999379845?text=Hola%2C%20quiero%20más%20información%20sobre%20las%20modalidades%20XOC%20Essential%20y%20Premium.%20Me%20interesa%20iniciar%20el%20proceso%20de%20adquisición.', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <LandingNavbar />
      
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Volver</span>
        </button>

        {/* Header Section */}
        <section className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-tight">
              Adquiere el poder del <span className="text-neon-green">XOC</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Transformar tu ciberseguridad no tiene por qué ser complejo. Hemos diseñado un proceso ágil para que tu equipo opere al siguiente nivel.
            </p>
          </motion.div>
        </section>

        {/* Process Section */}
        <section className="mb-32">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="text-xl font-black uppercase tracking-[0.2em] text-white">Tu camino hacia el XOC</h2>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {acquisitionSteps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-neon-green/10 flex items-center justify-center mb-6">
                  <step.icon className="w-6 h-6 text-neon-green" />
                </div>
                <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                
                {idx < acquisitionSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-neon-green/30 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Modalities Section */}
        <section className="mb-32">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px bg-white/10 flex-1" />
            <h2 className="text-xl font-black uppercase tracking-[0.2em] text-white">Escoge tu modalidad</h2>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {modalities.map((modal, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`p-10 rounded-3xl border ${modal.color} relative overflow-hidden flex flex-col`}
              >
                <div className="mb-8 flex items-center justify-between">
                  <div className={`p-4 rounded-2xl bg-white/5`}>
                    <modal.icon className={`w-8 h-8 ${modal.iconColor}`} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-white/10 rounded-full text-gray-400">
                    Modalidad
                  </span>
                </div>

                <h3 className="text-3xl font-black mb-4 uppercase tracking-tight">{modal.title}</h3>
                <p className="text-gray-400 mb-10 leading-relaxed font-medium">
                  {modal.description}
                </p>

                <div className="space-y-4 mb-12 flex-1">
                  {modal.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-3">
                      <CheckCircle2 className={`w-5 h-5 ${modal.iconColor} opacity-70`} />
                      <span className="text-sm text-gray-300 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center relative">
          <div className="absolute inset-0 bg-neon-green/5 blur-[120px] rounded-full" />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-8 uppercase tracking-tight">¿Dudas sobre cuál se <span className="text-neon-green">ajusta mejor</span>?</h2>
            <p className="text-gray-400 mb-12 text-lg max-w-2xl mx-auto">
              Nuestros arquitectos de seguridad te ayudarán a definir la arquitectura ideal para tu SOC.
            </p>
            <button 
              onClick={handleSalesClick}
              className="px-12 py-6 bg-neon-green text-black font-black rounded-2xl shadow-[0_0_30px_rgba(0,255,159,0.3)] hover:scale-105 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3 mx-auto"
            >
              Hablar con Ventas
              <MessageSquare className="w-5 h-5" />
            </button>
          </motion.div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
