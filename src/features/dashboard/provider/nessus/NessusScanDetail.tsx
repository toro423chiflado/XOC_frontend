import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../DashboardLayout';
import { providerService } from '../../../../services/provider.service';
import {
    ArrowLeft,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Filter,
    Loader2,
    RefreshCw,
    Server,
    ShieldAlert,
    WifiOff
} from 'lucide-react';

const parseHosts = (value: string) =>
    String(value || '')
        .split(',')
        .map((host) => host.trim())
        .filter(Boolean);

const summarizeHosts = (hosts: string[]) => {
    if (hosts.length === 0) return 'Host no identificado';
    if (hosts.length <= 3) return hosts.join(', ');
    return `${hosts.slice(0, 3).join(', ')} +${hosts.length - 3} mas`;
};

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const severityMeta: Record<string, { label: string; valueClass: string; badgeClass: string; softClass: string }> = {
    critical: {
        label: 'Critico',
        valueClass: 'text-red-400',
        badgeClass: 'border-red-500/20 bg-red-500/10 text-red-300',
        softClass: 'border-red-500/20 bg-red-500/10'
    },
    high: {
        label: 'Alto',
        valueClass: 'text-orange-400',
        badgeClass: 'border-orange-500/20 bg-orange-500/10 text-orange-300',
        softClass: 'border-orange-500/20 bg-orange-500/10'
    },
    medium: {
        label: 'Medio',
        valueClass: 'text-amber-400',
        badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
        softClass: 'border-amber-500/20 bg-amber-500/10'
    },
    low: {
        label: 'Bajo',
        valueClass: 'text-emerald-400',
        badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
        softClass: 'border-emerald-500/20 bg-emerald-500/10'
    },
    info: {
        label: 'Info',
        valueClass: 'text-sky-400',
        badgeClass: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
        softClass: 'border-sky-500/20 bg-sky-500/10'
    }
};

export default function NessusScanDetail() {
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
            const data = await providerService.getNessusScanDetail(id!);
            setScanData(data);
            setCurrentPage(1);
        } catch (err) {
            console.error('Failed to load Nessus scan detail', err);
            setError('No se pudo cargar el detalle historico de Nessus.');
        } finally {
            setIsLoading(false);
        }
    };

    const scan = scanData?.scan || scanData || {};
    const findings = scan.results?.vulnerabilities || scan.findings || [];
    const counts = {
        critical: scan.critical_count || 0,
        high: scan.high_count || 0,
        medium: scan.medium_count || 0,
        low: scan.low_count || 0,
        info: scan.info_count || 0
    };

    const filteredFindings = useMemo(() => {
        return findings.filter((finding: any) => {
            if (severityFilter === 'all') return true;
            return String(finding?.severity || 'info').toLowerCase() === severityFilter;
        });
    }, [findings, severityFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredFindings.length / itemsPerPage));
    const paginatedFindings = filteredFindings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalFindings = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);

    useEffect(() => {
        setCurrentPage(1);
    }, [severityFilter, id]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-[70vh] items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-violet-400" />
                        <p className="font-medium text-gray-400">Cargando detalle de Nessus...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !scanData) {
        return (
            <DashboardLayout>
                <div className="flex h-[70vh] flex-col items-center justify-center space-y-6 text-center">
                    <WifiOff className="h-16 w-16 text-red-500 opacity-20" />
                    <div>
                        <h2 className="text-2xl font-bold text-white">Detalle no disponible</h2>
                        <p className="mt-2 text-gray-400">{error || 'No se encontro el reporte solicitado.'}</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={loadScanDetail} className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-3 font-bold text-violet-200">
                            <RefreshCw className="h-4 w-4" /> Reintentar
                        </button>
                        <button onClick={() => navigate('/dashboard/nessus')} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-gray-300">
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
                <section className="overflow-hidden rounded-3xl border border-violet-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.14),_transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-7 md:p-10">
                    <div className="space-y-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={() => navigate(-1)} className="rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10">
                                    <ArrowLeft className="h-5 w-5 text-gray-300" />
                                </button>
                                <div className="rounded-2xl border border-white/10 bg-dark-card/70 p-3">
                                    <img src="./tenablenesus.svg" alt="Nessus Logo" className="h-10 w-10 rounded-full object-cover" />
                                </div>
                                <div>
                                    <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-violet-300/80">
                                        <ShieldAlert className="h-4 w-4" />
                                        Scan #{String(scan.id || scan.scan_id)}
                                    </div>
                                    <h2 className="text-3xl font-bold text-white md:text-4xl">Detalle del corte</h2>
                                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                                        <span className="inline-flex items-center gap-1.5"><Server className="h-4 w-4" /> {scan.scan_name || scan.target || 'Nessus scan'}</span>
                                        <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatDate(scan.scanned_at || scan.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Total Hallazgos</div>
                                <div className="mt-1.5 text-2xl font-bold text-white">{totalFindings.toLocaleString()}</div>
                            </div>
                            {(['critical', 'high', 'medium', 'low', 'info'] as const).map((key) => {
                                const meta = severityMeta[key];
                                return (
                                    <div key={key} className={`rounded-xl border p-4 ${meta.softClass}`}>
                                        <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{meta.label}</div>
                                        <div className={`mt-1.5 text-2xl font-bold ${meta.valueClass}`}>{counts[key].toLocaleString()}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-dark-border bg-dark-card p-6">
                    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Eventos del corte</h3>
                            <p className="text-xs text-gray-500">Detalle real asociado al snapshot y listo para investigacion operativa.</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Filter className="h-4 w-4 text-violet-300" /> Filtrar por severidad
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                ['all', 'Todos'],
                                ['critical', 'Critico'],
                                ['high', 'Alto'],
                                ['medium', 'Medio'],
                                ['low', 'Bajo'],
                                ['info', 'Info']
                            ].map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => setSeverityFilter(value as typeof severityFilter)}
                                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${severityFilter === value
                                        ? 'border-violet-400/50 bg-violet-500/20 text-violet-100'
                                        : 'border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06] hover:text-gray-200'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {paginatedFindings.length > 0 ? (
                        <div className="space-y-3">
                            {paginatedFindings.map((finding: any, index: number) => {
                                const key = String(finding?.severity || 'info').toLowerCase();
                                const meta = severityMeta[key] || severityMeta.info;
                                const hosts = parseHosts(String(finding?.host || finding?.ip || finding?.target || ''));
                                const hostPreview = summarizeHosts(hosts);
                                return (
                                    <div key={String(finding?.id || `${currentPage}-${index}`)} className={`group rounded-xl border p-4 overflow-hidden ${meta.softClass}`}>
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div className="min-w-0">
                                                <div className="line-clamp-2 text-sm font-semibold text-white">{String(finding?.name || finding?.title || 'Hallazgo')}</div>
                                                <div className="mt-2 space-y-1 text-xs text-gray-400">
                                                    <div className="flex items-start gap-2 min-w-0">
                                                        <Server className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                                        <div className="min-w-0">
                                                            <span className="line-clamp-2 break-all">{hostPreview}</span>
                                                            {hosts.length > 3 ? (
                                                                <div className="mt-1 hidden rounded-md border border-white/10 bg-black/25 p-2 text-[11px] text-gray-300 group-hover:block">
                                                                    {hosts.join(', ')}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {formatDate(finding?.created_at || finding?.detected_at || finding?.timestamp)}</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${meta.badgeClass}`}>{meta.label}</span>
                                                {finding?.cvss !== undefined && finding?.cvss !== null ? (
                                                    <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-gray-200">
                                                        CVSS {Number(finding.cvss).toFixed(1)}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-sm text-gray-500">No hay eventos para el filtro seleccionado.</div>
                    )}

                    {totalPages > 1 ? (
                        <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-gray-400">
                            <button
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                disabled={currentPage === 1}
                                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-200 disabled:opacity-40"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                            </button>
                            <span>Pagina {currentPage} de {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                disabled={currentPage === totalPages}
                                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-200 disabled:opacity-40"
                            >
                                Siguiente <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : null}
                </section>
            </div>
        </DashboardLayout>
    );
}
