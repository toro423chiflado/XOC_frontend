import type { UptimeDashboardModel } from './types';

const formatUptimeDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export function UptimeOperationsSection({ model }: { model: UptimeDashboardModel }) {
    return (
        <section className="space-y-8">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
                <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Monitores actualmente afectados</h3>
                            <p className="text-sm text-gray-400">Vista NOC priorizada con los servicios reportados en DOWN por Uptime Kuma.</p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">{model.affectedMonitors.length} activos</div>
                    </div>

                    {model.affectedMonitors.length > 0 ? (
                        <div className="space-y-3">
                            {model.affectedMonitors.map((monitor) => (
                                <div key={monitor.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold text-white">{monitor.name}</div>
                                            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-400">
                                                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-cyan-200">{monitor.category}</span>
                                                <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5">{monitor.site}</span>
                                            </div>
                                        </div>
                                        <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${monitor.severityTone === 'critical'
                                            ? 'border-red-500/25 bg-red-500/10 text-red-200'
                                            : monitor.severityTone === 'warning'
                                                ? 'border-amber-500/25 bg-amber-500/10 text-amber-200'
                                                : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
                                            }`}>
                                            {monitor.severityLabel}
                                        </span>
                                    </div>
                                    <div className="mt-3 text-xs text-gray-400">Estado reportado: DOWN activo · Ultimo corte visible: {monitor.sinceLabel}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-sm text-gray-500">No hay monitores afectados en el corte actual.</div>
                    )}
                </article>

                <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Impacto agregado</h3>
                            <p className="text-sm text-gray-400">Resumen rapido por tipo de activo y ubicacion inferida.</p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">Vista ejecutiva</div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="mb-3 text-xs uppercase tracking-[0.16em] text-gray-500">Por categoria</div>
                            <div className="space-y-2">
                                {model.impactByCategory.length > 0 ? model.impactByCategory.map((group) => (
                                    <div key={group.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-sm font-medium text-white">{group.label}</span>
                                            <span className="text-sm font-bold text-red-300">{group.count}</span>
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500">{group.monitors.slice(0, 2).join(' · ') || 'Sin detalle'}</div>
                                    </div>
                                )) : (
                                    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-gray-500">Sin afectacion visible por categoria.</div>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="mb-3 text-xs uppercase tracking-[0.16em] text-gray-500">Por sitio</div>
                            <div className="space-y-2">
                                {model.impactBySite.length > 0 ? model.impactBySite.map((group) => (
                                    <div key={group.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-sm font-medium text-white">{group.label}</span>
                                            <span className="text-sm font-bold text-white">{group.count}</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-gray-500">Sin agrupacion visible por sitio.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </article>
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Cortes recientes</h3>
                            <p className="text-sm text-gray-400">Snapshots reales de disponibilidad para revisar el comportamiento de los ultimos envios.</p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">{model.scanRows.length} cortes</div>
                    </div>

                    {model.scanRows.length > 0 ? (
                        <div className="space-y-3">
                            {model.scanRows.slice(0, 6).map((scan) => (
                                <div key={scan.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold text-white">{scan.target}</div>
                                            <div className="mt-1 text-xs text-gray-500">{formatUptimeDate(scan.createdAt)}</div>
                                        </div>
                                        <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase ${scan.status === 'completed'
                                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                                            : scan.status === 'running'
                                                ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                                                : 'border-red-500/20 bg-red-500/10 text-red-300'
                                            }`}>
                                            {scan.status}
                                        </span>
                                    </div>
                                    <div className="mt-3 text-xs text-gray-400">Uptime {scan.uptime.toFixed(2)}% · Operativos {scan.up} · Caidos {scan.down} · Monitoreados {scan.monitored}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-sm text-gray-500">No hay cortes recientes disponibles.</div>
                    )}
                </article>

                <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Incidentes y contexto</h3>
                            <p className="text-sm text-gray-400">Contexto rapido para validar si la afectacion es historica o solo del corte actual.</p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">{model.recentIncidents.length} visibles</div>
                    </div>

                    {model.recentIncidents.length > 0 ? (
                        <div className="grid gap-4 xl:grid-cols-2">
                            {model.recentIncidents.map((incident) => (
                                <div key={incident.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.04]">
                                    <div className="mb-2 line-clamp-2 text-sm font-semibold text-white">{incident.service}</div>
                                    <div className="space-y-1 text-xs text-gray-400">
                                        <div>Referencia: {incident.duration}</div>
                                        <div>{incident.timestamp}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-sm text-gray-500">No hay incidentes recientes visibles en esta cuenta.</div>
                    )}


                </article>
            </div>
        </section>
    );
}
