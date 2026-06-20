import type { ReactNode } from 'react';
import { Clock3, RefreshCw, ShieldAlert } from 'lucide-react';
import type { WazuhDashboardModel } from './types';

interface WazuhHeroProps {
    model: WazuhDashboardModel;
    rangeControl: ReactNode;
    onRefresh: () => void;
    isLoading: boolean;
}

export function WazuhHero({ model, rangeControl, onRefresh, isLoading }: WazuhHeroProps) {
    return (
        <section className="overflow-visible rounded-2xl border border-sky-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),_transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 md:p-5">
            <div className="space-y-3">
                <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px] xl:items-start xl:gap-3">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center xl:col-span-2">
                        <div className="rounded-xl border border-white/10 bg-dark-card/70 p-3">
                            <img src="./wazuuu.svg" alt="Wazuh Logo" className="h-10 w-10 object-contain rounded-full" />
                        </div>
                        <div>
                            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-sky-400/80">
                                <ShieldAlert className="h-4 w-4" />
                                Wazuh Security Operations
                            </div>
                            <h2 className="text-2xl font-bold text-white md:text-[2.1rem]">Wazuh Security Event Intelligence</h2>
                            <p className="text-sm text-gray-400">Tendencia, concentracion y evidencia operativa por ventanas de deteccion.</p>
                        </div>
                    </div>

                    <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/10 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 text-sky-400 ${isLoading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                        <div className="xl:flex xl:justify-end">
                            {rangeControl}
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px] xl:items-stretch">
                    <div className="grid gap-3 md:grid-cols-2 xl:col-span-2">
                        <article className="flex flex-col justify-between rounded-xl border border-sky-500/15 bg-black/20 px-5 py-3 backdrop-blur-sm min-w-0">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Estado live</div>
                                    <div className="mt-1.5 truncate text-[15px] font-bold text-white" title={model.integrationStatus.agentNameLabel}>
                                        {model.integrationStatus.agentNameLabel}
                                    </div>
                                </div>
                                <div className="flex-shrink-0 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                                    {model.integrationStatus.managerStatusLabel}
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-300">
                                <div className="rounded-lg border border-white/10 bg-black/20 p-2.5">
                                    <div className="text-[10px] uppercase tracking-[0.16em] text-gray-500">Activos</div>
                                    <div className="mt-1 text-[1.35rem] font-bold leading-none text-white">{Number(model.integrationStatus.activeAgents || 0).toLocaleString()}</div>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-black/20 p-2.5">
                                    <div className="text-[10px] uppercase tracking-[0.16em] text-gray-500">Inactivos</div>
                                    <div className="mt-1 text-[1.35rem] font-bold leading-none text-white">{Number(model.integrationStatus.inactiveAgents || 0).toLocaleString()}</div>
                                </div>
                            </div>
                        </article>

                        <article className="flex flex-col justify-between rounded-xl border border-sky-500/15 bg-black/20 px-5 py-3 backdrop-blur-sm min-w-0">
                            <div>
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Regla dominante del ultimo snapshot</div>
                                <div className="mt-1.5 text-[1.45rem] font-bold leading-snug text-white">{model.hero.dominantRuleName}</div>
                            </div>
                            <div className="mt-3 text-sm text-gray-400">{model.hero.dominantRuleCount.toLocaleString()} eventos asociados</div>
                        </article>
                    </div>

                    <article className="rounded-xl border border-sky-500/15 bg-[linear-gradient(145deg,rgba(8,47,73,0.96),rgba(10,10,10,0.92))] px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Ultimo corte procesado</div>
                                <div className="mt-1.5 text-[15px] font-bold text-white">{model.hero.latestCutLabel}</div>
                                <div className="mt-1 text-[11px] leading-4 text-gray-400">{model.hero.latestCutEvents.toLocaleString()} eventos en el snapshot.</div>
                            </div>
                            <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-1.5 text-sky-300">
                                <Clock3 className="h-4 w-4" />
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    );
}
