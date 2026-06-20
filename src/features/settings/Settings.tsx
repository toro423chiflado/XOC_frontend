import DashboardLayout from '../../features/dashboard/DashboardLayout';
import ApiKeyManagement from './ApiKeyManagement';

export default function AgentSettings() {
    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-2">Configuración</h2>
                    <p className="text-gray-400">
                        Administra las configuraciones del sistema.
                    </p>
                </div>

                <ApiKeyManagement />
            </div>
        </DashboardLayout>
    );
}
