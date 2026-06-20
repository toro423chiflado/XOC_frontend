import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../DashboardLayout';
import { providerService, type OpenvasMetrics, type DashboardRangePreset } from '../../../../services/provider.service';
import { Loader2, RefreshCw, WifiOff } from 'lucide-react';
import AgentNotDeployed from '../AgentNotDeployed';
import { buildInsightvmDashboardModel } from './utils';
import { InsightvmHero } from './InsightvmHero';
import { InsightvmKpiGrid } from './InsightvmKpiGrid';
import { InsightvmChartsSection } from './InsightvmChartsSection';
import { InsightvmOperationsSection } from './InsightvmOperationsSection';
import ModernDateRangeSelector from '../ModernDateRangeSelector';

export default function InsightvmDashboard() {
    const [metrics, setMetrics] = useState<OpenvasMetrics | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rangePreset, setRangePreset] = useState<DashboardRangePreset>('30d');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (rangePreset !== 'custom') {
            loadMetrics();
        }
    }, [rangePreset]);

    const loadMetrics = async () => {
        if (rangePreset === 'custom' && (!customFrom || !customTo)) {
            setError('Selecciona fechas "desde" y "hasta" para usar rango personalizado.');
            return;
        }
        if (rangePreset === 'custom' && customFrom > customTo) {
            setError('La fecha "desde" no puede ser mayor que "hasta".');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const [metricsData, analyticsData] = await Promise.all([
                providerService.getInsightvmMetrics({ preset: rangePreset, from: customFrom || undefined, to: customTo || undefined }),
                providerService.getInsightvmAnalytics({ preset: rangePreset, from: customFrom || undefined, to: customTo || undefined }).catch(() => null)
            ]);
            setMetrics(metricsData);
            setAnalytics(analyticsData);
        } catch (err: any) {
            console.error('Failed to load InsightVM metrics', err);
            if (err.response?.status === 401 || err.response?.status === 404) {
                setMetrics({ vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0, info: 0 }, scansCompleted: 0, hostsScanned: 0, topCVEs: [] });
            } else {
                setError('No se pudo cargar las métricas de InsightVM. El backend no está disponible o no responde.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const model = useMemo(() => (metrics ? buildInsightvmDashboardModel(metrics, analytics) : null), [metrics, analytics]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-96 items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-500" />
                        <p className="text-gray-400">Cargando métricas de Rapid7...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !metrics) {
        return (
            <DashboardLayout>
                <div className="flex h-[70vh] flex-col items-center justify-center space-y-6 text-center">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                        <div className="relative rounded-full border border-red-500/30 bg-black/40 p-8 backdrop-blur-xl">
                            <WifiOff className="h-16 w-16 text-red-500" />
                        </div>
                    </div>
                    <div className="max-w-md space-y-4">
                        <h2 className="text-3xl font-bold text-white">InsightVM No Disponible</h2>
                        <p className="text-lg text-gray-400">{error || 'No se pudo cargar la información de Rapid7 InsightVM.'}</p>
                    </div>
                    <button onClick={loadMetrics} className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/20 px-6 py-3 font-bold text-blue-400 transition-all hover:bg-blue-500/30">
                        <RefreshCw className="h-5 w-5" /> Reintentar
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    if (metrics.scansCompleted === 0) {
        return (
            <DashboardLayout>
                <AgentNotDeployed providerName="InsightVM Rapid7" theme="insightvm" />
            </DashboardLayout>
        );
    }

    if (!model) return null;

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <InsightvmHero
                    lastUpdateLabel={model.lastUpdateLabel}
                    totalVulnerabilities={model.totalVulnerabilities}
                    rangeControl={(
                        <ModernDateRangeSelector
                        preset={rangePreset}
                        customFrom={customFrom}
                        customTo={customTo}
                        onPresetChange={setRangePreset}
                        onCustomFromChange={setCustomFrom}
                        onCustomToChange={setCustomTo}
                        onApply={loadMetrics}
                        isLoading={isLoading}
                        />
                    )}
                    onRefresh={loadMetrics}
                    isLoading={isLoading}
                />

                <InsightvmKpiGrid cards={model.summaryCards} />

                <InsightvmChartsSection model={model} />

                <InsightvmOperationsSection model={model} onOpenScan={(id) => navigate(`/dashboard/insightvm/scan/${id}`)} />
            </div>
        </DashboardLayout>
    );
}
