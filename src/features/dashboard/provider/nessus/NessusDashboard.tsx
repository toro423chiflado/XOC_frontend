import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import DashboardLayout from '../../DashboardLayout';
import ModernDateRangeSelector from '../ModernDateRangeSelector';
import { providerService, type DashboardRangePreset, type NessusMetrics } from '../../../../services/provider.service';
import AgentNotDeployed from '../AgentNotDeployed';
import { NessusChartsSection } from './NessusChartsSection';
import { NessusHero } from './NessusHero';
import { NessusKpiGrid } from './NessusKpiGrid';
import { NessusOperationsSection } from './NessusOperationsSection';
import { buildNessusDashboardModel } from './utils';

export default function NessusDashboard() {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<NessusMetrics | null>(null);
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
            const data = await providerService.getNessusMetrics({
                preset: rangePreset,
                from: customFrom || undefined,
                to: customTo || undefined
            });
            setMetrics(data);
        } catch (loadError: any) {
            console.error('Failed to load Nessus metrics', loadError);
            if (loadError?.response?.status === 401 || loadError?.response?.status === 404) {
                setMetrics({
                    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
                    scansCompleted: 0,
                    hostsScanned: 0,
                    topCVEs: []
                });
            } else {
                setError('No se pudo cargar la informacion de Nessus.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const model = useMemo(() => {
        if (!metrics) return null;
        return buildNessusDashboardModel(metrics, rangePreset, customFrom, customTo);
    }, [metrics, rangePreset, customFrom, customTo]);

    const hasNessusData = useMemo(() => {
        if (!metrics) return false;

        const totalVulnerabilities = Object.values(metrics.vulnerabilities || {}).reduce(
            (acc, value) => acc + Number(value || 0),
            0
        );

        return (
            Number(metrics.scansCompleted || 0) > 0
            || Number(metrics.hostsScanned || 0) > 0
            || totalVulnerabilities > 0
            || (metrics.topCVEs?.length || 0) > 0
            || (metrics.scanDetails?.length || 0) > 0
        );
    }, [metrics]);

    if (isLoading && !metrics) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-96">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-4" />
                    <p className="text-gray-400 font-medium">Sincronizando reportes de Nessus...</p>
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

    if (metrics && !hasNessusData) {
        return (
            <DashboardLayout>
                <AgentNotDeployed providerName="Nessus" theme="nessus" />
            </DashboardLayout>
        );
    }

    if (!model) return null;

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                        {error}
                    </div>
                )}

                <NessusHero 
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
                <NessusKpiGrid cards={model.summaryCards} />
                <NessusChartsSection model={model} />
                <NessusOperationsSection model={model} onOpenScan={(id) => navigate(`/dashboard/nessus/scan/${id}`)} />
            </div>
        </DashboardLayout>
    );
}
