import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../features/dashboard/DashboardLayout';
import {
    Plug,
    Server,
    Cloud,
    Activity,
    ShieldCheck,
    AlertCircle,
    Globe,
    Settings,
    Edit3,
    RotateCcw,
    Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { integrationService, type IntegrationCapability } from '../../services/integration.service';
import { apiKeyService, type XocApiKey } from '../../services/apiKey.service';
import { useAuth } from '../../context/AuthContext';

interface ToolMeta {
    id: string;
    name: string;
    category: string;
    logo: string;
    color: string;
    accent: string;
}

const TOOLS: ToolMeta[] = [
    { id: 'openvas', name: 'OpenVAS Scanner', category: 'Vulnerability', logo: '/greenbone_openvass_logo.svg', color: '#00FF66', accent: 'bg-neon-green/10 text-neon-green' },
    { id: 'insightvm', name: 'InsightVM Rapid7', category: 'Vulnerability', logo: '/RPD.svg', color: '#FF5C00', accent: 'bg-orange-500/10 text-orange-500' },
    { id: 'nessus', name: 'Tenable Nessus', category: 'Vulnerability', logo: '/tenablenesus.svg', color: '#00A3FF', accent: 'bg-blue-500/10 text-blue-500' },
    { id: 'qualys', name: 'Qualys Guard', category: 'Vulnerability', logo: 'Q', color: '#ED1C24', accent: 'bg-red-500/10 text-red-500' },
    { id: 'zabbix', name: 'Zabbix Monitor', category: 'Infrastructure', logo: '/Zabbix_logo.svg', color: '#D40000', accent: 'bg-red-600/10 text-red-600' },
    { id: 'wazuh', name: 'Wazuh SIEM', category: 'Security', logo: '/wazuuu.svg', color: '#00A3FF', accent: 'bg-sky-500/10 text-sky-500' },
    { id: 'nmap', name: 'Nmap Scanner', category: 'Discovery', logo: 'M', color: '#9B51E0', accent: 'bg-purple-500/10 text-purple-500' },
    { id: 'uptime_kuma', name: 'Uptime Kuma', category: 'Monitoring', logo: '/uptime-kuma.svg', color: '#3ecf8e', accent: 'bg-emerald-500/10 text-emerald-400' },
    { id: 'other', name: 'Otros Agentes', category: 'General', logo: 'A', color: '#666', accent: 'bg-gray-500/10 text-gray-500' },
];

export default function Integrations() {
    const { user } = useAuth();
    const [integrations, setIntegrations] = useState<IntegrationCapability[]>([]);
    const [apiKeys, setApiKeys] = useState<XocApiKey[]>([]);
    const [selectedTool, setSelectedTool] = useState<ToolMeta | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (user?.companyId) {
            loadData();
        }
    }, [user?.companyId]);

    const loadData = async () => {
        if (!user?.companyId) return;
        try {
            const [integrationsData, keysData] = await Promise.all([
                integrationService.getIntegrations(parseInt(user.companyId)),
                apiKeyService.getAll(user.companyId)
            ]);
            setIntegrations(integrationsData);
            setApiKeys(keysData);
        } catch (error) {
            console.error('Failed to load integration data', error);
        }
    };

    const isToolActive = (toolId: string) => {
        const hasActiveKey = apiKeys.some(
            (k) => (k.integrationType === toolId || (toolId === 'uptime_kuma' && k.integrationType === 'uptime') || (toolId === 'nessus' && k.integrationType === 'tenable')) && k.isActive === true
        );
        const hasIntegration = integrations.some(
            (i) => i.provider === toolId || (toolId === 'uptime_kuma' && i.provider === 'uptime') || (toolId === 'nessus' && i.provider === 'tenable')
        );
        return hasActiveKey || hasIntegration;
    };

    const getIntegrationForTool = (toolId: string) => {
        if (toolId === 'uptime_kuma') {
            return integrations.find(i => i.provider === 'uptime_kuma' || i.provider === 'uptime');
        }
        return integrations.find(i => i.provider === toolId);
    };

    const handleUpdateCaps = async (integrationId: number, current: string[]) => {
        const input = prompt('Modificar capabilities (separadas por coma):', current.join(', '));
        if (input === null) return;
        setIsUpdating(true);
        try {
            const caps = input.split(',').map(c => c.trim()).filter(Boolean);
            await integrationService.updateCapabilities(integrationId, caps);
            await loadData();
        } catch (err) {
            alert('Error al actualizar capabilities');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRevert = async (integrationId: number) => {
        if (!confirm('¿Revertir al template global?')) return;
        setIsUpdating(true);
        try {
            await integrationService.updateCapabilities(integrationId, null);
            await loadData();
        } catch (err) {
            alert('Error al revertir');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4">
                <header>
                    <h2 className="text-3xl font-black text-white tracking-tight">Centro de Integraciones</h2>
                    <p className="text-gray-400 mt-2 font-medium">Gestiona el despliegue de tus agentes y la conexión con plataformas de seguridad.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Tools Grid */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {TOOLS.map((tool) => {
                            const active = isToolActive(tool.id);

                            return (
                                <motion.div
                                    key={tool.id}
                                    layoutId={tool.id}
                                    onClick={() => setSelectedTool(tool)}
                                    whileHover={{ y: -4 }}
                                    className={cn(
                                        "relative flex flex-col p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden",
                                        active
                                            ? "bg-dark-card border-dark-border"
                                            : "bg-dark-card/40 border-dark-border opacity-60 hover:opacity-100"
                                    )}
                                    style={{
                                        borderLeftColor: active ? tool.color : undefined,
                                        borderLeftWidth: active ? '4px' : '1px'
                                    }}
                                >
                                    {/* Active Pulse Indicator */}
                                    {active && (
                                        <div className="absolute top-4 right-4 flex items-center gap-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: tool.color }}></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: tool.color }}></span>
                                            </span>
                                            <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: tool.color }}>Desplegado</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 mb-6">
                                        <div
                                            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black shadow-lg overflow-hidden"
                                            style={{
                                                backgroundColor: active ? `${tool.color}15` : 'rgba(255,255,255,0.05)',
                                                color: active ? tool.color : '#666',
                                                border: `1px solid ${active ? `${tool.color}30` : 'rgba(255,255,255,0.1)'}`
                                            }}
                                        >
                                            {tool.logo.startsWith('/') ? (
                                                <img src={tool.logo} className="w-8 h-8 object-contain rounded-full" alt={tool.name} />
                                            ) : (
                                                tool.logo
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{tool.name}</h3>
                                            <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold">{tool.category}</p>
                                        </div>
                                    </div>

                                    {/* Deployment Split Section */}
                                    <div className="mt-auto pt-4 border-t border-white/5 flex gap-2">
                                        <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black tracking-widest bg-white/5 text-gray-700 border border-transparent opacity-40">
                                            <Cloud className="w-3.5 h-3.5" />
                                            CLOUD
                                        </div>
                                        <div className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all",
                                            active
                                                ? tool.id === 'insightvm'
                                                    ? "bg-orange-500/20 text-orange-500 border border-orange-500/30 shadow-[0_0_15px_rgba(255,92,0,0.1)]"
                                                    : "bg-neon-green/20 text-neon-green border border-neon-green/30 shadow-[0_0_15px_rgba(0,255,102,0.15)]"
                                                : "bg-white/5 text-gray-700 border border-transparent opacity-40"
                                        )}>
                                            <Server className="w-3.5 h-3.5" />
                                            ON PREMISE
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Details / Config Panel */}
                    <div className="lg:col-span-4">
                        <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden sticky top-8 shadow-2xl">
                            {selectedTool ? (
                                <div className="p-0">
                                    <div
                                        className="p-8 relative overflow-hidden"
                                        style={{ backgroundColor: `${selectedTool.color}08` }}
                                    >
                                        <div className="relative z-10">
                                            <div
                                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black mb-4 mx-auto overflow-hidden"
                                                style={{
                                                    backgroundColor: `${selectedTool.color}20`,
                                                    color: selectedTool.color,
                                                    border: `1px solid ${selectedTool.color}40`
                                                }}
                                            >
                                                {selectedTool.logo.startsWith('/') ? (
                                                    <img src={selectedTool.logo} className="w-10 h-10 object-contain rounded-full" alt="" />
                                                ) : (
                                                    selectedTool.logo
                                                )}
                                            </div>
                                            <h3 className="text-xl font-bold text-white text-center">{selectedTool.name}</h3>
                                            <p className="text-sm text-gray-400 text-center mt-1 uppercase tracking-widest">{selectedTool.category}</p>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                <Activity className="w-4 h-4" /> Estado de Conexión
                                            </h4>

                                            {isToolActive(selectedTool.id) ? (
                                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
                                                    <ShieldCheck className="w-5 h-5 text-green-400 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-bold text-green-400 uppercase">Integración Activa</p>
                                                        <p className="text-xs text-green-200/60 mt-1">
                                                            SOPHIA está recibiendo datos de este agente correctamente.
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
                                                    <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-bold text-white uppercase">Sin Configurar</p>
                                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                            Esta integración aún no está configurada para tu empresa.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Capabilities Section for Admins */}
                                        {isToolActive(selectedTool.id) && getIntegrationForTool(selectedTool.id) && (
                                            <div className="pt-6 border-t border-dark-border space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                        <Settings className="w-4 h-4" /> Capabilities
                                                    </h4>
                                                    <div className={cn(
                                                        "px-2 py-0.5 rounded text-[9px] font-black uppercase border",
                                                        getIntegrationForTool(selectedTool.id)?.capabilities_source === 'integration'
                                                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                    )}>
                                                        {getIntegrationForTool(selectedTool.id)?.capabilities_source === 'integration' ? 'OVERRIDE' : 'TEMPLATE'}
                                                    </div>
                                                </div>

                                                <div className="bg-black/40 border border-white/5 rounded-xl p-3">
                                                    <div className="flex flex-wrap gap-1.5 min-h-[20px]">
                                                        {getIntegrationForTool(selectedTool.id)?.effective_capabilities.map((cap, i) => (
                                                            <span key={i} className="text-[10px] font-bold px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded">
                                                                {cap}
                                                            </span>
                                                        )) || <span className="text-[10px] text-gray-600 italic">Ninguna herramienta habilitada</span>}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleUpdateCaps(getIntegrationForTool(selectedTool.id)!.id, getIntegrationForTool(selectedTool.id)!.effective_capabilities)}
                                                        disabled={isUpdating}
                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                                    >
                                                        {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit3 className="w-3.5 h-3.5" />}
                                                        EDITAR
                                                    </button>
                                                    {getIntegrationForTool(selectedTool.id)?.capabilities_source === 'integration' && (
                                                        <button
                                                            onClick={() => handleRevert(getIntegrationForTool(selectedTool.id)!.id)}
                                                            disabled={isUpdating}
                                                            title="Revertir a Template"
                                                            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg transition-all"
                                                        >
                                                            <RotateCcw className={cn("w-4 h-4", isUpdating && "animate-spin")} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-6 border-t border-dark-border">
                                            <div className="grid grid-cols-2 gap-3">
                                                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all text-gray-400 hover:text-white">
                                                    <Globe className="w-4 h-4" /> Docs
                                                </button>
                                                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all text-gray-400 hover:text-white">
                                                    <Settings className="w-4 h-4" /> Config
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => setSelectedTool(null)}
                                                className="w-full mt-3 py-3 text-xs font-black text-gray-500 hover:text-gray-300 uppercase tracking-widest"
                                            >
                                                Cerrar Detalles
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-20 h-20 bg-neon-blue/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-neon-blue/10">
                                        <Plug className="w-10 h-10 text-neon-blue/30" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Selecciona un Módulo</h3>
                                    <p className="text-sm text-gray-500">
                                        Haz clic en cualquier herramienta para ver detalles de despliegue, guías de instalación y telemetría.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
