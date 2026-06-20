import { useState, useEffect } from 'react';
import { Database, Loader2, XCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { superAdminService } from '../../../services/superadmin.service';
import type { CompanyTemplateStatus } from '../../../types/superadmin';
import { cn } from '../../../lib/utils';

interface Props {
    companyId: number;
}

export default function CompanyTemplatesPanel({ companyId }: Props) {
    const [templates, setTemplates] = useState<CompanyTemplateStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const res = await superAdminService.getCompanyCapabilityTemplates(companyId);
                setTemplates(res.templates);
            } catch (e: any) {
                setError(e.response?.data?.error || 'Error al cargar templates');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [companyId]);

    if (isLoading) return <div className="flex items-center gap-2 text-gray-500 py-8"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Escaneando directivas...</span></div>;
    if (error) return <div className="flex items-center gap-2 text-red-500/60 py-8"><XCircle className="w-4 h-4" /><span className="text-sm">{error}</span></div>;
    if (templates.length === 0) return <div className="text-center py-8 text-gray-600 text-xs font-bold uppercase tracking-widest italic opacity-50">Sin templates aplicables</div>;

    return (
        <div className="space-y-3">
            {templates.map(t => (
                <div key={t.id} className={cn(
                    "relative flex items-center justify-between p-4 rounded-xl border transition-all",
                    t.applies ? "bg-red-500/[0.03] border-red-500/10 shadow-[inset_2px_0_0_#ef4444]" : "bg-white/[0.02] border-white/5 opacity-60 grayscale-[0.5]"
                )}>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-2.5 rounded-lg border",
                            t.applies ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-white/5 border-white/10 text-gray-600"
                        )}>
                            <Database className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className={cn("text-sm font-black uppercase tracking-tight", t.applies ? "text-white" : "text-gray-500")}>
                                    {t.provider}
                                </h4>
                                {t.scope === 'all' ? (
                                    <span className="text-[8px] font-black px-1.5 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded">GLOBAL</span>
                                ) : (
                                    <span className="text-[8px] font-black px-1.5 py-0.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded">SELECTIVO</span>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-600 mt-0.5 font-bold uppercase tracking-widest italic">
                                {t.applies ? 'Directiva activa para esta empresa' : 'Directiva no asignada'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {t.applies ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/5 text-green-500 rounded-lg border border-green-500/10 text-[9px] font-black uppercase tracking-wider">
                                <ShieldCheck className="w-3.5 h-3.5" /> APLICA
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-gray-600 rounded-lg border border-white/10 text-[9px] font-black uppercase tracking-wider">
                                <ShieldAlert className="w-3.5 h-3.5" /> OMITE
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
