import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { ShieldAlert, Loader2, Lock, Mail, ArrowLeft } from 'lucide-react';

export default function SuperAdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!email.trim() || !password) {
            setError('Please enter email and password');
            setIsLoading(false);
            return;
        }

        try {
            const response = await authService.login(email.trim(), password);
            console.log('[SuperAdminLogin] User data received:', response.user);

            if (response.user.role?.toUpperCase() !== 'SUPERADMIN') {
                console.error('[SuperAdminLogin] Access denied. Current role:', response.user.role);
                setError('Acceso denegado: Se requieren privilegios de SUPERADMIN.');
                return;
            }

            console.log('[SuperAdminLogin] Access granted, redirecting...');
            login(response.access, response.refresh, response.user);
            navigate('/superadmin');

        } catch (err: any) {
            setError(err.response?.data?.error || 'Credenciales de administrador inválidas');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0c0c0f] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/8 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[200px] bg-red-900/10 rounded-full blur-[120px]" />
            </div>

            {/* Top red line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

            <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-500">
                <button
                    onClick={() => navigate('/login')}
                    className="absolute -top-12 left-0 flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors text-sm group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver al Login General
                </button>

                <div className="bg-[#131318] border border-red-500/25 rounded-2xl p-8 shadow-[0_0_60px_rgba(239,68,68,0.12),0_0_0_1px_rgba(239,68,68,0.08)] backdrop-blur-xl">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-red-500/15 rounded-2xl flex items-center justify-center mb-4 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
                            <ShieldAlert className="w-8 h-8 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
                            XOC Superadmin
                        </h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Nivel de Acceso: Root (0)</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-bold animate-in shake duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white text-sm focus:border-red-500/60 focus:shadow-[0_0_12px_rgba(239,68,68,0.15)] outline-none transition-all placeholder:text-gray-600"
                                placeholder="admin@txdxai.com"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white text-sm focus:border-red-500/60 focus:shadow-[0_0_12px_rgba(239,68,68,0.15)] outline-none transition-all placeholder:text-gray-600"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-[0_4px_20px_rgba(239,68,68,0.4),0_0_0_1px_rgba(239,68,68,0.2)] hover:shadow-[0_4px_28px_rgba(239,68,68,0.5)]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "ACCEDER AL PORTAL"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
                        <p className="text-[10px] text-gray-700 font-bold uppercase tracking-[0.25em]">
                            XOC · Sistema de Control Global v1.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
