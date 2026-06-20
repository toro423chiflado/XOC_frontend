import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface WelcomeTransitionProps {
    onComplete: () => void;
    userName?: string;
}

export default function WelcomeTransition({ onComplete, userName }: WelcomeTransitionProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Reduced waiting time for a faster experience
        const openTimer = setTimeout(() => {
            setIsVisible(false);
        }, 2200); // Wait less before starting to open

        const finishTimer = setTimeout(() => {
            onComplete();
        }, 3000); // Complete everything faster

        return () => {
            clearTimeout(openTimer);
            clearTimeout(finishTimer);
        };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 1 }} // Keep wrapper visible while children exit
                    className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden pointer-events-none"
                >
                    {/* Left Curtain - Explicit Slide Out on Exit */}
                    <motion.div
                        initial={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ duration: 0.7, ease: [0.7, 0, 0.3, 1] }}
                        className="absolute inset-y-0 left-0 w-1/2 bg-dark-bg border-r border-white/5 shadow-2xl z-20"
                    />

                    {/* Right Curtain - Explicit Slide Out on Exit */}
                    <motion.div
                        initial={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.7, ease: [0.7, 0, 0.3, 1] }}
                        className="absolute inset-y-0 right-0 w-1/2 bg-dark-bg border-l border-white/5 shadow-2xl z-20"
                    />

                    {/* Logo Content */}
                    <motion.div
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                        transition={{ duration: 0.5 }}
                        className="relative z-30 flex flex-col items-center gap-6"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                duration: 1,
                                ease: "easeOut",
                                delay: 0.3
                            }}
                            className="relative"
                        >
                            {/* Glow behind logo */}
                            <div className="absolute inset-0 bg-neon-blue/20 blur-[100px] rounded-full animate-pulse" />

                            <img
                                src="./Logo_XOC_Vectorial.svg"
                                alt="XOC Logo"
                                className="w-40 h-40 relative z-10"
                            />
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="text-center"
                        >
                            <h1 className="text-3xl font-black text-white tracking-[0.2em] uppercase mb-1">
                                Bienvenido al <span className="text-neon-blue">XOC</span>
                            </h1>
                            {userName && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1 }}
                                    className="text-xl font-bold text-white mb-2 italic px-4 py-1 bg-white/5 rounded-lg border border-white/5"
                                >
                                    {userName}
                                </motion.p>
                            )}
                            <p className="text-gray-500 font-bold uppercase tracking-[0.5em] text-[10px]">
                                Xperience Operation Center
                            </p>
                        </motion.div>
                    </motion.div>

                    {/* Background Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md z-10"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
