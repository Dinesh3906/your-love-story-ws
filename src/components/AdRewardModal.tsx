import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { AdMob, RewardAdOptions, AdMobRewardItem } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

interface AdRewardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdRewardModal = ({ isOpen, onClose }: AdRewardModalProps) => {
    const { setStats, stats } = useGameStore();
    const [isLoading, setIsLoading] = useState(false);
    const [pendingReward, setPendingReward] = useState<'trust' | 'relationship' | 'vulnerable' | null>(null);

    // AdMob Configuration from User
    const ADMOB_AD_UNIT_ID = "ca-app-pub-5173875521561209/1077537977";

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            AdMob.initialize({
                testingDevices: [],
                initializeForTesting: true,
            }).catch(e => console.error("AdMob Init Error:", e));
        }
    }, []);

    const showRewardedAd = async (type: 'trust' | 'relationship' | 'vulnerable') => {
        if (!Capacitor.isNativePlatform()) {
            // Fallback for Web/Dev (Simulator)
            console.log("Not a native platform, simulating reward...");
            setIsLoading(true);
            setTimeout(() => {
                applyReward(type);
                setIsLoading(false);
            }, 2000);
            return;
        }

        try {
            setIsLoading(true);
            setPendingReward(type);

            const options: RewardAdOptions = {
                adId: ADMOB_AD_UNIT_ID,
            };

            try {
                await AdMob.prepareRewardVideoAd(options);
            } catch (error) {
                console.warn('Live Ad failed, falling back to Test ID...', error);
                // TEST ID for Rewarded Ads: ca-app-pub-3940256099942544/5224354917
                await AdMob.prepareRewardVideoAd({
                    adId: 'ca-app-pub-3940256099942544/5224354917'
                });
            }

            const reward = await AdMob.showRewardVideoAd();

            if (reward) {
                applyReward(type);
            }
        } catch (error) {
            console.error('AdMob Error:', error);
            alert("Failed to load ad. Please try again later.");
        } finally {
            setIsLoading(false);
            setPendingReward(null);
        }
    };

    const applyReward = (type: 'trust' | 'relationship' | 'vulnerable') => {
        const { applyEphemeralReward } = useGameStore.getState();
        applyEphemeralReward(type);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isLoading ? onClose : undefined}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-[#0d0d1a] border border-cherry-blossom/30 p-6 sm:p-8 rounded-3xl shadow-[0_0_60px_rgba(255,183,197,0.2)] max-w-md w-full overflow-hidden"
                    >
                        {isLoading ? (
                            <div className="py-12 flex flex-col items-center justify-center space-y-8">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-16 h-16 rounded-full border-2 border-t-cherry-blossom border-white/5"
                                />
                                <div className="text-center">
                                    <h3 className="text-white font-serif text-xl mb-2 tracking-widest text-glow-romantic uppercase">Preparing Fate...</h3>
                                    <p className="text-white/40 text-[10px] uppercase tracking-widest">Loading Reward Channel</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Decorative Elements */}


                                <h2 className="text-2xl font-serif text-white mb-2 text-center text-glow-romantic tracking-widest uppercase">Destiny's Favor</h2>
                                <p className="text-white/60 text-center mb-8 text-[11px] tracking-[0.2em] font-light uppercase">
                                    Receive a blessing from the threads of time.
                                </p>

                                <div className="space-y-4">
                                    <button
                                        onClick={() => showRewardedAd('trust')}
                                        className="w-full group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-5 transition-all hover:bg-white/10 hover:border-cherry-blossom/50 hover:shadow-[0_0_20px_rgba(255,183,197,0.3)] text-left"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-cherry-blossom font-black tracking-[0.3em] uppercase text-[9px] mb-1">Empower</span>
                                            <span className="text-white font-serif text-xl group-hover:text-glow-romantic transition-all">Absolute Trust</span>
                                        </div>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play-circle"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => showRewardedAd('relationship')}
                                        className="w-full group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-5 transition-all hover:bg-white/10 hover:border-cherry-blossom/50 hover:shadow-[0_0_20px_rgba(255,183,197,0.3)] text-left"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-cherry-blossom font-black tracking-[0.3em] uppercase text-[9px] mb-1">Deepen</span>
                                            <span className="text-white font-serif text-xl group-hover:text-glow-romantic transition-all">Total Connection</span>
                                        </div>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play-circle"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => showRewardedAd('vulnerable')}
                                        className="w-full group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-5 transition-all hover:bg-white/10 hover:border-cherry-blossom/50 hover:shadow-[0_0_20px_rgba(255,183,197,0.3)] text-left"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-cherry-blossom font-black tracking-[0.3em] uppercase text-[9px] mb-1">Expose</span>
                                            <span className="text-white font-serif text-xl group-hover:text-glow-romantic transition-all">Open Heart conversation</span>
                                        </div>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play-circle"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
                                        </div>
                                    </button>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="mt-10 w-full text-center text-white/20 text-[9px] hover:text-cherry-blossom/60 transition-all duration-300 uppercase tracking-[0.5em] font-black group"
                                >
                                    <span className="inline-block group-hover:scale-110 transform transition-transform">Refuse the blessing</span>
                                </button>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
