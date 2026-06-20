import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../DashboardLayout';
import { providerService, type OpenvasMetrics, type DashboardRangePreset } from '../../../../services/provider.service';
import { Loader2, RefreshCw, WifiOff } from 'lucide-react';

import AgentNotDeployed from '../AgentNotDeployed';
import { OpenvasExposureSection } from './OpenvasExposureSection';
import { OpenvasHero } from './OpenvasHero';

import { OpenvasKpiGrid } from './OpenvasKpiGrid';
import { OpenvasOperationsSection } from './OpenvasOperationsSection';
import type { OpenvasHostItem } from './types';
import { buildOpenvasDashboardModel, formatOpenvasDate } from './utils';
import ModernDateRangeSelector from '../ModernDateRangeSelector';

export default function OpenvasDashboard() {
    const [metrics, setMetrics] = useState<OpenvasMetrics | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedHost, setSelectedHost] = useState<OpenvasHostItem | null>(null);
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
                providerService.getOpenvasMetrics({ preset: rangePreset, from: customFrom || undefined, to: customTo || undefined }),
                providerService.getOpenvasAnalytics({ preset: rangePreset, from: customFrom || undefined, to: customTo || undefined }).catch(err => {
                    console.warn('Analytics endpoint not available:', err);
                    return null;
                })
            ]);
            setMetrics(metricsData);
            setAnalytics(analyticsData);
        } catch (err: any) {
            console.error('Failed to load OpenVAS metrics', err);
            // If 401 or 404, it likely means the agent/module is not configured for this new account
            if (err.response?.status === 401 || err.response?.status === 404) {
                setMetrics({
                    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
                    scansCompleted: 0,
                    hostsScanned: 0,
                    topCVEs: []
                });
            } else {
                setError('No se pudo cargar las métricas de OpenVAS. El backend no está disponible o no responde.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const dashboardModel = useMemo(
        () => (metrics ? buildOpenvasDashboardModel(metrics, analytics) : null),
        [metrics, analytics]
    );

    useEffect(() => {
        if (!dashboardModel) {
            if (selectedHost !== null) {
                setSelectedHost(null);
            }
            return;
        }

        if (!selectedHost && dashboardModel.hostExposure.length > 0) {
            setSelectedHost(dashboardModel.hostExposure[0]);
            return;
        }

        if (selectedHost) {
            const updatedSelectedHost = dashboardModel.hostExposure.find((host) => host.host === selectedHost.host) || null;
            if (!updatedSelectedHost && selectedHost !== null) {
                setSelectedHost(dashboardModel.hostExposure[0] || null);
                return;
            }
            if (updatedSelectedHost && updatedSelectedHost !== selectedHost) {
                setSelectedHost(updatedSelectedHost);
            }
        }
    }, [dashboardModel, selectedHost]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-96 items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Cargando métricas históricas...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !metrics) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                        <div className="relative p-8 bg-black/40 border border-red-500/30 rounded-full backdrop-blur-xl">
                            <WifiOff className="w-16 h-16 text-red-500" />
                        </div>
                    </div>
                    <div className="max-w-md space-y-4">
                        <h2 className="text-3xl font-bold text-white">Backend No Disponible</h2>
                        <p className="text-gray-400 text-lg">
                            {error || 'No se pudo cargar la información de OpenVAS.'}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={loadMetrics}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 rounded-xl font-bold border border-emerald-500/30 transition-all"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Reintentar
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 text-gray-400 hover:bg-white/10 rounded-xl font-bold border border-white/5 transition-all"
                        >
                            Volver al Dashboard
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (metrics.scansCompleted === 0) {
        return (
            <DashboardLayout>
                <AgentNotDeployed providerName="OpenVAS" theme="openvas" />
            </DashboardLayout>
        );
    }

    if (!dashboardModel) {
        return null;
    }

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <OpenvasHero
                    totalVulnerabilities={dashboardModel.totalVulnerabilities}
                    lastUpdateLabel={dashboardModel.latestActivity ? formatOpenvasDate(dashboardModel.latestActivity) : 'Sin datos'}
                    isLoading={isLoading}
                    onRefresh={loadMetrics}
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

                <OpenvasKpiGrid cards={dashboardModel.summaryCards} />



                <OpenvasExposureSection
                    severityDistribution={dashboardModel.severityDistribution}
                    trendData={dashboardModel.trendData}
                    cutVolume={dashboardModel.cutVolume}
                    hostExposure={dashboardModel.hostExposure}
                    recentFindings={dashboardModel.recentFindings}
                    selectedHost={selectedHost}
                    onSelectHost={setSelectedHost}
                />

                <OpenvasOperationsSection
                    scanRows={dashboardModel.scanRows}
                    topCVEs={dashboardModel.topCVEs}
                    onOpenScan={(scanId: string) => navigate(`/dashboard/openvas/scan/${scanId}`)}
                />
            </div>
        </DashboardLayout>
    );
}
