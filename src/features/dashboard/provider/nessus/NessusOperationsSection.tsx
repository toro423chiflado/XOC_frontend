import { ChevronRight } from 'lucide-react';
import type { NessusDashboardModel } from './types';

const formatNessusDate = (dateString?: string) => {
    if (!dateString) return 'Sin registro';
    const asDate = new Date(dateString);
    if (Number.isNaN(asDate.getTime())) return dateString;
    return asDate.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export function NessusOperationsSection({
    model,
    onOpenScan
}: {
    model: NessusDashboardModel;
    onOpenScan: (id: string) => void;
}) {
    return (
        <section className="grid gap-8 xl:grid-cols-2">
            <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Resumen operativo</h3>
                        <p className="text-sm text-gray-400">Contexto general del periodo seleccionado.</p>
                    </div>
                </div>

                <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-violet-300/80">Severidad Dominante</div>
                    <div className="mt-2 text-2xl font-bold text-white">{model.dominantSeverity?.label || 'Sin dato'}</div>
                    <div className="mt-2 text-sm text-gray-300">
                        {model.criticalPressure}% del volumen total de hallazgos se concentra en severidades Críticas y Altas, representando el principal vector de riesgo.
                    </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Escaneos Completados</div>
                        <div className="mt-2 text-2xl font-bold text-emerald-300">{model.scansCompleted.toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Hosts Escaneados</div>
                        <div className="mt-2 text-2xl font-bold text-blue-300">{model.hostsScanned.toLocaleString()}</div>
                    </div>
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Share de Ruido (Bajo/Info)</div>
                        <div className="mt-2 text-2xl font-bold text-sky-300">{model.lowNoiseShare}%</div>
                </div>
            </article>

            <article className="rounded-xl border border-dark-border bg-dark-card p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Cortes recientes</h3>
                        <p className="text-sm text-gray-400">Acceso rapido a los reportes historicos.</p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">
                        {model.scanRows.length} cortes
                    </div>
                </div>

                {model.scanRows.length > 0 ? (
                    <div className="space-y-3">
                        {model.scanRows.slice(0, 4).map((scan) => (
                            <div key={scan.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-white">{scan.target}</div>
                                        <div className="mt-1 text-xs text-gray-500">{formatNessusDate(scan.createdAt)}</div>
                                    </div>
                                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold uppercase text-emerald-300">{scan.status}</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                                    <div className="flex items-center gap-3">
                                        <span>{scan.totalFindings.toLocaleString()} hallazgos</span>
                                        {scan.cvssMax !== undefined && scan.cvssMax > 0 && (
                                            <span className="rounded bg-red-500/20 px-1.5 py-0.5 font-mono text-[10px] text-red-300 border border-red-500/30">
                                                CVSS {scan.cvssMax.toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={() => onOpenScan(scan.id)} className="inline-flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-500/15">Ver detalle <ChevronRight className="h-3.5 w-3.5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-sm text-gray-500 text-center">
                        No hay cortes recientes disponibles en el periodo.
                    </div>
                )}
            </article>
        </section>
    );
}
