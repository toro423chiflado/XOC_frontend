import type { ReactNode } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';

export default function DashboardLayout({ children, fullWidth = false }: { children: ReactNode, fullWidth?: boolean }) {
    return (
        <div className="min-h-screen bg-dark-bg text-gray-100 flex flex-col">
            <Header />
            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 p-2 lg:p-4 overflow-auto">
                    <div className={fullWidth ? "w-full h-full" : "max-w-7xl mx-auto space-y-8"}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
