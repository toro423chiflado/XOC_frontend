import type { ReactNode } from 'react';
import { Clock3, RefreshCw, ShieldAlert } from 'lucide-react';

export function OpenvasHero({
    lastUpdateLabel,
    totalVulnerabilities,
    rangeControl,
    onRefresh,
    isLoading
}: {
    lastUpdateLabel: string;
    totalVulnerabilities: number;
    rangeControl: ReactNode;
    onRefresh: () => void;
    isLoading: boolean;
}) {
    return (
        <section className="overflow-visible rounded-2xl border border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-4 md:p-5">
            <div className="space-y-3">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="rounded-xl border border-white/10 bg-dark-card/70 p-3">
                            <img src="./greenbone_openvass_logo.svg" alt="OpenVAS Logo" className="h-10 w-10 object-contain" />
                        </div>
                        <div>
                            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-emerald-400/80">
                                <ShieldAlert className="h-4 w-4" />
                                Threat Exposure Command
                            </div>
                            <h2 className="text-2xl font-bold text-white md:text-[2.1rem]">OpenVAS Vulnerability Intelligence</h2>
                            <p className="text-sm text-gray-400">Cobertura, prioridad y tendencia histórica en una sola vista.</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3 xl:flex-shrink-0">
                        {rangeControl}
                        <button onClick={onRefresh} disabled={isLoading} className="inline-flex h-[46px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/10 disabled:opacity-50 sm:self-end">
                            <RefreshCw className={`h-4 w-4 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} /> Actualizar
                        </button>
                    </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_280px]">
                    <article className="rounded-xl border border-white/10 bg-black/20 px-5 py-3 backdrop-blur-sm xl:pr-4">
                        <div className="text-xs uppercase tracking-[0.24em] text-gray-500">Resumen actual</div>
                        <div className="mt-1.5 flex items-center justify-between gap-4">
                            <div className="flex items-end gap-3">
                                <span className="text-5xl font-bold leading-none text-white md:text-[4rem]">{totalVulnerabilities}</span>
                                <span className="pb-1 text-sm text-gray-400">vulnerabilidades visibles</span>
                            </div>
                            <div className="hidden rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300 md:block">
                                Cobertura histórica
                            </div>
                        </div>
                    </article>

                    <article className="rounded-xl border border-emerald-500/15 bg-[linear-gradient(145deg,rgba(10,32,20,0.96),rgba(10,10,10,0.92))] px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Última actualización</div>
                                <div className="mt-1.5 text-[15px] font-bold text-white">{lastUpdateLabel}</div>
                                <div className="mt-1 text-[11px] leading-4 text-gray-400">Procesamiento histórico más reciente.</div>
                            </div>
                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-1.5 text-emerald-300">
                                <Clock3 className="h-4 w-4" />
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    );
}
