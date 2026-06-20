import { useState, useEffect } from 'react';
import { Network, Search, RefreshCw, Loader2, XCircle, KeyRound, ChevronDown } from 'lucide-react';
import { superAdminService } from '../../../services/superadmin.service';
import type { SAIntegration } from '../../../types/superadmin';
import { cn } from '../../../lib/utils';
import CompanyFilter from '../components/CompanyFilter';
import TablePagination from '../components/TablePagination';

function IntegrationRow({ integration }: { integration: SAIntegration }) {
    const [expanded, setExpanded] = useState(false);
    const [creds, setCreds] = useState<Record<string, string> | null>(null);
    const [credsLoading, setCredsLoading] = useState(false);

    const viewCreds = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setCredsLoading(true);
        try {
            const res = await superAdminService.getIntegrationCredentials(integration.id);
            setCreds(res.credentials);
        } catch { alert('Error al obtener credenciales.'); }
        finally { setCredsLoading(false); }
    };

    return (
        <>
            <div
                className="grid grid-cols-[2fr_1fr_1fr_1fr_32px] gap-3 px-5 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div>
                    <p className="text-sm font-bold text-white font-mono uppercase">{integration.provider}</p>
                    <p className="text-[10px] text-gray-600">{integration.company?.name ?? `Company #${integration.company_id}`}</p>
                </div>
                <span className="text-xs text-gray-500 self-center">{integration.type ?? '—'}</span>
                <span className="text-[10px] text-gray-600 self-center">ID: {integration.id}</span>
                <span className="text-[10px] text-gray-600 self-center tabular-nums">
                    {new Date(integration.created_at).toLocaleDateString()}
                </span>
                <ChevronDown className={cn('w-4 h-4 text-gray-600 self-center transition-transform', expanded && 'rotate-180 text-red-400')} />
            </div>

            {expanded && (
                <div className="px-5 pb-5 bg-black/20 border-b border-white/[0.04] space-y-3 pt-4 animate-in fade-in duration-150">
                    {integration.capabilities && (
                        <div>
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-1">Capabilities</p>
                            <code className="text-xs text-blue-300 font-mono">{JSON.stringify(integration.capabilities)}</code>
                        </div>
                    )}
                    <div>
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-2">Credenciales (sensible)</p>
                        {creds ? (
                            <div className="space-y-1">
                                {Object.entries(creds).map(([k, v]) => (
                                    <div key={k} className="flex gap-3 text-xs">
                                        <span className="text-gray-500 w-24 flex-shrink-0 font-mono">{k}:</span>
                                        <span className="text-green-400 font-mono break-all">{v}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <button
                                onClick={viewCreds}
                                disabled={credsLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                            >
                                {credsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                                Ver credenciales
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default function IntegrationsView() {
    const [integrations, setIntegrations] = useState<SAIntegration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState('');
    const [companyFilter, setCompanyFilter] = useState<number | undefined>();
    const [count, setCount] = useState(0);
    const [offset, setOffset] = useState(0);
    const LIMIT = 20;

    const load = async () => {
        setIsLoading(true); setError(null);
        try {
            const res = await superAdminService.getIntegrations({
                provider: q || undefined,
                company_id: companyFilter,
                limit: LIMIT,
                offset: offset
            });
            setIntegrations(res.integrations);
            setCount(res.count);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Error al cargar');
        } finally { setIsLoading(false); }
    };

    useEffect(() => { load(); }, [offset, companyFilter]);

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
                        <Network className="w-5 h-5 text-red-500" /> Integraciones
                    </h1>
                    <p className="text-xs text-gray-600 mt-0.5">{count} integraciones registradas</p>
                </div>
                <button onClick={() => { setOffset(0); load(); }} className="p-2 text-gray-600 hover:text-white transition-colors">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
                <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input type="text" placeholder="Filtrar por proveedor..." value={q} onChange={e => setQ(e.target.value)}
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
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_32px] gap-3 px-5 py-4 border-b border-white/5 bg-black/40">
                    {['Proveedor / Empresa', 'Tipo', 'ID', 'Creada', ''].map(h => (
                        <span key={h} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{h}</span>
                    ))}
                </div>
                {isLoading ? (
                    <div className="flex items-center justify-center py-24 text-gray-600 gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-red-500/50" />
                        <span className="text-sm font-bold tracking-widest uppercase">Escaneando Red...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-red-500/60 gap-3">
                        <XCircle className="w-8 h-8 opacity-50" />
                        <span className="text-xs font-black uppercase tracking-widest">{error}</span>
                    </div>
                ) : integrations.length === 0 ? (
                    <div className="text-center py-24">
                        <p className="text-gray-600 text-sm font-bold uppercase tracking-widest italic opacity-50">Sin integraciones activas</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.04]">
                        {integrations.map(i => <IntegrationRow key={i.id} integration={i} />)}
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
