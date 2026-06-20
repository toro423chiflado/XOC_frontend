import type { NessusSummaryCard } from './types';
import { ShieldAlert, Server, Radar } from 'lucide-react';

const ICONS: Record<string, any> = {
    critical: ShieldAlert,
    hosts: Server,
    scans: Radar
};

export function NessusKpiGrid({ cards }: { cards: NessusSummaryCard[] }) {
    // If there's 3 cards, grid-cols-3 makes more sense than grid-cols-4
    return (
        <section className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => {
                const Icon = card.iconKey ? ICONS[card.iconKey] : null;
                return (
                    <article key={card.title} className="group relative overflow-hidden rounded-xl border border-dark-border bg-dark-card p-4 transition-colors hover:border-white/10 flex flex-row items-center gap-4">
                        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.glowClass}`} />
                        {Icon && (
                            <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03]">
                                <Icon className={`h-6 w-6 ${card.accentClass}`} />
                            </div>
                        )}
                        <div className="relative z-10 min-w-0 flex-1">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">{card.title}</div>
                            <div className={`mt-0.5 text-2xl font-bold leading-none ${card.accentClass}`}>{card.value}</div>
                            <p className="mt-1 truncate text-xs text-gray-400">{card.subtitle}</p>
                        </div>
                    </article>
                );
            })}
        </section>
    );
}
