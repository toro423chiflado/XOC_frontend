import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import DashboardLayout from '../../DashboardLayout';
import ModernDateRangeSelector from '../ModernDateRangeSelector';
import { providerService, type DashboardRangePreset, type UptimeMetrics } from '../../../../services/provider.service';
import AgentNotDeployed from '../AgentNotDeployed';
import { UptimeChartsSection } from './UptimeChartsSection';
import { UptimeHero } from './UptimeHero';
import { UptimeKpiGrid } from './UptimeKpiGrid';
import { UptimeOperationsSection } from './UptimeOperationsSection';
import { buildUptimeDashboardModel } from './utils';

export default function UptimeDashboard() {
    const [metrics, setMetrics] = useState<UptimeMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rangePreset, setRangePreset] = useState<DashboardRangePreset>('30d');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

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
            const data = await providerService.getUptimeMetrics({
                preset: rangePreset,
                from: customFrom || undefined,
                to: customTo || undefined
            });
            setMetrics(data);
        } catch (loadError: any) {
            console.error('Failed to load Uptime metrics', loadError);
            if (loadError?.response?.status === 401 || loadError?.response?.status === 404) {
                setMetrics({
                    servicesMonitored: 0,
                    servicesUp: 0,
                    servicesDown: 0,
                    uptimePercentage: 0,
                    recentDowntime: []
                });
            } else {
                setError('No se pudo cargar la informacion de Uptime Kuma.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const model = useMemo(() => {
        if (!metrics) return null;
        return buildUptimeDashboardModel(metrics, rangePreset, customFrom, customTo);
    }, [metrics, rangePreset, customFrom, customTo]);

    const hasUptimeData = useMemo(() => {
        if (!metrics) return false;
        return (
            Number(metrics.servicesMonitored || 0) > 0
            || Number(metrics.servicesUp || 0) > 0
            || Number(metrics.servicesDown || 0) > 0
            || Number(metrics.uptimePercentage || 0) > 0
            || (metrics.recentDowntime?.length || 0) > 0
            || (metrics.scanDetails?.length || 0) > 0
        );
    }, [metrics]);

    if (isLoading && !metrics) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-96">
                    <Loader2 className="w-12 h-12 text-cyan-300 animate-spin mb-4" />
                    <p className="text-gray-400 font-medium">Sincronizando monitores de Uptime Kuma...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error && !metrics) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
                    <div className="rounded-full bg-red-500/10 p-6 border border-red-500/20">
                        <Loader2 className="w-12 h-12 text-red-500" />
                    </div>
                    <div className="max-w-md">
                        <h2 className="text-2xl font-bold text-white uppercase italic tracking-tight">Error de Conexión</h2>
                        <p className="text-gray-400 mt-2">{error}</p>
                    </div>
                    <button onClick={loadMetrics} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-bold transition-all">
                        Reintentar
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    if (metrics && !hasUptimeData) {
        return (
            <DashboardLayout>
                <AgentNotDeployed providerName="Uptime Kuma" theme="uptime" />
            </DashboardLayout>
        );
    }

    if (!model) return null;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                        {error}
                    </div>
                )}

                <UptimeHero 
                    model={model} 
                    onRefresh={loadMetrics} 
                    isLoading={isLoading} 
                    rangeControl={
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
                    }
                />
                <UptimeKpiGrid cards={model.summaryCards} />
                <UptimeChartsSection model={model} />
                <UptimeOperationsSection model={model} />
            </div>
        </DashboardLayout>
    );
}
