import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    Filter,
    Loader2,
    RefreshCw,
    Search,
    ShieldAlert,
    WifiOff
} from 'lucide-react';
import DashboardLayout from '../dashboard/DashboardLayout';
import { providerService } from '../../services/provider.service';

type IncidentFinding = {
    id: string;
    scanSummaryId: string;
    scanId: string;
    scannerType: string;
    name: string;
    severity: string;
    cve: string;
    host: string;
    port: string;
    protocol: string;
    description?: string;
    solution?: string;
    impact?: string;
    detectedAt: string;
};

type IncidentRangePreset = '7d' | '30d';

type IncidentsCachePayload = {
    savedAt: number;
    findings: IncidentFinding[];
};

const PAGE_SIZE = 10;
const INCIDENTS_CACHE_TTL_MS = 2 * 60 * 1000;
const INCIDENTS_CACHE_KEY_PREFIX = 'incidents-cache:v1:';

const SEVERITY_COLORS: Record<string, string> = {
    critical: 'text-red-200 bg-red-500/15 border-red-500/40',
    high: 'text-orange-200 bg-orange-500/15 border-orange-500/40',
    medium: 'text-amber-200 bg-amber-500/15 border-amber-500/40',
    low: 'text-blue-200 bg-blue-500/15 border-blue-500/40',
    info: 'text-sky-200 bg-sky-500/15 border-sky-500/40'
};

const SEVERITY_BAR: Record<string, string> = {
    critical: 'from-red-500/90 to-red-700/90',
    high: 'from-orange-500/90 to-orange-700/90',
    medium: 'from-amber-500/90 to-amber-700/90',
    low: 'from-blue-500/90 to-blue-700/90',
    info: 'from-sky-500/90 to-sky-700/90'
};

const SOURCE_COLORS: Record<string, string> = {
    nessus: 'text-violet-200 border-violet-500/40 bg-violet-500/15',
    insightvm: 'text-fuchsia-200 border-fuchsia-500/40 bg-fuchsia-500/15',
    openvas: 'text-emerald-200 border-emerald-500/40 bg-emerald-500/15',
    wazuh: 'text-cyan-200 border-cyan-500/40 bg-cyan-500/15',
    zabbix: 'text-lime-200 border-lime-500/40 bg-lime-500/15',
    uptime_kuma: 'text-indigo-200 border-indigo-500/40 bg-indigo-500/15',
    tenable: 'text-pink-200 border-pink-500/40 bg-pink-500/15',
    rapid7: 'text-rose-200 border-rose-500/40 bg-rose-500/15',
    qualys: 'text-teal-200 border-teal-500/40 bg-teal-500/15',
    nmap: 'text-yellow-200 border-yellow-500/40 bg-yellow-500/15',
    other: 'text-gray-200 border-gray-500/40 bg-gray-500/15'
};

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

const parseHosts = (value: string) =>
    String(value || '')
        .split(',')
        .map((host) => host.trim())
        .filter(Boolean);

const summarizeHosts = (hosts: string[]) => {
    if (hosts.length === 0) return 'Sin host';
    if (hosts.length <= 2) return hosts.join(', ');
    return `${hosts.slice(0, 2).join(', ')} +${hosts.length - 2}`;
};

const formatScannerLabel = (scanner: string) => {
    const map: Record<string, string> = {
        uptime_kuma: 'Uptime Kuma',
        insightvm: 'InsightVM',
        openvas: 'OpenVAS',
        nessus: 'Nessus',
        wazuh: 'Wazuh',
        zabbix: 'Zabbix',
        tenable: 'Tenable',
        rapid7: 'Rapid7',
        qualys: 'Qualys',
        nmap: 'Nmap',
        other: 'Other'
    };
    return map[scanner] || scanner;
};

const formatDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Fecha no disponible';
    return parsed.toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
};

const getRangeLabel = (preset: IncidentRangePreset) => (preset === '30d' ? '30 dias' : '7 dias');

const getCacheKey = (preset: IncidentRangePreset) => `${INCIDENTS_CACHE_KEY_PREFIX}${preset}`;

const readIncidentsCache = (preset: IncidentRangePreset): IncidentFinding[] | null => {
    try {
        const raw = localStorage.getItem(getCacheKey(preset));
        if (!raw) return null;

        const parsed = JSON.parse(raw) as IncidentsCachePayload;
        if (!parsed || !Array.isArray(parsed.findings) || typeof parsed.savedAt !== 'number') {
            localStorage.removeItem(getCacheKey(preset));
            return null;
        }

        if ((Date.now() - parsed.savedAt) > INCIDENTS_CACHE_TTL_MS) {
            localStorage.removeItem(getCacheKey(preset));
            return null;
        }

        return parsed.findings;
    } catch {
        return null;
    }
};

const writeIncidentsCache = (preset: IncidentRangePreset, findings: IncidentFinding[]) => {
    try {
        const payload: IncidentsCachePayload = {
            savedAt: Date.now(),
            findings
        };
        localStorage.setItem(getCacheKey(preset), JSON.stringify(payload));
    } catch {
        // Ignore cache quota errors; incidents should still render from network.
    }
};

export default function IncidentsList() {
    const [findings, setFindings] = useState<IncidentFinding[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedSeverity, setSelectedSeverity] = useState('all');
    const [selectedSource, setSelectedSource] = useState('all');
    const [page, setPage] = useState(1);
    const [activeRange, setActiveRange] = useState<IncidentRangePreset>('7d');
    const [pendingRange, setPendingRange] = useState<IncidentRangePreset | null>(null);
    const [progress, setProgress] = useState({ processedScans: 0, totalScans: 0 });
    const [isPartialData, setIsPartialData] = useState(false);
    const deferredSearch = useDeferredValue(search);
    const requestIdRef = useRef(0);
    const findingsRef = useRef<IncidentFinding[]>([]);
    const activeRangeRef = useRef<IncidentRangePreset>('7d');

    useEffect(() => {
        findingsRef.current = findings;
    }, [findings]);

    useEffect(() => {
        activeRangeRef.current = activeRange;
    }, [activeRange]);

    const loadFindings = async (preset: IncidentRangePreset, options?: { force?: boolean }) => {
        const requestId = ++requestIdRef.current;
        const hasVisibleData = findingsRef.current.length > 0;
        const shouldUseCache = preset === '7d' && !options?.force;
        const cachedFindings = shouldUseCache ? readIncidentsCache(preset) : null;
        const hasFallbackData = hasVisibleData || Boolean(cachedFindings?.length);

        setError(null);
        setProgress({ processedScans: 0, totalScans: 0 });
        setIsPartialData(false);

        if (cachedFindings && cachedFindings.length > 0) {
            setActiveRange(preset);
            setPendingRange(null);
            startTransition(() => {
                setFindings(cachedFindings);
            });
            setIsLoading(false);
            setIsRefreshing(true);
        } else if (hasVisibleData) {
            if (activeRangeRef.current !== preset) {
                setPendingRange(preset);
            }
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            let accumulated: IncidentFinding[] = [];

            const data = await providerService.getAllScanFindings(
                { preset },
                {
                    concurrency: 6,
                    onChunk: (chunk, meta) => {
                        if (requestId !== requestIdRef.current) return;

                        accumulated = accumulated.concat(chunk as IncidentFinding[]);
                        setProgress({ processedScans: meta.processed, totalScans: meta.total });
                        setIsPartialData(meta.processed < meta.total);
                        setActiveRange(preset);
                        setPendingRange(meta.processed < meta.total ? preset : null);
                        setIsLoading(false);

                        startTransition(() => {
                            setFindings([...accumulated]);
                        });
                    }
                }
            );

            if (requestId !== requestIdRef.current) return;

            const nextFindings = data as IncidentFinding[];
            setActiveRange(preset);
            setPendingRange(null);
            setIsPartialData(false);
            setProgress((prev) => prev.totalScans > 0
                ? { processedScans: prev.totalScans, totalScans: prev.totalScans }
                : prev);

            startTransition(() => {
                setFindings(nextFindings);
            });

            if (preset === '7d') {
                writeIncidentsCache(preset, nextFindings);
            }
        } catch (loadError) {
            if (requestId !== requestIdRef.current) return;

            console.error('Failed to load incidents findings', loadError);
            setPendingRange(null);
            setIsPartialData(false);
            setError(hasFallbackData
                ? 'No fue posible completar la actualizacion. Conservamos los incidentes ya cargados.'
                : 'No fue posible cargar los incidentes. Intenta nuevamente.');
        } finally {
            if (requestId !== requestIdRef.current) return;

            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadFindings('7d');
        return () => {
            requestIdRef.current += 1;
        };
    }, []);

    const severityCounts = useMemo(() => {
        const counts: Record<string, number> = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0
        };
        findings.forEach((finding) => {
            const key = SEVERITY_ORDER.includes(finding.severity) ? finding.severity : 'info';
            counts[key] += 1;
        });
        return counts;
    }, [findings]);

    const sourceCounts = useMemo(() => {
        const counter = new Map<string, number>();
        findings.forEach((finding) => {
            const source = finding.scannerType || 'other';
            counter.set(source, (counter.get(source) || 0) + 1);
        });
        return Array.from(counter.entries()).sort((a, b) => b[1] - a[1]);
    }, [findings]);

    const filteredFindings = useMemo(() => {
        const term = deferredSearch.trim().toLowerCase();
        return findings.filter((finding) => {
            if (selectedSeverity !== 'all' && finding.severity !== selectedSeverity) return false;
            if (selectedSource !== 'all' && finding.scannerType !== selectedSource) return false;

            if (!term) return true;

            const haystack = [
                finding.name,
                finding.cve,
                finding.host,
                finding.scanId,
                finding.scannerType,
                finding.severity
            ]
                .join(' ')
                .toLowerCase();

            return haystack.includes(term);
        });
    }, [findings, deferredSearch, selectedSeverity, selectedSource]);

    useEffect(() => {
        setPage(1);
    }, [search, selectedSeverity, selectedSource]);

    const totalPages = Math.max(1, Math.ceil(filteredFindings.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);

    const paginatedFindings = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredFindings.slice(start, start + PAGE_SIZE);
    }, [filteredFindings, currentPage]);

    const visibleFrom = filteredFindings.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const visibleTo = Math.min(currentPage * PAGE_SIZE, filteredFindings.length);

    const resetFilters = () => {
        setSearch('');
        setSelectedSeverity('all');
        setSelectedSource('all');
    };

    if (isLoading && findings.length === 0) {
        return (
            <DashboardLayout>
                <div className="flex h-96 items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-emerald-400" />
                        <p className="text-gray-400">Cargando incidentes de los ultimos 7 dias...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error && findings.length === 0) {
        return (
            <DashboardLayout>
                <div className="flex h-[70vh] flex-col items-center justify-center space-y-6 text-center">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                        <div className="relative rounded-full border border-red-500/30 bg-black/40 p-8 backdrop-blur-xl">
                            <WifiOff className="h-16 w-16 text-red-500" />
                        </div>
                    </div>
                    <div className="max-w-md space-y-3">
                        <h2 className="text-3xl font-bold text-white">Incidentes No Disponibles</h2>
                        <p className="text-gray-400">{error}</p>
                    </div>
                    <button
                        onClick={() => loadFindings(activeRange, { force: true })}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-6 py-3 font-bold text-emerald-300 transition-all hover:bg-emerald-500/30"
                    >
                        <RefreshCw className="h-5 w-5" />
                        Reintentar
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-zinc-900 p-6">
                    <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-red-500/10 blur-3xl" />
                    <div className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
                    <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gray-300">
                                <ShieldAlert className="h-3.5 w-3.5 text-emerald-300" />
                                Preventions/Issues
                            </div>
                            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">Alertas de Seguridad Detectadas</h2>
                            <p className="mt-2 max-w-2xl text-sm text-gray-300 md:text-base">
                                Aqui se muestran todos los eventos de riesgo detectados por tus integraciones para priorizar respuesta y remediacion.
                            </p>
                        </div>
                        <div className="flex flex-col items-stretch gap-3 md:items-end">
                            <div className="inline-flex rounded-xl border border-white/10 bg-black/25 p-1">
                                {(['7d', '30d'] as IncidentRangePreset[]).map((preset) => {
                                    const isSelected = (pendingRange || activeRange) === preset;
                                    return (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => loadFindings(preset)}
                                            className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${isSelected
                                                ? 'bg-emerald-500/20 text-emerald-200'
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            {getRangeLabel(preset)}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => loadFindings(pendingRange || activeRange, { force: true })}
                                className="inline-flex items-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-gray-100 transition-colors hover:bg-white/20 md:self-auto"
                            >
                                <RefreshCw className={`h-4 w-4 text-emerald-300 ${isRefreshing ? 'animate-spin' : ''}`} />
                                {isRefreshing ? 'Actualizando' : 'Actualizar'}
                            </button>
                        </div>
                    </div>
                </section>

                {(isRefreshing || isPartialData || error) && (
                    <section className="rounded-xl border border-white/10 bg-dark-card p-4">
                        <div className="flex flex-col gap-2 text-sm text-gray-300 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-gray-300">
                                    Rango activo: {getRangeLabel(activeRange)}
                                </span>
                                {pendingRange && pendingRange !== activeRange && (
                                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                        Ampliando a {getRangeLabel(pendingRange)}
                                    </span>
                                )}
                                {isPartialData && progress.totalScans > 0 && (
                                    <span className="text-xs text-gray-400">
                                        Cargando historico: {progress.processedScans}/{progress.totalScans} scans procesados
                                    </span>
                                )}
                            </div>
                            {isRefreshing && !isPartialData && (
                                <span className="text-xs text-gray-500">Actualizando incidentes en segundo plano...</span>
                            )}
                        </div>
                        {error && findings.length > 0 && (
                            <p className="mt-3 text-xs text-amber-300">{error}</p>
                        )}
                    </section>
                )}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-dark-card p-4">
                        <div className="text-xs uppercase tracking-[0.16em] text-gray-500">Incidentes totales</div>
                        <div className="mt-2 text-3xl font-bold text-white">{findings.length.toLocaleString()}</div>
                        <p className="mt-1 text-xs text-gray-400">Ultimos {getRangeLabel(activeRange)}</p>
                    </div>
                    <div className="rounded-xl border border-red-500/30 bg-gradient-to-b from-red-500/10 to-transparent p-4">
                        <div className="text-xs uppercase tracking-[0.16em] text-red-200">Criticos + Altos</div>
                        <div className="mt-2 text-3xl font-bold text-white">
                            {(severityCounts.critical + severityCounts.high).toLocaleString()}
                        </div>
                        <p className="mt-1 text-xs text-red-100/80">Prioridad inmediata</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-dark-card p-4">
                        <div className="text-xs uppercase tracking-[0.16em] text-gray-500">Integraciones</div>
                        <div className="mt-2 text-3xl font-bold text-white">{sourceCounts.length}</div>
                        <p className="mt-1 text-xs text-gray-400">Fuentes reportando</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-dark-card p-4">
                        <div className="text-xs uppercase tracking-[0.16em] text-gray-500">Resultados visibles</div>
                        <div className="mt-2 text-3xl font-bold text-white">{filteredFindings.length.toLocaleString()}</div>
                        <p className="mt-1 text-xs text-gray-400">Despues de filtros</p>
                    </div>
                </section>

                <section className="rounded-xl border border-white/10 bg-dark-card p-4 md:p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-200">
                            <Filter className="h-4 w-4 text-emerald-300" />
                            Filtros de Incidentes
                        </div>
                        <button
                            onClick={resetFilters}
                            className="self-start rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-white/10 md:self-auto"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <label className="relative block">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Buscar por finding, CVE, host, scan..."
                                className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-emerald-400/60"
                            />
                        </label>
                        <select
                            value={selectedSource}
                            onChange={(event) => setSelectedSource(event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-400/60"
                        >
                            <option value="all">Todas las integraciones</option>
                            {sourceCounts.map(([source, count]) => (
                                <option key={source} value={source}>
                                    {formatScannerLabel(source)} ({count})
                                </option>
                            ))}
                        </select>
                        <select
                            value={selectedSeverity}
                            onChange={(event) => setSelectedSeverity(event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-400/60"
                        >
                            <option value="all">Todas las severidades</option>
                            {SEVERITY_ORDER.map((severity) => (
                                <option key={severity} value={severity}>
                                    {severity.toUpperCase()} ({severityCounts[severity] || 0})
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                <section className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-gray-400">
                        <span>
                            Mostrando {visibleFrom}-{visibleTo} de {filteredFindings.length} incidentes
                        </span>
                        <span>Pagina {currentPage} de {totalPages}</span>
                    </div>

                    {paginatedFindings.length === 0 && (
                        <div className="rounded-xl border border-white/10 bg-dark-card p-12 text-center">
                            <AlertTriangle className="mx-auto h-10 w-10 text-amber-300/80" />
                            <p className="mt-3 text-sm text-gray-300">No se encontraron incidentes con los filtros actuales.</p>
                        </div>
                    )}

                    {paginatedFindings.map((finding) => {
                        const severityClass = SEVERITY_COLORS[finding.severity] || SEVERITY_COLORS.info;
                        const severityBar = SEVERITY_BAR[finding.severity] || SEVERITY_BAR.info;
                        const sourceClass = SOURCE_COLORS[finding.scannerType] || SOURCE_COLORS.other;
                        const hosts = parseHosts(finding.host);
                        return (
                            <article
                                key={`${finding.scanId}-${finding.id}`}
                                className="relative overflow-hidden rounded-xl border border-white/10 bg-dark-card"
                            >
                                <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${severityBar}`} />
                                <div className="space-y-4 p-4 md:p-5">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div className="min-w-0">
                                            <h3 className="text-base font-semibold text-white md:text-lg">{finding.name}</h3>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                <span className="rounded-md border border-cyan-400/35 bg-cyan-500/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-200">
                                                    Scan {finding.scanId}
                                                </span>
                                                <span className="rounded-md border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                                                    Summary ID #{finding.scanSummaryId}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase ${severityClass}`}>
                                                {finding.severity}
                                            </span>
                                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${sourceClass}`}>
                                                {formatScannerLabel(finding.scannerType)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid gap-2 text-xs text-gray-300 md:grid-cols-4">
                                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                                            <div className="text-[10px] uppercase tracking-[0.14em] text-gray-500">Host</div>
                                            <div className="mt-1 break-words">{summarizeHosts(hosts)}</div>
                                        </div>
                                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                                            <div className="text-[10px] uppercase tracking-[0.14em] text-gray-500">CVE</div>
                                            <div className="mt-1 break-words">{finding.cve || 'N/A'}</div>
                                        </div>
                                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                                            <div className="text-[10px] uppercase tracking-[0.14em] text-gray-500">Puerto / Protocolo</div>
                                            <div className="mt-1">{finding.port} / {finding.protocol}</div>
                                        </div>
                                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                                            <div className="text-[10px] uppercase tracking-[0.14em] text-gray-500">Detectado</div>
                                            <div className="mt-1">{formatDate(finding.detectedAt)}</div>
                                        </div>
                                    </div>

                                    <details className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-gray-300">
                                        <summary className="cursor-pointer font-semibold text-gray-200">
                                            Ver detalle tecnico
                                        </summary>
                                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                                            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                                <div className="text-[10px] uppercase tracking-[0.14em] text-gray-500">Descripcion</div>
                                                <p className="mt-1 whitespace-pre-wrap break-words text-gray-300">
                                                    {finding.description || 'Sin descripcion'}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                                <div className="text-[10px] uppercase tracking-[0.14em] text-gray-500">Impacto</div>
                                                <p className="mt-1 whitespace-pre-wrap break-words text-gray-300">
                                                    {finding.impact || 'Sin impacto especificado'}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                                <div className="text-[10px] uppercase tracking-[0.14em] text-gray-500">Remediacion</div>
                                                <p className="mt-1 whitespace-pre-wrap break-words text-gray-300">
                                                    {finding.solution || 'Sin recomendacion de remediacion'}
                                                </p>
                                            </div>
                                        </div>
                                        {hosts.length > 2 && (
                                            <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                                <div className="text-[10px] uppercase tracking-[0.14em] text-gray-500">Todos los hosts</div>
                                                <div className="mt-2 flex max-h-24 flex-wrap gap-1.5 overflow-auto">
                                                    {hosts.map((host, index) => (
                                                        <span
                                                            key={`${finding.id}-host-${index}`}
                                                            className="rounded-md border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] text-gray-300"
                                                        >
                                                            {host}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </details>
                                </div>
                            </article>
                        );
                    })}
                </section>

                <section className="flex flex-col gap-3 rounded-xl border border-white/10 bg-dark-card p-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-xs text-gray-400">
                        Navega por paginas para revisar todos los incidentes reportados.
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Anterior
                        </button>
                        {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                            .slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5)
                            .map((pageNumber) => (
                                <button
                                    key={pageNumber}
                                    onClick={() => setPage(pageNumber)}
                                    className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                                        pageNumber === currentPage
                                            ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200'
                                            : 'border-white/15 bg-white/5 text-gray-200 hover:bg-white/10'
                                    }`}
                                >
                                    {pageNumber}
                                </button>
                            ))}
                        <button
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Siguiente
                        </button>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
