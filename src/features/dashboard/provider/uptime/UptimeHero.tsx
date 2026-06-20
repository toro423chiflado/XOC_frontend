import { Activity, RefreshCw, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UptimeDashboardModel } from './types';

interface UptimeHeroProps {
    model: UptimeDashboardModel;
    onRefresh: () => void;
    isLoading: boolean;
    rangeControl: ReactNode;
}

export function UptimeHero({ model, onRefresh, isLoading, rangeControl }: UptimeHeroProps) {
    const healthToneClass = model.healthState.tone === 'critical'
        ? 'border-red-500/25 bg-red-500/10 text-red-200'
        : model.healthState.tone === 'warning'
            ? 'border-amber-500/25 bg-amber-500/10 text-amber-100'
            : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100';

    return (
        <section className="overflow-visible rounded-2xl border border-emerald-500/25 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.2),_transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-4 md:p-5">
            <div className="space-y-3">
                <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1.6fr)_320px] xl:items-start">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="rounded-xl border border-white/10 bg-dark-card/70 p-3">
                            <img src="./uptime-kuma.svg" alt="Uptime Kuma Logo" className="h-10 w-10 object-contain" />
                        </div>
                        <div>
                            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-emerald-300/80">
                                <ShieldAlert className="h-4 w-4" />
                                Availability Operations Center
                            </div>
                            <h2 className="text-2xl font-bold text-white md:text-[2.1rem]">Uptime Kuma Availability Intelligence</h2>
                            <p className="text-sm text-gray-400">Una vista ejecutiva para disponibilidad, impacto actual y estabilidad operativa del entorno monitoreado.</p>
                        </div>
                    </div>

                    <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/10 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 text-emerald-300 ${isLoading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                        <div className="xl:flex xl:justify-end">
                            {rangeControl}
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_320px] xl:items-stretch">
                    <article className="min-w-0 rounded-xl border border-white/10 bg-black/20 px-5 py-3 backdrop-blur-sm">
                        <div className="text-xs uppercase tracking-[0.24em] text-gray-500">Disponibilidad actual</div>
                        <div className="mt-1.5 flex items-center justify-between gap-4 min-w-0">
                            <div className="flex min-w-0 flex-1 items-end gap-3">
                                <span className="text-5xl font-bold leading-none text-white md:text-[4rem]">{model.uptimePercentage.toFixed(2)}%</span>
                                <span className="truncate pb-1 text-sm text-gray-400" title="Lectura del ultimo corte sincronizado">
                                    ultimo corte disponible
                                </span>
                            </div>
                            <div className={`hidden flex-shrink-0 rounded-lg border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] md:block ${healthToneClass}`}>
                                {model.healthState.label}
                            </div>
                        </div>
                        <div className="mt-3 max-w-3xl text-sm leading-6 text-gray-300">
                            {model.healthState.summary}
                        </div>
                    </article>

                    <article className="rounded-xl border border-emerald-500/15 bg-[linear-gradient(145deg,rgba(6,78,59,0.96),rgba(10,10,10,0.92))] px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Impacto actual</div>
                                <div className="mt-1.5 text-[15px] font-bold text-white truncate" title={model.mostCriticalService?.service || 'Sin monitores afectados'}>
                                    {model.mostCriticalService?.service || 'Sin monitores afectados'}
                                </div>
                                <div className="mt-1 text-[11px] leading-4 text-gray-400">{model.servicesDown.toLocaleString()} afectados de {model.servicesMonitored.toLocaleString()} monitoreados</div>
                            </div>
                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-1.5 text-emerald-300">
                                <Activity className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="mt-4">
                            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                <div className="text-[10px] uppercase tracking-[0.16em] text-gray-500">Ultima sincronizacion</div>
                                <div className="mt-1 text-sm font-bold text-white">{model.dataFreshnessLabel}</div>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    );
}
