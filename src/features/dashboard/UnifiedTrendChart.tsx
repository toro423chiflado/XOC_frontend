import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Activity, AlertTriangle, ServerCrash } from 'lucide-react';
import { providerApiService } from '../../services/provider-api.service';
import type { DashboardSummary } from '../../types/api';

export default function UnifiedTrendChart() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await providerApiService.getDashboardSummary();
                setSummary(data);
            } catch (e) {
                console.error("Summary load error", e);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const getScoreData = () => {
        if (!summary) return { score: 100, penalties: [] };

        let score = 100;
        const penalties = [];

        const critVulns = summary.summary?.critical_vulnerabilities || 0;
        if (critVulns > 0) {
            const deduction = Math.min(35, critVulns * 0.5);
            score -= deduction;
            penalties.push({ label: 'Vuln. Críticas', value: critVulns, type: 'vuln', icon: ShieldAlert });
        }

        const down = summary.summary?.services_down || 0;
        if (down > 0) {
            const deduction = Math.min(25, down * 5);
            score -= deduction;
            penalties.push({ label: 'Servicios Caídos', value: down, type: 'down', icon: ServerCrash });
        }

        const alerts = summary.zabbix?.alerts || 0;
        if (alerts > 0) {
            const deduction = Math.min(20, alerts * 1);
            score -= deduction;
            penalties.push({ label: 'Alertas Activas', value: alerts, type: 'alert', icon: Activity });
        }

        const wazuhCrit = summary.wazuh?.alerts?.critical || 0;
        if (wazuhCrit > 0) {
            const deduction = Math.min(20, wazuhCrit * 0.2);
            score -= deduction;
            penalties.push({ label: 'Eventos Críticos', value: wazuhCrit, type: 'event', icon: AlertTriangle });
        }

        return {
            score: Math.max(0, Math.round(score)),
            penalties
        };
    };

    if (isLoading) {
        return (
            <div className="h-[250px] bg-black/20 border border-white/5 animate-pulse rounded-2xl" />
        );
    }

    const { score, penalties } = getScoreData();

    // Determine colors based on score
    let scoreColor = 'text-emerald-400';
    let ringColor = 'stroke-emerald-500';
    let bgGlow = 'bg-emerald-500/10';
    let statusText = 'Excelente';

    if (score < 50) {
        scoreColor = 'text-red-400';
        ringColor = 'stroke-red-500';
        bgGlow = 'bg-red-500/10';
        statusText = 'Crítico';
    } else if (score < 80) {
        scoreColor = 'text-amber-400';
        ringColor = 'stroke-amber-500';
        bgGlow = 'bg-amber-500/10';
        statusText = 'Atención Requerida';
    } else if (score < 95) {
        scoreColor = 'text-sky-400';
        ringColor = 'stroke-sky-500';
        bgGlow = 'bg-sky-500/10';
        statusText = 'Saludable';
    }

    // SVG Circle Math
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="relative overflow-hidden bg-[linear-gradient(145deg,rgba(10,10,10,0.8),rgba(15,23,42,0.4))] border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
            {/* Glow effect */}
            <div className={`absolute top-0 left-1/4 w-64 h-64 ${bgGlow} blur-[100px] rounded-full pointer-events-none transition-colors duration-1000`} />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                
                {/* Score Circular Progress */}
                <div className="relative flex flex-col items-center justify-center flex-shrink-0">
                    <svg className="w-40 h-40 transform -rotate-90">
                        {/* Background track */}
                        <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-white/5"
                        />
                        {/* Progress track */}
                        <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className={`${ringColor} drop-shadow-[0_0_8px_currentColor] transition-all duration-1000 ease-out`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-bold tracking-tighter ${scoreColor}`}>
                            {score}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">/ 100</span>
                    </div>
                </div>

                {/* Info Side */}
                <div className="flex-1 w-full">
                    <div className="mb-6 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">
                            <ShieldCheck className="w-3.5 h-3.5 text-gray-300" />
                            Security Posture
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">
                            Índice de Salud Global
                        </h3>
                        <p className={`text-sm font-semibold ${scoreColor}`}>
                            Estado: {statusText}
                        </p>
                    </div>

                    {/* Breakdown of penalties */}
                    <div className="grid grid-cols-2 gap-3">
                        {penalties.length === 0 ? (
                            <div className="col-span-2 flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                <span className="text-sm font-semibold text-emerald-200">
                                    No hay amenazas críticas activas. El sistema opera de manera óptima.
                                </span>
                            </div>
                        ) : (
                            penalties.map((penalty, idx) => {
                                let pColor = 'text-gray-400';
                                let pBg = 'bg-white/5';
                                let pBorder = 'border-white/10';

                                if (penalty.type === 'vuln') {
                                    pColor = 'text-red-400'; pBg = 'bg-red-500/10'; pBorder = 'border-red-500/20';
                                } else if (penalty.type === 'down') {
                                    pColor = 'text-red-500'; pBg = 'bg-red-500/10'; pBorder = 'border-red-500/20';
                                } else if (penalty.type === 'alert') {
                                    pColor = 'text-orange-400'; pBg = 'bg-orange-500/10'; pBorder = 'border-orange-500/20';
                                } else if (penalty.type === 'event') {
                                    pColor = 'text-amber-400'; pBg = 'bg-amber-500/10'; pBorder = 'border-amber-500/20';
                                }

                                const Icon = penalty.icon;

                                return (
                                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${pBorder} ${pBg}`}>
                                        <div className={`p-2 rounded-lg bg-black/20 ${pColor}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className={`text-lg font-bold leading-none mb-1 ${pColor}`}>
                                                {penalty.value.toLocaleString()}
                                            </div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                {penalty.label}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
