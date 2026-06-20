import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquareText, Ticket, Settings, Network, ShieldAlert, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

// Custom icon for SOPHIA Voice using the existing logo
const SophiaVoiceIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <img src="./SOPHIA.svg" alt="SOPHIA Voice" className={className} />
);

const WazuhSidebarIcon = ({ className = 'w-4 h-4' }: { className?: string }) => <img src="./wazuuu.svg" className={`${className} rounded-full object-cover`} alt="Wazuh" />;
const ZabbixSidebarIcon = ({ className = 'w-4 h-4' }: { className?: string }) => <img src="./Zabbix_logo.svg" className={`${className} object-contain`} alt="Zabbix" />;
const NessusSidebarIcon = ({ className = 'w-4 h-4' }: { className?: string }) => <img src="./tenablenesus.svg" className={`${className} rounded-full object-cover`} alt="Nessus" />;
const UptimeSidebarIcon = ({ className = 'w-4 h-4' }: { className?: string }) => <img src="./uptime-kuma.svg" className={`${className} object-contain`} alt="Uptime Kuma" />;

const MENU_ITEMS = [
    { label: 'Resumen', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Preventions/Issues', icon: ShieldAlert, path: '/incidents' },
    { label: 'SOPHIA AI', icon: MessageSquareText, path: '/sophia' },
    { label: 'SOPHIA Voice', icon: SophiaVoiceIcon, path: '/sophia-voice' },
    { label: 'Tickets', icon: Ticket, path: '/tickets' },
    { label: 'Integraciones', icon: Network, path: '/integrations' },
    { label: 'Configuración', icon: Settings, path: '/settings' },
];

const PROVIDER_DASHBOARDS = [
    { label: 'Wazuh SIEM', icon: WazuhSidebarIcon, path: '/dashboard/wazuh' },
    { label: 'Zabbix Monitor', icon: ZabbixSidebarIcon, path: '/dashboard/zabbix' },
    { label: 'Nessus Scanner', icon: NessusSidebarIcon, path: '/dashboard/nessus' },
    { label: 'OpenVAS Scanner', icon: ({ className = 'w-4 h-4' }: { className?: string }) => <img src="./greenbone_openvass_logo.svg" className={`${className} object-contain`} alt="OpenVAS" />, path: '/dashboard/openvas' },
    { label: 'InsightVM Rapid7', icon: ({ className = 'w-4 h-4' }: { className?: string }) => <img src="./RPD.svg" className={`${className} object-contain`} alt="InsightVM" />, path: '/dashboard/insightvm' },
    { label: 'Uptime Kuma', icon: UptimeSidebarIcon, path: '/dashboard/uptime' },
];

export default function Sidebar() {
    const { user } = useAuth();
    const [isDashboardsOpen, setIsDashboardsOpen] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside className={cn(
            "border-r border-dark-border bg-dark-card hidden lg:flex flex-col h-[calc(100vh-4rem)] sticky top-16 transition-[width] duration-300 ease-out overflow-hidden",
            isCollapsed ? "w-20" : "w-64"
        )}>
            <div className={cn("p-4 space-y-2 overflow-y-auto custom-scrollbar", isCollapsed && "px-2")}>
                <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-end")}>
                    <button
                        type="button"
                        onClick={() => setIsCollapsed((prev) => !prev)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                    >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>
                {MENU_ITEMS.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        title={item.label}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                                isCollapsed && "justify-center px-0",
                                isActive
                                    ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className={cn("font-medium", isCollapsed && "hidden")}>{item.label}</span>
                    </NavLink>
                ))}

                {user?.role === 'SUPERADMIN' && (
                    <NavLink
                        to="/superadmin"
                        title="Superadmin Portal"
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group mt-4 border border-red-500/10",
                                isCollapsed && "justify-center px-0",
                                isActive
                                    ? "bg-red-500/10 text-red-500 border-red-500/30"
                                    : "text-red-400/50 hover:bg-red-500/5 hover:text-red-400"
                            )
                        }
                    >
                        <ShieldAlert className="w-5 h-5" />
                        <span className={cn("font-bold uppercase tracking-tighter", isCollapsed && "hidden")}>Superadmin Portal</span>
                    </NavLink>
                )}

                {/* Dashboards Section */}
                {!isCollapsed && (
                    <div className="pt-4 mt-4 border-t border-white/5">
                    <button
                        onClick={() => setIsDashboardsOpen(!isDashboardsOpen)}
                        className="w-full flex items-center justify-between px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider">Dashboards</span>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", isDashboardsOpen && "rotate-180")} />
                    </button>

                    {isDashboardsOpen && (
                        <div className="mt-2 space-y-1">
                            {PROVIDER_DASHBOARDS.map((provider) => (
                                <NavLink
                                    key={provider.path}
                                    to={provider.path}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm",
                                            isActive
                                                ? "bg-neon-blue/10 text-neon-blue border border-neon-blue/20"
                                                : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
                                        )
                                    }
                                >
                                    <provider.icon className="w-4 h-4" />
                                    <span>{provider.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    )}
                </div>
                )}
            </div>

            <div className={cn("mt-auto border-t border-dark-border", isCollapsed ? "p-3" : "p-6")}>
                {isCollapsed ? (
                    <div className="flex items-center justify-center py-2">
                        <span className="w-2.5 h-2.5 bg-neon-green rounded-full animate-pulse" title="Operativo 99.9%" />
                    </div>
                ) : (
                    <div className="rounded-xl border border-emerald-500/15 bg-[linear-gradient(145deg,rgba(16,185,129,0.08),rgba(10,10,10,0.8))] backdrop-blur-md p-3 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.15),_transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500">Métrica Global</div>
                                    <div className="text-[13px] font-bold text-white leading-tight mt-0.5">Estado del Sistema</div>
                                </div>
                            </div>
                            
                            <div className="mt-2.5 flex items-center gap-2">
                                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-1">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                                        Operativo 99.9%
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-white/5">
                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.25em]">
                                    BY <span className="text-gray-300">TXDXSECURE</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
