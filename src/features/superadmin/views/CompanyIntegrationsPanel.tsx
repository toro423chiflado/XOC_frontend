import { useState, useEffect } from 'react';
import { Network, Loader2, XCircle, Check, RotateCcw, ShieldCheck, ShieldAlert, Database } from 'lucide-react';
import { superAdminService } from '../../../services/superadmin.service';
import type { SAIntegrationDetailed } from '../../../types/superadmin';
import { cn } from '../../../lib/utils';

interface Props {
    companyId: number;
}

export default function CompanyIntegrationsPanel({ companyId }: Props) {
    const [integrations, setIntegrations] = useState<SAIntegrationDetailed[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const load = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await superAdminService.getCompanyIntegrations(companyId);
            setIntegrations(res.integrations);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Error al cargar integraciones');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [companyId]);

    const handleRevertToTemplate = async (integrationId: number) => {
        if (!confirm('¿Deseas eliminar el override y volver a las capabilities del template global?')) return;
        setUpdatingId(integrationId);
        try {
            const res = await superAdminService.updateIntegration(integrationId, { capabilities: null });
            setIntegrations(prev => prev.map(i => i.id === integrationId ? res.integration : i));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al revertir');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleUpdateCapabilities = async (integrationId: number, currentCaps: string[]) => {
        const currentStr = currentCaps.join(', ');
        const input = prompt(
            '⚠️ ATENCIÓN: Al modificar estas capabilities, crearás un OVERRIDE específico para esta empresa.\nNo afectará a la Plantilla Global.\n\nIngrese las capabilities separadas por coma:',
            currentStr
        );
        if (input === null) return;

        const capabilities = input.split(',').map(c => c.trim()).filter(Boolean);
        setUpdatingId(integrationId);
        try {
            const res = await superAdminService.updateIntegration(integrationId, { capabilities });
            setIntegrations(prev => prev.map(i => i.id === integrationId ? res.integration : i));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al actualizar');
        } finally {
            setUpdatingId(null);
        }
    };

    if (isLoading) return <div className="flex items-center gap-2 text-gray-500 py-8"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Cargando integraciones...</span></div>;
    if (error) return <div className="flex items-center gap-2 text-red-500/60 py-8"><XCircle className="w-4 h-4" /><span className="text-sm">{error}</span></div>;
    if (integrations.length === 0) return <div className="text-center py-8 text-gray-600 text-xs font-bold uppercase tracking-widest italic opacity-50">Empresa sin integraciones</div>;

    return (
        <div className="space-y-3">
            {integrations.map(integration => {
                const isOverridden = integration.capabilities_source === 'integration';
                const isFromTemplate = integration.capabilities_source === 'template';

                return (
                    <div key={integration.id} className="bg-black/20 border border-white/5 rounded-xl p-4 shadow-sm hover:border-white/10 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">{integration.provider}</h4>
                                    <span className="text-[10px] text-gray-600 font-mono">#{integration.id}</span>
                                </div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{integration.type || 'Generic SIEM'}</p>
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                                {/* Source Badge */}
                                <div className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-black uppercase tracking-wider",
                                    isOverridden ? "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]" :
                                        isFromTemplate ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]" :
                                            "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                )}>
                                    {isOverridden ? <ShieldAlert className="w-3 h-3" /> : isFromTemplate ? <Database className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                                    {isOverridden ? 'Override' : isFromTemplate ? 'Template' : 'Ninguna'}
                                </div>

                                {/* Template Status/Scope Badge */}
                                {integration.template && (
                                    <div className="flex gap-1">
                                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-bold text-gray-500 uppercase">
                                            {integration.template_scope === 'all' ? 'SCOPE: ALL' : 'SCOPE: SELECTED'}
                                        </span>
                                        {integration.template_applies === false && (
                                            <span className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[8px] font-bold text-red-500 uppercase flex items-center gap-1">
                                                <XCircle className="w-2 h-2" /> NO DIRECTO
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Capabilities List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                                <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.15em] mb-2">Capabilities Efectivas</p>
                                {integration.effective_capabilities.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {integration.effective_capabilities.map((cap, idx) => (
                                            <span key={idx} className="text-[10px] font-bold px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded">
                                                {cap}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-gray-700 italic font-bold">Sin capacidades</span>
                                )}
                            </div>

                            {/* Template Info (The "Plantilla") */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                                    <Database className="w-2.5 h-2.5" /> Plantilla Global
                                </p>
                                {integration.template ? (
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap gap-1">
                                            {integration.template.capabilities.map((cap, idx) => (
                                                <span key={idx} className="text-[9px] font-medium px-1.5 py-0.5 bg-gray-500/10 text-gray-500 border border-white/5 rounded">
                                                    {cap}
                                                </span>
                                            ))}
                                        </div>
                                        {!integration.template.is_active && (
                                            <p className="text-[9px] text-yellow-500/60 font-bold uppercase tracking-tighter italic">⚠️ Plantilla Inactiva</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-[9px] text-gray-700 italic font-bold">No definida</p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.03]">
                            <div className="flex items-center gap-1">
                                {integration.has_credentials ? (
                                    <span className="flex items-center gap-1 text-[9px] text-green-500/70 font-bold uppercase tracking-widest">
                                        <Check className="w-2.5 h-2.5" /> Credenciales OK
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[9px] text-yellow-500/70 font-bold uppercase tracking-widest">
                                        <ShieldAlert className="w-2.5 h-2.5" /> Sin Credenciales
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {isOverridden && (
                                    <button
                                        onClick={() => handleRevertToTemplate(integration.id)}
                                        disabled={updatingId === integration.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all border border-white/5"
                                    >
                                        <RotateCcw className={cn("w-3 h-3", updatingId === integration.id && "animate-spin")} />
                                        REVERTIR A TEMPLATE
                                    </button>
                                )}
                                <button
                                    onClick={() => handleUpdateCapabilities(integration.id, integration.effective_capabilities)}
                                    disabled={updatingId === integration.id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-lg transition-all shadow-[0_2px_10px_rgba(239,68,68,0.1)] active:scale-95"
                                >
                                    {updatingId === integration.id && !isOverridden ? <Loader2 className="w-3 h-3 animate-spin" /> : <Network className="w-3 h-3" />}
                                    MODIFICAR CAPABILITIES
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
