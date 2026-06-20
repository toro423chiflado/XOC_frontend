import { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, Loader2, XCircle, KeyRound, ChevronDown, Check, Plus } from 'lucide-react';
import { superAdminService } from '../../../services/superadmin.service';
import type { Company, SAUser } from '../../../types/superadmin';
import { cn } from '../../../lib/utils';
import CompanyFilter from '../components/CompanyFilter';
import TablePagination from '../components/TablePagination';

const parseApiError = (error: any, fallback: string) => {
    const status = error?.response?.status;
    const detail = error?.response?.data?.message || error?.response?.data?.error || error?.message;
    if (status === 409) return detail || 'Conflicto: email o username ya existen.';
    if (status === 403) return detail || 'Accion no permitida por politica de SUPERADMIN unico.';
    if (status === 404) return detail || 'Usuario o empresa no encontrado.';
    if (status === 410) return 'Esta funcionalidad legacy fue deshabilitada.';
    return detail || fallback;
};

const ROLE_COLORS: Record<string, string> = {
    SUPERADMIN: 'text-red-400 bg-red-500/10 border-red-500/20',
    ADMIN: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    USER: 'text-gray-400 bg-white/5 border-white/10',
};

function UserRow({ user, onUpdate }: { user: SAUser; onUpdate: (u: SAUser) => void }) {
    const [expanded, setExpanded] = useState(false);
    const [role, setRole] = useState(user.role);
    const [username, setUsername] = useState(user.username);
    const [email, setEmail] = useState(user.email);
    const [saving, setSaving] = useState(false);
    const [resetPwd, setResetPwd] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);
    const [rowError, setRowError] = useState<string | null>(null);

    const isSuperadmin = user.role === 'SUPERADMIN';

    useEffect(() => {
        setRole(user.role);
        setUsername(user.username);
        setEmail(user.email);
    }, [user]);

    const saveUser = async () => {
        if (isSuperadmin) return;

        const payload: { role?: 'ADMIN' | 'USER'; username?: string; email?: string } = {};
        if (role !== user.role) payload.role = role as 'ADMIN' | 'USER';
        if (username.trim() !== user.username) payload.username = username.trim();
        if (email.trim() !== user.email) payload.email = email.trim();
        if (Object.keys(payload).length === 0) return;

        setSaving(true);
        setRowError(null);
        try {
            const updated = await superAdminService.updateUser(user.id, payload);
            onUpdate(updated);
        } catch (error: any) {
            setRowError(parseApiError(error, 'No se pudo actualizar el usuario.'));
        } finally { setSaving(false); }
    };

    const resetPassword = async () => {
        if (!confirm(`¿Generar contraseña temporal para ${user.username}?`)) return;
        setResetting(true);
        try {
            const res = await superAdminService.resetUserPassword(user.id);
            setResetPwd(res.temporary_password);
        } finally { setResetting(false); }
    };

    return (
        <>
            <div
                className="grid grid-cols-[2fr_2fr_1fr_1fr_32px] gap-3 px-5 py-4 border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-all duration-200 group"
                onClick={() => setExpanded(!expanded)}
            >
                <div>
                    <p className="text-sm font-black text-white group-hover:text-red-400 transition-colors tracking-tight">{user.username}</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-[0.05em]">{user.email}</p>
                </div>
                <p className="text-xs text-gray-400 font-bold self-center">{user.company?.name ?? `ID: ${user.company_id}`}</p>
                <div className="self-center">
                    <span className={cn('text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-[0_2px_8px_rgba(0,0,0,0.2)]', ROLE_COLORS[user.role] ?? ROLE_COLORS.USER)}>
                        {user.role}
                    </span>
                </div>
                <span className="text-[10px] text-gray-500 self-center font-mono tabular-nums">
                    {new Date(user.created_at).toLocaleDateString()}
                </span>
                <ChevronDown className={cn('w-4 h-4 text-gray-600 self-center transition-transform duration-300', expanded && 'rotate-180 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]')} />
            </div>

            {expanded && (
                <div className="px-5 pb-5 bg-black/30 border-b border-white/[0.06] animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="flex flex-wrap items-end gap-6 pt-5">
                        {/* Role editor */}
                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">Asignar Nivel de Acceso</label>
                            <div className="flex items-center gap-2">
                                <select
                                    value={isSuperadmin ? 'SUPERADMIN' : role}
                                    onChange={e => setRole(e.target.value as any)}
                                    disabled={isSuperadmin}
                                    className="bg-[#1a1a20] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-500/50 focus:shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all disabled:opacity-60"
                                >
                                    {isSuperadmin ? (
                                        <option value="SUPERADMIN">SUPERADMIN</option>
                                    ) : (
                                        ['USER', 'ADMIN'].map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))
                                    )}
                                </select>
                                {!isSuperadmin && (role !== user.role || username.trim() !== user.username || email.trim() !== user.email) && (
                                    <button
                                        onClick={saveUser}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl transition-all shadow-[0_4px_15px_rgba(239,68,68,0.3)] active:scale-95 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                        ACTUALIZAR
                                    </button>
                                )}
                            </div>
                            {isSuperadmin && (
                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.16em]">Usuario protegido por politica singleton: rol no editable.</p>
                            )}
                        </div>

                        <div className="space-y-2 min-w-[260px]">
                            <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">Datos de usuario</label>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isSuperadmin || saving}
                                    className="bg-[#1a1a20] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500/50 disabled:opacity-60"
                                />
                                <input
                                    value={email}
                                    type="email"
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isSuperadmin || saving}
                                    className="bg-[#1a1a20] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500/50 disabled:opacity-60"
                                />
                            </div>
                        </div>

                        {/* Password Reset */}
                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">Seguridad de Cuenta</label>
                            {resetPwd ? (
                                <div className="flex items-center gap-2">
                                    <code className="text-xs font-mono text-yellow-500 bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-2.5 shadow-[0_0_20px_rgba(234,179,8,0.05)]">{resetPwd}</code>
                                </div>
                            ) : (
                                <button
                                    onClick={resetPassword}
                                    disabled={resetting}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-gray-300 hover:text-white text-xs font-black rounded-xl transition-all border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.2)] disabled:opacity-50"
                                >
                                    {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                                    RESET PASSWORD
                                </button>
                            )}
                        </div>
                    </div>

                    {rowError && (
                        <p className="mt-3 text-[10px] text-red-400 uppercase tracking-wider font-bold">{rowError}</p>
                    )}

                    {resetPwd && (
                        <p className="text-[10px] text-yellow-500/60 mt-3 font-bold uppercase tracking-wider italic">⚠ Copia esta contraseña ahora. No se volverá a mostrar.</p>
                    )}
                </div>
            )}

        </>
    );
}

export default function UsersView() {
    const [users, setUsers] = useState<SAUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [companyFilter, setCompanyFilter] = useState<number | undefined>();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [count, setCount] = useState(0);
    const [offset, setOffset] = useState(0);
    const [createCompanyId, setCreateCompanyId] = useState<number | ''>('');
    const [createUsername, setCreateUsername] = useState('');
    const [createEmail, setCreateEmail] = useState('');
    const [createPassword, setCreatePassword] = useState('');
    const [createRole, setCreateRole] = useState<'ADMIN' | 'USER'>('ADMIN');
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const LIMIT = 20;

    const load = async () => {
        setIsLoading(true); setError(null);
        try {
            const res = await superAdminService.getUsers({
                q: q || undefined,
                role: roleFilter || undefined,
                company_id: companyFilter,
                limit: LIMIT,
                offset: offset
            });
            setUsers(res.users);
            setCount(res.count);
        } catch (e: any) {
            setError(parseApiError(e, 'Error al cargar usuarios'));
        } finally { setIsLoading(false); }
    };

    const loadCompanies = async () => {
        try {
            const res = await superAdminService.getCompanies({ limit: 1000 });
            setCompanies(res.companies || []);
        } catch {
            setCompanies([]);
        }
    };

    useEffect(() => { load(); }, [offset, roleFilter, companyFilter]);
    useEffect(() => { loadCompanies(); }, []);

    const handleUpdate = (updated: SAUser) => {
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setOffset(0);
        load();
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createCompanyId || !createUsername.trim() || !createEmail.trim() || !createPassword.trim()) {
            setCreateError('Completa company, username, email y password.');
            return;
        }

        setIsCreating(true);
        setCreateError(null);
        try {
            await superAdminService.createUser({
                company_id: Number(createCompanyId),
                username: createUsername.trim(),
                email: createEmail.trim(),
                password: createPassword,
                role: createRole
            });

            setCreateUsername('');
            setCreateEmail('');
            setCreatePassword('');
            setCreateRole('ADMIN');
            setCreateCompanyId('');
            setOffset(0);
            await load();
        } catch (error: any) {
            setCreateError(parseApiError(error, 'No se pudo crear el usuario.'));
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <Users className="w-5 h-5 text-red-500" /> Usuarios
                    </h1>
                    <p className="text-xs text-gray-600 mt-0.5">{count} usuarios totales</p>
                </div>
                <button onClick={load} className="p-2 text-gray-600 hover:text-white transition-colors">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <form onSubmit={handleCreateUser} className="mb-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Crear Usuario (tenant)</div>
                <div className="grid gap-3 md:grid-cols-3">
                    <select
                        value={createCompanyId}
                        onChange={(e) => setCreateCompanyId(e.target.value ? Number(e.target.value) : '')}
                        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-gray-200 outline-none focus:border-red-500/40"
                        required
                    >
                        <option value="">Selecciona company</option>
                        {companies.map((company) => (
                            <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                    </select>
                    <input
                        value={createUsername}
                        onChange={(e) => setCreateUsername(e.target.value)}
                        placeholder="username"
                        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-red-500/40"
                        required
                    />
                    <input
                        value={createEmail}
                        onChange={(e) => setCreateEmail(e.target.value)}
                        type="email"
                        placeholder="email"
                        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-red-500/40"
                        required
                    />
                    <input
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        type="password"
                        placeholder="password"
                        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-red-500/40"
                        required
                    />
                    <select
                        value={createRole}
                        onChange={(e) => setCreateRole(e.target.value as 'ADMIN' | 'USER')}
                        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-200 outline-none focus:border-red-500/40"
                    >
                        <option value="ADMIN">ADMIN</option>
                        <option value="USER">USER</option>
                    </select>
                    <button
                        type="submit"
                        disabled={isCreating}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-300 transition-all hover:bg-red-500/25 disabled:opacity-50"
                    >
                        {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Crear
                    </button>
                </div>
                {createError && <p className="mt-2 text-xs text-red-400">{createError}</p>}
            </form>

            <div className="flex flex-wrap gap-3 mb-4">
                <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                        type="text"
                        placeholder="Buscar usuario o email..."
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-red-500/40 outline-none placeholder:text-gray-600"
                    />
                </form>

                <CompanyFilter
                    currentValue={companyFilter}
                    onSelect={(id) => { setCompanyFilter(id); setOffset(0); }}
                />

                <select
                    value={roleFilter}
                    onChange={e => { setRoleFilter(e.target.value); setOffset(0); }}
                    className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-red-500/40"
                >
                    <option value="">Todos los roles</option>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                </select>

                <button onClick={() => { setOffset(0); load(); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-all">
                    Filtrar
                </button>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden mb-6">
                <div className="grid grid-cols-[2fr_2fr_1fr_1fr_32px] gap-3 px-5 py-3 border-b border-white/5 bg-black/30">
                    {['Usuario', 'Empresa', 'Rol', 'Creado', ''].map(h => (
                        <span key={h} className="text-[10px] font-black uppercase tracking-widest text-gray-600">{h}</span>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-gray-600 gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Cargando...</span>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-16 text-red-500/60 gap-2">
                        <XCircle className="w-4 h-4" /><span className="text-sm">{error}</span>
                    </div>
                ) : users.length === 0 ? (
                    <p className="text-center py-16 text-gray-600 text-sm">Sin resultados</p>
                ) : (
                    <div>
                        {users.map(u => <UserRow key={u.id} user={u} onUpdate={handleUpdate} />)}
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
