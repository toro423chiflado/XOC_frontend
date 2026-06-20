import { useMemo } from 'react';
import { BarChart3, ChevronRight, Clock3, Globe2, Radar, Server, Target } from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import type { OpenvasCutVolumeDatum, OpenvasFindingItem, OpenvasHostItem, OpenvasSeverityDatum, OpenvasTrendDatum } from './types';
import { formatOpenvasDate, getSeverityMeta } from './utils';

interface OpenvasExposureSectionProps {
    severityDistribution: OpenvasSeverityDatum[];
    trendData: OpenvasTrendDatum[];
    cutVolume: OpenvasCutVolumeDatum[];
    hostExposure: OpenvasHostItem[];
    recentFindings: OpenvasFindingItem[];
    selectedHost: OpenvasHostItem | null;
    onSelectHost: (host: OpenvasHostItem) => void;
}

export function OpenvasExposureSection({
    severityDistribution,
    trendData,
    cutVolume,
    hostExposure,
    recentFindings,
    selectedHost,
    onSelectHost
}: OpenvasExposureSectionProps) {
    const detailHost = selectedHost || hostExposure[0] || null;
    
    const hasCutData = cutVolume.length > 0;
    const totalScans = cutVolume.length;
    const medianEventsPerCut = useMemo(() => {
        if (!hasCutData) return 0;
        const sorted = [...cutVolume].sort((a, b) => a.total - b.total);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid].total : (sorted[mid - 1].total + sorted[mid].total) / 2;
    }, [cutVolume, hasCutData]);

    const activeTrendSeries = severityDistribution.filter((item) =>
        trendData.some((day) => Number(day[item.key]) > 0)
    );
    const hostMaxRisk = Math.max(...hostExposure.map((host) => host.weightedRisk), 1);
    const trendTotalsBySeverity = useMemo(
        () => activeTrendSeries.map((item) => ({
            ...item,
            total: trendData.reduce((sum, day) => sum + Number(day[item.key] || 0), 0),
            activeDays: trendData.reduce((count, day) => count + (Number(day[item.key] || 0) > 0 ? 1 : 0), 0)
        })),
        [activeTrendSeries, trendData]
    );
    const totalTrendAccumulated = trendTotalsBySeverity.reduce((sum, item) => sum + item.total, 0);
    const tooltipStyle = {
        backgroundColor: '#f8fafc',
        border: '1px solid rgba(15,23,42,0.12)',
        borderRadius: '12px',
        color: '#0f172a',
        boxShadow: '0 18px 40px rgba(15,23,42,0.28)'
    };

    const renderCompactLegend = (
        item: { key: string; label: string; color: string; textClass: string },
        value: number,
        helper?: string
    ) => (
        <div key={item.key} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <div>
                    <div className="text-sm font-medium text-white">{item.label}</div>
                    {helper ? <div className="text-[11px] text-gray-500">{helper}</div> : null}
                </div>
            </div>
            <span className={`text-sm font-bold ${item.textClass}`}>{value}</span>
        </div>
    );

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
        <section className="space-y-8">
            <div className="grid gap-8 xl:grid-cols-2">
                <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2">
                            <BarChart3 className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Serie por corte</h3>
                            <p className="text-sm text-gray-400">Comportamiento real de cada sincronizacion y volumen de findings.</p>
                        </div>
                    </div>

                    <div className="flex min-h-[430px] flex-col justify-between gap-6">
                        <div className="relative h-72 xl:h-80">
                            {hasCutData ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cutVolume} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                        <XAxis dataKey="id" tickFormatter={(idVal) => cutVolume.find((item) => item.id === idVal)?.tickLabel || ''} stroke="#6b7280" tickLine={false} axisLine={false} fontSize={12} minTickGap={24} />
                                        <YAxis stroke="#6b7280" tickLine={false} axisLine={false} fontSize={12} />
                                        <Tooltip labelFormatter={(idVal) => cutVolume.find((item) => item.id === idVal)?.fullLabel || String(idVal)} contentStyle={tooltipStyle} itemStyle={{ color: '#0f172a' }} labelStyle={{ color: '#334155', fontWeight: 700 }} />
                                        <Bar dataKey="total" name="Hallazgos" fill="#10b981" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-center text-sm text-gray-500">
                                    No hay cortes suficientes para construir la serie de volumen.
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                                <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500">Cortes visibles</div>
                                <div className="mt-1 text-xl font-bold leading-none text-white">{totalScans.toLocaleString()}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                                <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500">Mediana de findings por corte</div>
                                <div className="mt-1 text-xl font-bold leading-none text-white">{medianEventsPerCut.toLocaleString('es-ES', { maximumFractionDigits: 1 })}</div>
                            </div>
                        </div>
                    </div>
                </article>

                <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                            <Radar className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Tendencia de exposicion</h3>
                            <p className="text-sm text-gray-400">Serie historica para detectar crecimiento o contencion por severidad.</p>
                        </div>
                    </div>

                    <div className="flex min-h-[430px] flex-col justify-between gap-4">
                        <div className="relative h-72 xl:h-80">
                            {trendData.length >= 2 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                        <XAxis dataKey="date" stroke="#6b7280" tickLine={false} axisLine={false} fontSize={12} />
                                        <YAxis stroke="#6b7280" tickLine={false} axisLine={false} fontSize={12} />
                                        <Tooltip
                                            contentStyle={tooltipStyle}
                                            itemStyle={{ color: '#0f172a' }}
                                            labelStyle={{ color: '#334155', fontWeight: 700 }}
                                        />
                                        {activeTrendSeries.map((item) => (
                                            <Area
                                                key={item.key}
                                                type="monotone"
                                                dataKey={item.key}
                                                name={item.label}
                                                stroke={item.color}
                                                strokeWidth={2}
                                                fill={item.color}
                                                fillOpacity={0.14}
                                                stackId="severity"
                                                isAnimationActive
                                                animationDuration={1000}
                                                animationEasing="ease-out"
                                                dot={(props) => renderAnimatedDot(props, item.color)}
                                            />
                                        ))}
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-center text-sm text-gray-500">
                                    Se necesitan al menos dos puntos historicos para mostrar una tendencia fiable.
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-4">
                            {trendTotalsBySeverity.map((item) => {
                                const share = totalTrendAccumulated > 0 ? Math.round((item.total / totalTrendAccumulated) * 100) : 0;
                                const helper = item.total > 0
                                    ? `${share}% del total`
                                    : '0%';

                                return renderCompactLegend(item, item.total, helper);
                            })}
                        </div>
                    </div>
                </article>
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.95fr)]">
                <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Mapa de activos prioritarios</h3>
                            <p className="text-sm text-gray-400">Top hosts por riesgo ponderado para acelerar drill-down y triage.</p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">{hostExposure.length} activos visibles</div>
                    </div>

                    {hostExposure.length > 0 ? (
                        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                            {hostExposure.map((host) => {
                                const selected = detailHost?.host === host.host;
                                const riskWidth = `${(host.weightedRisk / hostMaxRisk) * 100}%`;
                                const riskColor = host.critical > 0 ? '#ef4444' : host.high > 0 ? '#f97316' : '#10b981';
                                const showSeverityBreakdown = host.hasSeverityBreakdown;

                                return (
                                    <button
                                        key={host.host}
                                        onClick={() => onSelectHost(host)}
                                        className={`w-full rounded-xl border p-5 text-left transition-colors ${selected ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'}`}
                                    >
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-lg font-semibold text-white">{host.host}</div>
                                                        <div className="mt-1 text-sm text-gray-500">{host.totalFindings} hallazgos consolidados</div>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
                                                </div>

                                                <div className="mt-4 space-y-2">
                                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                                        <span>{showSeverityBreakdown ? 'Riesgo ponderado' : 'Severidad'}</span>
                                                        <span className="font-semibold text-white">{showSeverityBreakdown ? host.weightedRisk : 'Sin desglose'}</span>
                                                    </div>
                                                    <div className="h-2.5 overflow-hidden rounded-full bg-black/30">
                                                        {showSeverityBreakdown ? (
                                                            <div className="h-full rounded-full" style={{ width: riskWidth, backgroundColor: riskColor }} />
                                                        ) : (
                                                            <div className="h-full rounded-full bg-white/10" style={{ width: '100%' }} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {showSeverityBreakdown ? (
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 xl:justify-end">
                                                    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-red-300">C {host.critical}</span>
                                                    <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-1 text-orange-300">H {host.high}</span>
                                                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-300">M {host.medium}</span>
                                                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-300">L {host.low}</span>
                                                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-blue-300">I {host.info}</span>
                                                </div>
                                            ) : (
                                                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-gray-400 xl:justify-end">
                                                    Sin desglose de severidad disponible
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-sm text-gray-500">
                            No hay suficiente contexto por host para construir el mapa de activos.
                        </div>
                    )}
                </article>

                <article className="self-start rounded-xl border border-dark-border bg-dark-card p-7">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                            <Target className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Detalle del activo seleccionado</h3>
                            <p className="text-sm text-gray-400">Detalle operativo pensado para entender flujo, severidad y siguientes acciones.</p>
                        </div>
                    </div>

                    {detailHost ? (
                        <div className="space-y-5">
                            <div className="rounded-xl border border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(255,255,255,0.02))] p-5">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.22em] text-emerald-400/80">Activo seleccionado</div>
                                        <div className="mt-2 text-2xl font-bold text-white">{detailHost.host}</div>
                                        <div className="mt-2 text-sm text-gray-300">{detailHost.totalFindings} hallazgos agregados con riesgo ponderado {detailHost.weightedRisk}.</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 xl:min-w-[220px]">
                                        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                                            <div className="text-xs uppercase tracking-[0.2em] text-gray-500">CVSS max</div>
                                            <div className="mt-1 text-2xl font-bold text-white">{detailHost.maxCvss ? detailHost.maxCvss.toFixed(1) : '—'}</div>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                                            <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Findings</div>
                                            <div className="mt-1 text-2xl font-bold text-white">{detailHost.totalFindings}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
                                <div className="grid grid-cols-2 gap-4">
                                    {(['critical', 'high', 'medium', 'low', 'info'] as const).map((severity) => {
                                        const meta = getSeverityMeta(severity);
                                        return (
                                            <div key={severity} className={`rounded-xl border p-3 ${meta.softClass}`}>
                                                <div className="text-xs uppercase tracking-[0.2em] text-gray-500">{meta.label}</div>
                                                <div className={`mt-2 text-2xl font-bold ${meta.textClass}`}>{detailHost[severity]}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                                        <Globe2 className="h-4 w-4 text-emerald-400" />
                                        Hallazgos mas representativos
                                    </div>
                                    {detailHost.topFindings.length > 0 ? (
                                        <div className="space-y-3">
                                            {detailHost.topFindings.map((finding) => {
                                                const meta = getSeverityMeta(finding.severity);
                                                return (
                                                    <div key={finding.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <div className="text-sm font-medium text-white">{finding.name}</div>
                                                                <div className="mt-1 text-xs text-gray-500">{finding.cve || 'Sin CVE'} {finding.detectedAt ? `• ${formatOpenvasDate(finding.detectedAt)}` : ''}</div>
                                                            </div>
                                                            <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase ${meta.badgeClass}`}>{meta.label}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex min-h-[160px] items-center rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-gray-500">
                                            No hay findings suficientes para poblar el panel de detalle.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-400">
                                <div className="mb-2 font-semibold text-white">Ultima observacion</div>
                                {detailHost.lastSeen ? formatOpenvasDate(detailHost.lastSeen) : 'Sin timestamp disponible'}
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full min-h-72 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-center text-sm text-gray-500">
                            Selecciona un activo para inspeccionar su contexto operativo.
                        </div>
                    )}
                </article>
            </div>
        </section>
    );
}
