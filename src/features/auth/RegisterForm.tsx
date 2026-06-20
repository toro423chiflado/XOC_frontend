import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

export default function RegisterForm() {
    const [companyName, setCompanyName] = useState('');
    const [adminUsername, setAdminUsername] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const fallbackToLogin = () => {
        navigate('/login', { replace: true });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!companyName.trim() || !adminEmail.trim() || !password) {
            setError('Completa empresa, correo admin y contraseña');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await authService.register(
                companyName.trim(),
                '',
                adminUsername.trim(),
                adminEmail.trim(),
                password
            );

            if (!response.access || !response.refresh || !response.user) {
                fallbackToLogin();
                return;
            }

            login(response.access, response.refresh, response.user);

            const persistedAccess = localStorage.getItem('accessToken');
            const persistedRefresh = localStorage.getItem('refreshToken');
            if (!persistedAccess || !persistedRefresh) {
                fallbackToLogin();
                return;
            }

            navigate('/dashboard');
        } catch (err: any) {
            const status = err?.response?.status;
            const code = err?.response?.data?.error;
            if (status === 410 || code === 'REGISTRATION_FLOW_CHANGED') {
                fallbackToLogin();
                return;
            }

            setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Error en onboarding de tenant');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 w-full text-gray-200">
            {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Nombre de la Empresa</label>
                <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:border-neon-blue transition-colors text-white"
                    placeholder="Empresa S.A.C."
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Correo del Admin Owner</label>
                <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:border-neon-blue transition-colors text-white"
                    placeholder="admin@empresa.com"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Username Admin Owner (Opcional)</label>
                <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:border-neon-blue transition-colors text-white"
                    placeholder="admin_empresa"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Contraseña</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:border-neon-blue transition-colors text-white"
                    placeholder="••••••••"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Confirmar Contraseña</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:border-neon-blue transition-colors text-white"
                    placeholder="••••••••"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-neon-blue/90 hover:bg-neon-blue text-black font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,240,255,0.3)] mt-2"
            >
                {isLoading ? 'Creando tenant...' : 'Crear Tenant y Admin'}
            </button>

            <div className="text-center text-sm text-gray-500 mt-4">
                ¿Ya tienes una cuenta?{' '}
                <a href="/login" className="text-neon-blue hover:text-white transition-colors">
                    Inicia Sesión
                </a>
            </div>
        </form>
    );
}
