import { FileSearch } from 'lucide-react';
import type { InsightvmDashboardModel } from './types';
import { formatInsightvmDate } from './utils';

export function InsightvmOperationsSection({
    model,
    onOpenScan
}: {
    model: InsightvmDashboardModel;
    onOpenScan: (id: string) => void;
}) {
    return (
        <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
            <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Resumen operativo</h3>
                        <p className="text-sm text-gray-400">Metricas globales sobre la cobertura y el riesgo de red.</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-5">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-orange-300/80">Activo de mayor prioridad</div>
                        <div className="mt-2 text-2xl font-bold text-white">{model.mostCriticalHost?.host || 'Sin identificar'}</div>
                        <div className="mt-2 text-sm text-gray-300">
                            {model.mostCriticalHost?.criticalCount || 0} hallazgos criticos asociados en el ultimo escaneo.
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Cobertura de red</div>
                            <div className="mt-2 text-2xl font-bold text-white">{model.hostCoverage}</div>
                            <div className="mt-1 text-xs text-gray-500">Endpoints unicos visibles</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Riesgo por host</div>
                            <div className="mt-2 text-2xl font-bold text-white">{model.avgRiskPerHost.toFixed(1)}</div>
                            <div className="mt-1 text-xs text-gray-500">Promedio de hallazgos por activo</div>
                        </div>
                    </div>
                </div>
            </article>

            <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Cortes recientes</h3>
                        <p className="text-sm text-gray-400">Historial de escaneos InsightVM procesados.</p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">{model.scanRows.length} cortes</div>
                </div>

                {model.scanRows.length > 0 ? (
                    <div className="space-y-3">
                        {model.scanRows.map((scan) => (
                            <div key={scan.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-white">{scan.target}</div>
                                        <div className="mt-1 text-[11px] uppercase tracking-wider text-gray-500">{formatInsightvmDate(scan.createdAt)}</div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1.5">
                                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                                            {scan.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="text-xs text-gray-400">
                                            <span className="font-bold text-white">{scan.totalFindings}</span> findings
                                        </div>
                                        {scan.cvssMax !== undefined && scan.cvssMax > 0 && (
                                            <div className="text-xs text-gray-400">
                                                CVSS <span className={`font-bold ${scan.cvssMax >= 9.0 ? 'text-red-400' : scan.cvssMax >= 7.0 ? 'text-orange-400' : 'text-amber-400'}`}>{scan.cvssMax.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => onOpenScan(scan.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/20">
                                        <FileSearch className="h-3.5 w-3.5" /> Detalle
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                        <FileSearch className="mb-3 h-8 w-8 text-gray-600" />
                        <div className="text-sm font-medium text-gray-300">No hay cortes recientes</div>
                        <div className="mt-1 text-xs text-gray-500">Los escaneos procesados apareceran aqui.</div>
                    </div>
                )}
            </article>
        </section>
    );
}
