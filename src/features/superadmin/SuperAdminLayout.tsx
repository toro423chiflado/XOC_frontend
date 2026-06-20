import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    ShieldAlert, LogOut, Building2, Users, Network,
    Bot, Ticket, MessageSquare, ScrollText, Database, ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type SAView = 'companies' | 'users' | 'integrations' | 'agents' | 'tickets' | 'sophia' | 'audit' | 'templates';

interface NavItem {
    id: SAView;
    label: string;
    icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'companies', label: 'Empresas', icon: Building2 },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'integrations', label: 'Integraciones', icon: Network },
    { id: 'agents', label: 'Agent Instances', icon: Bot },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'sophia', label: 'Sophia Sessions', icon: MessageSquare },
    { id: 'audit', label: 'Audit Logs', icon: ScrollText },
    { id: 'templates', label: 'Cap. Templates', icon: Database },
];

interface Props {
    children: ReactNode;
    activeView: SAView;
    onNavigate: (view: SAView) => void;
}

export default function SuperAdminLayout({ children, activeView, onNavigate }: Props) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/superadmin/login');
    };

    return (
        <div className="min-h-screen bg-[#0c0c0f] text-gray-200 flex">
            {/* Sidebar */}
            <aside className="w-56 flex-shrink-0 border-r border-red-900/20 bg-[#0f0f13] flex flex-col sticky top-0 h-screen shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
                {/* Brand */}
                <div className="px-5 py-5 border-b border-red-900/20">
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="p-1.5 bg-red-500/20 rounded-md border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                        </div>
                        <span className="text-white font-black text-sm uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">XOC</span>
                    </div>
                    <p className="text-[10px] text-red-400/70 font-bold uppercase tracking-[0.2em] pl-0.5">Superadmin Portal</p>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {NAV_ITEMS.map(item => {
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={cn(
                                    'w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all text-left',
                                    isActive
                                        ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                                        : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.06]'
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <item.icon className={cn("w-3.5 h-3.5 flex-shrink-0", isActive && "text-red-400")} />
                                    <span className="truncate">{item.label}</span>
                                </div>
                                {isActive && <ChevronRight className="w-3 h-3 opacity-70 flex-shrink-0 text-red-400" />}
                            </button>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="px-4 py-4 border-t border-red-900/20 bg-black/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-200 truncate max-w-[110px]">{user?.username}</p>
                            <p className="text-[10px] text-red-400 uppercase font-bold tracking-widest">Root Access</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Cerrar Sesión"
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all hover:shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-[#0c0c0f]">
                {/* Subtle red ambient top bar */}
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
                <div className="max-w-6xl mx-auto px-8 py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
