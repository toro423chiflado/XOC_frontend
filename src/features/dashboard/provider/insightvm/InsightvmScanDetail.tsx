import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../DashboardLayout';
import { providerService } from '../../../../services/provider.service';
import {
    AlertTriangle, Loader2, ArrowLeft, Activity, Target, WifiOff, Calendar, Timer
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

export default function InsightvmScanDetail() {
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
        }
    }, [id]);

    const loadScanDetail = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await providerService.getInsightvmScanDetail(id!);
            setScanData(data);
        } catch (err) {
            console.error('Failed to load InsightVM scan detail', err);
            setError('No se pudo encontrar el reporte de Rapid7 InsightVM.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch { return '—'; }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-[70vh] items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-400 font-medium tracking-widest uppercase text-xs">Desencriptando Hallazgos de Rapid7...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !scanData) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
                    <WifiOff className="w-16 h-16 text-red-500 opacity-20" />
                    <h2 className="text-2xl font-bold text-white">Reporte no encontrado</h2>
                    <button onClick={() => navigate(-1)} className="text-blue-500 hover:underline">Volver</button>
                </div>
            </DashboardLayout>
        );
    }

    const scan = scanData.scan || scanData;
    const results = scan.results?.vulnerabilities || scan.results || [];
    const counts = {
        critical: scan.critical_count ?? 0,
        high: scan.high_count ?? 0,
        medium: scan.medium_count ?? 0,
        low: scan.low_count ?? 0,
        info: scan.info_count ?? 0
    };

    const isHealthy = counts.critical === 0 && counts.high === 0;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg border border-white/5 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                        <img src="./RPD.svg" alt="Rapid7 Logo" className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Reporte de Vulnerabilidades</h2>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                            <span className="flex items-center gap-1.5 font-mono"><Target className="w-3.5 h-3.5" /> {scan.target}</span>
                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(scan.created_at)}</span>
                        </div>
                    </div>
                </div>

                {/* Score Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Crítico', value: counts.critical, color: 'text-red-500', bg: 'bg-red-500/10' },
                        { label: 'Alto', value: counts.high, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                        { label: 'Medio', value: counts.medium, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                        { label: 'Bajo', value: counts.low, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { label: 'Informativo', value: counts.info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    ].map(s => (
                        <div key={s.label} className={`${s.bg} border border-white/5 p-5 rounded-2xl text-center`}>
                            <span className="text-[10px] text-gray-500 block mb-1 uppercase font-black tracking-widest">{s.label}</span>
                            <span className={`text-3xl font-black ${s.color}`}>{s.value}</span>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Insights */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-500" />
                                Resumen Ejecutivo
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Riesgo Calculado</span>
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 flex-1 bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${Math.min(((counts.critical * 3 + counts.high * 2) / 20) * 100, 100)}%` }} />
                                        </div>
                                        <span className="text-sm font-black text-white">{isHealthy ? 'BAJO' : 'ELEVADO'}</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1 flex items-center gap-1"><Timer className="w-3 h-3" /> Scanner Info</span>
                                    <span className="text-xs text-white">InsightVM v{scan.version || '7.0'}</span>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Este reporte fue generado por el motor de Rapid7 InsightVM.
                                    {isHealthy
                                        ? " El asset analizado cumple con las políticas básicas de seguridad."
                                        : " Se han identificado brechas de seguridad que exponen el asset a ataques conocidos."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Findings List */}
                    <div className="lg:col-span-2">
                        <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-2xl">
                            <div className="px-6 py-4 border-b border-dark-border bg-white/[0.02] flex items-center justify-between">
                                <h3 className="font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Hallazgos Clínicos</h3>
                                <span className="text-xs text-gray-500">{results.length} total</span>
                            </div>
                            <div className="divide-y divide-dark-border">
                                {results.length > 0 ? (
                                    results.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((f: any, i: number) => (
                                        <div key={i} className="p-6 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="space-y-2">
                                                    <h4 className="text-white font-bold group-hover:text-blue-400 transition-colors">{f.name}</h4>
                                                    <div className="flex gap-2 items-center">
                                                        {f.cve && <span className="text-[10px] font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">{f.cve}</span>}
                                                        {f.cvss !== undefined && f.cvss !== null && (
                                                            <span className={cn(
                                                                "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                                                                f.cvss >= 9 ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                                    f.cvss >= 7 ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                                                        f.cvss >= 4 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                                            "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                                            )}>
                                                                CVSS {f.cvss.toFixed(1)}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest pl-1">Puerto: {f.port || 'TCP'}</span>
                                                    </div>
                                                </div>
                                                <div className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border 
                                                    ${(f.severity || '').toLowerCase() === 'critical' ? 'text-red-500 border-red-500/20 bg-red-500/5' :
                                                        (f.severity || '').toLowerCase() === 'high' ? 'text-orange-500 border-orange-500/20 bg-orange-500/5' :
                                                            'text-blue-500 border-blue-500/20 bg-blue-500/5'}`}>
                                                    {f.severity || 'INFO'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (counts.critical > 0 || counts.high > 0 || counts.medium > 0 || counts.low > 0 || counts.info > 0) ? (
                                    <div className="p-16 text-center">
                                        <AlertTriangle className="w-12 h-12 text-amber-500/40 mx-auto mb-4" />
                                        <h4 className="text-lg font-bold text-white mb-2">Detalle No Disponible</h4>
                                        <p className="text-gray-500 text-sm max-w-sm mx-auto">
                                            El escaneo reporta vulnerabilidades en su resumen, pero el detalle de los hallazgos no se encuentra disponible (posiblemente debido a truncamiento durante la ingesta).
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-16 text-center">
                                        <div className="mb-4 relative h-12 w-12 mx-auto">
                                            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse" />
                                            <Activity className="w-12 h-12 text-blue-500/40 relative" />
                                        </div>
                                        <h4 className="text-lg font-bold text-white mb-2">Sin Hallazgos Críticos</h4>
                                        <p className="text-gray-500 text-sm max-w-sm mx-auto">
                                            No se encontraron vulnerabilidades explotables en este escaneo. El sistema mantiene una postura de seguridad robusta.
                                        </p>
                                    </div>
                                )}
                            </div>
                            {/* Pagination */}
                            {results.length > itemsPerPage && (
                                <div className="p-4 border-t border-dark-border bg-black/20 flex justify-between items-center">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="text-xs text-gray-500 hover:text-white disabled:opacity-20 transition-all px-3 py-1 bg-white/5 rounded-md"
                                    >Anterior</button>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-4">Página {currentPage} de {Math.ceil(results.length / itemsPerPage)}</span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(results.length / itemsPerPage), p + 1))}
                                        disabled={currentPage === Math.ceil(results.length / itemsPerPage)}
                                        className="text-xs text-gray-500 hover:text-white disabled:opacity-20 transition-all px-3 py-1 bg-white/5 rounded-md"
                                    >Siguiente</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
