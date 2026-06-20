import { useState, useEffect } from 'react';
import { Ticket, RefreshCw, Loader2, XCircle, Search } from 'lucide-react';
import { superAdminService } from '../../../services/superadmin.service';
import type { SATicket } from '../../../types/superadmin';
import { cn } from '../../../lib/utils';
import CompanyFilter from '../components/CompanyFilter';
import TablePagination from '../components/TablePagination';

const STATUS_STYLES: Record<string, string> = {
    PENDING: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    EXECUTED: 'text-green-400 bg-green-500/10 border-green-500/20',
    FAILED: 'text-red-400 bg-red-500/10 border-red-500/20',
    DERIVED: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    APPROVED: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

const STATUSES = ['PENDING', 'EXECUTED', 'FAILED', 'DERIVED', 'APPROVED'];

export default function TicketsView() {
    const [tickets, setTickets] = useState<SATicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [companyFilter, setCompanyFilter] = useState<number | undefined>();
    const [count, setCount] = useState(0);
    const [offset, setOffset] = useState(0);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const LIMIT = 20;

    const load = async () => {
        setIsLoading(true); setError(null);
        try {
            const res = await superAdminService.getTickets({
                q: q || undefined,
                status: statusFilter || undefined,
                company_id: companyFilter,
                limit: LIMIT,
                offset: offset
            });
            setTickets(res.tickets);
            setCount(res.count);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Error');
        } finally { setIsLoading(false); }
    };

    useEffect(() => { load(); }, [offset, statusFilter, companyFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setOffset(0);
        load();
    };

    const updateStatus = async (id: number, status: string) => {
        setUpdatingId(id);
        try {
            const updated = await superAdminService.updateTicketStatus(id, status);
            setTickets(prev => prev.map(t => t.id === id ? { ...t, status: updated.status } : t));
        } catch { alert('Error al actualizar estado.'); }
        finally { setUpdatingId(null); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-red-500" /> Tickets (Global)
                    </h1>
                    <p className="text-xs text-gray-600 mt-0.5">{count} tickets</p>
                </div>
                <button onClick={load} className="p-2 text-gray-600 hover:text-white transition-colors">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
                <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input type="text" placeholder="Buscar por subject..." value={q} onChange={e => setQ(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-red-500/40 outline-none placeholder:text-gray-600" />
                </form>

                <CompanyFilter
                    currentValue={companyFilter}
                    onSelect={(id) => { setCompanyFilter(id); setOffset(0); }}
                />

                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setOffset(0); }}
                    className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-red-500/40">
                    <option value="">Todos los estados</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <button onClick={() => { setOffset(0); load(); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-all">
                    Filtrar
                </button>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden mb-6">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_140px] gap-3 px-5 py-3 border-b border-white/5 bg-black/30">
                    {['Subject', 'Empresa', 'Estado', 'Creado', 'Cambiar Estado'].map(h => (
                        <span key={h} className="text-[10px] font-black uppercase tracking-widest text-gray-600">{h}</span>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-gray-600 gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Cargando...</span></div>
                ) : error ? (
                    <div className="flex items-center justify-center py-16 text-red-500/60 gap-2"><XCircle className="w-4 h-4" /><span className="text-sm">{error}</span></div>
                ) : tickets.length === 0 ? (
                    <p className="text-center py-16 text-gray-600 text-sm">Sin tickets</p>
                ) : (
                    <div className="divide-y divide-white/[0.04]">
                        {tickets.map(t => (
                            <div key={t.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_140px] gap-3 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors">
                                <div>
                                    <p className="text-sm font-bold text-white line-clamp-1">{t.subject}</p>
                                    <p className="text-[10px] text-gray-600">#{t.id} · {t.creator?.username ?? 'Desconocido'}</p>
                                </div>
                                <span className="text-xs text-gray-500">{t.company?.name ?? `#${t.company_id}`}</span>
                                <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border self-center inline-block w-fit', STATUS_STYLES[t.status] ?? STATUS_STYLES.PENDING)}>
                                    {t.status}
                                </span>
                                <span className="text-[10px] text-gray-600 tabular-nums">
                                    {new Date(t.created_at).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-1">
                                    <select
                                        defaultValue={t.status}
                                        onChange={e => updateStatus(t.id, e.target.value)}
                                        disabled={updatingId === t.id}
                                        className="flex-1 bg-black/50 border border-white/10 rounded-md px-2 py-1 text-[10px] text-gray-300 outline-none focus:border-red-500/40 disabled:opacity-50"
                                    >
                                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {updatingId === t.id && <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin flex-shrink-0" />}
                                </div>
                            </div>
                        ))}
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
