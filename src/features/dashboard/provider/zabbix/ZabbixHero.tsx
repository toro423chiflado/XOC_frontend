import { Activity, RefreshCw, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';

export function ZabbixHero({
    agentName,
    lastUsedLabel,
    statusLabel,
    alertsActive,
    availabilityRate,
    totalHosts,
    onlineHosts,
    criticalPressure,
    rangeControl,
    onRefresh,
    isLoading
}: {
    agentName?: string;
    lastUsedLabel: string;
    statusLabel: string;
    alertsActive: number;
    availabilityRate: number | null;
    totalHosts: number;
    onlineHosts: number;
    criticalPressure: number;
    rangeControl: ReactNode;
    onRefresh: () => void;
    isLoading: boolean;
}) {
    const normalizedStatus = statusLabel.toLowerCase();
    const statusToneClass = normalizedStatus.includes('incidente') || normalizedStatus.includes('inestable')
        ? 'border-red-500/25 bg-red-500/10 text-red-200'
        : normalizedStatus.includes('observ') || normalizedStatus.includes('mixta') || normalizedStatus.includes('sin telemetria')
            ? 'border-amber-500/25 bg-amber-500/10 text-amber-100'
            : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100';

    return (
        <section className="overflow-visible rounded-2xl border border-red-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.14),_transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-4 md:p-5">
            <div className="space-y-3">
                <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1.6fr)_320px] xl:items-start">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="rounded-xl border border-white/10 bg-dark-card/70 p-3">
                            <img src="/Zabbix_logo.svg" alt="Zabbix Logo" className="h-10 w-10 object-contain" />
                        </div>
                        <div>
                            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-red-400/80">
                                <ShieldAlert className="h-4 w-4" />
                                Monitoring Operations Center
                            </div>
                            <h2 className="text-2xl font-bold text-white md:text-[2.1rem]">Zabbix Monitoring Intelligence</h2>
                            <p className="text-sm text-gray-400">Lectura ejecutiva de disponibilidad, cobertura de hosts y presion de alertas en el entorno monitoreado.</p>
                        </div>
                    </div>

                    <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/10 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 text-red-400 ${isLoading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                        <div className="xl:flex xl:justify-end">
                            {rangeControl}
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_320px] xl:items-stretch">
                    <article className="min-w-0 rounded-xl border border-white/10 bg-black/20 px-5 py-3 backdrop-blur-sm">
                        <div className="text-xs uppercase tracking-[0.24em] text-gray-500">Disponibilidad visible</div>
                        <div className="mt-1.5 flex items-center justify-between gap-4 min-w-0">
                            <div className="flex min-w-0 flex-1 items-end gap-3">
                                <span className="text-5xl font-bold leading-none text-white md:text-[4rem]">
                                    {availabilityRate !== null ? `${availabilityRate}%` : alertsActive.toLocaleString()}
                                </span>
                                <span
                                    className="truncate pb-1 text-sm text-gray-400"
                                    title={availabilityRate !== null ? 'hosts online del inventario visible' : 'alertas activas visibles'}
                                >
                                    {availabilityRate !== null ? `${onlineHosts} de ${totalHosts} hosts online` : 'alertas activas visibles'}
                                </span>
                            </div>
                            <div className={`hidden flex-shrink-0 rounded-lg border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] md:block ${statusToneClass}`}>
                                {statusLabel}
                            </div>
                        </div>
                    </article>

                    <article className="rounded-xl border border-red-500/15 bg-[linear-gradient(145deg,rgba(69,10,10,0.96),rgba(10,10,10,0.92))] px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Impacto actual</div>
                                <div className="mt-1.5 truncate text-[15px] font-bold text-white" title={agentName || 'Sin agente visible'}>
                                    {agentName || 'Sin agente visible'}
                                </div>
                                <div className="mt-2 text-[13px] leading-4 text-gray-400">Ultimo reporte: <span className="font-medium text-gray-300">{lastUsedLabel}</span></div>
                            </div>
                            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-red-300">
                                <Activity className="h-4 w-4" />
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    );
}
