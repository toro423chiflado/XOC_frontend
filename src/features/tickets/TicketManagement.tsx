import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../features/dashboard/DashboardLayout';
import { Plus, Loader2, Save, Trash2, ClipboardList, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { ticketsService } from '../../services/tickets.service';
import type { Ticket, ExecutionLogsPayload } from '../../types/api';

type ExecutionLogEntry = {
    ts?: string;
    step?: string;
    status?: string;
    detail?: string;
};

const formatExecutionLogs = (value: Ticket['execution_logs']): string => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
};

const parseExecutionLogs = (value: Ticket['execution_logs']): ExecutionLogEntry[] | null => {
    // Caso 1: execution_logs es un array directamente
    if (Array.isArray(value)) {
        const entries = value.filter((item): item is ExecutionLogEntry => typeof item === 'object' && item !== null);
        return entries.length > 0 ? entries : null;
    }
    // Caso 2: execution_logs es un objeto que contiene .timeline[]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as ExecutionLogsPayload;
        const timeline = obj.timeline;
        if (Array.isArray(timeline) && timeline.length > 0) {
            return timeline as ExecutionLogEntry[];
        }
    }
    return null;
};

const getExecutionLogsData = (logs: Ticket['execution_logs']): ExecutionLogsPayload | null => {
    if (!logs || typeof logs === 'string' || Array.isArray(logs)) return null;
    return logs as ExecutionLogsPayload;
};

const getStepTone = (step?: string): string => {
    const normalized = String(step || '').toLowerCase();
    if (normalized.includes('read') || normalized.includes('verify')) return 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10';
    if (normalized.includes('write')) return 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10';
    return 'text-gray-300 border-white/10 bg-white/5';
};

type TicketStatusFilter = 'ALL' | 'PENDING' | 'PREAPROBADO' | 'APROBADO' | 'RECHAZADO' | 'DERIVED' | 'EN_EJECUCION' | 'RESUELTO' | 'FALLIDO';
type DetailTab = 'summary' | 'plan' | 'timeline' | 'logs';

const normalizeTicketStatus = (status?: string | null): Exclude<TicketStatusFilter, 'ALL'> | string => {
    const normalized = String(status || '').trim().toUpperCase();
    const statusMap: Record<string, Exclude<TicketStatusFilter, 'ALL'>> = {
        RESOLVED: 'RESUELTO',
        COMPLETED: 'RESUELTO',
        EXECUTED: 'RESUELTO',
        FAILED: 'FALLIDO',
        ERROR: 'FALLIDO',
        DERIVED: 'DERIVED',
        APPROVED: 'APROBADO',
        REJECTED: 'RECHAZADO',
        PENDING: 'PENDING',
        RUNNING: 'EN_EJECUCION',
        PREAPROBADO: 'PREAPROBADO',
        APROBADO: 'APROBADO',
        RECHAZADO: 'RECHAZADO',
        EN_EJECUCION: 'EN_EJECUCION',
        RESUELTO: 'RESUELTO',
        FALLIDO: 'FALLIDO'
    };

    return statusMap[normalized] || normalized;
};

const formatDuration = (value?: number | null): string => {
    if (value == null || Number.isNaN(value)) return '—';
    if (value < 60) return `${Math.round(value)}s`;
    const minutes = Math.floor(value / 60);
    const seconds = Math.round(value % 60);
    return `${minutes}m ${seconds}s`;
};

const formatDecisionLabel = (value?: string | null): string => {
    if (!value) return '—';
    return value.replace(/_/g, ' ').toLowerCase();
};

const getTextPreview = (value?: string | null): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
};

const FLOW_PHASES = [
    { id: 'PENDING', label: 'Pendiente', countKey: 'PENDING', color: 'border-orange-500/30 text-orange-300 bg-orange-500/10' },
    { id: 'PREAPROBADO', label: 'Preaprobado', countKey: 'PREAPROBADO', color: 'border-amber-500/30 text-amber-300 bg-amber-500/10' },
    { id: 'APROBADO', label: 'Aprobado', countKey: 'APROBADO', color: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' },
    { id: 'EN_EJECUCION', label: 'En ejecucion', countKey: 'EN_EJECUCION', color: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10' },
    { id: 'RESUELTO', label: 'Resuelto', countKey: 'RESUELTO', color: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' },
    { id: 'FALLIDO', label: 'Fallido', countKey: 'FALLIDO', color: 'border-red-500/30 text-red-300 bg-red-500/10' },
    { id: 'DERIVED', label: 'Derivado', countKey: 'DERIVED', color: 'border-blue-500/30 text-blue-300 bg-blue-500/10' },
    { id: 'RECHAZADO', label: 'Rechazado', countKey: 'RECHAZADO', color: 'border-rose-500/30 text-rose-300 bg-rose-500/10' }
] as const satisfies ReadonlyArray<{ id: Exclude<TicketStatusFilter, 'ALL'>; label: string; countKey: Exclude<TicketStatusFilter, 'ALL'>; color: string }>;

const MAIN_FLOW_PHASE_IDS: Exclude<TicketStatusFilter, 'ALL'>[] = ['PENDING', 'PREAPROBADO', 'APROBADO', 'EN_EJECUCION', 'RESUELTO'];
const EXIT_FLOW_PHASES: Array<{ id: Exclude<TicketStatusFilter, 'ALL'>; sourceColumn: number }> = [
    { id: 'DERIVED', sourceColumn: 1 },
    { id: 'RECHAZADO', sourceColumn: 2 },
    { id: 'FALLIDO', sourceColumn: 4 }
];

const STATUS_META: Record<string, { label: string; description: string; badge: string; border: string; tone: string }> = {
    PENDING: {
        label: 'Pendiente',
        description: 'Esperando decisión de VICTOR',
        badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/30',
        border: 'border-l-4 border-l-orange-500',
        tone: 'text-orange-400'
    },
    PREAPROBADO: {
        label: 'Preaprobado',
        description: 'Plan listo para aprobación humana',
        badge: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
        border: 'border-l-4 border-l-amber-500',
        tone: 'text-amber-300'
    },
    APROBADO: {
        label: 'Aprobado',
        description: 'Aprobado para ejecución',
        badge: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
        border: 'border-l-4 border-l-emerald-500',
        tone: 'text-emerald-300'
    },
    RECHAZADO: {
        label: 'Rechazado',
        description: 'Rechazado por humano',
        badge: 'bg-rose-500/10 text-rose-300 border border-rose-500/30',
        border: 'border-l-4 border-l-rose-500',
        tone: 'text-rose-300'
    },
    EN_EJECUCION: {
        label: 'En ejecucion',
        description: 'Ticket en proceso de ejecucion',
        badge: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30',
        border: 'border-l-4 border-l-cyan-500',
        tone: 'text-cyan-300'
    },
    RESUELTO: {
        label: 'Resuelto',
        description: 'Ticket resuelto correctamente',
        badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
        border: 'border-l-4 border-l-emerald-500',
        tone: 'text-emerald-400'
    },
    FALLIDO: {
        label: 'Fallido',
        description: 'La ejecucion termino con error',
        badge: 'bg-red-500/10 text-red-400 border border-red-500/30',
        border: 'border-l-4 border-l-red-500',
        tone: 'text-red-400'
    },
    DERIVED: {
        label: 'Derivado',
        description: 'No factible por capacidades',
        badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
        border: 'border-l-4 border-l-blue-500',
        tone: 'text-blue-400'
    }
};

export default function TicketManagement() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({ subject: '', description: '' });
    const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>('ALL');
    const [search, setSearch] = useState('');
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
    const [detailTab, setDetailTab] = useState<DetailTab>('summary');
    const [page, setPage] = useState(1);
    const TICKETS_PER_PAGE = 8;

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        setIsLoading(true);
        try {
            const data = await ticketsService.getAll();
            setTickets(data);
        } catch (error) {
            console.error("Failed to load tickets", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject.trim()) return;

        setIsSaving(true);
        try {
            await ticketsService.create(formData.subject, formData.description);
            setFormData({ subject: '', description: '' });
            setIsModalOpen(false);
            await loadTickets(); // Refresh list
        } catch (error) {
            alert("Error al crear el ticket. Por favor intente de nuevo.");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusMeta = (status: string) => STATUS_META[status] || {
        label: status,
        description: 'Estado no reconocido',
        badge: 'bg-white/5 text-gray-400 border border-white/10',
        border: 'border-l-4 border-l-gray-500',
        tone: 'text-gray-400'
    };

    const getPhaseConfig = (phaseId: Exclude<TicketStatusFilter, 'ALL'>) => FLOW_PHASES.find(phase => phase.id === phaseId)!;

    const formatDate = (value?: string | null) => {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleString();
    };

    const counts = useMemo(() => {
        return tickets.reduce((acc, ticket) => {
            const normalizedStatus = normalizeTicketStatus(ticket.status);
            acc.total += 1;
            acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;
            return acc;
        }, {
            total: 0,
            PENDING: 0,
            PREAPROBADO: 0,
            APROBADO: 0,
            RECHAZADO: 0,
            EN_EJECUCION: 0,
            RESUELTO: 0,
            FALLIDO: 0,
            DERIVED: 0
        } as Record<string, number>);
    }, [tickets]);

    const filteredTickets = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        return tickets
            .filter(ticket => statusFilter === 'ALL' || normalizeTicketStatus(ticket.status) === statusFilter)
            .filter(ticket => {
                if (!normalizedSearch) return true;
                const subject = ticket.subject?.toLowerCase() || '';
                const description = ticket.description?.toLowerCase() || '';
                return subject.includes(normalizedSearch) || description.includes(normalizedSearch);
            })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [tickets, statusFilter, search]);

    const totalPages = Math.max(1, Math.ceil(filteredTickets.length / TICKETS_PER_PAGE));
    const paginatedTickets = filteredTickets.slice((page - 1) * TICKETS_PER_PAGE, page * TICKETS_PER_PAGE);
    const startItem = filteredTickets.length === 0 ? 0 : (page - 1) * TICKETS_PER_PAGE + 1;
    const endItem = Math.min(page * TICKETS_PER_PAGE, filteredTickets.length);

    const selectedTicket = filteredTickets.find(ticket => ticket.id === selectedTicketId) || null;

    useEffect(() => {
        if (filteredTickets.length === 0) {
            setSelectedTicketId(null);
            return;
        }

        if (page > totalPages) {
            setPage(totalPages);
            return;
        }

        if (!selectedTicketId || !filteredTickets.some(ticket => ticket.id === selectedTicketId)) {
            setSelectedTicketId(filteredTickets[0].id);
        }
    }, [filteredTickets, selectedTicketId, page, totalPages]);

    useEffect(() => {
        setPage(1);
    }, [statusFilter, search]);

    useEffect(() => {
        setDetailTab('summary');
    }, [selectedTicketId]);

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Gestión de Tickets</h2>
                    <p className="text-gray-400">Tablero de operaciones en tiempo real.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-neon-green text-black font-semibold px-4 py-2 rounded-lg hover:bg-neon-green/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Crear Ticket
                </button>
            </div>

            {/* Create Ticket Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-dark-border">
                            <h3 className="text-xl font-bold text-white">Nuevo Ticket de Incidente</h3>
                            <p className="text-sm text-gray-400">Reporta un evento de seguridad o solicitud técnica.</p>
                        </div>
                        <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Asunto / Título</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej: Alerta de logs sospechosos en Firewall"
                                    className="w-full bg-black/30 border border-dark-border rounded-lg p-3 text-white focus:border-neon-green focus:outline-none transition-colors"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Descripción (Opcional)</label>
                                <textarea
                                    placeholder="Detalles adicionales sobre el ticket..."
                                    rows={4}
                                    className="w-full bg-black/30 border border-dark-border rounded-lg p-3 text-white focus:border-neon-green focus:outline-none transition-colors resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving || !formData.subject.trim()}
                                    className="flex items-center gap-2 bg-neon-green hover:bg-neon-green/90 text-black font-bold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Crear Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isLoading && tickets.length === 0 ? (
                <div className="flex h-96 items-center justify-center">
                    <Loader2 className="w-8 h-8 text-neon-green animate-spin" />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="rounded-2xl border border-dark-border bg-dark-card/60 p-4 md:p-5">
                        <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-widest text-gray-500">
                            <span>Fases del flujo</span>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('ALL')}
                                className={`rounded-full border px-3 py-1 transition-colors ${statusFilter === 'ALL' ? 'border-white/20 bg-white/10 text-white' : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'}`}
                            >
                                Total {counts.total}
                            </button>
                        </div>
                        <div className="mt-5 overflow-x-auto pb-2">
                            <div className="min-w-[980px] space-y-4">
                                <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-3">
                                    {MAIN_FLOW_PHASE_IDS.map((phaseId, idx) => {
                                        const phase = getPhaseConfig(phaseId);
                                        const isActive = statusFilter === phase.id;
                                        const count = counts[phase.countKey];
                                        const isEmphasized = count > 0 || isActive;

                                        return (
                                            <div key={phase.id} className="relative">
                                                {idx < MAIN_FLOW_PHASE_IDS.length - 1 && (
                                                    <div className="pointer-events-none absolute left-[calc(100%-6px)] right-[-18px] top-10 hidden h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent lg:block" />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setStatusFilter(phase.id)}
                                                    className={`group relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left transition-all ${phase.color} ${isActive ? 'scale-[1.02] shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_26px_rgba(255,255,255,0.06)]' : isEmphasized ? 'hover:-translate-y-0.5 hover:opacity-100' : 'opacity-65 hover:opacity-90'}`}
                                                >
                                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-[9px] font-black uppercase tracking-[0.26em] text-white/70">Etapa {idx + 1}</div>
                                                            <div className="mt-2 text-[11px] font-black uppercase tracking-[0.18em]">{phase.label}</div>
                                                        </div>
                                                        <div className="mt-0.5 h-3.5 w-3.5 rounded-full border border-current/40 bg-current/10 shadow-[0_0_18px_currentColor]" />
                                                    </div>
                                                    <div className="mt-4 flex items-end justify-between gap-3">
                                                        <div className="text-3xl font-black leading-none text-white">{count}</div>
                                                        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">{isActive ? 'activo' : 'flujo'}</div>
                                                    </div>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="relative grid grid-cols-5 gap-3">
                                    <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-full lg:block">
                                        {EXIT_FLOW_PHASES.map(({ id, sourceColumn }, idx) => {
                                            const sourceLeft = `calc(${((sourceColumn - 0.5) / 5) * 100}% - 1px)`;
                                            const branchLeft = `calc(60% + ${(idx + 0.5) * (40 / 3)}%)`;

                                            return (
                                                <div key={`connector-${id}`} className="absolute inset-0">
                                                    <div
                                                        className="absolute top-0 h-8 w-px bg-gradient-to-b from-white/28 via-white/16 to-transparent"
                                                        style={{ left: sourceLeft }}
                                                    />
                                                    <div
                                                        className="absolute h-px bg-gradient-to-r from-white/18 via-white/14 to-white/8"
                                                        style={{ left: sourceLeft, top: '2rem', width: `calc(${branchLeft} - ${sourceLeft})` }}
                                                    />
                                                    <div
                                                        className="absolute h-9 w-px bg-gradient-to-b from-white/24 via-white/14 to-transparent"
                                                        style={{ left: branchLeft, top: '2rem' }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="relative col-span-3 overflow-hidden rounded-2xl border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_34%),linear-gradient(180deg,rgba(8,12,20,0.92),rgba(5,8,16,0.96))] p-5">
                                        <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-neon-green/5 blur-3xl" />
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/30 p-3 shadow-[0_0_24px_rgba(0,255,157,0.08)]">
                                                <img src="/VICTOR.svg" alt="VICTOR" className="h-full w-full object-contain" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-neon-green/80">Victor Orchestration</div>
                                                <div className="mt-1 text-base font-semibold text-white">Pipeline operativo de tickets</div>
                                                <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
                                                    Cada ticket avanza por validacion, aprobacion y ejecucion. Las salidas operativas muestran desvio, rechazo o fallo para que el estado real del caso se entienda de inmediato.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pointer-events-none absolute right-[-1px] top-1/2 hidden h-px w-14 bg-gradient-to-r from-white/20 via-white/10 to-transparent lg:block" />
                                        <div className="pointer-events-none absolute right-12 top-1/2 hidden h-16 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-white/18 to-white/10 lg:block" />
                                    </div>
                                    <div className="relative col-span-2 pl-0 lg:pl-1">
                                        <div className="mb-2 flex items-center gap-3">
                                            <div className="h-px flex-1 bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
                                            <div className="text-[9px] font-black uppercase tracking-[0.24em] text-gray-500">Salidas operativas</div>
                                        </div>
                                        <div className="relative mt-7 grid grid-cols-3 gap-3">
                                            {EXIT_FLOW_PHASES.map(({ id }) => {
                                                const phase = getPhaseConfig(id);
                                                const isActive = statusFilter === phase.id;
                                                const count = counts[phase.countKey];
                                                return (
                                                    <button
                                                        key={phase.id}
                                                        type="button"
                                                        onClick={() => setStatusFilter(phase.id)}
                                                        className={`relative w-full rounded-xl border px-4 py-3 text-left transition-all ${phase.color} ${isActive ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_22px_rgba(255,255,255,0.05)]' : count > 0 ? 'hover:-translate-y-0.5 hover:opacity-100' : 'opacity-65 hover:opacity-90'}`}
                                                    >
                                                        <div className="text-[9px] font-black uppercase tracking-[0.24em] text-white/55">Salida</div>
                                                        <div className="mt-2 text-[11px] font-black uppercase tracking-[0.18em]">{phase.label}</div>
                                                        <div className="mt-3 flex items-end justify-between gap-2">
                                                            <div className="text-2xl font-black leading-none text-white">{count}</div>
                                                            <div className="h-2.5 w-2.5 rounded-full border border-current/40 bg-current/10" />
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid items-start gap-6 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] xl:grid-cols-[minmax(340px,400px)_minmax(0,1fr)]">
                        <section className="bg-dark-card border border-dark-border rounded-2xl flex flex-col min-h-[520px] lg:max-h-[calc(100vh-8rem)] overflow-hidden">
                            <div className="p-4 border-b border-dark-border space-y-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Buscar por asunto o descripcion"
                                            className="w-full bg-black/30 border border-dark-border rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-neon-green focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 self-start md:self-auto">
                                        <span className="text-[10px] uppercase tracking-widest text-gray-500">Filtro</span>
                                        {statusFilter === 'ALL' ? (
                                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-300">
                                                Todos
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setStatusFilter('ALL')}
                                                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all ${getStatusMeta(statusFilter).badge} hover:opacity-100`}
                                            >
                                                {getStatusMeta(statusFilter).label}
                                                <span className="ml-2 text-white/70">Limpiar</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
                                    <span>
                                        Mostrando {startItem}-{endItem} de {filteredTickets.length}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={page === 1}
                                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                            className="p-1.5 rounded-md border border-white/10 hover:border-neon-green/40 hover:text-neon-green disabled:opacity-40"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="text-[10px] uppercase tracking-widest">{page} / {totalPages}</span>
                                        <button
                                            type="button"
                                            disabled={page === totalPages}
                                            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                            className="p-1.5 rounded-md border border-white/10 hover:border-neon-green/40 hover:text-neon-green disabled:opacity-40"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2.5">
                                {isLoading ? (
                                    <div className="flex h-64 items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-neon-green animate-spin" />
                                    </div>
                                ) : filteredTickets.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-sm text-gray-500">
                                        No hay tickets que coincidan con el filtro.
                                    </div>
                                ) : (
                                    paginatedTickets.map(ticket => {
                                        const statusMeta = getStatusMeta(normalizeTicketStatus(ticket.status));
                                        const executionLabel = ticket.execution_status || 'Pendiente';
                                        const isSelected = selectedTicketId === ticket.id;

                                        return (
                                            <div
                                                key={ticket.id}
                                                onClick={() => setSelectedTicketId(ticket.id)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        setSelectedTicketId(ticket.id);
                                                    }
                                                }}
                                                className={`w-full text-left rounded-xl border px-4 py-3 transition-all cursor-pointer ${isSelected ? 'border-neon-green/40 bg-white/5 shadow-[0_0_0_1px_rgba(0,255,157,0.1)]' : 'border-white/5 bg-[#111317] hover:border-white/10'}`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-widest text-gray-500">
                                                            <span className="font-mono">Ticket #{ticket.id}</span>
                                                            <span className="shrink-0">{formatDate(ticket.created_at)}</span>
                                                        </div>
                                                        <h4 className="mt-2 text-sm font-semibold text-gray-100 line-clamp-1">{ticket.subject}</h4>
                                                        {ticket.description && (
                                                            <p className="mt-1 text-xs text-gray-400 line-clamp-1 leading-relaxed">
                                                                {ticket.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${statusMeta.badge}`}>
                                                        {statusMeta.label}
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
                                                    <span className={`rounded-full border px-2 py-1 font-bold uppercase tracking-widest ${statusMeta.badge}`}>
                                                        {executionLabel}
                                                    </span>
                                                    {ticket.action_plan_version && (
                                                        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 font-mono text-gray-400">
                                                            {ticket.action_plan_version}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </section>

                        <aside className="bg-dark-card border border-dark-border rounded-2xl p-5 flex flex-col min-h-[520px] lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] overflow-hidden">
                            {selectedTicket ? (() => {
                                const statusMeta = getStatusMeta(normalizeTicketStatus(selectedTicket.status));
                                const creatorLabel = selectedTicket.creator?.username
                                    || (selectedTicket.created_by_user_id ? `ID ${selectedTicket.created_by_user_id}` : 'Sistema');
                                const logsData = getExecutionLogsData(selectedTicket.execution_logs);
                                const finalResult = logsData?.final_result ?? null;
                                const pendingDecision = selectedTicket.pending_decision;
                                const executionState = selectedTicket.execution_status || 'Pendiente';
                                const outcomeText = getTextPreview(finalResult?.stdout) || getTextPreview(finalResult?.stderr) || getTextPreview(finalResult?.message);
                                const plan = selectedTicket.action_plan;
                                const steps = Array.isArray(plan?.steps) ? plan.steps : [];
                                const structuredLogs = parseExecutionLogs(selectedTicket.execution_logs);
                                const rawLogs = selectedTicket.execution_logs ? formatExecutionLogs(selectedTicket.execution_logs) : '';
                                const tabButtonClass = (tab: DetailTab) => `rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${detailTab === tab ? 'border-neon-green/40 bg-neon-green/10 text-neon-green' : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'}`;

                                return (
                                    <div className="flex min-h-0 flex-col h-full">
                                        <div className="flex flex-col gap-4 border-b border-white/8 pb-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Detalle Ticket #{selectedTicket.id}</div>
                                                    <h3 className="mt-1 text-lg font-bold text-white">{selectedTicket.subject}</h3>
                                                    <div className="mt-1 text-xs text-gray-500">{statusMeta.description}</div>
                                                </div>
                                                <span className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${statusMeta.badge}`}>
                                                    {statusMeta.label}
                                                </span>
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-xs text-gray-400">
                                                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Creado</div>
                                                    <div className="mt-1 text-sm text-gray-200">{formatDate(selectedTicket.created_at)}</div>
                                                </div>
                                                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Estado run</div>
                                                    <div className={`mt-1 text-sm font-semibold ${statusMeta.tone}`}>{executionState}</div>
                                                </div>
                                                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Duracion</div>
                                                    <div className="mt-1 text-sm text-gray-200">{formatDuration(logsData?.duration_seconds)}</div>
                                                </div>
                                                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Solicitado por</div>
                                                    <div className="mt-1 text-sm text-gray-200">{creatorLabel}</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button type="button" onClick={() => setDetailTab('summary')} className={tabButtonClass('summary')}>
                                                    Resumen
                                                </button>
                                                <button type="button" onClick={() => setDetailTab('plan')} className={tabButtonClass('plan')}>
                                                    Plan {steps.length > 0 ? `(${steps.length})` : ''}
                                                </button>
                                                <button type="button" onClick={() => setDetailTab('timeline')} className={tabButtonClass('timeline')}>
                                                    Timeline {structuredLogs ? `(${structuredLogs.length})` : ''}
                                                </button>
                                                <button type="button" onClick={() => setDetailTab('logs')} className={tabButtonClass('logs')}>
                                                    Logs
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex-1 overflow-y-auto pr-1">
                                            {detailTab === 'summary' && (
                                                <div className="space-y-5">
                                                    {selectedTicket.description && (
                                                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                                                            <div className="text-[10px] uppercase tracking-widest text-gray-500">Descripcion</div>
                                                            <p className="mt-2 text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                                                                {selectedTicket.description}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {pendingDecision && (
                                                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-4">
                                                            <div className="text-[10px] uppercase tracking-widest text-amber-300/80">Decision humana pendiente</div>
                                                            <div className="mt-2 text-sm font-semibold capitalize text-amber-100">{pendingDecision.question || formatDecisionLabel(pendingDecision.decision_id)}</div>
                                                            <div className="mt-1 text-xs leading-relaxed text-amber-100/70">
                                                                Victor dejo este ticket en espera hasta recibir una decision operativa del analista.
                                                            </div>
                                                            {pendingDecision.options && pendingDecision.options.length > 0 && (
                                                                <div className="mt-3 flex flex-wrap gap-2">
                                                                    {pendingDecision.options.map((opt) => (
                                                                        <span key={opt.option_id} className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${opt.option_id === pendingDecision.recommended_option_id ? 'border-amber-400/40 bg-amber-500/15 text-amber-200' : 'border-white/10 bg-white/5 text-gray-400'}`}>
                                                                            {opt.title}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="grid gap-3 xl:grid-cols-2 text-xs text-gray-400">
                                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                            <div className="text-[10px] uppercase tracking-widest text-gray-500">Inicio run</div>
                                                            <div className="mt-1 text-sm text-gray-200">{formatDate(logsData?.timeline?.[0]?.ts as string || selectedTicket.created_at)}</div>
                                                        </div>
                                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                            <div className="text-[10px] uppercase tracking-widest text-gray-500">Ultima actualizacion</div>
                                                            <div className="mt-1 text-sm text-gray-200">{formatDate(logsData?.timeline?.at(-1)?.ts as string || selectedTicket.executed_at || selectedTicket.approved_at)}</div>
                                                        </div>
                                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                            <div className="text-[10px] uppercase tracking-widest text-gray-500">Run ID</div>
                                                            <div className="mt-1 break-all font-mono text-[11px] text-gray-200">{logsData?.run_id || '—'}</div>
                                                        </div>
                                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                            <div className="text-[10px] uppercase tracking-widest text-gray-500">Correlation ID</div>
                                                            <div className="mt-1 break-all font-mono text-[11px] text-gray-200">{logsData?.correlation_id || '—'}</div>
                                                        </div>
                                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                            <div className="text-[10px] uppercase tracking-widest text-gray-500">Iteraciones</div>
                                                            <div className="mt-1 text-sm font-semibold text-gray-200">{logsData?.iterations || '—'}</div>
                                                        </div>
                                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                            <div className="text-[10px] uppercase tracking-widest text-gray-500">Plan version</div>
                                                            <div className="mt-1 text-sm font-semibold text-gray-200">{selectedTicket.action_plan_version || '—'}</div>
                                                        </div>
                                                    </div>

                                                    {(logsData || selectedTicket.execution_summary) && (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-[10px] uppercase tracking-widest text-gray-500">Resumen Victor</div>
                                                                <span className="text-[10px] uppercase tracking-widest text-gray-500">{finalResult?.status || executionState || 'sin resultado'}</span>
                                                            </div>
                                                            {selectedTicket.execution_summary && (
                                                                <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                                                                    {selectedTicket.execution_summary}
                                                                </div>
                                                            )}
                                                            <div className="grid gap-3 sm:grid-cols-3 text-xs text-gray-400">
                                                                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Eventos</div>
                                                                    <div className="mt-1 text-sm font-semibold text-gray-200">{structuredLogs?.length ?? '—'}</div>
                                                                </div>
                                                                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Duracion</div>
                                                                    <div className="mt-1 text-sm font-semibold text-gray-200">{formatDuration(logsData?.duration_seconds)}</div>
                                                                </div>
                                                                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Resultado</div>
                                                                    <div className="mt-1 text-sm font-semibold text-gray-200">{finalResult?.status || '—'}</div>
                                                                </div>
                                                            </div>
                                                            {outcomeText && (
                                                                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#050816]">
                                                                    <div className="border-b border-white/8 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                                                                        final_result
                                                                    </div>
                                                                    <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap px-3 py-3 font-mono text-[11px] leading-6 text-gray-200">{outcomeText}</pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {detailTab === 'plan' && (
                                                steps.length > 0 ? (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-[10px] uppercase tracking-widest text-gray-500">Plan de accion</div>
                                                            <span className="text-[10px] uppercase tracking-widest text-gray-500">{steps.length} pasos</span>
                                                        </div>
                                                        {plan?.summary && (
                                                            <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-gray-300 leading-relaxed">
                                                                {plan.summary}
                                                            </div>
                                                        )}
                                                        <ol className="space-y-3">
                                                            {steps.map((step, idx) => (
                                                                <li key={step.id || idx} className="rounded-lg border border-white/10 bg-black/20 overflow-hidden">
                                                                    <details open={idx === 0}>
                                                                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                                                                            <div>
                                                                                <div className="text-[10px] uppercase tracking-widest text-gray-500">Paso {step.id || idx + 1}</div>
                                                                                <div className="mt-1 text-sm font-semibold text-white">{step.description || 'Paso sin descripcion'}</div>
                                                                            </div>
                                                                            {step.tool && (
                                                                                <span className="shrink-0 text-[10px] font-bold text-neon-green uppercase tracking-widest">{step.tool}</span>
                                                                            )}
                                                                        </summary>
                                                                        <div className="border-t border-white/8 px-4 py-3 space-y-3">
                                                                            {step.parameters ? (
                                                                                <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 text-[11px] text-gray-300">
                                                                                    {JSON.stringify(step.parameters, null, 2)}
                                                                                </pre>
                                                                            ) : (
                                                                                <div className="text-[11px] text-gray-500">Sin parametros</div>
                                                                            )}
                                                                        </div>
                                                                    </details>
                                                                </li>
                                                            ))}
                                                        </ol>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-gray-400">
                                                        {selectedTicket.execution_summary
                                                            ? 'Victor no devolvio el plan completo en este cierre. El panel conserva la metadata real de ejecucion disponible.'
                                                            : 'Este ticket no tiene plan de accion.'}
                                                    </div>
                                                )
                                            )}

                                            {detailTab === 'timeline' && (
                                                structuredLogs ? (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-[10px] uppercase tracking-widest text-gray-500">Execution timeline</div>
                                                            <span className="text-[10px] uppercase tracking-widest text-gray-500">{structuredLogs.length} eventos</span>
                                                        </div>
                                                        <ol className="space-y-3">
                                                            {structuredLogs.map((log, idx) => (
                                                                <li key={`${log.step || 'step'}-${idx}`} className="overflow-hidden rounded-lg border border-white/10 bg-[#050816]">
                                                                    <details open={idx === 0}>
                                                                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                                                                            <div className="min-w-0">
                                                                                <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                                                                                    <span className="text-white/35">[{String(idx + 1).padStart(2, '0')}]</span>
                                                                                    <span>Evento</span>
                                                                                </div>
                                                                                <div className="mt-1 line-clamp-1 text-xs text-gray-300">{log.detail || 'Sin salida registrada'}</div>
                                                                            </div>
                                                                            <span className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] ${getStepTone(log.step)}`}>
                                                                                {log.step || 'step'}
                                                                            </span>
                                                                        </summary>
                                                                        <div className="border-t border-white/8 space-y-3 px-4 py-3">
                                                                            {log.ts && (
                                                                                <div className="overflow-hidden rounded-md border border-white/10 bg-black/35">
                                                                                    <div className="border-b border-white/8 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                                                                                        timestamp
                                                                                    </div>
                                                                                    <div className="px-3 py-2 font-mono text-[11px] text-cyan-100 break-all">
                                                                                        {formatDate(log.ts)}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {log.status && (
                                                                                <div className="overflow-hidden rounded-md border border-white/10 bg-black/35">
                                                                                    <div className="border-b border-white/8 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                                                                                        status
                                                                                    </div>
                                                                                    <div className="px-3 py-2 font-mono text-[11px] text-emerald-200 break-all">
                                                                                        {log.status}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            <div className="overflow-hidden rounded-md border border-white/10 bg-black/45">
                                                                                <div className="border-b border-white/8 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                                                                                    output
                                                                                </div>
                                                                                <div className="px-3 py-2 font-mono text-[11px] leading-6 text-gray-200 whitespace-pre-wrap break-words">
                                                                                    <span className="mr-2 text-neon-green/80">&gt;</span>
                                                                                    {log.detail || 'Sin salida registrada'}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </details>
                                                                </li>
                                                            ))}
                                                        </ol>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-gray-400">
                                                        No hay timeline estructurada disponible para este ticket.
                                                    </div>
                                                )
                                            )}

                                            {detailTab === 'logs' && (
                                                rawLogs ? (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-[10px] uppercase tracking-widest text-gray-500">Execution logs</div>
                                                            <span className="text-[10px] uppercase tracking-widest text-gray-500">raw</span>
                                                        </div>
                                                        <pre className="max-h-[28rem] overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-4 text-[11px] text-gray-300">
                                                            {rawLogs}
                                                        </pre>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-gray-400">
                                                        Este ticket no tiene logs disponibles.
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        <div className="flex justify-end border-t border-white/8 pt-4 mt-4">
                                            <button
                                                onClick={() => {
                                                    if (confirm('¿Eliminar ticket?')) {
                                                        ticketsService.delete(selectedTicket.id).then(() => loadTickets());
                                                    }
                                                }}
                                                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400 border border-red-500/30 bg-red-500/10 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })() : (
                                <div className="flex flex-1 flex-col items-center justify-center text-center text-gray-500">
                                    <ClipboardList className="h-10 w-10 text-gray-600 mb-3" />
                                    <p className="text-sm">Selecciona un ticket para ver el detalle.</p>
                                </div>
                            )}
                        </aside>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
