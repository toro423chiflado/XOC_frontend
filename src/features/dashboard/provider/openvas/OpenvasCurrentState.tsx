import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../DashboardLayout';
import { providerService, type OpenvasMetrics } from '../../../../services/provider.service';
import { Shield, AlertTriangle, Server, Loader2, RefreshCw, Clock, ArrowLeft, Activity, WifiOff } from 'lucide-react';

import AgentNotDeployed from '../AgentNotDeployed';

export default function OpenvasCurrentState() {
    const [metrics, setMetrics] = useState<OpenvasMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadCurrentState();
    }, []);

    const loadCurrentState = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await providerService.getOpenvasCurrentState();
            console.log('OpenVAS Current State (Deduplicated):', data);
            setMetrics(data);
        } catch (err: any) {
            console.error('Failed to load OpenVAS current state', err);
            // If 401 or 404, treat as not deployed
            if (err.response?.status === 401 || err.response?.status === 404) {
                setMetrics({
                    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
                    scansCompleted: 0,
                    hostsScanned: 0,
                    topCVEs: []
                });
            } else {
                setError('No se pudo cargar el estado actual. El backend no está disponible o no responde.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-96 items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Cargando estado actual...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Error state
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
                            {error || 'No se pudo cargar la información del estado actual de OpenVAS.'}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={loadCurrentState}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 rounded-xl font-bold border border-emerald-500/30 transition-all"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Reintentar
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/openvas')}
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 text-gray-400 hover:bg-white/10 rounded-xl font-bold border border-white/5 transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Volver al Overview
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Agent Not Deployed State (Empty account)
    if (metrics.scansCompleted === 0) {
        return (
            <DashboardLayout>
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/dashboard/openvas')}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors border border-white/5"
                        title="Volver al Overview"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <h2 className="text-2xl font-bold text-white">Estado Actual</h2>
                </div>
                <AgentNotDeployed providerName="OpenVAS" theme="openvas" />
            </DashboardLayout>
        );
    }

    // Safe date formatter
    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '—';
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '—';
        }
    };

    // Use backend totals directly (don't recalculate)
    const totalVulns = metrics.vulnerabilities.critical +
        metrics.vulnerabilities.high +
        metrics.vulnerabilities.medium +
        metrics.vulnerabilities.low +
        metrics.vulnerabilities.info;

    const hasScans = metrics.scanDetails && metrics.scanDetails.length > 0;
    const hasCVEs = metrics.topCVEs && metrics.topCVEs.length > 0;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard/openvas')}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors border border-white/5"
                            title="Volver al Overview"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                            <Shield className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Estado Actual de OpenVAS</h2>
                            <p className="text-gray-400">Último escaneo por objetivo (sin duplicados)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {metrics.lastUpdate && (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>Actualizado: {formatDate(metrics.lastUpdate)}</span>
                            </div>
                        )}
                        <button
                            onClick={loadCurrentState}
                            disabled={isLoading}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors border border-white/5 disabled:opacity-50"
                            title="Refrescar"
                        >
                            <RefreshCw className={`w-5 h-5 text-emerald-500 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm font-medium">Total Vulnerabilidades</span>
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="text-3xl font-bold text-white">{totalVulns}</div>
                        <div className="text-xs text-gray-500 mt-1">Estado actual de la red</div>
                    </div>

                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm font-medium">Críticas</span>
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="text-3xl font-bold text-red-500">{metrics.vulnerabilities.critical}</div>
                        <div className="text-xs text-red-500/50 mt-1">Requieren atención inmediata</div>
                    </div>

                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm font-medium">Altas</span>
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="text-3xl font-bold text-orange-500">{metrics.vulnerabilities.high}</div>
                        <div className="text-xs text-orange-500/50 mt-1">Prioridad alta</div>
                    </div>

                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm font-medium">Hosts Escaneados</span>
                            <Server className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold text-white">{metrics.hostsScanned}</div>
                        <div className="text-xs text-gray-500 mt-1">Objetivos únicos</div>
                    </div>
                </div>

                {/* Scans Table */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Scans por Objetivo</h3>
                        <span className="text-xs text-gray-500">
                            {metrics.scanDetails?.length || 0} objetivos
                        </span>
                    </div>
                    {hasScans ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-dark-border text-xs text-gray-500 uppercase font-bold">
                                        <th className="px-4 py-3">Objetivo</th>
                                        <th className="px-4 py-3">Estado</th>
                                        <th className="px-4 py-3">Vulnerabilidades</th>
                                        <th className="px-4 py-3">Última Actualización</th>
                                        <th className="px-4 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-border">
                                    {metrics.scanDetails!.map((scan, idx) => {
                                        const vulnCount = scan.vulnerabilities?.length || 0;
                                        const statusColors = {
                                            completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                                            failed: 'bg-red-500/10 text-red-500 border-red-500/20',
                                            running: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                        };
                                        const statusColor = statusColors[scan.status as keyof typeof statusColors] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';

                                        return (
                                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors text-sm">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Server className="w-4 h-4 text-emerald-500" />
                                                        <span className="font-mono text-white">{scan.target || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${statusColor}`}>
                                                        {scan.status?.toUpperCase() || 'UNKNOWN'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-white font-bold">{vulnCount}</span>
                                                    <span className="text-gray-500 text-xs ml-1">detectadas</span>
                                                </td>
                                                <td className="px-4 py-4 text-gray-400 text-xs">
                                                    {formatDate(scan.created_at)}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <button
                                                        onClick={() => navigate(`/dashboard/openvas/scan/${scan.id}`)}
                                                        className="flex items-center gap-2 ml-auto px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors border border-emerald-500/20 text-xs font-bold"
                                                    >
                                                        <Activity className="w-3.5 h-3.5" />
                                                        Ver Reporte
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Server className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No se encontraron scans</p>
                        </div>
                    )}
                </div>

                {/* Top CVEs */}
                {hasCVEs && (
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">CVEs Más Frecuentes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {metrics.topCVEs!.slice(0, 6).map((cve, idx) => {
                                const severityColors = {
                                    critical: 'border-red-500/30 bg-red-500/5',
                                    high: 'border-orange-500/30 bg-orange-500/5',
                                    medium: 'border-amber-500/30 bg-amber-500/5',
                                    low: 'border-green-500/30 bg-green-500/5',
                                    info: 'border-blue-500/30 bg-blue-500/5'
                                };
                                const color = severityColors[cve.severity as keyof typeof severityColors] || 'border-gray-500/30 bg-gray-500/5';

                                return (
                                    <div key={idx} className={`border rounded-lg p-4 ${color}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-mono text-sm text-emerald-500">{cve.cve}</span>
                                            <span className="text-xs text-gray-400">{cve.count} hosts</span>
                                        </div>
                                        <div className="text-xs text-gray-500 capitalize">{cve.severity}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
