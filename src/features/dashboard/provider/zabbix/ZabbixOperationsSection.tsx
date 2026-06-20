import { Activity, CheckCircle2, XCircle } from 'lucide-react';
import { severityStyles } from './utils';
import type { ZabbixDashboardModel } from './types';

const parseHosts = (value: string) =>
    String(value || '')
        .split(',')
        .map((host) => host.trim())
        .filter(Boolean);

const summarizeHosts = (hosts: string[]) => {
    if (hosts.length === 0) return 'Activo no identificado';
    if (hosts.length <= 3) return hosts.join(', ');
    return `${hosts.slice(0, 3).join(', ')} +${hosts.length - 3} mas`;
};

export function ZabbixOperationsSection({ model }: { model: ZabbixDashboardModel }) {
    const hasNamedHosts = model.hostRows.length > 0;

    return (
        <section className="space-y-8">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
                <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Estado de hosts</h3>
                            <p className="text-sm text-gray-400">Hosts monitoreados con lectura de disponibilidad y estado operativo.</p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">{model.hostRows.length} visibles</div>
                    </div>

                    {hasNamedHosts ? (
                        <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02]">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-dark-border text-xs uppercase text-gray-500">
                                        <th className="px-4 py-3">Host</th>
                                        <th className="px-4 py-3">Estado</th>
                                        <th className="px-4 py-3">Reporte</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-border">
                                    {model.hostRows.map((host) => (
                                        <tr key={host.id} className="text-sm transition-colors hover:bg-white/[0.02]">
                                            <td className="px-4 py-4">
                                                <div className="font-medium text-white">{host.name}</div>
                                                <div className="font-mono text-xs text-gray-500">{host.metaLabel}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`text-xs font-bold ${host.isOnline ? 'text-emerald-400' : host.isOffline ? 'text-red-400' : 'text-amber-400'}`}>{host.statusLabel}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    {host.isOnline ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : host.isOffline ? <XCircle className="h-4 w-4 text-red-400" /> : <Activity className="h-4 w-4 text-amber-400" />}
                                                    <span className="text-xs text-gray-400">{host.isOnline ? 'Disponible' : host.isOffline ? 'No disponible' : 'Reportado'}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                                La metadata del snapshot confirma <span className="font-semibold text-white">{model.totalHosts} hosts visibles</span>, pero la fuente no entrego el inventario nominal de hosts para este corte.
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                {model.hostStateDistribution.map((item) => (
                                    <div key={`fallback-host-state-${item.key}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-gray-500">
                                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                            {item.label}
                                        </div>
                                        <div className="mt-2 text-3xl font-bold text-white">{item.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-400">
                                En este escenario el dashboard muestra cobertura y estado agregado del snapshot. Para listar hosts por nombre, la integracion debe enviar `hosts[]` o findings con hostname identificable.
                            </div>
                        </div>
                    )}
                </article>

                <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Metadata del snapshot</h3>
                            <p className="text-sm text-gray-400">Contexto tecnico del ultimo corte para soporte operacional y troubleshooting.</p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">NOC</div>
                    </div>

                    <div className="space-y-3">
                        {model.snapshotFacts.map((fact) => (
                            <div key={fact.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">{fact.label}</div>
                                <div className="mt-2 text-sm font-bold text-white">{fact.value}</div>
                                <div className="mt-1 text-xs text-gray-400">{fact.helper}</div>
                            </div>
                        ))}
                    </div>
                </article>
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Alertas recientes</h3>
                            <p className="text-sm text-gray-400">Hallazgos priorizados por severidad para triage rapido cuando exista detalle util.</p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">{model.recentAlerts.length} visibles</div>
                    </div>

                    {model.recentAlerts.length > 0 ? (
                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
                            {model.recentAlerts.map((alert) => {
                                const hosts = parseHosts(alert.host);
                                return (
                                    <div key={alert.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-sm font-semibold text-white">{alert.description}</span>
                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${severityStyles[alert.severityKey]}`}>{alert.severityLabel}</span>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500">
                                            <span className="text-gray-400">Hosts ({hosts.length}): </span>
                                            <span>{summarizeHosts(hosts)}</span>
                                        </div>
                                        {hosts.length > 3 && (
                                            <details className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
                                                <summary className="cursor-pointer text-xs text-gray-300">Ver detalle</summary>
                                                <div className="mt-2 max-h-24 space-y-1 overflow-auto pr-1 text-[11px] text-gray-400">
                                                    {hosts.map((host, hostIndex) => (
                                                        <div key={`${alert.id}-host-${hostIndex}`} className="truncate">{host}</div>
                                                    ))}
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-sm text-gray-500">No hay alertas recientes. El dashboard se apoya en la metadata NOC del snapshot actual.</div>
                    )}
                </article>

                <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Resumen operativo</h3>
                            <p className="text-sm text-gray-400">Lectura de impacto y capacidad de monitoreo para el equipo NOC.</p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">Snapshot</div>
                    </div>

                    <div className="space-y-3">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Estado del corte</div>
                            <div className="mt-2 text-2xl font-bold text-white">{model.healthState.label}</div>
                            <div className="mt-1 text-sm text-gray-400">{model.healthState.summary}</div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Freshness</div>
                                <div className="mt-2 text-sm font-bold text-white">{model.dataFreshnessLabel}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Motivo del envio</div>
                                <div className="mt-2 text-sm font-bold text-white">{model.sendReasonLabel}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Cobertura</div>
                                <div className="mt-2 text-sm font-bold text-white">{model.availabilityIndicator.value}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Densidad de monitoreo</div>
                                <div className="mt-2 text-sm font-bold text-white">{model.triggerDensity.toFixed(1)} triggers/host</div>
                            </div>
                        </div>
                    </div>
                </article>
            </div>
        </section>
    );
}
