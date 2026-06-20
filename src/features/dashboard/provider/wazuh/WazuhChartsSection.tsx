import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, Radar } from 'lucide-react';
import type { WazuhDashboardModel } from './types';

export function WazuhChartsSection({ model }: { model: WazuhDashboardModel }) {
    const tooltipStyle = {
        backgroundColor: '#f8fafc',
        border: '1px solid rgba(15,23,42,0.12)',
        borderRadius: '12px',
        color: '#0f172a',
        boxShadow: '0 18px 40px rgba(15,23,42,0.28)'
    };

    const renderAnimatedDot = (props: any, color: string) => {
        const { cx, cy, value } = props;
        if (typeof cx !== 'number' || typeof cy !== 'number' || Number(value || 0) <= 0) return null;

        return (
            <g>
                <circle cx={cx} cy={cy} r={6} fill={color} opacity={0.18}>
                    <animate attributeName="r" values="4;8;4" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.18;0.05;0.18" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <circle cx={cx} cy={cy} r={3.5} fill={color} stroke="#0b0f14" strokeWidth={1.5} />
            </g>
        );
    };

    const hasTrendData = model.analytics.trend.some((day) => day.total > 0);
    const hasCutData = model.historical.cutVolume.some((item) => item.total > 0);

    return (
        <section className="grid gap-8 xl:grid-cols-2">
            <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-2"><Radar className="h-5 w-5 text-sky-400" /></div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Tendencia del rango</h3>
                        <p className="text-sm text-gray-400">Volumen temporal por severidad para {model.rangeLabel.toLowerCase()}.</p>
                    </div>
                </div>

                <div className="flex min-h-[390px] flex-col gap-3">
                    <div className="h-64 xl:h-72">
                        {hasTrendData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={model.analytics.trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                    <XAxis dataKey="label" stroke="#6b7280" tickLine={false} axisLine={false} fontSize={12} />
                                    <YAxis stroke="#6b7280" tickLine={false} axisLine={false} fontSize={12} />
                                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#0f172a' }} labelStyle={{ color: '#334155', fontWeight: 700 }} />
                                    {model.historical.severityDistribution.map((item) => (
                                        <Area key={item.key} type="monotone" stackId="trend" dataKey={item.key} name={item.label} stroke={item.color} strokeWidth={2} fill={item.color} fillOpacity={0.18} isAnimationActive animationDuration={900} dot={(props) => renderAnimatedDot(props, item.color)} />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-center text-sm text-gray-500">No hay suficiente historial para graficar la tendencia.</div>
                        )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {model.historical.severityDistribution.map((item) => (
                            <div key={item.key} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500">{item.label}</div>
                                        <div className={`mt-1 text-xl font-bold leading-none ${item.textClass}`}>{item.value.toLocaleString()}</div>
                                    </div>
                                    <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </article>

            <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-2"><BarChart3 className="h-5 w-5 text-sky-400" /></div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Serie por corte</h3>
                        <p className="text-sm text-gray-400">Comportamiento real de cada sincronizacion y estabilidad del pipeline.</p>
                    </div>
                </div>

                <div className="flex min-h-[390px] flex-col gap-3">
                    <div className="h-64 xl:h-72">
                        {hasCutData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={model.historical.cutVolume} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                    <XAxis dataKey="label" tickFormatter={(_, index) => model.historical.cutVolume[index]?.tickLabel || ''} stroke="#6b7280" tickLine={false} axisLine={false} fontSize={12} minTickGap={24} />
                                    <YAxis stroke="#6b7280" tickLine={false} axisLine={false} fontSize={12} />
                                    <Tooltip labelFormatter={(label) => model.historical.cutVolume.find((item) => item.label === label)?.fullLabel || String(label)} contentStyle={tooltipStyle} itemStyle={{ color: '#0f172a' }} labelStyle={{ color: '#334155', fontWeight: 700 }} />
                                    <Bar dataKey="total" name="Eventos" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-center text-sm text-gray-500">No hay cortes suficientes para construir la serie de volumen.</div>
                        )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500">Cortes visibles</div>
                            <div className="mt-1 text-xl font-bold leading-none text-white">{model.historical.totalScans.toLocaleString()}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500">Mediana por corte</div>
                            <div className="mt-1 text-xl font-bold leading-none text-white">{model.historical.medianEventsPerCut.toLocaleString('es-ES', { maximumFractionDigits: 1 })}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500">Ruido bajo + info</div>
                            <div className="mt-1 text-xl font-bold leading-none text-white">{model.historical.noiseSharePct}%</div>
                        </div>
                    </div>
                </div>
            </article>
        </section>
    );
}
