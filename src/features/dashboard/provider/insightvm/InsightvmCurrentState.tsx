import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../DashboardLayout';
import { providerService, type OpenvasMetrics } from '../../../../services/provider.service';
import { Loader2, ArrowLeft } from 'lucide-react';
import AgentNotDeployed from '../AgentNotDeployed';

export default function InsightvmCurrentState() {
    const [metrics, setMetrics] = useState<OpenvasMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadCurrentState();
    }, []);

    const loadCurrentState = async () => {
        setIsLoading(true);
        try {
            const data = await providerService.getInsightvmCurrentState();
            setMetrics(data);
        } catch (err: any) {
            console.error('Failed to load InsightVM current state', err);
            if (err.response?.status === 401 || err.response?.status === 404) {
                setMetrics({
                    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
                    scansCompleted: 0,
                    hostsScanned: 0,
                    topCVEs: []
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-96 items-center justify-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                </div>
            </DashboardLayout>
        );
    }

    if (!metrics || metrics.scansCompleted === 0) {
        return (
            <DashboardLayout>
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/dashboard/insightvm')} className="p-2 hover:bg-white/5 rounded-lg border border-white/5"><ArrowLeft className="w-5 h-5 text-gray-400" /></button>
                    <h2 className="text-2xl font-bold text-white">Estado Actual Rapid7</h2>
                </div>
                <AgentNotDeployed providerName="InsightVM Rapid7" theme="insightvm" />
            </DashboardLayout>
        );
    }

    const totalVulns = (metrics.vulnerabilities.critical || 0) + (metrics.vulnerabilities.high || 0) + (metrics.vulnerabilities.medium || 0);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard/insightvm')} className="p-2 hover:bg-white/5 rounded-lg border border-white/5 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-400" /></button>
                        <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                            <img src="/RPD.svg" alt="Rapid7 Logo" className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Estado Crítico Actual</h2>
                            <p className="text-gray-400 text-sm">Últimos resultados consolidados por Rapid7</p>
                        </div>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-xl">
                        <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Riesgos</div>
                        <div className="text-4xl font-black text-white">{totalVulns}</div>
                    </div>
                    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-xl border-red-500/20">
                        <div className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-1">Críticos</div>
                        <div className="text-4xl font-black text-red-500">{metrics.vulnerabilities.critical}</div>
                    </div>
                    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-xl">
                        <div className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-1">Assets Vivos</div>
                        <div className="text-4xl font-black text-white">{metrics.hostsScanned}</div>
                    </div>
                </div>

                {/* Simplified List */}
                <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-black/20 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Objetivo (Asset)</th>
                                <th className="px-6 py-4 text-right">Hallazgos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                            {metrics.scanDetails?.map((s, i) => (
                                <tr key={i} className="hover:bg-blue-500/[0.01] transition-colors group">
                                    <td className="px-6 py-4 font-mono text-white text-sm group-hover:text-blue-400 transition-colors">{s.target}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => navigate(`/dashboard/insightvm/scan/${s.id}`)}
                                            className="px-4 py-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-lg border border-blue-500/20 text-xs font-bold transition-all"
                                        >Detalles</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
