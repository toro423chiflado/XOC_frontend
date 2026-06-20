import { AlertCircle, Server, TrendingUp, Activity } from 'lucide-react';
import type { ZabbixSummaryCard } from './types';

const icons = [Server, AlertCircle, Activity, TrendingUp];
const iconStyles = [
    'border-red-500/20 bg-red-500/12 text-red-300 shadow-[0_0_24px_rgba(239,68,68,0.12)]',
    'border-orange-500/20 bg-orange-500/12 text-orange-300 shadow-[0_0_24px_rgba(249,115,22,0.12)]',
    'border-emerald-500/20 bg-emerald-500/12 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.12)]',
    'border-blue-500/20 bg-blue-500/12 text-blue-300 shadow-[0_0_24px_rgba(59,130,246,0.12)]'
];

export function ZabbixKpiGrid({ cards }: { cards: ZabbixSummaryCard[] }) {
    return (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card, index) => {
                const Icon = icons[index] || Server;
                return (
                    <article key={card.title} className="group relative overflow-hidden rounded-xl border border-dark-border bg-dark-card p-5 transition-colors hover:border-white/10">
                        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.glowClass}`} />
                        <div className="relative flex items-start justify-between gap-3">
                            <div>
                                <div className="text-xs uppercase tracking-[0.22em] text-gray-500">{card.title}</div>
                                <div className={`mt-3 text-3xl font-bold ${card.accentClass}`}>{card.value}</div>
                                <p className="mt-2 text-sm leading-6 text-gray-400">{card.subtitle}</p>
                            </div>
                            <div className={`rounded-xl border p-3 transition-all duration-300 group-hover:scale-105 ${iconStyles[index] || iconStyles[0]}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                        </div>
                    </article>
                );
            })}
        </section>
    );
}
