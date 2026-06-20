import { Activity, Radar } from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { UptimeDashboardModel } from './types';

export function UptimeChartsSection({ model }: { model: UptimeDashboardModel }) {
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

    return (
        <section className="grid gap-8 xl:grid-cols-2">
            <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2"><Activity className="h-5 w-5 text-cyan-300" /></div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Presion de disponibilidad</h3>
                        <p className="text-sm text-gray-400">Distribucion operativa por estado de servicio en este corte.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {model.distribution.map((item) => {
                        const share = model.servicesMonitored > 0 ? Math.round((item.value / model.servicesMonitored) * 100) : 0;
                        return (
                            <div key={item.key} className={`rounded-xl border p-4 ${item.softClass}`}>
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-medium text-white">{item.label}</div>
                                        <div className="text-[11px] text-gray-500">{share}% del inventario monitoreado</div>
                                    </div>
                                    <span className={`text-lg font-bold ${item.textClass}`}>{item.value.toLocaleString()}</span>
                                </div>
                                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/30">
                                    <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: item.color }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </article>

            <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2"><Radar className="h-5 w-5 text-cyan-300" /></div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Tendencia historica</h3>
                        <p className="text-sm text-gray-400">Evolucion continua de disponibilidad y servicios caidos en el periodo seleccionado.</p>
                    </div>
                </div>


                <div className="h-72 xl:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={model.trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="date" stroke="#6b7280" tickLine={false} axisLine={false} fontSize={12} />
                            <YAxis
                                stroke="#ef4444"
                                tickLine={false}
                                axisLine={false}
                                fontSize={12}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                itemStyle={{ color: '#0f172a' }}
                                labelStyle={{ color: '#334155', fontWeight: 700 }}
                            />
                            <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                            <Area
                                type="monotone"
                                dataKey="down"
                                name="Servicios caidos"
                                stroke="#ef4444"
                                strokeWidth={2}
                                fill="#ef4444"
                                fillOpacity={0.14}
                                isAnimationActive
                                animationDuration={1000}
                                animationEasing="ease-out"
                                dot={(props) => renderAnimatedDot(props, '#ef4444')}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </article>
        </section>
    );
}
