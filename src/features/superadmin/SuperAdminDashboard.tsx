import { useState, useEffect, lazy, Suspense } from 'react';
import SuperAdminLayout, { type SAView } from './SuperAdminLayout';
import { Loader2 } from 'lucide-react';

const CompaniesView = lazy(() => import('./views/CompaniesView'));
const UsersView = lazy(() => import('./views/UsersView'));
const IntegrationsView = lazy(() => import('./views/IntegrationsView'));
const AgentInstancesView = lazy(() => import('./views/AgentInstancesView'));
const TicketsView = lazy(() => import('./views/TicketsView'));
const SophiaSessionsView = lazy(() => import('./views/SophiaSessionsView'));
const AuditLogsView = lazy(() => import('./views/AuditLogsView'));
const CapabilityTemplatesView = lazy(() => import('./views/CapabilityTemplatesView'));

const VIEW_MAP: Record<SAView, React.LazyExoticComponent<React.ComponentType<any>>> = {
    companies: CompaniesView,
    users: UsersView,
    integrations: IntegrationsView,
    agents: AgentInstancesView,
    tickets: TicketsView,
    sophia: SophiaSessionsView,
    audit: AuditLogsView,
    templates: CapabilityTemplatesView,
};

function ViewLoader() {
    return (
        <div className="flex items-center justify-center py-24 text-gray-600 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando módulo...</span>
        </div>
    );
}

export default function SuperAdminDashboard() {
    const [activeView, setActiveView] = useState<SAView>('companies');

    // Restore last view from session
    useEffect(() => {
        const saved = sessionStorage.getItem('sa_view') as SAView | null;
        if (saved && VIEW_MAP[saved]) setActiveView(saved);
    }, []);

    const handleNavigate = (view: SAView) => {
        setActiveView(view);
        sessionStorage.setItem('sa_view', view);
    };

    const ActiveComponent = VIEW_MAP[activeView];

    return (
        <SuperAdminLayout activeView={activeView} onNavigate={handleNavigate}>
            <Suspense fallback={<ViewLoader />}>
                <ActiveComponent />
            </Suspense>
        </SuperAdminLayout>
    );
}
