import { Radar, ScanSearch, Server } from 'lucide-react';
import type { OpenvasSummaryCard } from './types';

const icons = [Radar, Server, ScanSearch];
const iconStyles = [
    'border-red-500/20 bg-red-500/12 text-red-300 shadow-[0_0_16px_rgba(239,68,68,0.12)]',
    'border-blue-500/20 bg-blue-500/12 text-blue-300 shadow-[0_0_16px_rgba(59,130,246,0.12)]',
    'border-teal-500/20 bg-teal-500/12 text-teal-300 shadow-[0_0_16px_rgba(20,184,166,0.12)]'
];

interface OpenvasKpiGridProps {
    cards: OpenvasSummaryCard[];
}

export function OpenvasKpiGrid({ cards }: OpenvasKpiGridProps) {
    return (
        <section className="grid gap-3 md:grid-cols-3">
            {cards.map((card, index) => {
                const Icon = icons[index] || Radar;
                const iconStyle = iconStyles[index] || iconStyles[0];
                return (
                    <article key={card.title} className="group relative overflow-hidden rounded-xl border border-dark-border bg-dark-card p-4 transition-colors hover:border-white/10">
                        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50 ${card.glowClass}`} />
                        <div className="relative flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="truncate text-[10px] uppercase tracking-widest text-gray-500">{card.title}</div>
                                <div className={`mt-1.5 text-2xl font-bold ${card.accentClass}`}>{card.value}</div>
                                <p className="mt-1 truncate text-xs text-gray-400" title={card.subtitle}>{card.subtitle}</p>
                            </div>
                            <div className={`shrink-0 rounded-xl border p-2.5 transition-all duration-300 group-hover:scale-105 ${iconStyle}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                        </div>
                    </article>
                );
            })}
        </section>
    );
}
