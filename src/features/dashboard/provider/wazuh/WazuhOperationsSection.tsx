import { useState } from 'react';
import { ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import type { WazuhDashboardModel } from './types';
import { getWazuhSeverityMeta } from './utils';

export function WazuhOperationsSection({
    model,
    onOpenScan
}: {
    model: WazuhDashboardModel;
    onOpenScan: (id: string) => void;
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(model.historical.cutRows.length / itemsPerPage);
    const paginatedRows = model.historical.cutRows.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <section className="space-y-8">
            <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-2"><ShieldAlert className="h-5 w-5 text-sky-400" /></div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Resumen del último snapshot</h3>
                            <p className="text-sm text-gray-400">Contexto operativo y distribución de eventos.</p>
                        </div>
                    </div>
                    <div className="flex flex-col md:items-end">
                        <div className="text-sm font-semibold text-white">{model.snapshot.scannedAtLabel}</div>
                        <div className="text-[11px] uppercase tracking-wider text-gray-500">{model.snapshot.windowLabel}</div>
                    </div>
                </div>

                <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {model.snapshot.severityDistribution.map((item: any) => (
                        <div key={item.key} className={`flex items-center justify-between rounded-xl border p-3.5 transition-all hover:brightness-110 ${item.softClass || 'border-white/5 bg-white/[0.02]'}`}>
                            <div className="flex items-center gap-2.5">
                                <span className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-200">{item.label}</span>
                            </div>
                            <span className={`text-xl font-bold ${item.textClass}`}>{item.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="flex flex-col gap-3">
                        <div className="mb-1 flex items-center gap-2">
                            <div className="h-4 w-1 rounded-full bg-sky-500/50"></div>
                            <div className="text-xs font-bold uppercase tracking-wider text-white">Contexto de ingesta</div>
                        </div>
                        <div className="flex-1 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-400">Regla dominante</div>
                            <div className="mt-1.5 text-sm font-semibold text-gray-200 line-clamp-2">{model.snapshot.topRules[0]?.name || '—'}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Motivo</div>
                                <div className="mt-1 truncate text-xs font-medium text-white">{model.snapshot.sendReason || '—'}</div>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Modo</div>
                                <div className="mt-1 truncate text-xs font-medium text-white">{model.snapshot.snapshotMode || '—'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="mb-1 flex items-center gap-2">
                            <div className="h-4 w-1 rounded-full bg-amber-500/50"></div>
                            <div className="text-xs font-bold uppercase tracking-wider text-white">Top 3 Reglas</div>
                        </div>
                        <div className="flex-1 space-y-2.5">
                            {model.snapshot.topRules.slice(0, 3).map((rule, index) => (
                                <div key={`${rule.name}-${index}`} className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] p-3.5 transition-colors hover:bg-white/[0.04]">
                                    <div className="truncate pr-3 text-[13px] font-medium text-gray-300 transition-colors group-hover:text-white">{rule.name}</div>
                                    <div className="shrink-0 rounded bg-amber-500/10 px-2.5 py-1 text-sm font-bold text-amber-400">{rule.count}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="mb-1 flex items-center gap-2">
                            <div className="h-4 w-1 rounded-full bg-emerald-500/50"></div>
                            <div className="text-xs font-bold uppercase tracking-wider text-white">Top 3 Agentes</div>
                        </div>
                        <div className="flex-1 space-y-2.5">
                            {model.snapshot.topAgents.slice(0, 3).map((agent, index) => (
                                <div key={`${agent.name}-${index}`} className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] p-3.5 transition-colors hover:bg-white/[0.04]">
                                    <div className="truncate pr-3 text-[13px] font-medium text-gray-300 transition-colors group-hover:text-white">{agent.name}</div>
                                    <div className="shrink-0 rounded bg-emerald-500/10 px-2.5 py-1 text-sm font-bold text-emerald-400">{agent.count}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </article>



            <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Tabla de cortes</h3>
                        <p className="text-sm text-gray-400">Historial operativo con metadata util para revisar estabilidad, picos y contexto del envio.</p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">{model.historical.cutRows.length} cortes</div>
                </div>

                {model.historical.cutRows.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02]">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-dark-border text-[10px] uppercase tracking-wider text-gray-500">
                                        <th className="px-4 py-3 font-semibold">Scanned at</th>
                                        <th className="px-4 py-3 font-semibold">Scan</th>
                                        <th className="px-4 py-3 font-semibold">Total</th>
                                        <th className="px-4 py-3 font-semibold text-red-400/70">Crit</th>
                                        <th className="px-4 py-3 font-semibold text-orange-400/70">Alto</th>
                                        <th className="px-4 py-3 font-semibold text-amber-400/70">Med</th>
                                        <th className="px-4 py-3 font-semibold text-emerald-400/70">Bajo</th>
                                        <th className="px-4 py-3 font-semibold text-sky-400/70">Info</th>
                                        <th className="px-4 py-3 font-semibold">Top rule</th>
                                        <th className="px-4 py-3 font-semibold">Top agent</th>
                                        <th className="px-4 py-3 font-semibold">Send reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-border">
                                    {paginatedRows.map((cut) => (
                                        <tr 
                                            key={cut.id} 
                                            onClick={() => onOpenScan(cut.id)}
                                            className="group cursor-pointer text-sm transition-colors hover:bg-white/[0.04]"
                                        >
                                            <td className="px-4 py-3 text-xs text-gray-400 group-hover:text-white transition-colors">{formatCutDate(cut.scannedAt)}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-white group-hover:text-sky-300 transition-colors">{cut.scanName}</div>
                                                <div className="mt-0.5 text-[11px] text-gray-500">{cut.agentName || 'Agente no informado'}</div>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-white">{cut.totalEvents.toLocaleString()}</td>
                                            <td className="px-4 py-3 font-medium text-red-400/90">{cut.severityTotals.critical.toLocaleString()}</td>
                                            <td className="px-4 py-3 font-medium text-orange-400/90">{cut.severityTotals.high.toLocaleString()}</td>
                                            <td className="px-4 py-3 font-medium text-amber-400/90">{cut.severityTotals.medium.toLocaleString()}</td>
                                            <td className="px-4 py-3 font-medium text-emerald-400/90">{cut.severityTotals.low.toLocaleString()}</td>
                                            <td className="px-4 py-3 font-medium text-sky-400/90">{cut.severityTotals.info.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-xs text-gray-400 max-w-[200px] truncate" title={cut.topRule || ''}>{cut.topRule || '—'}</td>
                                            <td className="px-4 py-3 text-xs text-gray-400 max-w-[120px] truncate" title={cut.topAgent || ''}>{cut.topAgent || '—'}</td>
                                            <td className="px-4 py-3 text-xs text-gray-400">{cut.sendReason || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                <div className="text-xs text-gray-500">
                                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, model.historical.cutRows.length)} de {model.historical.cutRows.length} cortes
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <div className="text-xs font-medium text-white px-2">
                                        Página {currentPage} de {totalPages}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-sm text-gray-500">No hay cortes recientes disponibles.</div>
                )}
            </article>
        </section>
    );
}

function formatCutDate(value?: string | null) {
    if (!value) return 'Sin registro';
    const asDate = new Date(value);
    if (Number.isNaN(asDate.getTime())) return value;
    return asDate.toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
