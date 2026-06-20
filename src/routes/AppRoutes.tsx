import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import AuthLayout from '../features/auth/AuthLayout';
import LoginForm from '../features/auth/LoginForm';
import RegisterForm from '../features/auth/RegisterForm';
import Dashboard from '../features/dashboard/Dashboard';
import XocCoreDetail from '../features/dashboard/XocCoreDetail';
import IncidentsList from '../features/dashboard/IncidentsList';
import SophiaChat from '../features/sophia/SophiaChat';
import TicketManagement from '../features/tickets/TicketManagement';
import LiveVoiceSessionView from '../features/sophia/LiveVoiceSession';
import Integrations from '../features/settings/Integrations';
import AgentSettings from '../features/settings/Settings';
import CompanyInfo from '../features/landing/CompanyInfo';
import LandingPage from '../features/landing/LandingPage';
import SuperAdminDashboard from '../features/superadmin/SuperAdminDashboard';
import SuperAdminLogin from '../features/superadmin/SuperAdminLogin';
import ProviderDashboard from '../features/dashboard/provider/ProviderDashboard';
import OpenvasCurrentState from '../features/dashboard/provider/openvas/OpenvasCurrentState';
import OpenvasScanDetail from '../features/dashboard/provider/openvas/OpenvasScanDetail';
import InsightvmCurrentState from '../features/dashboard/provider/insightvm/InsightvmCurrentState';
import InsightvmScanDetail from '../features/dashboard/provider/insightvm/InsightvmScanDetail';
import WazuhScanDetail from '../features/dashboard/provider/wazuh/WazuhScanDetail';
import NessusScanDetail from '../features/dashboard/provider/nessus/NessusScanDetail';
import WelcomeTransition from '../components/layout/WelcomeTransition';
import ExitTransition from '../components/layout/ExitTransition';
import XocAcquisitionPage from '../features/landing/components/XocAcquisitionPage';

// Placeholder Components for testing routing
const Login = () => <AuthLayout title="Iniciar Sesión" subtitle="Accede a tu cuenta de XOC"><LoginForm /></AuthLayout>;
const Register = () => <AuthLayout title="Onboarding de Tenant" subtitle="Crea tu tenant y admin owner en un solo paso"><RegisterForm /></AuthLayout>;

const ProtectedRoute = () => {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-dark-bg text-neon-blue">Cargando...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Security check: Superadmin cannot access client dashboard
    if (user?.role === 'SUPERADMIN') {
        return <Navigate to="/superadmin" replace />;
    }

    return <Outlet />;
};

const SuperAdminRoute = () => {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-dark-bg text-neon-blue">Cargando...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/superadmin/login" replace />;
    }

    if (user?.role !== 'SUPERADMIN') {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

const AppFallbackRoute = () => {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (user?.role === 'SUPERADMIN') {
        return <Navigate to="/superadmin" replace />;
    }

    return <Navigate to="/dashboard" replace />;
};

const AppContent = () => {
    const { showWelcome, setShowWelcome, showExit, user } = useAuth();

    return (
        <>
            {showWelcome && (
                <WelcomeTransition
                    onComplete={() => setShowWelcome(false)}
                    userName={user?.username}
                />
            )}
            {showExit && (
                <ExitTransition onComplete={() => { }} />
            )}
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/info" element={<CompanyInfo />} />
                <Route path="/adquirir" element={<XocAcquisitionPage />} />
                <Route path="/superadmin/login" element={<SuperAdminLogin />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/dashboard/xoc-core" element={<XocCoreDetail />} />
                    <Route path="/dashboard/:provider" element={<ProviderDashboard />} />
                    <Route path="/dashboard/openvas/current" element={<OpenvasCurrentState />} />
                    <Route path="/dashboard/openvas/scan/:id" element={<OpenvasScanDetail />} />
                    <Route path="/dashboard/insightvm/current" element={<InsightvmCurrentState />} />
                    <Route path="/dashboard/insightvm/scan/:id" element={<InsightvmScanDetail />} />
                    <Route path="/dashboard/wazuh/scan/:id" element={<WazuhScanDetail />} />
                    <Route path="/dashboard/nessus/scan/:id" element={<NessusScanDetail />} />
                    <Route path="/incidents" element={<IncidentsList />} />
                    <Route path="/sophia" element={<SophiaChat />} />
                    <Route path="/sophia-voice" element={<LiveVoiceSessionView />} />
                    <Route path="/tickets" element={<TicketManagement />} />
                    <Route path="/integrations" element={<Integrations />} />
                    <Route path="/settings" element={<AgentSettings />} />
                </Route>

                {/* SuperAdmin Routes */}
                <Route element={<SuperAdminRoute />}>
                    <Route path="/superadmin" element={<SuperAdminDashboard />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<AppFallbackRoute />} />
            </Routes>
        </>
    );
};

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}
