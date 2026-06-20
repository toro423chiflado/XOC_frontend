import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, WifiOff } from 'lucide-react';
import DashboardLayout from '../../DashboardLayout';
import { providerService, type WazuhMetrics, type WazuhRangePreset } from '../../../../services/provider.service';
import { WazuhChartsSection } from './WazuhChartsSection';
import { WazuhHero } from './WazuhHero';
import { WazuhKpiGrid } from './WazuhKpiGrid';
import { WazuhOperationsSection } from './WazuhOperationsSection';
import { buildWazuhDashboardModel } from './utils';
import ModernDateRangeSelector from '../ModernDateRangeSelector';
import AgentNotDeployed from '../AgentNotDeployed';

export default function WazuhDashboard() {
    const [metrics, setMetrics] = useState<WazuhMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rangePreset, setRangePreset] = useState<WazuhRangePreset>('30d');
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
            const data = await providerService.getWazuhMetrics({
                preset: rangePreset,
                from: customFrom || undefined,
                to: customTo || undefined
            });
            setMetrics(data);
        } catch (err: any) {
            console.error('Failed to load Wazuh metrics', err);
            if (err?.response?.status === 401 || err?.response?.status === 404) {
                setMetrics({
                    activeAgents: 0,
                    inactiveAgents: 0,
                    topRules: [],
                    alertsBySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
                    configured: false,
                    message: 'Wazuh integration not configured.'
                });
            } else {
                setError('No se pudo cargar la informacion de Wazuh.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const model = useMemo(
        () => (metrics && metrics.configured !== false ? buildWazuhDashboardModel(metrics, rangePreset, customFrom, customTo) : null),
        [metrics, rangePreset, customFrom, customTo]
    );
    const hasWazuhData = useMemo(() => {
        if (!metrics || metrics.configured === false) return false;

        const historicalTotal = Number(metrics.historical?.totalEvents || Object.values(metrics.alertsBySeverity || {}).reduce((acc, value) => acc + Number(value || 0), 0));
        const currentTotal = Number(metrics.snapshot?.totalEvents || metrics.currentSnapshot?.totalAlerts || 0);
        const hasScans = (metrics.historical?.cuts?.length || metrics.scanDetails?.length || 0) > 0;
        const hasFindings = (metrics.analytics?.recentEvents?.length || metrics.recentFindings?.length || 0) > 0;
        const hasRules = (metrics.snapshot?.topRules?.length || metrics.topRules?.length || 0) > 0;

        return historicalTotal > 0 || currentTotal > 0 || hasScans || hasFindings || hasRules;
    }, [metrics]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-96 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
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
                        <h2 className="text-3xl font-bold text-white">Wazuh No Disponible</h2>
                        <p className="text-lg text-gray-400">{error || 'No se pudo cargar la informacion de Wazuh.'}</p>
                    </div>
                    <button onClick={loadMetrics} className="inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/20 px-6 py-3 font-bold text-sky-400 transition-all hover:bg-sky-500/30">
                        <RefreshCw className="h-5 w-5" /> Reintentar
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    if (metrics.configured === false || !hasWazuhData) {
        return (
            <DashboardLayout>
                <AgentNotDeployed
                    providerName="Wazuh"
                    theme="wazuh"
                    message={metrics.message || (!hasWazuhData ? 'No hay telemetria de Wazuh para el rango seleccionado.' : undefined)}
                />
            </DashboardLayout>
        );
    }

    if (!model) {
        return null;
    }

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <WazuhHero
                    model={model}
                    rangeControl={(
                        <ModernDateRangeSelector
                            preset={rangePreset}
                            customFrom={customFrom}
                            customTo={customTo}
                            onPresetChange={(preset) => setRangePreset(preset as WazuhRangePreset)}
                            onCustomFromChange={setCustomFrom}
                            onCustomToChange={setCustomTo}
                            onApply={loadMetrics}
                            isLoading={isLoading}
                            hideTitle
                        />
                    )}
                    onRefresh={loadMetrics}
                    isLoading={isLoading}
                />

                <WazuhKpiGrid cards={model.summaryCards} />

                <WazuhChartsSection model={model} />

                <WazuhOperationsSection
                    model={model}
                    onOpenScan={(id) => navigate(`/dashboard/wazuh/scan/${id}`)}
                />

                {model.historical.totalEvents === 0 && model.snapshot.topRules.length === 0 && (
                    <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-200">
                        {metrics.message || 'Wazuh no trae reglas recientes para listar, pero si existen historicos agregados para esta empresa.'}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
