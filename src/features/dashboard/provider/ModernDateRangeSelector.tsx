import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { DashboardRangePreset } from '../../../services/provider.service';

interface ModernDateRangeSelectorProps {
    preset: DashboardRangePreset;
    customFrom: string;
    customTo: string;
    onPresetChange: (preset: DashboardRangePreset) => void;
    onCustomFromChange: (value: string) => void;
    onCustomToChange: (value: string) => void;
    onApply: () => void;
    isLoading?: boolean;
    hideTitle?: boolean;
}

const QUICK_PRESETS: Array<{ value: DashboardRangePreset; label: string }> = [
    { value: 'today', label: 'Hoy (Últimas 24h)' },
    { value: 'yesterday', label: 'Ayer' },
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: 'custom', label: 'Rango Personalizado' }
];

export default function ModernDateRangeSelector({
    preset,
    customFrom,
    customTo,
    onPresetChange,
    onCustomFromChange,
    onCustomToChange,
    onApply,
    isLoading,
    hideTitle = false
}: ModernDateRangeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activePresetLabel = QUICK_PRESETS.find(p => p.value === preset)?.label || 'Seleccionar Rango';
    
    const handlePresetSelect = (p: DashboardRangePreset) => {
        onPresetChange(p);
        if (p !== 'custom') {
            setIsOpen(false);
        }
    };

    return (
        <div className="relative z-[100] sm:min-w-[230px]" ref={dropdownRef}>
            {/* Trigger Button */}
            <div className="mb-0 flex flex-col items-start gap-1.5">
                <div className="flex flex-col">
                    <span className="mb-0.5 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Control de Rango</span>
                </div>
                
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        group inline-flex h-[46px] items-center gap-3 rounded-xl border px-4 transition-all duration-300
                        ${isOpen 
                            ? 'bg-sky-500/20 border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.15)] text-sky-300' 
                            : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-300'}
                    `}
                >
                    <div className="flex items-center gap-2.5">
                        {preset === 'today' ? <Clock className="w-4 h-4 text-emerald-400" /> : <Calendar className="w-4 h-4" />}
                        <span className="text-sm font-bold tracking-tight">
                            {preset === 'custom' ? `${customFrom || '...'} → ${customTo || '...'}` : activePresetLabel}
                        </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-[min(420px,calc(100vw-2rem))] bg-[#0c0f14]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="flex h-full">
                        {/* Sidebar: Presets */}
                        <div className="w-1/2 border-r border-white/5 p-3 space-y-1 bg-black/20">
                            <div className="px-2 pb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Presets Rápidos</div>
                            {QUICK_PRESETS.map((p) => {
                                const active = preset === p.value;
                                return (
                                    <button
                                        key={p.value}
                                        onClick={() => handlePresetSelect(p.value)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left text-sm ${
                                            active 
                                            ? 'bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20' 
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                                        }`}
                                    >
                                        {p.label}
                                        {active && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content: Custom or Details */}
                        <div className="w-1/2 p-5 flex flex-col gap-4">
                            {preset === 'custom' ? (
                                <>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Rango Específico</div>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-gray-500 font-bold ml-1 uppercase">Fecha Inicio</label>
                                            <input
                                                type="date"
                                                value={customFrom}
                                                onChange={(e) => onCustomFromChange(e.target.value)}
                                                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-sky-500/50 outline-none transition-colors [color-scheme:dark]"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-gray-500 font-bold ml-1 uppercase">Fecha Fin</label>
                                            <input
                                                type="date"
                                                value={customTo}
                                                onChange={(e) => onCustomToChange(e.target.value)}
                                                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-sky-500/50 outline-none transition-colors [color-scheme:dark]"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                onApply();
                                                setIsOpen(false);
                                            }}
                                            disabled={isLoading || !customFrom || !customTo}
                                            className="w-full mt-2 py-2.5 bg-sky-500 text-white rounded-xl font-bold text-sm hover:bg-sky-400 disabled:opacity-50 disabled:bg-gray-800 transition-all shadow-[0_5px_15px_rgba(14,165,233,0.2)]"
                                        >
                                            {isLoading ? 'Actualizando...' : 'Aplicar Rango'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8">
                                    <div className="w-16 h-16 rounded-full bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                                        <Clock className="w-8 h-8 text-sky-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm">Modo Histórico Directo</h4>
                                        <p className="text-[11px] text-gray-400 mt-2 px-2">
                                            Este dashboard está ajustado para mostrar la tendencia de {activePresetLabel.toLowerCase()}.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-widest bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                                        <CheckCircle2 className="w-3 h-3" /> Estado: Live
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Info Footer */}
                    <div className="px-4 py-2 bg-white/5 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3" /> Zona horaria: UTC-5
                        </span>
                        {isLoading && (
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping"></div>
                                <span className="text-[10px] font-bold text-sky-400 italic">Sincronizando...</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
