import { useState, useEffect } from 'react';
import { Building2, Search, RefreshCw, Loader2, XCircle, Edit2, Check, X, Network, Database, ChevronRight, Plus } from 'lucide-react';
import { superAdminService } from '../../../services/superadmin.service';
import type { Company, CompanyDetail, PlanStatus } from '../../../types/superadmin';
import CompanyIntegrationsPanel from './CompanyIntegrationsPanel';
import CompanyTemplatesPanel from './CompanyTemplatesPanel';
import { cn } from '../../../lib/utils';

const parseApiError = (error: any, fallback: string) => {
    const status = error?.response?.status;
    const detail = error?.response?.data?.message || error?.response?.data?.error || error?.message;
    if (status === 409) return detail || 'Conflicto: nombre de empresa duplicado.';
    if (status === 403) return detail || 'Accion no permitida por politica de seguridad.';
    if (status === 404) return detail || 'Empresa no encontrada.';
    if (status === 410) return 'Esta funcionalidad legacy fue deshabilitada.';
    return detail || fallback;
};

function StatBadge({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex flex-col items-center bg-white/[0.05] border border-white/10 rounded-lg px-4 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            <span className="text-lg font-black text-white tabular-nums">{value}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{label}</span>
        </div>
    );
}

const PLAN_STATUS_OPTIONS: { value: PlanStatus; label: string }[] = [
    { value: 'DEMO', label: 'Demo' },
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'EXPIRED', label: 'Expirado' },
    { value: 'INACTIVE', label: 'Inactivo' }
];

const planStatusStyles: Record<PlanStatus, string> = {
    DEMO: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)]',
    ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.15)]',
    EXPIRED: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
    INACTIVE: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
};

function CompanyDetailPanel({ id, onClose }: { id: number; onClose: () => void }) {
    const [detail, setDetail] = useState<CompanyDetail | null>(null);
    const [capsSummary, setCapsSummary] = useState<{ capabilities: string[]; count: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [activeTab, setActiveTab] = useState<'info' | 'integrations' | 'templates'>('info');
    const [planStatus, setPlanStatus] = useState<PlanStatus>('INACTIVE');
    const [planStatusSaving, setPlanStatusSaving] = useState(false);
    const [planStatusError, setPlanStatusError] = useState<string | null>(null);
    const [planStatusSuccess, setPlanStatusSuccess] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            superAdminService.getCompanyById(id),
            superAdminService.getCompanyCapabilitiesSummary(id, { include_integrations: false })
        ]).then(([d, caps]) => {
            setDetail(d);
            setNewName(d.name);
            setPlanStatus(d.plan_status);
            setCapsSummary(caps);
            setPlanStatusError(null);
            setPlanStatusSuccess(null);
        }).finally(() => setIsLoading(false));
    }, [id]);

    const saveName = async () => {
        if (!detail || !newName.trim()) return;
        await superAdminService.updateCompany(detail.id, { name: newName });
        setDetail(prev => prev ? { ...prev, name: newName } : prev);
        setEditingName(false);
    };

    const handlePlanStatusSave = async () => {
        if (!detail || planStatusSaving || planStatus === detail.plan_status) return;
        setPlanStatusSaving(true);
        setPlanStatusError(null);
        setPlanStatusSuccess(null);
        try {
            await superAdminService.updateCompany(detail.id, { plan_status: planStatus });
            setDetail(prev => prev ? { ...prev, plan_status: planStatus } : prev);
            setPlanStatusSuccess('Plan status actualizado');
            window.setTimeout(() => setPlanStatusSuccess(null), 2500);
        } catch (err: any) {
            setPlanStatusError(err.response?.data?.error || 'Error al actualizar plan status');
        } finally {
            setPlanStatusSaving(false);
        }
    };

    return (
        <div className="bg-[#1a1a20] border border-white/10 rounded-xl p-0 mt-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.3)] overflow-hidden">
            {/* Header Tabs */}
            <div className="flex items-center px-4 pt-4 border-b border-white/[0.06] bg-black/20">
                <button
                    onClick={() => setActiveTab('info')}
                    className={cn(
                        "px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all",
                        activeTab === 'info' ? "border-red-500 text-red-500" : "border-transparent text-gray-500 hover:text-gray-300"
                    )}
                >
                    Información General
                </button>
                <button
                    onClick={() => setActiveTab('integrations')}
                    className={cn(
                        "px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all flex items-center gap-2",
                        activeTab === 'integrations' ? "border-red-500 text-red-500" : "border-transparent text-gray-500 hover:text-gray-300"
                    )}
                >
                    <Network className="w-3.5 h-3.5" />
                    Integraciones & Caps
                </button>
                <button
                    onClick={() => setActiveTab('templates')}
                    className={cn(
                        "px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all flex items-center gap-2",
                        activeTab === 'templates' ? "border-red-500 text-red-500" : "border-transparent text-gray-500 hover:text-gray-300"
                    )}
                >
                    <Database className="w-3.5 h-3.5" />
                    Directivas (Templates)
                </button>
                <div className="flex-1" />
                <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors mb-2"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6">
                {isLoading ? (
                    <div className="flex items-center gap-2 text-gray-500 py-8"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Cargando datos empresa...</span></div>
                ) : detail ? (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        {activeTab === 'info' ? (
                            <div className="space-y-5">
                                {/* ... existing info markup ... */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {editingName ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    value={newName}
                                                    onChange={e => setNewName(e.target.value)}
                                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-red-500/40 transition-colors"
                                                    autoFocus
                                                />
                                                <button onClick={saveName} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-md transition-colors"><Check className="w-4 h-4" /></button>
                                                <button onClick={() => setEditingName(false)} className="p-1.5 text-gray-500 hover:bg-white/5 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-lg font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{detail.name}</p>
                                                <button onClick={() => setEditingName(true)} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest"> ID: {detail.id} · Creada: {new Date(detail.created_at).toLocaleDateString()}</p>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-5 gap-2">
                                    <StatBadge label="Usuarios" value={detail.users_count} />
                                    <StatBadge label="Integr." value={detail.integrations_count} />
                                    <StatBadge label="Tickets" value={detail.tickets_count} />
                                    <StatBadge label="Sessions" value={detail.sessions_count} />
                                    <StatBadge label="Agents" value={detail.agent_instances_count} />
                                </div>

                                {/* Plan Status */}
                                <div className="bg-black/30 border border-white/10 rounded-lg p-4">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">Estado de plan</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span
                                                    className={cn(
                                                        'px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border rounded-full',
                                                        planStatusStyles[detail.plan_status]
                                                    )}
                                                >
                                                    {detail.plan_status}
                                                </span>
                                                {detail.plan_status === 'DEMO' && (
                                                    <span className="text-[10px] text-blue-300/80 font-bold uppercase tracking-wider">Modo demo: datos simulados</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <select
                                                value={planStatus}
                                                onChange={(e) => {
                                                    setPlanStatus(e.target.value as PlanStatus);
                                                    setPlanStatusError(null);
                                                    setPlanStatusSuccess(null);
                                                }}
                                                className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-200 focus:outline-none focus:border-red-500/40"
                                            >
                                                {PLAN_STATUS_OPTIONS.map(option => (
                                                    <option key={option.value} value={option.value} className="bg-[#111114]">
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={handlePlanStatusSave}
                                                disabled={planStatusSaving || planStatus === detail.plan_status}
                                                className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-red-500/30 text-red-400 hover:text-white hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                            >
                                                {planStatusSaving ? 'Guardando...' : 'Guardar'}
                                            </button>
                                        </div>
                                    </div>

                                    {planStatusError && (
                                        <div className="mt-3 text-[10px] text-red-400 font-bold uppercase tracking-widest">
                                            {planStatusError}
                                        </div>
                                    )}
                                    {planStatusSuccess && (
                                        <div className="mt-3 text-[10px] text-green-400 font-bold uppercase tracking-widest">
                                            {planStatusSuccess}
                                        </div>
                                    )}
                                </div>


                                {/* Capabilities Rollup */}
                                <div className="bg-red-500/[0.02] border border-red-500/10 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] text-red-400 uppercase tracking-[0.2em] font-black">Resumen Herramientas (Rollup)</p>
                                        <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/15 px-2 py-0.5 rounded-full font-bold">
                                            {capsSummary?.count || 0} TOTAL
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {capsSummary && capsSummary.capabilities.length > 0 ? (
                                            capsSummary.capabilities.map((cap, i) => (
                                                <span key={i} className="text-[10px] font-bold text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                                                    {cap}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-[10px] text-gray-600 italic">No hay capacidades efectivas activas.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'integrations' ? (
                            <CompanyIntegrationsPanel companyId={id} />
                        ) : (
                            <CompanyTemplatesPanel companyId={id} />
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-red-500/60 font-black uppercase tracking-widest text-xs">
                        <XCircle className="w-8 h-8 mb-2 opacity-50" />
                        Error al cargar empresa
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CompaniesView() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState('');
    const [count, setCount] = useState(0);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [page, setPage] = useState(0);
    const [createName, setCreateName] = useState('');
    const [createPlanStatus, setCreatePlanStatus] = useState<PlanStatus>('ACTIVE');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const LIMIT = 20;

    const load = async (offset = 0) => {
        setIsLoading(true); setError(null);
        try {
            const res = await superAdminService.getCompanies({ q: q || undefined, limit: LIMIT, offset });
            setCompanies(res.companies);
            setCount(res.count);
        } catch (e: any) {
            setError(parseApiError(e, 'Error al cargar empresas'));
        } finally { setIsLoading(false); }
    };

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createName.trim()) {
            setCreateError('El nombre de la empresa es obligatorio.');
            return;
        }

        setCreating(true);
        setCreateError(null);
        try {
            await superAdminService.createCompany({
                name: createName.trim(),
                plan_status: createPlanStatus
            });
            setCreateName('');
            setCreatePlanStatus('ACTIVE');
            setPage(0);
            await load(0);
        } catch (error: any) {
            setCreateError(parseApiError(error, 'No se pudo crear la empresa.'));
        } finally {
            setCreating(false);
        }
    };

    useEffect(() => {
        load(page * LIMIT);
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        load(0);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-red-500" /> Empresas
                    </h1>
                    <p className="text-xs text-gray-600 mt-0.5">{count} empresas registradas</p>
                </div>
                <button onClick={() => { setPage(0); load(0); }} className="p-2 text-gray-600 hover:text-white transition-colors">
                    <RefreshCw className={`w - 4 h - 4 ${isLoading ? 'animate-spin' : ''} `} />
                </button>
            </div>

            <form onSubmit={handleCreateCompany} className="mb-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Crear Company</div>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_150px]">
                    <input
                        type="text"
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        placeholder="Nombre de empresa"
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-red-500/40"
                        required
                    />
                    <select
                        value={createPlanStatus}
                        onChange={(e) => setCreatePlanStatus(e.target.value as PlanStatus)}
                        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-200 outline-none focus:border-red-500/40"
                    >
                        {PLAN_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.value}</option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        disabled={creating}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-300 transition-all hover:bg-red-500/25 disabled:opacity-50"
                    >
                        {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Crear
                    </button>
                </div>
                {createError && <p className="mt-2 text-xs text-red-400">{createError}</p>}
            </form>

            {/* Search */}
            <form onSubmit={handleSearch} className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-red-500/40 outline-none placeholder:text-gray-600"
                />
            </form>

            {/* Table */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                <div className="grid grid-cols-[1fr_160px_40px] px-5 py-4 border-b border-white/5 bg-black/40">
                    {['Empresa', 'Creada', ''].map(h => (
                        <span key={h} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{h}</span>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-600 gap-4">
                        <Loader2 className="w-6 h-6 animate-spin text-red-500/50" />
                        <span className="text-sm font-bold tracking-[0.3em] uppercase opacity-50">Localizando Sedes...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-red-500/60 gap-3">
                        <XCircle className="w-8 h-8 opacity-50" />
                        <span className="text-xs font-black uppercase tracking-widest">{error}</span>
                    </div>
                ) : (
                    <div>
                        {companies.map(c => (
                            <div key={c.id}>
                                <div
                                    className={cn(
                                        "grid grid-cols-[1fr_160px_40px] px-5 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-all cursor-pointer group",
                                        selectedId === c.id && "bg-red-500/[0.03] border-red-500/20 shadow-[inset_4px_0_0_#ef4444]"
                                    )}
                                    onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                                >
                                    <div>
                                        <p className={cn("text-sm font-black transition-colors group-hover:text-red-400", selectedId === c.id ? "text-red-400" : "text-white")}>{c.name}</p>
                                        <p className="text-[10px] text-gray-600 font-mono font-bold">ID: {c.id}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-500 self-center tabular-nums font-bold">
                                        {new Date(c.created_at).toLocaleDateString()}
                                    </span>
                                    <ChevronRight className={cn("w-4 h-4 text-gray-600 self-center transition-all duration-300", selectedId === c.id ? 'rotate-90 text-red-500' : 'group-hover:translate-x-1')} />
                                </div>
                                {selectedId === c.id && (
                                    <div className="px-5 pb-5 bg-black/40 shadow-inner">
                                        <CompanyDetailPanel id={c.id} onClose={() => setSelectedId(null)} />
                                    </div>
                                )}
                            </div>
                        ))}
                        {companies.length === 0 && (
                            <p className="text-center py-16 text-gray-600 text-sm font-black uppercase tracking-widest opacity-50">Sin resultados</p>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {count > LIMIT && (
                <div className="flex items-center justify-between mt-6 px-2">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                        Mostrando {page * LIMIT + 1} - {Math.min((page + 1) * LIMIT, count)} de {count} resaltados
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0 || isLoading}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-black text-gray-400 hover:text-white disabled:opacity-30 transition-all hover:bg-white/10"
                        >
                            ANTERIOR
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={(page + 1) * LIMIT >= count || isLoading}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-black text-gray-400 hover:text-white disabled:opacity-30 transition-all hover:bg-white/10"
                        >
                            SIGUIENTE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
