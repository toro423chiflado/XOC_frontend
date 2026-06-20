import { useParams, Navigate } from 'react-router-dom';
import WazuhDashboard from './wazuh/WazuhDashboard';
import ZabbixDashboard from './zabbix/ZabbixDashboard';
import NessusDashboard from './nessus/NessusDashboard';
import UptimeDashboard from './uptime/UptimeDashboard';
import OpenvasDashboard from './openvas/OpenvasDashboard';
import InsightvmDashboard from './insightvm/InsightvmDashboard';
import DashboardLayout from '../DashboardLayout';
import { AlertTriangle } from 'lucide-react';

export default function ProviderDashboard() {
    const { provider } = useParams<{ provider: string }>();

    // Route to specific provider dashboard
    switch (provider?.toLowerCase()) {
        case 'wazuh':
            return <WazuhDashboard />;
        case 'zabbix':
            return <ZabbixDashboard />;
        case 'nessus':
            return <NessusDashboard />;
        case 'uptime':
            return <UptimeDashboard />;
        case 'openvas':
            return <OpenvasDashboard />;
        case 'insightvm':
            return <InsightvmDashboard />;
        case 'paloalto':
        case 'splunk':
        case 'meraki':
            // Placeholder for other providers
            return (
                <DashboardLayout>
                    <div className="flex flex-col items-center justify-center h-96 text-center">
                        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Dashboard en Desarrollo</h2>
                        <p className="text-gray-400">
                            El dashboard para <span className="text-neon-cyan font-bold capitalize">{provider}</span> estará disponible próximamente.
                        </p>
                    </div>
                </DashboardLayout>
            );
        default:
            return <Navigate to="/dashboard" replace />;
    }
}
