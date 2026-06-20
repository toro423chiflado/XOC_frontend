import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../DashboardLayout';
import { providerService } from '../../../../services/provider.service';
import {
    AlertTriangle,
    Server,
    Loader2,
    RefreshCw,
    ArrowLeft,
    CheckCircle2,
    Info,
    Activity,
    Target,
    WifiOff,
    Search,
    ChevronRight,
    Calendar,
    Timer
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

export default function OpenvasScanDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [scanData, setScanData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (id) {
            loadScanDetail();
            setCurrentPage(1); // Reset page on ID change
        }
    }, [id]);

    const loadScanDetail = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await providerService.getScanDetail(id!);
            setScanData(data);
        } catch (err) {
            console.error('Failed to load scan detail', err);
            setError('No se pudo cargar la información detallada del escaneo. Es posible que el ID no sea válido o el servidor no responda.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '—';
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '—';
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-[70vh] items-center justify-center">
                    <div className="text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-pulse blur-xl" />
                            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin relative mx-auto" />
                        </div>
                        <p className="text-gray-400 font-medium">Analizando reporte de OpenVAS...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !scanData) {
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
                        <h2 className="text-3xl font-bold text-white">Error de Carga</h2>
                        <p className="text-gray-400 text-lg">
                            {error || 'No se pudo encontrar el detalle del escaneo solicitado.'}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={loadScanDetail}
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
                            Volver al Dashboard
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const scan = scanData.scan || scanData;
    const results = scan.results?.vulnerabilities || scan.results || [];

    // Severity Counts - Prioritize direct counts from backend if available
    const counts = {
        critical: scan.critical_count ?? 0,
        high: scan.high_count ?? 0,
        medium: scan.medium_count ?? 0,
        low: scan.low_count ?? 0,
        info: scan.info_count ?? 0
    };

    // If counts are still 0 and we have a results array, fallback to counting results
    if (Object.values(counts).every(v => v === 0) && results.length > 0) {
        results.forEach((v: any) => {
            const sev = (v.severity || v.threat || 'info').toLowerCase();
            if (sev in counts) counts[sev as keyof typeof counts]++;
            else counts.info++;
        });
    }

    const isHealthy = counts.critical === 0 && counts.high === 0;
    const displayName = scan.target || scan.scan_name || 'Sin nombre';
    const displayDate = scan.scanned_at || scan.created_at;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors border border-white/5"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                            <img src="./greenbone_openvass_logo.svg" alt="OpenVAS Logo" className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-2xl font-bold text-white">Detalle de Escaneo</h2>
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
                                    {scan.status || 'COMPLETED'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1.5 font-mono">
                                    <Target className="w-4 h-4" />
                                    {displayName}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(displayDate)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg">
                            <span className="text-xs text-gray-500 block">ID de Escaneo</span>
                            <span className="text-sm font-mono text-emerald-500">#{String(scan.id || '').substring(0, 8)}...</span>
                        </div>
                    </div>
                </div>

                {/* Security Posture Bar */}
                <div className={`p-1 rounded-2xl bg-gradient-to-r ${isHealthy
                    ? 'from-emerald-500/20 via-emerald-500/5 to-transparent border border-emerald-500/20'
                    : 'from-red-500/20 via-red-500/5 to-transparent border border-red-500/20'
                    }`}>
                    <div className="bg-black/40 backdrop-blur-md p-6 rounded-[14px] flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-full ${isHealthy ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                {isHealthy ? (
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                ) : (
                                    <AlertTriangle className="w-8 h-8 text-red-500" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">
                                    {isHealthy ? 'Postura de Seguridad: Saludable' : 'Postura de Seguridad: Riesgo Detectado'}
                                </h3>
                                <p className="text-gray-400">
                                    {isHealthy
                                        ? 'No se detectaron vulnerabilidades críticas o de alto riesgo que requieran parcheo inmediato.'
                                        : `Se detectaron ${counts.critical + counts.high} hallazgos de severidad elevada que deben ser gestionados.`
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {counts.info > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg text-xs font-bold">
                                    <Info className="w-4 h-4" />
                                    {counts.info} Findings Informativos
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Primary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Crítico', value: counts.critical, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                        { label: 'Alto', value: counts.high, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                        { label: 'Medio', value: counts.medium, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                        { label: 'Bajo', value: counts.low, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                        { label: 'Info', value: counts.info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                    ].map((stat) => (
                        <div key={stat.label} className={`${stat.bg} ${stat.border} border p-4 rounded-xl text-center transition-all hover:translate-y-[-2px]`}>
                            <span className="text-gray-400 text-xs block mb-1 uppercase font-bold tracking-wider">{stat.label}</span>
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column: Analysis Context */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-dark-border bg-white/[0.02]">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Search className="w-4 h-4 text-emerald-500" />
                                    Contexto de Análisis
                                </h3>
                            </div>
                            <div className="p-5 space-y-5">
                                <div>
                                    <span className="text-xs text-gray-500 block mb-1.5 uppercase font-bold tracking-wider underline decoration-emerald-500/30">Target del Escaneo</span>
                                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                                            <Server className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <span className="font-mono text-white text-sm">{displayName}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                        <span className="text-[10px] text-gray-500 block mb-1 uppercase font-bold">Scanner</span>
                                        <span className="text-xs text-white font-medium">OpenVAS GVM</span>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                        <span className="text-[10px] text-gray-500 block mb-1 uppercase font-bold">Calidad (QoD)</span>
                                        <span className="text-xs text-white font-medium">80% (Defecto)</span>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 col-span-2">
                                        <span className="text-[10px] text-gray-500 block mb-1 uppercase font-bold">Riesgo Máximo (CVSS)</span>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 flex-grow bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${(scan.cvss_max || 0) >= 9 ? 'bg-red-600' :
                                                        (scan.cvss_max || 0) >= 7 ? 'bg-red-500' :
                                                            (scan.cvss_max || 0) >= 4 ? 'bg-orange-500' :
                                                                'bg-emerald-500'
                                                        }`}
                                                    style={{ width: `${((scan.cvss_max || 0) / 10) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-white">{scan.cvss_max || '0.0'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <h4 className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                        <Timer className="w-3 h-3" />
                                        Cronología
                                    </h4>
                                    <div className="relative pl-4 space-y-4 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:bg-white/10">
                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-dark-bg" />
                                            <span className="text-[10px] text-gray-500 block">Fecha del Escaneo</span>
                                            <span className="text-xs text-white">{formatDate(displayDate)}</span>
                                        </div>
                                        {scan.received_at && (
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gray-500 border-2 border-dark-bg" />
                                                <span className="text-[10px] text-gray-500 block">Sincronizado</span>
                                                <span className="text-xs text-white">{formatDate(scan.received_at)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Health Summary Widget */}
                        <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-white/10 rounded-2xl p-6">
                            <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Diagnóstico
                            </h4>
                            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                                {isHealthy
                                    ? "El sistema no presenta brechas críticas de seguridad. Se recomienda continuar con los ciclos de escaneo informativos."
                                    : "Se requiere un plan de remediación para mitigar los riesgos detectados antes del próximo escaneo programado."
                                }
                            </p>
                            <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-all border border-white/5">
                                Generar Reporte PDF
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Findings List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between mb-2 px-2">
                            <h3 className="font-bold text-white flex items-center gap-2 uppercase tracking-widest text-sm">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                Hallazgos del Escaneo ({results.length})
                            </h3>
                            <div className="flex gap-2">
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold">RECIENTE</span>
                            </div>
                        </div>

                        {results.length > 0 ? (
                            <div className="space-y-3">
                                {results.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((finding: any, idx: number) => {
                                    const sev = (finding.severity || finding.threat || 'info').toLowerCase();
                                    const severityConfig: any = {
                                        critical: { color: 'text-red-500', bg: 'bg-red-500/5', border: 'border-red-500/20', icon: AlertTriangle },
                                        high: { color: 'text-orange-500', bg: 'bg-orange-500/5', border: 'border-orange-500/20', icon: AlertTriangle },
                                        medium: { color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/20', icon: AlertTriangle },
                                        low: { color: 'text-emerald-500', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', icon: CheckCircle2 },
                                        info: { color: 'text-blue-500', bg: 'bg-blue-500/5', border: 'border-blue-500/20', icon: Info },
                                    };
                                    const config = severityConfig[sev] || severityConfig.info;
                                    const Icon = config.icon;

                                    return (
                                        <div key={idx} className={`group ${config.bg} ${config.border} border rounded-xl p-4 hover:border-white/20 transition-all cursor-pointer`}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className={`mt-1 p-2 rounded-lg ${config.bg} border ${config.border}`}>
                                                        <Icon className={`w-4 h-4 ${config.color}`} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold text-sm mb-1 group-hover:text-emerald-400 transition-colors">
                                                            {finding.name || 'Vulnerabilidad sin nombre'}
                                                        </h4>
                                                        <div className="flex items-center gap-3">
                                                            {finding.cve && (
                                                                <span className="text-[10px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                                    {finding.cve}
                                                                </span>
                                                            )}
                                                            {finding.cvss !== undefined && finding.cvss !== null && (
                                                                <span className={cn(
                                                                    "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                                                                    finding.cvss >= 9 ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                                        finding.cvss >= 7 ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                                                            finding.cvss >= 4 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                                                "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                                )}>
                                                                    CVSS {finding.cvss.toFixed(1)}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-gray-400 font-medium">
                                                                Portal: {finding.port || 'TCP/UDP'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Pagination Controls */}
                                {results.length > itemsPerPage && (
                                    <div className="flex items-center justify-between pt-4 border-t border-dark-border mt-6">
                                        <p className="text-xs text-gray-500 italic">
                                            Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, results.length)} - {Math.min(currentPage * itemsPerPage, results.length)} de {results.length} hallazgos
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-bold text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                Anterior
                                            </button>
                                            <div className="flex items-center gap-1 px-3">
                                                <span className="text-xs font-bold text-emerald-500">{currentPage}</span>
                                                <span className="text-xs text-gray-600">/</span>
                                                <span className="text-xs text-gray-400 font-medium">{Math.ceil(results.length / itemsPerPage)}</span>
                                            </div>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(results.length / itemsPerPage), prev + 1))}
                                                disabled={currentPage === Math.ceil(results.length / itemsPerPage)}
                                                className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-bold text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (counts.critical > 0 || counts.high > 0 || counts.medium > 0 || counts.low > 0 || counts.info > 0) ? (
                            <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center">
                                <div className="mb-4 relative h-20 w-20 mx-auto">
                                    <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-pulse" />
                                    <AlertTriangle className="w-20 h-20 text-amber-500/40 relative" />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2">Detalle No Disponible</h4>
                                <p className="text-gray-500 max-w-sm mx-auto">
                                    El escaneo reporta vulnerabilidades en su resumen, pero el detalle de los hallazgos no se encuentra disponible en la base de datos (posiblemente debido a truncamiento por límite de tamaño durante la ingesta).
                                </p>
                            </div>
                        ) : (
                            <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center">
                                <div className="mb-4 relative h-20 w-20 mx-auto">
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-pulse" />
                                    <CheckCircle2 className="w-20 h-20 text-emerald-500/40 relative" />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2">Sin Hallazgos Críticos</h4>
                                <p className="text-gray-500 max-w-sm mx-auto">
                                    No se encontraron vulnerabilidades explotables en este escaneo.
                                    El sistema mantiene una postura de seguridad robusta.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
