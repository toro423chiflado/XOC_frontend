import { useNavigate } from 'react-router-dom';
import { Bot, Binary, Zap, Settings, ArrowRight } from 'lucide-react';

export default function EmptyDashboard() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {/* Animated Sphere / Agent Placeholder */}
            <div className="relative mb-12">
                <div className="absolute inset-0 bg-neon-green/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative w-48 h-48 bg-dark-card border-2 border-neon-green/30 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(0,255,159,0.1)]">
                    <div className="absolute inset-0 rounded-full border border-dashed border-neon-green/20 animate-[spin_10s_linear_infinite]" />
                    <Bot className="w-20 h-20 text-neon-green animate-bounce" style={{ animationDuration: '3s' }} />
                </div>

                {/* Floating Icons */}
                <div className="absolute -top-4 -right-4 p-3 bg-dark-bg border border-dark-border rounded-xl animate-bounce" style={{ animationDelay: '0.5s' }}>
                    <Binary className="w-6 h-6 text-neon-blue" />
                </div>
                <div className="absolute -bottom-4 -left-4 p-3 bg-dark-bg border border-dark-border rounded-xl animate-bounce" style={{ animationDelay: '1s' }}>
                    <Zap className="w-6 h-6 text-neon-purple" />
                </div>
            </div>

            <div className="max-w-md space-y-6">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                    Tu agente SOPHIA aún no ha sido desplegado
                </h2>
                <p className="text-gray-400 text-lg">
                    Parece que tu infraestructura de seguridad aún no está conectada. Necesitamos configurar tus credenciales de Azure y tus integraciones para comenzar a monitorear.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <button
                        onClick={() => navigate('/settings')}
                        className="flex items-center gap-2 bg-neon-green hover:bg-neon-green/90 text-black font-bold px-8 py-3 rounded-xl transition-all transform hover:scale-105 active:scale-95"
                    >
                        <Settings className="w-5 h-5" /> Configurar Agente
                    </button>
                    <button
                        onClick={() => navigate('/integrations')}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold px-8 py-3 rounded-xl border border-white/10 transition-all"
                    >
                        Conectar Apps <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Steps Guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl w-full border-t border-dark-border pt-12">
                <div className="text-left space-y-3">
                    <div className="w-8 h-8 rounded-full bg-neon-green/20 text-neon-green flex items-center justify-center font-bold">1</div>
                    <h4 className="text-white font-semibold">Configura Azure</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Conecta Azure OpenAI y Azure Search para activar el motor cognitivo de SOPHIA.</p>
                </div>
                <div className="text-left space-y-3">
                    <div className="w-8 h-8 rounded-full bg-neon-blue/20 text-neon-blue flex items-center justify-center font-bold">2</div>
                    <h4 className="text-white font-semibold">Instala Agentes</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Conecta tus escáneres OpenVAS o monitores Zabbix y comienza el flujo de datos.</p>
                </div>
                <div className="text-left space-y-3">
                    <div className="w-8 h-8 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center font-bold">3</div>
                    <h4 className="text-white font-semibold">Recibe Insights</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">SOPHIA analizará automáticamente tu infraestructura y generará tickets y alertas inteligentes.</p>
                </div>
            </div>
        </div>
    );
}
