import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

/**
 * Golden star particles that drift slowly and emotionally.
 */
const StarParticle = ({ delay, style }: { delay: number; style: React.CSSProperties }) => (
    <motion.div
        initial={{ scale: 0, opacity: 0, rotate: 0 }}
        animate={{
            scale: [0, 1, 0.8, 0],
            opacity: [0, 0.8, 1, 0],
            y: [-20, -60, -80],
            rotate: [0, 90, 180],
        }}
        transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay,
            ease: "easeInOut"
        }}
        className="absolute pointer-events-none"
        style={style}
    >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="#FCD34D" className="drop-shadow-[0_0_3px_rgba(252,211,77,0.8)]" />
        </svg>
    </motion.div>
);

export const AchievementOverlay: React.FC = () => {
    const notifications = useGameStore(state => state.notifications);
    const removeNotification = useGameStore(state => state.removeNotification);

    // Generate random star particle positions
    const starParticles = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        delay: Math.random() * 5,
        style: {
            left: `${Math.random() * 100}%`,
            top: `${100 + Math.random() * 20}%`, // Start slightly below
        }
    })), []);

    return (
        <div className="fixed top-36 right-4 z-[9999] flex flex-col gap-3 pointer-events-none w-[240px] max-w-[calc(100vw-2rem)]">
            <AnimatePresence mode="popLayout">
                {notifications.map((notification) => (
                    <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, x: 50, scale: 0.9, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, x: 20, filter: 'blur(10px)', transition: { duration: 0.4 } }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="pointer-events-auto relative group origin-top-right"
                        onClick={() => removeNotification(notification.id)}
                    >
                        {/* Ultra-Slim Sunset Glow */}
                        <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-500/30 via-violet-600/20 to-indigo-900/40 rounded-[1.2rem] blur-lg opacity-50 group-hover:opacity-80 transition duration-1000" />

                        {/* Shrunken Glassmorphism Card */}
                        <div className="relative bg-black/70 backdrop-blur-[25px] border border-white/10 rounded-[1.2rem] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.03)] overflow-hidden">

                            {/* Inner Subtle Tint */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/5 via-transparent to-violet-500/5 pointer-events-none" />

                            {/* Floating Star Particles (Reduced Count) */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
                                {starParticles.slice(0, 8).map(s => <StarParticle key={s.id} delay={s.delay} style={s.style} />)}
                            </div>

                            <div className="flex flex-col gap-2 relative z-10">
                                {/* Miniature Header Row with 120s Label */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-[0.5px] w-4 bg-pink-400/40" />
                                        <h4 className="text-pink-300/90 font-medium text-[7px] tracking-[0.3em] uppercase font-outfit leading-none">
                                            ACHIEVEMENT
                                        </h4>
                                    </div>
                                    <span className="text-[7px] font-bold text-pink-300 font-outfit bg-pink-500/20 px-1.5 py-0.5 rounded-full border border-pink-500/20">
                                        120s
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    {/* Small Poetic Title */}
                                    <h3 className="text-white text-lg tracking-tight font-serif italic leading-none"
                                        style={{ fontFamily: "'Playfair Display', serif", textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                                        {notification.title}
                                    </h3>

                                    {/* Compact Subtitle */}
                                    <p className="text-pink-100/70 text-[13px] leading-tight font-light"
                                        style={{ fontFamily: "'Pinyon Script', cursive" }}>
                                        {notification.subtitle}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
