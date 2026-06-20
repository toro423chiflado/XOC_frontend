import { ChevronLeft, ChevronRight, FileSearch } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { OpenvasScanRow, OpenvasTopCveItem } from './types';
import { formatOpenvasDate, getSeverityMeta } from './utils';

interface OpenvasOperationsSectionProps {
    scanRows: OpenvasScanRow[];
    topCVEs: OpenvasTopCveItem[];
    onOpenScan: (scanId: string) => void;
}

export function OpenvasOperationsSection({
    scanRows,
    topCVEs,
    onOpenScan
}: OpenvasOperationsSectionProps) {
    const [reportFilter, setReportFilter] = useState<'all' | 'completed' | 'running' | 'failed'>('all');
    const [reportPage, setReportPage] = useState(1);
    const reportsPerPage = 6;
    const filteredReports = useMemo(
        () => scanRows.filter((scan) => reportFilter === 'all' || scan.status === reportFilter),
        [reportFilter, scanRows]
    );
    const totalPages = Math.max(1, Math.ceil(filteredReports.length / reportsPerPage));
    const safeReportPage = Math.min(reportPage, totalPages);
    const paginatedReports = filteredReports.slice((safeReportPage - 1) * reportsPerPage, safeReportPage * reportsPerPage);

    return (
        <section className="space-y-8">
            <div className="grid gap-8 2xl:grid-cols-2">
                <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                    <div className="mb-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Reportes recientes</h3>
                                <p className="text-sm text-gray-400">Filtro rapido y paginacion para revisar corridas recientes y su carga operativa.</p>
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">{scanRows.length} reportes</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(['all', 'completed', 'running', 'failed'] as const).map((filter) => {
                                const active = reportFilter === filter;
                                return (
                                    <button
                                        key={filter}
                                        onClick={() => {
                                            setReportFilter(filter);
                                            setReportPage(1);
                                        }}
                                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${active ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.05]'}`}
                                    >
                                        {filter === 'all' ? 'Todos' : filter}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {paginatedReports.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20">
                                <table className="w-full text-left text-sm text-gray-300">
                                    <thead className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold text-gray-400">
                                        <tr>
                                            <th className="px-4 py-3">Activo / Referencia</th>
                                            <th className="px-4 py-3">Fecha</th>
                                            <th className="px-4 py-3">Estado</th>
                                            <th className="px-4 py-3">Findings</th>
                                            <th className="px-4 py-3">Riesgo / Severidad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {paginatedReports.map((report) => {
                                            const statusClass = report.status === 'completed'
                                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                                                : report.status === 'failed'
                                                    ? 'border-red-500/20 bg-red-500/10 text-red-300'
                                                    : 'border-blue-500/20 bg-blue-500/10 text-blue-300';
                                            const riskLabel = report.hasSeverityBreakdown
                                                ? `${report.weightedRisk}`
                                                : 'Sin desglose';

                                            return (
                                                <tr 
                                                    key={report.id} 
                                                    onClick={() => onOpenScan(report.id)}
                                                    title="Click para ver detalle del reporte"
                                                    className="group cursor-pointer transition-colors hover:bg-white/[0.04]"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="font-mono text-sm font-semibold text-emerald-400 transition-colors group-hover:text-emerald-300">{report.target}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-400">
                                                        {formatOpenvasDate(report.createdAt)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusClass}`}>
                                                            {report.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-white">
                                                        {report.findings}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-400">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span>{riskLabel}</span>
                                                            <ChevronRight className="h-4 w-4 text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between px-1 text-xs text-gray-400">
                                <span>Mostrando {(safeReportPage - 1) * reportsPerPage + 1} a {Math.min(safeReportPage * reportsPerPage, filteredReports.length)} de {filteredReports.length} reportes</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setReportPage((page) => Math.max(1, page - 1))}
                                        disabled={safeReportPage === 1}
                                        className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-gray-300 transition-colors hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setReportPage((page) => Math.min(totalPages, page + 1))}
                                        disabled={safeReportPage === totalPages}
                                        className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-gray-300 transition-colors hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-sm text-gray-500">
                            No hay reportes para el filtro seleccionado.
                        </div>
                    )}
                </article>

                <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Top 5 Tareas por Volumen</h3>
                            <p className="text-sm text-gray-400">Activos o segmentos que generaron la mayor cantidad de hallazgos en el ultimo periodo.</p>
                        </div>
                    </div>

                    {scanRows.length > 0 ? (
                        <div className="space-y-4">
                            {[...scanRows]
                                .sort((a, b) => b.findings - a.findings)
                                .slice(0, 5)
                                .map((scan, index) => {
                                    const maxFindings = Math.max(...scanRows.map(s => s.findings), 1);
                                    const widthPct = Math.max((scan.findings / maxFindings) * 100, 2);
                                    
                                    return (
                                        <button 
                                            key={`${scan.id}-${index}`}
                                            onClick={() => onOpenScan(scan.id)}
                                            title="Click para ver detalle del reporte"
                                            className="group w-full rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left transition-colors hover:bg-white/[0.04]"
                                        >
                                            <div className="mb-2 flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 truncate max-w-[70%]">
                                                    <span className="truncate font-semibold text-white transition-colors group-hover:text-emerald-400">{scan.target}</span>
                                                    <ChevronRight className="h-4 w-4 shrink-0 text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100" />
                                                </div>
                                                <span className="font-mono font-bold text-gray-300">{scan.findings.toLocaleString()}</span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
                                                <div 
                                                    className="h-full rounded-full bg-emerald-500 transition-all duration-1000" 
                                                    style={{ width: `${widthPct}%` }}
                                                />
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500">
                                                Escaneado: {formatOpenvasDate(scan.createdAt)}
                                            </div>
                                        </button>
                                    );
                                })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-sm text-gray-500">
                            No hay suficientes datos para generar el top de tareas.
                        </div>
                    )}
                </article>
            </div>

        </section>
    );
}
