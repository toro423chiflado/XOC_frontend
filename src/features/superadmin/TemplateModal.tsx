import { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { superAdminService } from '../../services/superadmin.service';
import type { IntegrationCapabilityTemplate } from '../../types/superadmin';

interface TemplateModalProps {
    isOpen: boolean;
    template: IntegrationCapabilityTemplate | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function TemplateModal({ isOpen, template, onClose, onSuccess }: TemplateModalProps) {
    const isEditing = !!template;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        provider: '',
        description: '',
        capabilities: '',
        is_active: true
    });

    useEffect(() => {
        if (template) {
            const caps = Array.isArray(template.capabilities)
                ? template.capabilities.join(', ')
                : typeof template.capabilities === 'string'
                    ? template.capabilities
                    : template.capabilities
                        ? JSON.stringify(template.capabilities)
                        : '';
            setForm({
                provider: template.provider,
                description: template.description || '',
                capabilities: caps,
                is_active: template.is_active
            });
        } else {
            setForm({ provider: '', description: '', capabilities: '', is_active: true });
        }
        setError(null);
    }, [template, isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        setError(null);

        const capsArray = form.capabilities
            .split(',')
            .map(c => c.trim())
            .filter(c => c.length > 0);

        const payload = {
            provider: form.provider.trim().toLowerCase(),
            description: form.description.trim() || undefined,
            capabilities: capsArray.length > 0 ? capsArray : undefined,
            is_active: form.is_active
        };

        try {
            if (isEditing && template) {
                await superAdminService.updateCapabilityTemplate(template.id, payload);
            } else {
                await superAdminService.createCapabilityTemplate(payload);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Ocurrió un error al guardar.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">
                            {isEditing ? 'Editar Template' : 'Nuevo Template'}
                        </h2>
                        <p className="text-[10px] text-gray-600 mt-0.5">
                            {isEditing ? template?.provider.toUpperCase() : 'Capacidades de integración por proveedor'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2.5 text-red-400 text-xs">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Provider */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            Proveedor <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            disabled={isEditing}
                            value={form.provider}
                            onChange={e => setForm({ ...form, provider: e.target.value })}
                            placeholder="wazuh, nessus, openvas..."
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:border-red-500/40 outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed placeholder:text-gray-700"
                        />
                        {isEditing && (
                            <p className="text-[10px] text-gray-700 italic">El proveedor no puede modificarse.</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Descripción</label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Descripción breve del set de capacidades..."
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-red-500/40 outline-none transition-colors placeholder:text-gray-700"
                        />
                    </div>

                    {/* Capabilities */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            Capacidades <span className="text-gray-600">(separadas por coma)</span>
                        </label>
                        <textarea
                            value={form.capabilities}
                            onChange={e => setForm({ ...form, capabilities: e.target.value })}
                            placeholder="get_alerts, ack_alert, list_endpoints, scan_start..."
                            rows={4}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:border-red-500/40 outline-none transition-colors resize-none placeholder:text-gray-700"
                        />
                        <p className="text-[10px] text-gray-700 italic">Ej: get_alerts, ack_alert, create_ticket</p>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between py-3 border-t border-white/5">
                        <div>
                            <p className="text-sm font-bold text-white">Estado Activo</p>
                            <p className="text-[10px] text-gray-600 mt-0.5">Si está inactivo, el backend no lo usará como fallback</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, is_active: !form.is_active })}
                            className={cn(
                                'relative w-11 h-6 rounded-full transition-all flex-shrink-0',
                                form.is_active ? 'bg-green-500' : 'bg-gray-700'
                            )}
                        >
                            <div className={cn(
                                'absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all',
                                form.is_active ? 'left-6' : 'left-1'
                            )} />
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5 flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-gray-500 font-bold hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !form.provider.trim()}
                        className={cn(
                            'flex-[2] py-2.5 rounded-lg text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40',
                            isEditing
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : 'bg-red-600 hover:bg-red-500 text-white'
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                {isEditing ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                {isEditing ? 'GUARDAR CAMBIOS' : 'CREAR TEMPLATE'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
