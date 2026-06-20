import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../DashboardLayout';
import { providerService, type DashboardRangePreset } from '../../../../services/provider.service';
import type { ZabbixFullMetrics } from '../../../../types/api';
import { Loader2, RefreshCw, WifiOff } from 'lucide-react';
import AgentNotDeployed from '../AgentNotDeployed';
import { buildZabbixDashboardModel } from './utils';
import { ZabbixHero } from './ZabbixHero';
import { ZabbixKpiGrid } from './ZabbixKpiGrid';
import { ZabbixChartsSection } from './ZabbixChartsSection';
import { ZabbixOperationsSection } from './ZabbixOperationsSection';
import ModernDateRangeSelector from '../ModernDateRangeSelector';

export default function ZabbixDashboard() {
    const [metrics, setMetrics] = useState<ZabbixFullMetrics | null>(null);
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
            const data = await providerService.getZabbixFullMetrics({
                preset: rangePreset,
                from: customFrom || undefined,
                to: customTo || undefined
            });
            setMetrics(data);
        } catch (loadError: any) {
            console.error('Failed to load Zabbix metrics', loadError);
            const status = loadError?.response?.status;
            if (status === 401 || status === 404) {
                setMetrics({ configured: false, message: 'Zabbix integration not configured.' });
            } else {
                setError('No se pudo cargar la información de Zabbix.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const configuredMetrics = useMemo(
        () => (metrics && metrics.configured ? metrics : null),
        [metrics]
    );
    const hasZabbixData = useMemo(() => {
        if (!configuredMetrics) return false;

        const hostsFromSummary = Number(configuredMetrics.summary?.hosts || 0);
        const alertsFromSummary = Number(configuredMetrics.summary?.alerts || 0);

        return hostsFromSummary > 0
            || alertsFromSummary > 0
            || configuredMetrics.hosts.length > 0
            || configuredMetrics.alerts.length > 0;
    }, [configuredMetrics]);
    const model = useMemo(
        () => (configuredMetrics ? buildZabbixDashboardModel(configuredMetrics) : null),
        [configuredMetrics]
    );

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-96 items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-red-500" />
                        <p className="text-gray-400">Cargando métricas de Zabbix...</p>
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
                        <h2 className="text-3xl font-bold text-white">Zabbix No Disponible</h2>
                        <p className="text-lg text-gray-400">{error || 'No se pudo cargar la información de Zabbix.'}</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={loadMetrics} className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/20 px-6 py-3 font-bold text-red-400 transition-all hover:bg-red-500/30">
                            <RefreshCw className="h-5 w-5" /> Reintentar
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-bold text-gray-400 transition-all hover:bg-white/10">
                            Volver al Dashboard
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!metrics.configured || !hasZabbixData) {
        const providerMessage = 'message' in metrics ? metrics.message : undefined;
        return (
            <DashboardLayout>
                <AgentNotDeployed
                    providerName="Zabbix"
                    theme="zabbix"
                    message={providerMessage || (!hasZabbixData ? 'No hay telemetria de Zabbix para el rango seleccionado.' : undefined)}
                />
            </DashboardLayout>
        );
    }

    if (!model) return null;

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <ZabbixHero
                    agentName={configuredMetrics?.agentInfo?.name}
                    lastUsedLabel={model.lastUsedLabel}
                    statusLabel={model.statusLabel}
                    alertsActive={model.alertsActive}
                    availabilityRate={model.availabilityRate}
                    totalHosts={model.totalHosts}
                    onlineHosts={model.onlineHosts}
                    criticalPressure={model.criticalPressure}
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
                    onRefresh={loadMetrics}
                    isLoading={isLoading}
                />

                <ZabbixKpiGrid cards={model.summaryCards} />

                <ZabbixChartsSection model={model} />

                <ZabbixOperationsSection model={model} />
            </div>
        </DashboardLayout>
    );
}
