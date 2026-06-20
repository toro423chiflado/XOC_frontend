import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-dark-bg text-white overflow-hidden">
            {/* Left Side - Visual/Branding */}
            <div className="hidden lg:flex flex-col justify-center items-center bg-dark-card border-r border-dark-border relative overflow-hidden">
                {/* Main Pulsing Aura */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute w-[600px] h-[600px] bg-neon-blue/20 blur-[120px] rounded-full pointer-events-none"
                />

                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2
                    }}
                    className="absolute w-[500px] h-[500px] bg-neon-green/10 blur-[100px] rounded-full pointer-events-none"
                />

                <div className="z-10 text-center space-y-6 max-w-lg p-8">
                    <div className="relative group">
                        {/* Logo Aura Glow */}
                        <motion.div
                            animate={{
                                opacity: [0.5, 0.8, 0.5],
                                scale: [0.95, 1.05, 0.95]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute inset-0 bg-neon-blue/30 blur-3xl rounded-full"
                        />
                        <img
                            src="/Logo_XOC_Vectorial.svg"
                            alt="XOC Logo"
                            className="w-32 h-32 mx-auto mb-4 relative z-10 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]"
                        />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-6xl font-bold bg-gradient-to-r from-neon-green via-neon-blue to-neon-green bg-[length:200%_auto] animate-[gradient_8s_linear_infinite] bg-clip-text text-transparent tracking-widest">
                            XOC
                        </h1>
                    </motion.div>

                    <div className="space-y-1">
                        <p className="text-2xl font-light text-gray-300 tracking-tight">
                            Xperience Operation Center
                        </p>
                        <p className="text-sm tracking-[0.3em] text-emerald-500 font-black uppercase opacity-60">
                            powered by TxDxSecure
                        </p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                        <p className="text-gray-400 italic font-medium">"Inteligencia operativa y ciberseguridad unificada."</p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form Content */}
            <div className="flex flex-col justify-center items-center p-8 lg:p-16 relative">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-white">{title}</h2>
                        {subtitle && <p className="mt-2 text-sm text-gray-400">{subtitle}</p>}
                    </div>

                    {/* Form Slot */}
                    <div className="mt-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
