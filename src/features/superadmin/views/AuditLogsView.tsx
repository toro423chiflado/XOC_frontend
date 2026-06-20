import { useState, useEffect } from 'react';
import { ScrollText, RefreshCw, Loader2, XCircle } from 'lucide-react';
import { superAdminService } from '../../../services/superadmin.service';
import type { AuditLog } from '../../../types/superadmin';
import CompanyFilter from '../components/CompanyFilter';
import TablePagination from '../components/TablePagination';

const ACTION_COLORS: Record<string, string> = {
    CREATE: 'text-green-400',
    UPDATE: 'text-blue-400',
    DELETE: 'text-red-400',
    READ: 'text-gray-400',
};

export default function AuditLogsView() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [companyFilter, setCompanyFilter] = useState<number | undefined>();
    const [count, setCount] = useState(0);
    const [offset, setOffset] = useState(0);
    const LIMIT = 20;

    const load = async () => {
        setIsLoading(true); setError(null);
        try {
            const res = await superAdminService.getAuditLogs({
                company_id: companyFilter,
                limit: LIMIT,
                offset: offset
            });
            setLogs(res.audit_logs);
            setCount(res.count);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Error');
        } finally { setIsLoading(false); }
    };

    useEffect(() => { load(); }, [offset, companyFilter]);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <ScrollText className="w-5 h-5 text-red-500" /> Audit Logs
                    </h1>
                    <p className="text-xs text-gray-600 mt-0.5">{count} eventos registrados</p>
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

            <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden mb-6">
                <div className="grid grid-cols-[80px_2fr_1fr_1fr_1fr] gap-3 px-5 py-3 border-b border-white/5 bg-black/30">
                    {['Acción', 'Entidad', 'Actor', 'Empresa', 'Fecha'].map(h => (
                        <span key={h} className="text-[10px] font-black uppercase tracking-widest text-gray-600">{h}</span>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-gray-600 gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Cargando...</span></div>
                ) : error ? (
                    <div className="flex items-center justify-center py-16 text-red-500/60 gap-2"><XCircle className="w-4 h-4" /><span className="text-sm">{error}</span></div>
                ) : logs.length === 0 ? (
                    <p className="text-center py-16 text-gray-600 text-sm">Sin registros</p>
                ) : (
                    <div className="divide-y divide-white/[0.04]">
                        {logs.map(log => (
                            <div key={log.id} className="grid grid-cols-[80px_2fr_1fr_1fr_1fr] gap-3 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors">
                                <span className={`text-[10px] font-black uppercase ${ACTION_COLORS[log.action] ?? 'text-gray-400'}`}>
                                    {log.action}
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-white">{log.entity_type ?? '—'}</p>
                                    {log.entity_id && <p className="text-[10px] text-gray-600">ID: {log.entity_id}</p>}
                                </div>
                                <span className="text-xs text-gray-500">{log.actor?.username ?? '—'}</span>
                                <span className="text-xs text-gray-500">{log.company?.name ?? '—'}</span>
                                <span className="text-[10px] text-gray-600 tabular-nums">
                                    {new Date(log.created_at).toLocaleString('es', {
                                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
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
