import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface ExitTransitionProps {
    onComplete: () => void;
}

export default function ExitTransition({ onComplete }: ExitTransitionProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 2200); // Wait for curtains to close and logo to show

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden pointer-events-auto">
            {/* Left Curtain - Closing */}
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                transition={{ duration: 0.8, ease: [0.7, 0, 0.3, 1] }}
                className="absolute inset-y-0 left-0 w-1/2 bg-dark-bg border-r border-white/5 shadow-2xl z-20"
            />

            {/* Right Curtain - Closing */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                transition={{ duration: 0.8, ease: [0.7, 0, 0.3, 1] }}
                className="absolute inset-y-0 right-0 w-1/2 bg-dark-bg border-l border-white/5 shadow-2xl z-20"
            />

            {/* Logo Content - Appearing while closing */}
            <div className="relative z-30 flex flex-col items-center gap-6">
                <motion.div
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        duration: 0.8,
                        ease: "easeOut",
                        delay: 0.4
                    }}
                    className="relative"
                >
                    {/* Glow behind logo */}
                    <div className="absolute inset-0 bg-neon-blue/20 blur-[100px] rounded-full" />

                    <img
                        src="/Logo_XOC_Vectorial.svg"
                        alt="XOC Logo"
                        className="w-32 h-32 relative z-10"
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="text-center flex flex-col items-center"
                >
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-neon-green via-neon-blue to-neon-green bg-[length:200%_auto] animate-[gradient_8s_linear_infinite] bg-clip-text text-transparent tracking-[0.6em] uppercase mr-[-0.6em]">
                        XOC
                    </h1>
                    <p className="text-gray-600 font-bold uppercase tracking-[0.2em] text-[10px] mt-4 mr-[-0.2em]">
                        Sesión Finalizada
                    </p>
                </motion.div>
            </div>

            {/* Background Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10"
            />
        </div>
    );
}
