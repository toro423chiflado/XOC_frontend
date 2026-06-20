import { useState, useEffect } from 'react';
import { providerService } from '../../services/provider.service';
import { AlertTriangle, ShieldAlert, ChevronRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const SEVERITY_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };

const normalizeSeverity = (value: unknown) => {
    const normalized = typeof value === 'string' ? value.toLowerCase() : '';
    return Object.prototype.hasOwnProperty.call(SEVERITY_RANK, normalized) ? normalized : 'info';
};

const toSafeNumber = (value: unknown, fallback = 0) => {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : fallback;
};

export default function UnifiedThreatsList() {
    const [threats, setThreats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadThreats() {
            try {
                // Fetch top CVEs from both providers
                const [openvas, insightvm] = await Promise.all([
                    providerService.getOpenvasMetrics().catch(() => null),
                    providerService.getInsightvmMetrics().catch(() => null)
                ]);

                let allThreats = [];

                // Standardize and merge OpenVAS threats
                if (openvas?.topCVEs) {
                    allThreats.push(...openvas.topCVEs.map((c: any) => ({
                        ...c,
                        source: 'OpenVAS',
                        sourceIcon: '/greenbone_openvass_logo.svg'
                    })));
                }

                // Standardize and merge InsightVM threats
                if (insightvm?.topCVEs) {
                    allThreats.push(...insightvm.topCVEs.map((c: any) => ({
                        ...c,
                        source: 'InsightVM',
                        sourceIcon: '/RPD.svg'
                    })));
                }

                // Sort by severity (Critical first) and take top 5
                allThreats.sort((a, b) => {
                    const rankA = SEVERITY_RANK[normalizeSeverity(a.severity)] || 0;
                    const rankB = SEVERITY_RANK[normalizeSeverity(b.severity)] || 0;
                    return rankB - rankA;
                });

                setThreats(allThreats.slice(0, 5));

            } catch (err) {
                console.error("Failed to load threats", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadThreats();
    }, []);

    if (isLoading) {
        return <div className="h-64 bg-dark-card animate-pulse rounded-xl"></div>;
    }

    if (threats.length === 0) {
        return (
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[250px]">
                <ShieldAlert className="w-16 h-16 text-emerald-500/20 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Sin Amenazas Críticas</h3>
                <p className="text-gray-400 text-sm max-w-xs">¡Excelente! No se han detectado CVEs de alto impacto en las integraciones activas.</p>
            </div>
        );
    }

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Amenazas Prioritarias</h3>
                        <p className="text-xs text-gray-400">CVEs que requieren atención inmediata</p>
                    </div>
                </div>
                <Link to="/dashboard/openvas/current" className="text-xs font-bold text-blue-500 hover:text-white transition-colors flex items-center gap-1">
                    VER TODO <ChevronRight className="w-3 h-3" />
                </Link>
            </div>

            <div className="space-y-3">
                {threats.map((threat, idx) => {
                    const cveId = String(threat.cve_id ?? threat.cve ?? 'UNKNOWN-ID');
                    const score = toSafeNumber(threat.cvss_score ?? threat.cvss, 0);
                    const safeScore = Math.min(10, Math.max(0, score));
                    const hosts = Math.max(1, Math.floor(toSafeNumber(threat.hosts_affected ?? threat.count, 1)));
                    const severity = normalizeSeverity(threat.severity);
                    const isCritical = severity === 'critical';

                    return (
                        <div key={idx} className="group p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border ${isCritical ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'}`}>
                                    <span className="text-sm font-black">{safeScore.toFixed(1)}</span>
                                    <span className="text-[9px] font-bold uppercase">CVSS</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                                        {cveId}
                                        <div className="bg-black/40 px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/5">
                                            <img src={threat.sourceIcon} alt={threat.source} className="w-3 h-3" />
                                            <span className="text-[9px] text-gray-400 font-sans">{threat.source}</span>
                                        </div>
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isCritical ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                                            {severity}
                                        </span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Activity className="w-3 h-3" />
                                            {hosts} hosts afectados
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
