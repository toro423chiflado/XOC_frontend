import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../DashboardLayout';
import { providerService } from '../../../../services/provider.service';
import {
    AlertTriangle,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Filter,
    Loader2,
    RefreshCw,
    ShieldAlert,
    WifiOff
} from 'lucide-react';
import { buildWazuhScanDetailModel, formatWazuhDate, getWazuhSeverityMeta } from './utils';

export default function WazuhScanDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [scanData, setScanData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low' | 'info'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    useEffect(() => {
        if (id) loadScanDetail();
    }, [id]);

    const loadScanDetail = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await providerService.getWazuhScanDetail(id!);
            setScanData(data);
            setCurrentPage(1);
        } catch (err) {
            console.error('Failed to load Wazuh scan detail', err);
            setError('No se pudo cargar el detalle historico de Wazuh.');
        } finally {
            setIsLoading(false);
        }
    };

    const model = useMemo(() => (scanData ? buildWazuhScanDetailModel(scanData) : null), [scanData]);
    const filteredFindings = useMemo(() => {
        if (!model) return [];
        return model.findings.filter((finding) => {
            if (severityFilter === 'all') return true;
            return String(finding.severity).toLowerCase() === severityFilter;
        });
    }, [model, severityFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredFindings.length / itemsPerPage));
    const paginatedFindings = filteredFindings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [severityFilter, id]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-[70vh] items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-sky-400" />
                        <p className="font-medium text-gray-400">Cargando detalle de Wazuh...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !scanData || !model) {
        return (
            <DashboardLayout>
                <div className="flex h-[70vh] flex-col items-center justify-center space-y-6 text-center">
                    <WifiOff className="h-16 w-16 text-red-500 opacity-20" />
                    <div>
                        <h2 className="text-2xl font-bold text-white">Detalle no disponible</h2>
                        <p className="mt-2 text-gray-400">{error || 'No se encontro el reporte solicitado.'}</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={loadScanDetail} className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-5 py-3 font-bold text-sky-300">
                            <RefreshCw className="h-4 w-4" /> Reintentar
                        </button>
                        <button onClick={() => navigate('/dashboard/wazuh')} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-gray-300">
                            <ArrowLeft className="h-4 w-4" /> Volver
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <section className="overflow-hidden rounded-3xl border border-sky-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-7 md:p-10">
                    <div className="space-y-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={() => navigate(-1)} className="rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10">
                                    <ArrowLeft className="h-5 w-5 text-gray-300" />
                                </button>
                                <div className="rounded-2xl border border-white/10 bg-dark-card/70 p-3">
                                    <img src="./wazuuu.svg" alt="Wazuh Logo" className="h-10 w-10 rounded-full object-cover" />
                                </div>
                                <div>
                                    <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-sky-400/80">
                                        <ShieldAlert className="h-4 w-4" />
                                        Historical Detection View
                                    </div>
                                    <h2 className="text-3xl font-bold text-white md:text-4xl">Detalle historico de Wazuh</h2>
                                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                                        <span>{model.scanName}</span>
                                        <span>{model.scannedAtLabel}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Scan ID</div>
                                <div className="mt-1 font-mono text-sm text-sky-300">#{model.scanId}</div>
                            </div>
                        </div>

                    </div>
                </section>

                <section className="rounded-2xl border border-dark-border bg-dark-card p-6">
                    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Tabla de eventos</h3>
                            <p className="text-xs text-gray-500">Evento, severidad, agente, descripcion y referencia real del corte.</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Filter className="h-4 w-4 text-sky-400" /> Filtrar por severidad
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                ['all', 'Todos'],
                                ['critical', 'Critico'],
                                ['high', 'Alto'],
                                ['medium', 'Medio'],
                                ['low', 'Bajo'],
                                ['info', 'Info']
                            ].map(([value, label]) => {
                                const active = severityFilter === value;
                                return (
                                    <button
                                        key={value}
                                        onClick={() => setSeverityFilter(value as typeof severityFilter)}
                                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${active ? 'border-sky-500/30 bg-sky-500/10 text-sky-300' : 'border-white/10 bg-black/20 text-gray-300 hover:bg-white/5'}`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {filteredFindings.length > 0 ? (
                        <>
                            <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02]">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-dark-border text-xs uppercase text-gray-500">
                                            <th className="px-4 py-3">Evento</th>
                                            <th className="px-4 py-3">Severidad</th>
                                            <th className="px-4 py-3">Agente</th>
                                            <th className="px-4 py-3">Descripcion</th>
                                            <th className="px-4 py-3">Detectado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-border">
                                        {paginatedFindings.map((finding) => {
                                            const meta = getWazuhSeverityMeta(finding.severity);
                                            return (
                                                <tr key={finding.id} className="text-sm transition-colors hover:bg-white/[0.02]">
                                                    <td className="px-4 py-4 text-white">{finding.name}</td>
                                                    <td className="px-4 py-4">
                                                        <span className={`rounded-full border px-2 py-1 text-xs font-bold uppercase ${meta.softClass} ${meta.textClass}`}>{meta.label}</span>
                                                    </td>
                                                    <td className="px-4 py-4 font-mono text-gray-300">{finding.host}</td>
                                                    <td className="px-4 py-4 text-xs text-gray-400">{finding.description}</td>
                                                    <td className="px-4 py-4 text-xs text-gray-400">{formatWazuhDate(finding.detectedAt)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 flex flex-col gap-3 border-t border-dark-border pt-4 md:flex-row md:items-center md:justify-between">
                                <div className="text-xs text-gray-500">
                                    Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredFindings.length)} de {filteredFindings.length} eventos
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                        disabled={currentPage === 1}
                                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-gray-300 disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                                    </button>
                                    <span className="px-3 text-xs font-bold text-gray-400">Pagina {currentPage} / {totalPages}</span>
                                    <button
                                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                        disabled={currentPage === totalPages}
                                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-gray-300 disabled:opacity-40"
                                    >
                                        Siguiente <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-12 text-center text-gray-500">
                            <AlertTriangle className="mx-auto mb-3 h-10 w-10 opacity-20" />
                            No hay eventos detallados para este corte con el filtro actual.
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
