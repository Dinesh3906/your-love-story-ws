import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { AdRewardModal } from './AdRewardModal';

export const MusicControls = () => {
    const { isMusicPlaying, setIsMusicPlaying } = useGameStore();
    const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

    return (
        <>
            {/* Watch Ad Button - Positioned to the left of the Music Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 183, 197, 0.2)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsRewardModalOpen(true)}
                className="fixed bottom-16 right-4 sm:bottom-20 sm:right-8 z-[100] p-3 sm:p-4 rounded-full glass-morphism border border-cherry-blossom/60 text-white shadow-[0_0_30px_rgba(255,183,197,0.4)] hover:shadow-[0_0_40px_rgba(255,183,197,0.6)] transition-all group overflow-hidden"
                title="Watch Ad for Rewards"
            >
                <div className="relative z-10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gift sm:w-5 sm:h-5 text-cherry-blossom"><polyline points="20 12 20 22 4 22 4 12" /><rect width="20" height="5" x="2" y="7" /><line x1="12" x2="12" y1="22" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
                </div>
            </motion.button>

            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[100] p-3 sm:p-4 rounded-full glass-morphism border border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all group overflow-hidden"
                title={isMusicPlaying ? "Mute Music" : "Play Music"}
            >
                <div className="relative z-10 flex items-center justify-center">
                    {isMusicPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume-2 sm:w-5 sm:h-5"><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume-x sm:w-5 sm:h-5"><path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" x2="17" y1="9" y2="15" /><line x1="17" x2="23" y1="9" y2="15" /></svg>
                    )}
                </div>
                {!isMusicPlaying && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: '20px', opacity: 1 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[1.5px] sm:h-[2px] bg-cherry-blossom rotate-45 pointer-events-none"
                    />
                )}
            </motion.button>

            <AdRewardModal
                isOpen={isRewardModalOpen}
                onClose={() => setIsRewardModalOpen(false)}
            />
        </>
    );
};
