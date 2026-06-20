import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuperAdminRedirect, setShowSuperAdminRedirect] = useState(false);
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
            // Use standard Auth Service
            const response = await authService.login(email.trim(), password);

            if (response.user.role === 'SUPERADMIN') {
                setShowSuperAdminRedirect(true);
                return;
            }

            login(response.access, response.refresh, response.user);
            navigate('/dashboard');

        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    if (showSuperAdminRedirect) {
        return (
            <div className="space-y-6 w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-4">
                    <ShieldAlert className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Acceso Restringido</h2>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Su cuenta tiene privilegios de <span className="text-red-500 font-bold underline">SUPERADMINISTRADOR</span>.
                        Este portal está reservado exclusivamente para clientes y usuarios finales.
                    </p>
                </div>

                <Link
                    to="/superadmin/login"
                    className="block w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 px-4 rounded-xl transition-all shadow-lg shadow-red-600/20 uppercase tracking-widest text-xs"
                >
                    Ir al Panel de Control Superadmin
                </Link>

                <button
                    onClick={() => {
                        setShowSuperAdminRedirect(false);
                        setError('');
                    }}
                    className="text-[10px] font-bold text-gray-600 hover:text-white uppercase tracking-widest transition-colors"
                >
                    Volver al Inicio de Sesión
                </button>
            </div>
        );
    }

    return (
        <>
            <Link
                to="/"
                className="fixed top-5 left-5 lg:top-7 lg:left-8 z-50 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-colors bg-black/35 border border-white/10 rounded-full px-4 py-2 backdrop-blur-sm"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver
            </Link>

            <form onSubmit={handleSubmit} className="space-y-6 w-full text-gray-200">
                {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-400">Correo</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 focus:outline-none focus:border-neon-green transition-colors text-white"
                        placeholder="admin@empresa.com"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-400">Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 focus:outline-none focus:border-neon-green transition-colors text-white"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center text-gray-400">
                        <input type="checkbox" className="mr-2 rounded border-dark-border bg-dark-bg text-neon-green focus:ring-neon-green" />
                        Recordarme
                    </label>
                    <a href="#" className="text-neon-green hover:underline">¿Olvidaste tu contraseña?</a>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-neon-green/90 hover:bg-neon-green text-black font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,255,159,0.3)]"
                >
                    {isLoading ? 'Autenticando...' : 'Ingresar al Sistema'}
                </button>

                <div className="text-center text-sm text-gray-500 mt-6 space-y-3">
                    <div>
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="text-neon-blue hover:text-white transition-colors">
                            Crear Tenant
                        </Link>
                    </div>
                    <div>
                        <Link to="/info" className="text-neon-blue hover:text-white transition-colors text-xs font-medium border-b border-neon-blue/30 hover:border-white pb-0.5">
                            Ver Información de la Empresa (Público)
                        </Link>
                    </div>
                    <div className="pt-4 mt-4 border-t border-white/5">
                        <Link to="/superadmin/login" className="inline-flex items-center gap-2 text-red-500/60 hover:text-red-500 transition-all text-[10px] font-black uppercase tracking-widest group">
                            <ShieldAlert className="w-3 h-3 group-hover:scale-110 transition-transform" />
                            Acceso Superadmin
                        </Link>
                    </div>
                </div>
            </form>
        </>
    );
}
