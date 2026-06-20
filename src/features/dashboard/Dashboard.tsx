import DashboardLayout from './DashboardLayout';
import XSIAMCommandCenter from './XSIAMCommandCenter';
import UnifiedTrendChart from './UnifiedTrendChart';
import IntegrationStatus from './IntegrationStatus';
import UnifiedThreatsList from './UnifiedThreatsList';

export default function Dashboard() {
    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8">
                {/* Header with Agent Status */}
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Centro de Comando de Seguridad</h2>
                        <p className="text-gray-400 font-medium mt-1">Visión unificada de amenazas e integridad de infraestructura</p>
                    </div>

                    {/* Agent Status Indicators */}
                    <div className="flex items-center gap-6 pt-1">
                        <div className="flex items-center gap-3">
                            <img src="/SOPHIA.svg" alt="SOPHIA" className="w-6 h-6" />
                            <div className="flex items-center gap-2.5">
                                <span className="text-sm font-bold tracking-wide text-white">SOPHIA</span>
                                <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                                    <span className="absolute inset-[-3px] rounded-full bg-neon-green/25 blur-[4px]" />
                                    <span className="absolute inset-[-1px] rounded-full bg-neon-green/20 animate-pulse" />
                                    <span className="relative h-2.5 w-2.5 rounded-full bg-neon-green shadow-[0_0_8px_rgba(0,255,157,0.65)]" />
                                </span>
                                <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-neon-green">ONLINE</span>
                            </div>
                        </div>

                        <div className="h-5 w-px bg-white/10" />

                        <div className="flex items-center gap-3">
                            <img src="/VICTOR.svg" alt="VICTOR" className="w-6 h-6" />
                            <div className="flex items-center gap-2.5">
                                <span className="text-sm font-bold tracking-wide text-white">VICTOR</span>
                                <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                                    <span className="absolute inset-[-3px] rounded-full bg-cyan-400/25 blur-[4px]" />
                                    <span className="absolute inset-[-1px] rounded-full bg-cyan-400/20 animate-pulse" />
                                    <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.65)]" />
                                </span>
                                <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-400">ONLINE</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Command Center Visual Flow */}
                <XSIAMCommandCenter />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <UnifiedTrendChart />
                        <UnifiedThreatsList />
                    </div>

                    <div className="lg:col-span-1 h-full">
                        <IntegrationStatus />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
