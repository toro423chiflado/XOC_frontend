import { Activity, Radar } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import type { ZabbixDashboardModel } from './types';

export function ZabbixChartsSection({ model }: { model: ZabbixDashboardModel }) {
    const isSinglePointTrend = model.trendData.length === 1;

    return (
        <section className="grid gap-8 xl:grid-cols-2">
            <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-2"><Activity className="h-5 w-5 text-red-400" /></div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Estado actual NOC</h3>
                        <p className="text-sm text-gray-400">Lectura operativa del ultimo snapshot con foco en hosts, problemas, eventos y cobertura.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Salud operacional</div>
                                <div className="mt-2 text-2xl font-bold text-white">{model.healthState.label}</div>
                                <div className="mt-1 text-sm text-gray-400">{model.healthState.summary}</div>
                            </div>
                            <div className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase ${model.healthState.tone === 'critical'
                                ? 'border-red-500/25 bg-red-500/10 text-red-200'
                                : model.healthState.tone === 'warning'
                                    ? 'border-amber-500/25 bg-amber-500/10 text-amber-100'
                                    : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
                                }`}>
                                {model.snapshotChanged ? 'Cambio detectado' : 'Snapshot estable'}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Hosts visibles</div>
                            <div className="mt-2 text-3xl font-bold text-white">{model.totalHosts}</div>
                            <div className="mt-1 text-xs text-gray-500">{model.availabilityIndicator.helper}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Triggers vigilados</div>
                            <div className="mt-2 text-3xl font-bold text-white">{model.triggerCount}</div>
                            <div className="mt-1 text-xs text-gray-500">{model.triggerDensity.toFixed(1)} triggers por host</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Problemas activos</div>
                            <div className={`mt-2 text-3xl font-bold ${model.problemCount > 0 ? 'text-red-300' : 'text-emerald-300'}`}>{model.problemCount}</div>
                            <div className="mt-1 text-xs text-gray-500">Incidentes abiertos en el snapshot actual</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Eventos activos</div>
                            <div className={`mt-2 text-3xl font-bold ${model.eventCount > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>{model.eventCount}</div>
                            <div className="mt-1 text-xs text-gray-500">Actividad operacional visible en el corte</div>
                        </div>
                    </div>
                </div>
            </article>

            <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-2"><Radar className="h-5 w-5 text-red-400" /></div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Tendencia de salud NOC</h3>
                        <p className="text-sm text-gray-400">Evolucion del periodo con foco en problemas, eventos y tamaño de la superficie monitoreada.</p>
                    </div>
                </div>

                <div className="h-72 xl:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        {isSinglePointTrend ? (
                            <BarChart data={model.trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis dataKey="date" stroke="#6b7280" tickLine={false} axisLine={false} fontSize={12} />
                                <YAxis stroke="#6b7280" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{
                                        backgroundColor: '#0b1220',
                                        border: '1px solid rgba(148,163,184,0.25)',
                                        borderRadius: '10px',
                                        color: '#e2e8f0'
                                    }}
                                />
                                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                                <Bar dataKey="hosts" name="Hosts visibles" fill="#e5e7eb" radius={[6, 6, 0, 0]} maxBarSize={42} />
                                <Bar dataKey="events" name="Eventos" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={42} />
                                <Bar dataKey="problems" name="Problemas" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={42} />
                            </BarChart>
                        ) : (
                            <ComposedChart data={model.trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis dataKey="date" stroke="#6b7280" tickLine={false} axisLine={false} fontSize={12} />
                                <YAxis yAxisId="activity" stroke="#ef4444" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                                <YAxis yAxisId="hosts" orientation="right" stroke="#e5e7eb" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{
                                        backgroundColor: '#0b1220',
                                        border: '1px solid rgba(148,163,184,0.25)',
                                        borderRadius: '10px',
                                        color: '#e2e8f0'
                                    }}
                                />
                                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                                <Bar yAxisId="activity" dataKey="problems" name="Problemas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                <Bar yAxisId="activity" dataKey="events" name="Eventos" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                <Line
                                    yAxisId="hosts"
                                    type="monotone"
                                    dataKey="hosts"
                                    name="Hosts visibles"
                                    stroke="#e5e7eb"
                                    strokeWidth={2.2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 6 }}
                                />
                            </ComposedChart>
                        )}
                    </ResponsiveContainer>
                </div>

            </article>
        </section>
    );
}
