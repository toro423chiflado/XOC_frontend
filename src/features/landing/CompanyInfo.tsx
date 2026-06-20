import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Server, Activity, Cpu, Database, Network } from 'lucide-react';
// import { cn } from '../../lib/utils';

export default function CompanyInfo() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-dark-bg text-white overflow-y-auto custom-scrollbar">
            {/* Navbar / Header */}
            <div className="sticky top-0 z-50 bg-dark-bg/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <img src="./Logo_XOC_Vectorial.svg" alt="XOC Logo" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-lg tracking-wider">XOC PLATFORM <span className="text-neon-cyan text-[10px] ml-2 opacity-60">powered by TxDxSecure</span></span>
                </div>
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Regresar al Login
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12 space-y-24">

                {/* A. Overview */}
                <section className="text-center space-y-6">
                    <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
                        Xperience Operation Center
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                        La convergencia definitiva entre Seguridad (SOC), Operaciones de Red (NOC) y Observabilidad de Aplicaciones.
                        XOC redefine cómo las empresas protegen y optimizan su ecosistema digital.
                    </p>
                </section>

                {/* B. Features */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FeatureCard
                        icon={<Shield className="w-8 h-8 text-neon-green" />}
                        title="Inteligencia de Seguridad"
                        desc="Detección de amenazas en tiempo real y respuesta automatizada ante incidentes de cibersuguridad."
                    />
                    <FeatureCard
                        icon={<Network className="w-8 h-8 text-neon-blue" />}
                        title="Operaciones de Red"
                        desc="Monitoreo continuo de infraestructura activa, routers, switches y enlaces críticos."
                    />
                    <FeatureCard
                        icon={<Activity className="w-8 h-8 text-neon-pink" />}
                        title="Experiencia de Usuario"
                        desc="Análisis profundo de la jornada digital del cliente para garantizar satisfacción total."
                    />
                    <FeatureCard
                        icon={<Server className="w-8 h-8 text-neon-cyan" />}
                        title="Telemetría Full-Stack"
                        desc="Observabilidad completa con métricas, logs y trazas distribuidas de todas sus aplicaciones."
                    />
                </section>

                {/* C. Architecture */}
                <section className="bg-dark-card border border-dark-border rounded-2xl p-8 lg:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                                <Cpu className="w-8 h-8 text-neon-green" />
                                Arquitectura & Tecnología
                            </h2>
                            <ul className="space-y-6">
                                <li className="flex gap-4">
                                    <div className="p-2 bg-white/5 rounded-lg h-fit"><Database className="w-5 h-5 text-neon-green" /></div>
                                    <div>
                                        <h4 className="font-bold text-white">SOPHIA AI Core</h4>
                                        <p className="text-sm text-gray-400 mt-1">Agente autónomo potenciado por Azure OpenAI y RAG (Retrieval Augmented Generation) para respuestas contextuales precisas.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="p-2 bg-white/5 rounded-lg h-fit"><Network className="w-5 h-5 text-neon-blue" /></div>
                                    <div>
                                        <h4 className="font-bold text-white">Ecosistema de Integraciones</h4>
                                        <p className="text-sm text-gray-400 mt-1">Conectores nativos para Wazuh, Zabbix, Splunk, Cisco Meraki y más herramientas industriales.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="p-2 bg-white/5 rounded-lg h-fit"><Shield className="w-5 h-5 text-neon-pink" /></div>
                                    <div>
                                        <h4 className="font-bold text-white">Seguridad Cloud-Native</h4>
                                        <p className="text-sm text-gray-400 mt-1">Protección de grado militar para credenciales utilizando Azure KeyVault.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-black/40 rounded-xl p-6 border border-white/5 font-mono text-sm text-gray-300">
                            <div className="flex gap-2 mb-4 border-b border-white/5 pb-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            </div>
                            <p className="text-neon-green">$ connecting to sophia_core...</p>
                            <p>{'>'} agent_status: <span className="text-white">ONLINE</span></p>
                            <p>{'>'} loading_modules: [wazuh, zabbix, openai]... <span className="text-green-500">OK</span></p>
                            <p>{'>'} rag_index: <span className="text-neon-cyan">azure_search_v2</span></p>
                            <p className="animate-pulse">{'>'} awaiting_instructions_</p>
                        </div>
                    </div>
                </section>

                {/* D. Use Cases */}
                <section>
                    <h2 className="text-3xl font-bold text-center mb-10">Casos de Uso Empresarial</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <UseCaseCard
                            title="Respuesta a Incidentes"
                            desc="Reducción del MTTR (Mean Time To Repair) mediante análisis automatizado de alertas de seguridad correlacionadas."
                        />
                        <UseCaseCard
                            title="Optimización de Recursos"
                            desc="Identificación proactiva de cuellos de botella en la red antes de que afecten la operación crítica de la empresa."
                        />
                        <UseCaseCard
                            title="Alta Disponibilidad"
                            desc="Garantía de continuidad de negocio mediante monitoreo predictivo de servicios y bases de datos."
                        />
                    </div>
                </section>

                <div className="text-center pb-12 pt-12 border-t border-white/5">
                    <p className="text-gray-500 text-sm">© 2025 TXDX SECURE. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="bg-dark-card p-6 rounded-xl border border-dark-border hover:border-neon-green/30 transition-all hover:-translate-y-1 hover:shadow-lg group">
            <div className="mb-4 p-3 bg-white/5 rounded-lg w-fit group-hover:bg-white/10 transition-colors">
                {icon}
            </div>
            <h3 className="font-bold text-lg text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400">{desc}</p>
        </div>
    );
}

function UseCaseCard({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="p-6 rounded-xl bg-gradient-to-b from-white/5 to-transparent border border-white/5">
            <h3 className="font-bold text-white text-xl mb-3">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
        </div>
    );
}
