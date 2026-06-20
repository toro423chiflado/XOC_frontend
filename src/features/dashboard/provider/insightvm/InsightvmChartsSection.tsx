import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Radar, Activity } from 'lucide-react';
import type { InsightvmDashboardModel } from './types';

export function InsightvmChartsSection({ model }: { model: InsightvmDashboardModel }) {
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

    const hasTrend = model.trendData.length >= 2 && model.trendData.some((item) => item.total > 0);
    const hasCutVolume = model.cutVolume.length > 0 && model.cutVolume.some((item) => item.total > 0);

    return (
        <section className="grid gap-8 xl:grid-cols-2">
            <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-2">
                        <Radar className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Tendencia del rango</h3>
                        <p className="text-sm text-gray-400">Volumen temporal por severidad para el rango visible.</p>
                    </div>
                </div>

                <div className="flex min-h-[390px] flex-col gap-3">
                    <div className="h-64 xl:h-72">
                        {hasTrend ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={model.trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                    <XAxis dataKey="date" stroke="#6b7280" tickLine={false} axisLine={false} fontSize={12} />
                                    <YAxis stroke="#6b7280" tickLine={false} axisLine={false} fontSize={12} />
                                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#0f172a' }} labelStyle={{ color: '#334155', fontWeight: 700 }} />
                                    {model.severityDistribution.map((item) => (
                                        <Area 
                                            key={item.key} 
                                            type="monotone" 
                                            stackId="trend" 
                                            dataKey={item.key} 
                                            name={item.label} 
                                            stroke={item.color} 
                                            strokeWidth={2} 
                                            fill={item.color} 
                                            fillOpacity={0.18} 
                                            isAnimationActive 
                                            animationDuration={900} 
                                            dot={(props) => renderAnimatedDot(props, item.color)}
                                        />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-center text-sm text-gray-500">
                                No hay suficiente historial para graficar la tendencia.
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {model.severityDistribution.map((item) => (
                            <div key={item.key} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500">{item.label}</div>
                                        <div className={`mt-1 text-xl font-bold leading-none ${item.textClass}`}>
                                            {item.value.toLocaleString()}
                                        </div>
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
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2">
                        <Activity className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Serie por corte</h3>
                        <p className="text-sm text-gray-400">
                            Volumen de hallazgos por escaneo individual.
                        </p>
                    </div>
                </div>

                <div className="flex min-h-[390px] flex-col justify-between gap-4">
                    <div className="h-72 xl:h-80">
                        {hasCutVolume ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={model.cutVolume} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                    <XAxis dataKey="tickLabel" stroke="#6b7280" tickLine={false} axisLine={false} fontSize={12} />
                                    <YAxis stroke="#6b7280" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                                    <Tooltip 
                                        contentStyle={tooltipStyle} 
                                        cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                                        formatter={(value) => [`${Number(value || 0)} hallazgos`, 'Volumen']}
                                        labelFormatter={(label, payload) => {
                                            if (payload && payload.length > 0) {
                                                return payload[0].payload.fullLabel;
                                            }
                                            return label;
                                        }}
                                    />
                                    <Bar 
                                        dataKey="total" 
                                        name="Total" 
                                        fill="#3b82f6" 
                                        radius={[4, 4, 0, 0]} 
                                        isAnimationActive
                                        animationDuration={1200}
                                        barSize={32}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-center text-sm text-gray-500">
                                No hay escaneos para mostrar volumen.
                            </div>
                        )}
                    </div>
                </div>
            </article>
        </section>
    );
}
