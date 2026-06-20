import { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, Loader2, XCircle, Trash2, Search } from 'lucide-react';
import { superAdminService } from '../../../services/superadmin.service';
import type { SASession } from '../../../types/superadmin';
import CompanyFilter from '../components/CompanyFilter';
import TablePagination from '../components/TablePagination';

export default function SophiaSessionsView() {
    const [sessions, setSessions] = useState<SASession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState('');
    const [companyFilter, setCompanyFilter] = useState<number | undefined>();
    const [count, setCount] = useState(0);
    const [offset, setOffset] = useState(0);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const LIMIT = 20;

    const load = async () => {
        setIsLoading(true); setError(null);
        try {
            const res = await superAdminService.getChatSessions({
                q: q || undefined,
                company_id: companyFilter,
                limit: LIMIT,
                offset: offset,
                order: 'desc'
            });
            setSessions(res.sessions);
            setCount(res.count);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Error');
        } finally { setIsLoading(false); }
    };

    useEffect(() => { load(); }, [offset, companyFilter]);

    const deleteSession = async (id: number) => {
        if (!confirm('¿Eliminar esta sesión? Se borrará el historial local y se intentará borrar el thread remoto.')) return;
        setDeletingId(id);
        try {
            await superAdminService.deleteChatSession(id);
            setSessions(prev => prev.filter(s => s.id !== id));
            setCount(prev => prev - 1);
        } catch { alert('Error al eliminar sesión.'); }
        finally { setDeletingId(null); }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setOffset(0);
        load();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-red-500" /> Sophia Chat Sessions
                    </h1>
                    <p className="text-xs text-gray-600 mt-0.5">{count} sesiones</p>
                </div>
                <button onClick={load} className="p-2 text-gray-600 hover:text-white transition-colors">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
                <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input type="text" placeholder="Buscar por título..." value={q} onChange={e => setQ(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-red-500/40 outline-none placeholder:text-gray-600" />
                </form>

                <CompanyFilter
                    currentValue={companyFilter}
                    onSelect={(id) => { setCompanyFilter(id); setOffset(0); }}
                />

                <button onClick={() => { setOffset(0); load(); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-all">
                    Filtrar
                </button>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden mb-6">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-3 px-5 py-3 border-b border-white/5 bg-black/30">
                    {['Título / Usuario', 'Empresa', 'ID', 'Creada', ''].map(h => (
                        <span key={h} className="text-[10px] font-black uppercase tracking-widest text-gray-600">{h}</span>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-gray-600 gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Cargando...</span></div>
                ) : error ? (
                    <div className="flex items-center justify-center py-16 text-red-500/60 gap-2"><XCircle className="w-4 h-4" /><span className="text-sm">{error}</span></div>
                ) : sessions.length === 0 ? (
                    <p className="text-center py-16 text-gray-600 text-sm">Sin sesiones</p>
                ) : (
                    <div className="divide-y divide-white/[0.04]">
                        {sessions.map(s => (
                            <div key={s.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-3 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors group">
                                <div>
                                    <p className="text-sm font-bold text-white line-clamp-1">{s.title ?? 'Sin título'}</p>
                                    <p className="text-[10px] text-gray-600">{s.user?.email ?? `User #${s.user_id}`}</p>
                                </div>
                                <span className="text-xs text-gray-500">{s.company?.name ?? `#${s.company_id}`}</span>
                                <span className="text-[10px] text-gray-600 font-mono">#{s.id}</span>
                                <span className="text-[10px] text-gray-600 tabular-nums">
                                    {new Date(s.created_at).toLocaleDateString()}
                                </span>
                                <button
                                    onClick={() => deleteSession(s.id)}
                                    disabled={deletingId === s.id}
                                    className="p-1.5 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all disabled:opacity-50 opacity-0 group-hover:opacity-100"
                                >
                                    {deletingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
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
