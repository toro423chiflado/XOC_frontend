import type { DashboardRangePreset } from '../../../services/provider.service';

interface DateRangePresetControlsProps {
    preset: DashboardRangePreset;
    customFrom: string;
    customTo: string;
    onPresetChange: (preset: DashboardRangePreset) => void;
    onCustomFromChange: (value: string) => void;
    onCustomToChange: (value: string) => void;
    onApply: () => void;
    isLoading?: boolean;
}

const QUICK_PRESETS: Array<{ value: DashboardRangePreset; label: string }> = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' }
];

export default function DateRangePresetControls({
    preset,
    customFrom,
    customTo,
    onPresetChange,
    onCustomFromChange,
    onCustomToChange,
    onApply,
    isLoading
}: DateRangePresetControlsProps) {
    return (
        <section className="rounded-xl border border-dark-border bg-dark-card p-4">
            <div className="flex flex-col gap-4">
                <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-gray-500">Rango historico</div>
                    <div className="mt-2 text-sm text-gray-300">Filtra tendencias e indicadores por fecha para este dashboard.</div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                    <label className="flex flex-col gap-1 text-xs text-gray-400">
                        Preset
                        <select
                            value={preset}
                            onChange={(e) => onPresetChange(e.target.value as DashboardRangePreset)}
                            className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-gray-100 shadow-sm [color-scheme:dark] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                        >
                            <option value="today">Hoy</option>
                            <option value="yesterday">Ayer</option>
                            <option value="7d">Ultimos 7 dias</option>
                            <option value="30d">Ultimos 30 dias</option>
                            <option value="custom">Personalizado</option>
                        </select>
                    </label>

                    <div className="flex flex-wrap gap-2">
                        {QUICK_PRESETS.map((quickPreset) => {
                            const active = preset === quickPreset.value;
                            return (
                                <button
                                    key={quickPreset.value}
                                    type="button"
                                    onClick={() => onPresetChange(quickPreset.value)}
                                    className={active
                                        ? 'rounded-lg border border-sky-500/40 bg-sky-500/20 px-3 py-2 text-xs font-semibold text-sky-300'
                                        : 'rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white'}
                                >
                                    {quickPreset.label}
                                </button>
                            );
                        })}
                    </div>

                    {preset === 'custom' && (
                        <>
                            <label className="flex flex-col gap-1 text-xs text-gray-400">
                                Desde
                                <input
                                    type="date"
                                    value={customFrom}
                                    onChange={(e) => onCustomFromChange(e.target.value)}
                                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-gray-400">
                                Hasta
                                <input
                                    type="date"
                                    value={customTo}
                                    onChange={(e) => onCustomToChange(e.target.value)}
                                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={onApply}
                                disabled={isLoading}
                                className="rounded-lg border border-sky-500/30 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-300 disabled:opacity-60"
                            >
                                Aplicar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
