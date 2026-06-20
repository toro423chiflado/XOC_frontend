import { Clock, RefreshCw, ShieldAlert } from 'lucide-react';
import type { NessusDashboardModel } from './types';

interface NessusHeroProps {
    model: NessusDashboardModel;
    onRefresh: () => void;
    isLoading: boolean;
    rangeControl: React.ReactNode;
}

export function NessusHero({ model, onRefresh, isLoading, rangeControl }: NessusHeroProps) {
    return (
        <section className="overflow-visible rounded-2xl border border-violet-500/25 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.2),_transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-4 md:p-5">
            <div className="space-y-3">
                <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1.6fr)_320px] xl:items-start">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="rounded-xl border border-white/10 bg-dark-card/70 p-3">
                            <img src="./tenablenesus.svg" alt="Nessus Logo" className="h-10 w-10 rounded-full object-cover" />
                        </div>
                        <div>
                            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-violet-300/80">
                                <ShieldAlert className="h-4 w-4" />
                                Vulnerability Operations Center
                            </div>
                            <h2 className="text-2xl font-bold text-white md:text-[2.1rem]">Nessus Vulnerability Intelligence</h2>
                            <p className="text-sm text-gray-400">Lectura ejecutiva de exposicion, presion critica y cobertura de escaneo con estetica operacional.</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between w-full">
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/10 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 text-violet-300 ${isLoading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                        <div className="xl:flex xl:justify-end">
                            {rangeControl}
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_320px] xl:items-stretch">
                    <article className="rounded-xl border border-white/10 bg-black/20 px-5 py-3 backdrop-blur-sm min-w-0">
                        <div className="text-xs uppercase tracking-[0.24em] text-gray-500">Resumen actual</div>
                        <div className="mt-1.5 flex items-center justify-between gap-4 min-w-0">
                            <div className="flex items-end gap-3 min-w-0 flex-1">
                                <span className="text-5xl font-bold leading-none text-white md:text-[4rem]">{model.totalFindings.toLocaleString()}</span>
                                <span className="pb-1 text-sm text-gray-400 truncate" title="hallazgos visibles">
                                    hallazgos visibles
                                </span>
                            </div>
                            <div className="hidden rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300 md:block flex-shrink-0">
                                Presion critica: {model.criticalPressure}%
                            </div>
                        </div>
                    </article>

                    <article className="rounded-xl border border-violet-500/15 bg-[linear-gradient(145deg,rgba(46,16,101,0.96),rgba(10,10,10,0.92))] px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Ultimo corte</div>
                                <div className="mt-1.5 text-[15px] font-bold text-white truncate" title={model.scanRows[0]?.target || 'Sin cortes recientes'}>
                                    {model.scanRows[0]?.target || 'Sin cortes recientes'}
                                </div>
                                <div className="mt-1 text-[11px] leading-4 text-gray-400">Estado: {model.scanRows[0]?.status || 'N/A'}</div>
                            </div>
                            <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-1.5 text-violet-300">
                                <Clock className="h-4 w-4" />
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    );
}
