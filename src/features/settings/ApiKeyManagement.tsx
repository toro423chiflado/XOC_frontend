import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Key,
    Plus,
    Trash2,
    Copy,
    Check,
    AlertTriangle,
    Loader2,
    Clock,
    ShieldCheck,
    X,
    ShieldAlert,
    RefreshCw,
    ToggleLeft,
    ToggleRight,
    Activity
} from 'lucide-react';
import { apiKeyService, type XocApiKey } from '../../services/apiKey.service';
import { useAuth } from '../../context/AuthContext';

const INTEGRATION_TYPES = [
    { value: 'openvas', label: 'OpenVAS Scanner' },
    { value: 'insightvm', label: 'InsightVM (Rapid7)' },
    { value: 'nessus', label: 'Nessus Scanner' },
    { value: 'qualys', label: 'Qualys' },
    { value: 'zabbix', label: 'Zabbix Monitor' },
    { value: 'uptime_kuma', label: 'Uptime Kuma' },
    { value: 'wazuh', label: 'Wazuh SIEM' },
    { value: 'nmap', label: 'Nmap' },
    { value: 'other', label: 'Otro' }
];

const INTEGRATION_LABEL_ALIASES: Record<string, string> = {
    tenable: 'Nessus Scanner',
    rapid7: 'InsightVM (Rapid7)',
    uptime: 'Uptime Kuma'
};

export default function ApiKeyManagement() {
    const { user } = useAuth();
    const [keys, setKeys] = useState<XocApiKey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newIntegrationType, setNewIntegrationType] = useState('openvas');
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    useEffect(() => {
        if (user?.companyId) {
            loadKeys();
        }
    }, [user?.companyId]);

    const loadKeys = async () => {
        if (!user?.companyId) return;
        setIsLoading(true);
        try {
            const data = await apiKeyService.getAll(user.companyId);
            setKeys(data);
        } catch (error) {
            console.error('Failed to load API keys', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.companyId) return;

        if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
            alert('Lo sentimos, solo el usuario ADMINISTRADOR puede generar nuevas llaves.');
            return;
        }

        setIsCreating(true);
        try {
            const result = await apiKeyService.create(user.companyId, newKeyName, newIntegrationType);
            const keyToShow = result.agent_key?.api_key || result.api_key || result.apiKey;
            setGeneratedKey(keyToShow || null);
            await loadKeys();
        } catch (error: any) {
            console.error('Failed to create API key', error);
            const backendMessage = error.response?.data?.message || error.response?.data?.error || '';
            alert(`Error al crear la API Key: ${backendMessage || 'Error de conexión.'}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleRevoke = async (id: string) => {
        if (!user?.companyId) return;
        if (!confirm('¿Estás seguro de que deseas ELIMINAR permanentemente esta API Key?')) return;

        setIsProcessing(id);
        try {
            await apiKeyService.revoke(user.companyId, id);
            await loadKeys();
        } catch (error) {
            console.error('Failed to revoke API key', error);
        } finally {
            setIsProcessing(null);
        }
    };

    const handleToggle = async (id: string) => {
        if (!user?.companyId) return;
        setIsProcessing(id);
        try {
            await apiKeyService.toggleStatus(user.companyId, id);
            await loadKeys();
        } catch (error) {
            console.error('Failed to toggle API key', error);
        } finally {
            setIsProcessing(null);
        }
    };

    const handleRegenerate = async (id: string) => {
        if (!user?.companyId) return;

        const keyToRegen = keys.find(k => k.id === id);
        if (!keyToRegen) return;

        if (!confirm(`¿Estás seguro de regenerar la llave para "${keyToRegen.name}"? El token actual dejará de funcionar inmediatamente.`)) return;

        setIsProcessing(id);
        try {
            const result = await apiKeyService.regenerate(user.companyId, id);
            const actualKey = result.agent_key?.api_key || result.api_key || result.apiKey;

            setGeneratedKey(actualKey || null);
            setShowModal(true);
            await loadKeys();
        } catch (error) {
            console.error('Failed to regenerate API key', error);
            alert('Error al regenerar la llave.');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleCopy = () => {
        if (generatedKey) {
            navigator.clipboard.writeText(generatedKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setGeneratedKey(null);
        setNewKeyName('');
        setNewIntegrationType('openvas');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getIntegrationLabel = (type: string) => {
        return INTEGRATION_TYPES.find(t => t.value === type)?.label || INTEGRATION_LABEL_ALIASES[type] || type.toUpperCase();
    };

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden mt-8">
            <div className="p-6 bg-gradient-to-r from-green-500/10 to-transparent border-b border-green-500/20 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-lg text-green-400">
                        <Key className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">XOC Agent API Keys</h3>
                        <p className="text-sm text-gray-400">Gestiona accesos individuales para cada sensor o despliegue.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {(user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') && (
                        <span className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded-md flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Solo Admin
                        </span>
                    )}
                    <button
                        onClick={() => setShowModal(true)}
                        disabled={user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN'}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-black font-black rounded-lg text-xs uppercase tracking-widest transition-all shadow-[0_0_18px_rgba(34,197,94,0.3)] hover:shadow-[0_0_28px_rgba(34,197,94,0.5)] hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Agente
                    </button>
                </div>
            </div>

            <div className="p-0">
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
                    </div>
                ) : keys.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                            <Key className="w-8 h-8 opacity-20" />
                        </div>
                        <p>No hay llaves de agente configuradas.</p>
                        <button onClick={() => setShowModal(true)} className="text-neon-purple text-sm hover:underline mt-2">Crear mi primera API Key</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-dark-border bg-black/20">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Agente / Integración</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Último Uso</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-border">
                                {keys.map((key) => (
                                    <tr key={key.id} className={`hover:bg-white/[0.02] transition-colors group ${!key.isActive ? 'opacity-50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white flex items-center gap-2">
                                                {key.name || 'Agente sin nombre'}
                                                <span className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-gray-400 font-mono">
                                                    {key.integrationType.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono mt-0.5">{getIntegrationLabel(key.integrationType)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 opacity-50 text-neon-purple" />
                                                    <span className="text-xs">Creada: {formatDate(key.createdAt)}</span>
                                                </div>
                                                {key.lastUsed ? (
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="w-3.5 h-3.5 text-neon-green" />
                                                        <span className="text-xs text-neon-green/70">Activo: {formatDate(key.lastUsed)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-gray-600 italic ml-5">Nunca utilizada</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggle(key.id)}
                                                disabled={isProcessing === key.id}
                                                className="flex items-center gap-2 group/toggle"
                                            >
                                                {key.isActive ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                                                        <ToggleRight className="w-3 h-3" /> ACTIVA
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-500/10 text-gray-500 border border-gray-500/20">
                                                        <ToggleLeft className="w-3 h-3" /> INACTIVA
                                                    </span>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleRegenerate(key.id)}
                                                    disabled={isProcessing === key.id}
                                                    className="p-2 text-gray-400 hover:text-neon-purple hover:bg-neon-purple/10 rounded-lg transition-all"
                                                    title="Regenerar Token (Mantiene nombre)"
                                                >
                                                    <RefreshCw className={`w-4 h-4 ${isProcessing === key.id ? 'animate-spin' : ''}`} />
                                                </button>
                                                <button
                                                    onClick={() => handleRevoke(key.id)}
                                                    disabled={isProcessing === key.id}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                    title="Eliminar Agente"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-dark-border bg-gradient-to-r from-neon-purple/20 to-transparent flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">
                                {generatedKey ? 'Nueva Llave Generada' : 'Configurar Nuevo Agente'}
                            </h3>
                            {!generatedKey && (
                                <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            )}
                        </div>

                        <div className="p-8">
                            {!generatedKey ? (
                                <form onSubmit={handleCreate} className="space-y-6">
                                    <div className="space-y-5">
                                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex gap-3">
                                            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
                                            <div>
                                                <p className="text-xs text-orange-200/80 leading-relaxed font-medium">
                                                    Recuerda: Solo podrás ver esta llave una vez. Asegúrate de copiarla inmediatamente.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Tipo de Integración</label>
                                            <p className="text-[11px] text-gray-500">
                                                El backend recibe siempre el valor canonico en minusculas para esta seleccion.
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {INTEGRATION_TYPES.map(type => (
                                                    <button
                                                        key={type.value}
                                                        type="button"
                                                        onClick={() => setNewIntegrationType(type.value)}
                                                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${newIntegrationType === type.value
                                                            ? 'bg-neon-purple/20 border-neon-purple text-neon-purple'
                                                            : 'bg-white/5 border-white/5 text-gray-500 hover:text-gray-300'
                                                            }`}
                                                    >
                                                        {type.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[11px] text-gray-400">
                                                Valor API: <code className="font-mono text-neon-green">{newIntegrationType}</code>
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Nombre del Despliegue</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Ej: OpenVAS Sede Principal"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-neon-purple focus:outline-none transition-all placeholder:text-gray-700"
                                                value={newKeyName}
                                                onChange={(e) => setNewKeyName(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                                        >
                                            Cancelar
                                        </button>
                                        <motion.button
                                            type="submit"
                                            disabled={isCreating}
                                            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0, 255, 102, 0.4)' }}
                                            whileTap={{ scale: 0.98 }}
                                            className="relative flex items-center gap-2 bg-neon-green text-black font-black px-8 py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg overflow-hidden group/btn"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />

                                            {isCreating ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <ShieldCheck className="w-5 h-5" />
                                            )}
                                            <span className="relative z-10 tracking-[0.2em] uppercase text-xs">
                                                GENERAR LLAVE
                                            </span>

                                            {!isCreating && (
                                                <div className="absolute inset-0 rounded-xl border border-black/10 animate-pulse" />
                                            )}
                                        </motion.button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 flex gap-4">
                                        <div className="p-3 bg-green-500/20 rounded-full h-fit">
                                            <ShieldCheck className="w-6 h-6 text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-green-400 uppercase tracking-wider">¡Éxito!</p>
                                            <p className="text-xs text-green-200/80 mt-1 leading-relaxed">
                                                Copia esta llave ahora. Por seguridad, no se guardará en texto plano y no podrás recuperarla después.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">AGENT API KEY</label>
                                        <div className="flex gap-2">
                                            <code className="flex-1 bg-black/60 border border-neon-green/40 rounded-xl px-4 py-4 text-neon-green font-mono text-sm break-all shadow-inner">
                                                {generatedKey}
                                            </code>
                                            <button
                                                onClick={handleCopy}
                                                className="bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/30 rounded-xl px-5 flex items-center justify-center transition-all group active:scale-90"
                                            >
                                                {copied ? (
                                                    <Check className="w-6 h-6 text-green-500" />
                                                ) : (
                                                    <Copy className="w-6 h-6 text-neon-green group-hover:scale-110 transition-transform" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <motion.button
                                        onClick={closeModal}
                                        whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(0, 255, 102, 0.3)' }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full bg-neon-green text-black font-black py-4 rounded-xl shadow-xl shadow-neon-green/10 hover:bg-neon-green/90 transition-all mt-4 uppercase tracking-[0.2em] text-sm relative overflow-hidden group/btn"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite]" />
                                        <span className="relative z-10">He copiado la llave de forma segura</span>
                                    </motion.button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
