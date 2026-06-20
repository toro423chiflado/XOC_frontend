import { Activity, BarChart3, Clock3, Gauge, ShieldAlert, Users } from 'lucide-react';
import type { WazuhMetricCard } from './types';

const icons = [Activity, ShieldAlert, Gauge, BarChart3, Users, Clock3];
const iconStyles = [
    'border-sky-500/20 bg-sky-500/12 text-sky-300',
    'border-red-500/20 bg-red-500/12 text-red-300',
    'border-orange-500/20 bg-orange-500/12 text-orange-300',
    'border-amber-500/20 bg-amber-500/12 text-amber-300',
    'border-emerald-500/20 bg-emerald-500/12 text-emerald-300',
    'border-cyan-500/20 bg-cyan-500/12 text-cyan-300'
];

export function WazuhKpiGrid({ cards }: { cards: WazuhMetricCard[] }) {
    return (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card, index) => {
                const Icon = icons[index] || Activity;
                const iconStyle = iconStyles[index] || iconStyles[0];
                return (
                    <article key={card.title} className="group relative overflow-hidden rounded-xl border border-dark-border bg-dark-card p-3.5 transition-colors hover:border-white/10">
                        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.glowClass}`} />
                        <div className="relative">
                            <div className="flex items-start justify-between gap-3">
                                <div className="text-xs uppercase tracking-[0.22em] text-gray-500">{card.title}</div>
                                <div className={`rounded-xl border p-2 transition-all duration-300 group-hover:scale-105 ${iconStyle}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                            </div>
                            <div className={`mt-1.5 text-[1.8rem] font-bold leading-none ${card.accentClass}`}>{card.value}</div>
                            <p className="mt-1.5 text-[13px] leading-4 text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">{card.subtitle}</p>
                        </div>
                    </article>
                );
            })}
        </section>
    );
}
