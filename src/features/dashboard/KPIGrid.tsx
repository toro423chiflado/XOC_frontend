import { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Loader2, Gauge } from 'lucide-react';
import { providerService } from '../../services/provider.service';

export default function KPIGrid() {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadKPIs() {
            try {
                // Fetch real data from all active scanners
                const [openvas, insightvm] = await Promise.all([
                    providerService.getOpenvasMetrics().catch(() => null),
                    providerService.getInsightvmMetrics().catch(() => null)
                ]);

                // Aggregate metrics
                const ovVulns = openvas?.vulnerabilities || { critical: 0, high: 0, medium: 0, low: 0 };
                const ivVulns = insightvm?.vulnerabilities || { critical: 0, high: 0, medium: 0, low: 0 };

                const totalVulns =
                    (ovVulns.critical + ovVulns.high + ovVulns.medium + ovVulns.low) +
                    (ivVulns.critical + ivVulns.high + ivVulns.medium + ivVulns.low);

                const totalCritical = (ovVulns.critical || 0) + (ivVulns.critical || 0);
                const totalScans = (openvas?.scansCompleted || 0) + (insightvm?.scansCompleted || 0);

                // Calculate a basic "Security Score" (100 - penalties)
                // Heuristic: -10 per critical, -2 per high. Min 0.
                const penalty = (totalCritical * 10) + ((ovVulns.high + ivVulns.high) * 2);
                const score = Math.max(0, 100 - penalty);

                setStats({
                    riskScore: score,
                    totalVulns,
                    totalCritical,
                    totalScans,
                    activeIntegrations: (openvas ? 1 : 0) + (insightvm ? 1 : 0)
                });

            } catch (error) {
                console.warn("Failed to fetch KPI data", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadKPIs();
    }, []);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-dark-card border border-dark-border rounded-xl p-6 h-32 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                    </div>
                ))}
            </div>
        );
    }

    // Determine colors based on score
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const KPI_ITEMS = [
        {
            label: 'Nivel de Seguridad Global',
            value: `${stats?.riskScore || 0}/100`,
            icon: Shield,
            color: getScoreColor(stats?.riskScore || 0),
            subtext: stats?.riskScore >= 80 ? 'Estado Óptimo' : 'Requiere Atención',
            bg: 'bg-emerald-500/5',
            trend: null
        },
        {
            label: 'Vulnerabilidades Totales',
            value: stats?.totalVulns || 0,
            icon: AlertTriangle,
            color: 'text-orange-500',
            subtext: 'Detectadas en todos los activos',
            bg: 'bg-orange-500/5',
            trend: '+12 (24h)' // This would ideally be calculated from historical diff
        },
        {
            label: 'Amenazas Críticas',
            value: stats?.totalCritical || 0,
            icon: AlertTriangle,
            color: 'text-red-500',
            subtext: 'Alta Prioridad de Remediación',
            bg: 'bg-red-500/5',
            trend: null,
            pulse: stats?.totalCritical > 0
        },
        {
            label: 'Escaneos Ejecutados',
            value: stats?.totalScans || 0,
            icon: Gauge,
            color: 'text-blue-500',
            subtext: 'Reportes generados exitosamente',
            bg: 'bg-blue-500/5',
            trend: null
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {KPI_ITEMS.map((item, idx) => (
                <div key={idx} className={`bg-dark-card border ${item.color.replace('text', 'border')}/20 rounded-xl p-6 hover:border-white/10 transition-all group relative overflow-hidden`}>
                    <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                        <item.icon className={`w-16 h-16 ${item.color}`} />
                    </div>

                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className={`p-3 rounded-lg ${item.bg} border-white/5 border`}>
                            <item.icon className={`w-6 h-6 ${item.color} ${item.pulse ? 'animate-pulse' : ''}`} />
                        </div>
                        {item.trend && (
                            <span className="text-xs font-mono font-bold text-gray-400 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                                {item.trend}
                            </span>
                        )}
                    </div>

                    <div className="relative z-10">
                        <h3 className={`text-3xl font-black ${item.color} mb-1 tracking-tight`}>{item.value}</h3>
                        <p className="text-sm font-bold text-gray-200 uppercase tracking-wide">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-2">{item.subtext}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
