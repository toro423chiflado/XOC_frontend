import { useState, useEffect } from 'react';
import { Database, Plus, Edit2, Trash2, Search, RefreshCw, Loader2, XCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { superAdminService } from '../../../services/superadmin.service';
import type { IntegrationCapabilityTemplate } from '../../../types/superadmin';
import TemplateModal from '../TemplateModal';
import AssignCompaniesModal from '../AssignCompaniesModal';
import { Building, Users, Globe } from 'lucide-react';

function CapPills({ caps }: { caps: IntegrationCapabilityTemplate['capabilities'] }) {
    const [exp, setExp] = useState(false);
    const list: string[] = Array.isArray(caps)
        ? (caps as string[])
        : typeof caps === 'string'
            ? caps.split(',').map(c => c.trim()).filter(Boolean)
            : caps ? Object.values(caps as any) : [];

    if (!list.length) return <span className="text-gray-700 italic text-xs">—</span>;
    const shown = exp ? list : list.slice(0, 3);
    return (
        <div className="flex flex-wrap gap-1.5">
            {shown.map((c, i) => (
                <span key={i} className="text-[10px] font-black uppercase tracking-tight px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded shadow-[0_0_10px_rgba(239,68,68,0.1)]">{c}</span>
            ))}
            {list.length > 3 && (
                <button onClick={() => setExp(!exp)} className="text-[10px] text-gray-500 hover:text-red-400 font-bold flex items-center gap-0.5 transition-colors">
                    {exp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {exp ? 'MENOS' : `+${list.length - 3}`}
                </button>
            )}
        </div>
    );
}

export default function CapabilityTemplatesView() {
    const [templates, setTemplates] = useState<IntegrationCapabilityTemplate[]>([]);
    const [filtered, setFiltered] = useState<IntegrationCapabilityTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [count, setCount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [editing, setEditing] = useState<IntegrationCapabilityTemplate | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const load = async () => {
        setIsLoading(true); setError(null);
        try {
            const res = await superAdminService.getCapabilityTemplates({ include_companies: true });
            setTemplates(res.templates);
            setCount(res.count);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Error');
        } finally { setIsLoading(false); }
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        let r = [...templates];
        if (q.trim()) r = r.filter(t => t.provider.toLowerCase().includes(q.toLowerCase()) || (t.description ?? '').toLowerCase().includes(q.toLowerCase()));
        if (statusFilter === 'active') r = r.filter(t => t.is_active);
        if (statusFilter === 'inactive') r = r.filter(t => !t.is_active);
        setFiltered(r);
    }, [templates, q, statusFilter]);

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar este template?')) return;
        setDeletingId(id);
        try {
            await superAdminService.deleteCapabilityTemplate(id);
            setTemplates(prev => prev.filter(t => t.id !== id));
        } catch {
            alert('Error al eliminar.');
        } finally { setDeletingId(null); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2.5 drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <Database className="w-6 h-6 text-red-500" /> Master Directives
                    </h1>
                    <p className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">
                        {count} Plantillas base maestras (No afectadas por overrides locales)
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={load} className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => { setEditing(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl transition-all active:scale-95 shadow-[0_4px_20px_rgba(239,68,68,0.4)]"
                    >
                        <Plus className="w-4 h-4" /> NUEVA PLANTILLA
                    </button>
                </div>
            </div>

            <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input type="text" placeholder="Buscar proveedor..." value={q} onChange={e => setQ(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-red-500/40 outline-none placeholder:text-gray-600" />
                </div>
                <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs font-bold">
                    {(['all', 'active', 'inactive'] as const).map(f => (
                        <button key={f} onClick={() => setStatusFilter(f)}
                            className={cn('px-3 py-2 uppercase tracking-wider transition-colors',
                                statusFilter === f ? 'bg-red-500/20 text-red-400' : 'text-gray-600 hover:text-white hover:bg-white/5')}>
                            {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1.5fr_2fr_100px_100px_80px_100px_64px] gap-3 px-5 py-3 border-b border-white/5 bg-black/30">
                    {['Proveedor', 'Capacidades', 'Scope', 'Companies', 'Estado', 'Actualizado', ''].map(h => (
                        <span key={h} className="text-[10px] font-black uppercase tracking-widest text-gray-600">{h}</span>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-gray-600 gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Cargando...</span></div>
                ) : error ? (
                    <div className="flex items-center justify-center py-16 text-red-500/60 gap-2"><XCircle className="w-4 h-4" /><span className="text-sm">{error}</span></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-600 text-sm mb-3">{q || statusFilter !== 'all' ? 'Sin resultados' : 'No hay templates'}</p>
                        {!q && statusFilter === 'all' && (
                            <button onClick={() => { setEditing(null); setIsModalOpen(true); }} className="text-xs text-red-400 hover:underline">Crear el primero</button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.04]">
                        {filtered.map(t => (
                            <div key={t.id} className="grid grid-cols-[1.5fr_2fr_100px_100px_80px_100px_64px] gap-3 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors group">
                                <div>
                                    <p className="text-sm font-bold text-white font-mono uppercase">{t.provider}</p>
                                    {t.description && <p className="text-[10px] text-gray-600 line-clamp-1">{t.description}</p>}
                                </div>
                                <CapPills caps={t.capabilities} />
                                <div>
                                    {t.scope === 'all' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] font-black uppercase tracking-wider">
                                            <Globe className="w-3 h-3" /> ALL
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[9px] font-black uppercase tracking-wider">
                                            <Building className="w-3 h-3" /> SELECTED
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white tabular-nums">{t.assigned_companies_count}</span>
                                    <button
                                        onClick={() => { setEditing(t); setIsAssignModalOpen(true); }}
                                        className="p-1 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                                        title="Asignar empresas"
                                    >
                                        <Users className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div>
                                    {t.is_active ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-green-400 font-bold">
                                            <CheckCircle className="w-3 h-3" />Activo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-600 font-bold">
                                            <XCircle className="w-3 h-3" />Inactivo
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-600 tabular-nums">
                                    {new Date(t.updated_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                                </p>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditing(t); setIsModalOpen(true); }} className="p-1.5 text-gray-600 hover:text-white hover:bg-white/10 rounded-md transition-all">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id} className="p-1.5 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all disabled:opacity-50">
                                        {deletingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filtered.length > 0 && (
                    <div className="px-5 py-3 border-t border-white/5 bg-black/20">
                        <span className="text-[10px] text-gray-700">{filtered.length} de {count}</span>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <TemplateModal
                    isOpen={isModalOpen}
                    template={editing}
                    onClose={() => { setIsModalOpen(false); setEditing(null); }}
                    onSuccess={() => { setIsModalOpen(false); setEditing(null); load(); }}
                />
            )}

            {isAssignModalOpen && editing && (
                <AssignCompaniesModal
                    template={editing}
                    onClose={() => { setIsAssignModalOpen(false); setEditing(null); }}
                    onSuccess={() => { setIsAssignModalOpen(false); setEditing(null); load(); }}
                />
            )}
        </div>
    );
}
