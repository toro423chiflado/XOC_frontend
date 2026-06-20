import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell, User } from 'lucide-react';

export default function Header() {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <header className="h-16 border-b border-dark-border bg-dark-card/50 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-3">
                <img src="/Logo_XOC_Vectorial.svg" alt="XOC Logo" className="w-10 h-10 object-contain" />
                <div className="flex flex-col -space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent">
                            XOC Dashboard
                        </span>
                        <div className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider leading-none">
                                Enterprise
                            </span>
                        </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium tracking-tighter uppercase relative top-0.5">
                        powered by TxDxSecure
                    </span>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </button>

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-4 border-l border-dark-border">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-white">{user?.username || 'Usuario'}</p>
                        <p className="text-xs text-gray-400">{user?.role ? user.role.toUpperCase() : 'USUARIO'}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neon-green to-neon-blue p-[1px]">
                        <div className="w-full h-full rounded-full bg-dark-bg flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Cerrar Sesión"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
