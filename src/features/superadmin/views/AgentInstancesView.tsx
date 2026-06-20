import { useState, useEffect } from 'react';
import { Bot, RefreshCw, Loader2, XCircle, ChevronDown } from 'lucide-react';
import { superAdminService } from '../../../services/superadmin.service';
import type { SAAgentInstance } from '../../../types/superadmin';
import { cn } from '../../../lib/utils';
import CompanyFilter from '../components/CompanyFilter';
import TablePagination from '../components/TablePagination';

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'text-green-400 bg-green-500/10 border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.2)]',
    TO_PROVISION: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_12px_rgba(234,179,8,0.2)]',
    DISABLED: 'text-gray-500 bg-white/5 border-white/10 shadow-none',
};

function AgentRow({ agent }: { agent: SAAgentInstance }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <div
                className="grid grid-cols-[2fr_1fr_1fr_1fr_32px] gap-3 px-5 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div>
                    <p className="text-sm font-bold text-white font-mono">{agent.agent_type}</p>
                    <p className="text-[10px] text-gray-600">{agent.company?.name ?? `Company #${agent.company_id}`}</p>
                </div>
                <div className="self-center">
                    <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border', STATUS_COLORS[agent.status] ?? STATUS_COLORS.DISABLED)}>
                        {agent.status}
                    </span>
                </div>
                <span className="text-[10px] text-gray-600 self-center">ID: {agent.id}</span>
                <span className="text-[10px] text-gray-600 self-center tabular-nums">
                    {agent.last_used_at ? new Date(agent.last_used_at).toLocaleDateString() : '—'}
                </span>
                <ChevronDown className={cn('w-4 h-4 text-gray-600 self-center transition-transform', expanded && 'rotate-180 text-red-400')} />
            </div>

            {expanded && (
                <div className="px-5 pb-5 bg-black/20 border-b border-white/[0.04] pt-4 animate-in fade-in duration-150">
                    <div className="space-y-3">
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Credenciales técnicas</p>
                        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-400">
                            Las access keys y rotación fueron deshabilitadas en este portal.
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function AgentInstancesView() {
    const [agents, setAgents] = useState<SAAgentInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [companyFilter, setCompanyFilter] = useState<number | undefined>();
    const [count, setCount] = useState(0);
    const [offset, setOffset] = useState(0);
    const LIMIT = 20;

    const load = async () => {
        setIsLoading(true); setError(null);
        try {
            const res = await superAdminService.getAgentInstances({
                company_id: companyFilter,
                limit: LIMIT,
                offset: offset
            });
            setAgents(res.agent_instances);
            setCount(res.count);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Error al cargar');
        } finally { setIsLoading(false); }
    };

    useEffect(() => { load(); }, [offset, companyFilter]);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <Bot className="w-5 h-5 text-red-500" /> Agent Instances
                    </h1>
                    <p className="text-xs text-gray-600 mt-0.5">{count} instancias registradas</p>
                </div>
                <div className="flex items-center gap-3">
                    <CompanyFilter
                        currentValue={companyFilter}
                        onSelect={(id) => { setCompanyFilter(id); setOffset(0); }}
                    />
                    <button onClick={load} className="p-2 text-gray-600 hover:text-white transition-colors">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="bg-[#131318] border border-white/10 rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] mb-6">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_32px] gap-3 px-5 py-4 border-b border-white/5 bg-black/40">
                    {['Agente / Empresa', 'Estado', 'ID', 'Último Uso', ''].map(h => (
                        <span key={h} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{h}</span>
                    ))}
                </div>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-600 gap-4">
                        <Loader2 className="w-6 h-6 animate-spin text-red-500/50" />
                        <span className="text-sm font-bold tracking-[0.3em] uppercase">Sincronizando Instancias...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-red-500/60 gap-3">
                        <XCircle className="w-8 h-8 opacity-50 shadow-[0_0_20px_rgba(239,68,68,0.2)]" />
                        <span className="text-xs font-black uppercase tracking-widest">{error}</span>
                    </div>
                ) : agents.length === 0 ? (
                    <div className="text-center py-24">
                        <p className="text-gray-600 text-sm font-black uppercase tracking-[0.2em] italic opacity-40">No se detectaron agentes activos</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.04]">
                        {agents.map(a => <AgentRow key={a.id} agent={a} />)}
                    </div>
                )}

                <TablePagination
                    total={count}
                    limit={LIMIT}
                    offset={offset}
                    onPageChange={setOffset}
                />
            </div>
        </div>
    );
}
