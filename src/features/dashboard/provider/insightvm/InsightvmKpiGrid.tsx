import { Activity, AlertTriangle, ScanSearch, Server } from 'lucide-react';
import type { InsightvmSummaryCard } from './types';

const icons = [AlertTriangle, AlertTriangle, Server, ScanSearch];
const iconStyles = [
    'border-blue-500/20 bg-blue-500/12 text-blue-300 shadow-[0_0_24px_rgba(59,130,246,0.12)]',
    'border-orange-500/20 bg-orange-500/12 text-orange-300 shadow-[0_0_24px_rgba(249,115,22,0.12)]',
    'border-sky-500/20 bg-sky-500/12 text-sky-300 shadow-[0_0_24px_rgba(14,165,233,0.12)]',
    'border-emerald-500/20 bg-emerald-500/12 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.12)]'
];

export function InsightvmKpiGrid({ cards }: { cards: InsightvmSummaryCard[] }) {
    return (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card, index) => {
                const Icon = icons[index] || Activity;
                return (
                    <article key={card.title} className="group relative overflow-hidden rounded-xl border border-dark-border bg-dark-card p-4 transition-colors hover:border-white/10">
                        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.glowClass}`} />
                        <div className="relative flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="truncate text-[10px] uppercase tracking-widest text-gray-500">{card.title}</div>
                                <div className={`mt-1.5 text-2xl font-bold ${card.accentClass}`}>{card.value}</div>
                                <p className="mt-1 truncate text-xs text-gray-400" title={card.subtitle}>{card.subtitle}</p>
                            </div>
                            <div className={`shrink-0 rounded-xl border p-2.5 transition-all duration-300 group-hover:scale-105 ${iconStyles[index] || iconStyles[0]}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                        </div>
                    </article>
                );
            })}
        </section>
    );
}
