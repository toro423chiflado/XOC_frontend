import { BriefcaseMedical, ShieldCheck, Siren } from 'lucide-react';
import type { OpenvasPriorityBucket } from './types';

interface OpenvasInsightsPanelProps {
    priorityBuckets: OpenvasPriorityBucket[];
}

const laneIcons = [Siren, BriefcaseMedical, ShieldCheck];

export function OpenvasInsightsPanel({ priorityBuckets }: OpenvasInsightsPanelProps) {
    const totalBacklog = priorityBuckets.reduce((sum, bucket) => sum + bucket.value, 0);

    return (
        <section>
            <article className="rounded-xl border border-dark-border bg-dark-card p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-white">Flujo recomendado</div>
                    <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-gray-400">{totalBacklog} items visibles</div>
                </div>
                <div className="space-y-4">
                    {priorityBuckets.map((bucket, index) => {
                        const Icon = laneIcons[index] || ShieldCheck;
                        return (
                            <div key={bucket.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                                            <Icon className={`h-4 w-4 ${bucket.accentClass}`} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-white">{bucket.title}</div>
                                            <div className="mt-1 text-xs leading-5 text-gray-400">{bucket.description}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-2xl font-bold ${bucket.accentClass}`}>{bucket.value}</div>
                                        <div className="mt-1 text-[11px] text-gray-500">{totalBacklog > 0 ? `${Math.round((bucket.value / totalBacklog) * 100)}% del flujo` : 'Sin volumen'}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </article>
        </section>
    );
}
