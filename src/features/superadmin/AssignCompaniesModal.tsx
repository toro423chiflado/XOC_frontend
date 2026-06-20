import { useState, useEffect } from 'react';
import { X, Search, Loader2, Building, CheckCircle2, Circle } from 'lucide-react';
import { superAdminService } from '../../services/superadmin.service';
import type { Company, IntegrationCapabilityTemplate } from '../../types/superadmin';
import { cn } from '../../lib/utils';

interface Props {
    template: IntegrationCapabilityTemplate;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AssignCompaniesModal({ template, onClose, onSuccess }: Props) {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [mode, setMode] = useState<'replace' | 'add' | 'remove'>('replace');

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const [allRes, assignedRes] = await Promise.all([
                    superAdminService.getCompanies({ limit: 100 }),
                    superAdminService.getTemplateCompanies(template.id, { include_all: true })
                ]);
                setCompanies(allRes.companies);
                setAssignedIds(new Set(assignedRes.companies.map(c => c.id)));
            } catch (err) {
                console.error(err);
                alert('Error al cargar datos');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [template.id]);

    const toggleSelection = (id: number) => {
        setAssignedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await superAdminService.assignCompaniesToTemplate(template.id, {
                company_ids: Array.from(assignedIds),
                mode
            });
            onSuccess();
        } catch (err) {
            alert('Error al guardar asignaciones');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a1a20] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Asignar Empresas</h3>
                        <p className="text-xs text-red-400 font-bold uppercase tracking-widest mt-1">Template: {template.provider}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {/* Mode Selector */}
                    <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 border border-white/5 rounded-xl">
                        {(['replace', 'add', 'remove'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={cn(
                                    "py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                    mode === m ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                {m === 'replace' ? 'REEMPLAZAR' : m === 'add' ? 'AGREGAR' : 'QUITAR'}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar empresa..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-white outline-none focus:border-red-500/40"
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
                            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                            <span className="text-xs font-black uppercase tracking-widest">Sincronizando Red...</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredCompanies.map(company => {
                                const isSelected = assignedIds.has(company.id);
                                return (
                                    <div
                                        key={company.id}
                                        onClick={() => toggleSelection(company.id)}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all group",
                                            isSelected
                                                ? "bg-red-500/[0.05] border-red-500/20 shadow-inner"
                                                : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                isSelected ? "bg-red-500/10 text-red-400" : "bg-white/5 text-gray-500 group-hover:text-gray-300"
                                            )}>
                                                <Building className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className={cn("text-sm font-black transition-colors", isSelected ? "text-red-400" : "text-white group-hover:text-red-400")}>
                                                    {company.name}
                                                </p>
                                                <p className="text-[10px] text-gray-600 font-mono">ID: {company.id}</p>
                                            </div>
                                        </div>
                                        {isSelected ? (
                                            <CheckCircle2 className="w-5 h-5 text-red-500" />
                                        ) : (
                                            <Circle className="w-5 h-5 text-white/5 group-hover:text-white/20" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-black/20 flex items-center justify-between">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        {assignedIds.size} SELECCIONADAS
                    </p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-xs font-black text-gray-400 hover:text-white transition-colors">
                            CANCELAR
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || (assignedIds.size === 0 && mode !== 'replace')}
                            className="flex items-center gap-2 px-8 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl transition-all shadow-[0_4px_20px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:translate-y-0"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'GUARDAR CAMBIOS'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
