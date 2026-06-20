import { useNavigate } from 'react-router-dom';
import { Bot, Settings, Rocket, ArrowRight, ShieldAlert } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface AgentNotDeployedProps {
    providerName: string;
    setupPath?: string;
    message?: string;
    theme?: AgentTheme;
}

type AgentTheme = 'openvas' | 'insightvm' | 'nessus' | 'uptime' | 'wazuh' | 'zabbix' | 'default';

type AgentThemeClasses = {
    mainColorClass: string;
    borderColorClass: string;
    bgColorClass: string;
    glowColorClass: string;
    scanLineClass: string;
    btnColorClass: string;
    btnTextClass: string;
    textColorClass: string;
};

const themeClassesByProvider: Record<AgentTheme, AgentThemeClasses> = {
    openvas: {
        mainColorClass: 'text-emerald-400',
        borderColorClass: 'border-emerald-500/30',
        bgColorClass: 'bg-emerald-500/20',
        glowColorClass: 'shadow-[0_0_50px_rgba(16,185,129,0.14)]',
        scanLineClass: 'via-emerald-400',
        btnColorClass: 'bg-emerald-500 hover:bg-emerald-400',
        btnTextClass: 'text-black',
        textColorClass: 'text-emerald-400'
    },
    insightvm: {
        mainColorClass: 'text-orange-500',
        borderColorClass: 'border-orange-500/30',
        bgColorClass: 'bg-orange-500/20',
        glowColorClass: 'shadow-[0_0_50px_rgba(249,115,22,0.14)]',
        scanLineClass: 'via-orange-500',
        btnColorClass: 'bg-orange-500 hover:bg-orange-400',
        btnTextClass: 'text-black',
        textColorClass: 'text-orange-500'
    },
    nessus: {
        mainColorClass: 'text-violet-400',
        borderColorClass: 'border-violet-500/30',
        bgColorClass: 'bg-violet-500/20',
        glowColorClass: 'shadow-[0_0_50px_rgba(139,92,246,0.14)]',
        scanLineClass: 'via-violet-400',
        btnColorClass: 'bg-violet-600 hover:bg-violet-500',
        btnTextClass: 'text-white',
        textColorClass: 'text-violet-400'
    },
    uptime: {
        mainColorClass: 'text-cyan-300',
        borderColorClass: 'border-cyan-400/30',
        bgColorClass: 'bg-cyan-400/20',
        glowColorClass: 'shadow-[0_0_50px_rgba(34,211,238,0.14)]',
        scanLineClass: 'via-cyan-300',
        btnColorClass: 'bg-cyan-400 hover:bg-cyan-300',
        btnTextClass: 'text-black',
        textColorClass: 'text-cyan-300'
    },
    wazuh: {
        mainColorClass: 'text-sky-400',
        borderColorClass: 'border-sky-500/30',
        bgColorClass: 'bg-sky-500/20',
        glowColorClass: 'shadow-[0_0_50px_rgba(14,165,233,0.14)]',
        scanLineClass: 'via-sky-400',
        btnColorClass: 'bg-sky-500 hover:bg-sky-400',
        btnTextClass: 'text-black',
        textColorClass: 'text-sky-400'
    },
    zabbix: {
        mainColorClass: 'text-red-400',
        borderColorClass: 'border-red-500/30',
        bgColorClass: 'bg-red-500/20',
        glowColorClass: 'shadow-[0_0_50px_rgba(239,68,68,0.14)]',
        scanLineClass: 'via-red-400',
        btnColorClass: 'bg-red-500 hover:bg-red-400',
        btnTextClass: 'text-white',
        textColorClass: 'text-red-400'
    },
    default: {
        mainColorClass: 'text-neon-blue',
        borderColorClass: 'border-neon-blue/30',
        bgColorClass: 'bg-neon-blue/20',
        glowColorClass: 'shadow-[0_0_50px_rgba(0,240,255,0.1)]',
        scanLineClass: 'via-neon-blue',
        btnColorClass: 'bg-neon-blue hover:bg-neon-blue/90',
        btnTextClass: 'text-black',
        textColorClass: 'text-neon-blue'
    }
};

const resolveTheme = (providerName: string): AgentTheme => {
    const normalized = providerName.toLowerCase();
    if (normalized.includes('insightvm') || normalized.includes('rapid7')) return 'insightvm';
    if (normalized.includes('openvas')) return 'openvas';
    if (normalized.includes('nessus')) return 'nessus';
    if (normalized.includes('uptime')) return 'uptime';
    if (normalized.includes('wazuh')) return 'wazuh';
    if (normalized.includes('zabbix')) return 'zabbix';
    return 'default';
};

export default function AgentNotDeployed({ providerName, setupPath = '/settings', message, theme }: AgentNotDeployedProps) {
    const navigate = useNavigate();

    const providerLabel = providerName.toLowerCase().includes('rapid7') ? 'Rapid7' : providerName;
    const resolvedTheme = theme || resolveTheme(providerName);
    const {
        mainColorClass,
        borderColorClass,
        bgColorClass,
        glowColorClass,
        scanLineClass,
        btnColorClass,
        btnTextClass,
        textColorClass
    } = themeClassesByProvider[resolvedTheme];

    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            {/* Animated Agent Sphere */}
            <div className="relative mb-12">
                <div className={cn("absolute inset-0 rounded-full blur-3xl animate-pulse", bgColorClass)} />
                <div className={cn("relative w-40 h-40 bg-dark-card border-2 rounded-full flex items-center justify-center overflow-hidden", borderColorClass, glowColorClass)}>
                    <div className={cn("absolute inset-0 rounded-full border border-dashed animate-[spin_15s_linear_infinite]", borderColorClass)} />
                    <Bot className={cn("w-16 h-16 animate-bounce", mainColorClass)} style={{ animationDuration: '3s' }} />

                    {/* Scanning Line Animation */}
                    <div className={cn("absolute inset-x-0 h-1 bg-gradient-to-r from-transparent to-transparent top-1/2 -translate-y-1/2 animate-[pan_2s_ease-in-out_infinite]", scanLineClass)} />
                </div>

                <div className="absolute -top-2 -right-2 p-3 bg-dark-bg border border-dark-border rounded-xl shadow-xl">
                    <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
                </div>
            </div>

            <div className="max-w-md space-y-6">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                    Tu Agente <span className={cn("uppercase", textColorClass)}>{providerName}</span> aún no ha sido desplegado
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed">
                    SOPHIA no puede analizar tu infraestructura porque no hemos recibido datos de este sensor.
                    Por favor, revisa la integracion y sincroniza tu servidor.
                </p>
                {message && (
                    <p className="text-gray-500 text-sm">
                        Detalle: {message}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <button
                        onClick={() => navigate(setupPath)}
                        className={cn("flex items-center gap-2 font-bold px-8 py-3 rounded-xl transition-all transform hover:scale-105 active:scale-95", btnColorClass, btnTextClass)}
                    >
                        <Settings className="w-5 h-5" /> Ir a Configuración
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold px-8 py-3 rounded-xl border border-white/10 transition-all text-sm"
                    >
                        Volver al Panel <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Hint Card */}
            <div className="mt-16 p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 max-w-sm text-left">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", bgColorClass)}>
                    <Rocket className={cn("w-5 h-5", mainColorClass)} />
                </div>
                <div>
                    <h4 className="text-white text-sm font-bold">Consejo Rápido</h4>
                    <p className="text-xs text-gray-500">Asegúrate de que el servicio de {providerLabel} tenga acceso a la URL de este portal.</p>
                </div>
            </div>

            <style>{`
                @keyframes pan {
                    0% { top: 20%; opacity: 0; }
                    50% { opacity: 1; }
                    100% { top: 80%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}
