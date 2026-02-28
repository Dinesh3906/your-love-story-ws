import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { preferences, updateUserPreferences } = useGameStore();

    // Survey State
    const [surveyCategory, setSurveyCategory] = React.useState('General');
    const [likes, setLikes] = React.useState<string[]>([]);
    const [dislikes, setDislikes] = React.useState<string[]>([]);
    const [description, setDescription] = React.useState('');

    // Sync local state with store preferences
    React.useEffect(() => {
        setLikes(preferences.likes || []);
        setDislikes(preferences.dislikes || []);
        setDescription(preferences.description || '');
    }, [preferences, isOpen]);

    const handleSaveSurvey = () => {
        updateUserPreferences({ likes, dislikes, description });
        onClose();
    };

    const categories = ['General', 'Food', 'Places', 'Characters', 'Atmosphere'];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-safe">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg glass-morphism rounded-[32px] overflow-hidden border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                    >
                        <div className="p-8 sm:p-10 space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-serif text-white tracking-wider">
                                    SOUL CUSTOMIZATION
                                </h2>
                                <div className="h-[1px] w-20 bg-cherry-blossom mx-auto opacity-50"></div>
                            </div>

                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setSurveyCategory(cat)}
                                                className={`whitespace-nowrap px-4 py-2 rounded-full text-[9px] font-black tracking-widest uppercase transition-all border ${surveyCategory === cat ? 'bg-cherry-blossom text-midnight border-cherry-blossom' : 'bg-white/5 text-white/40 border-white/10 hover:text-white'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] uppercase tracking-[0.3em] text-white/50 block font-black">How do you describe your heart?</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder={`Describe your ${surveyCategory.toLowerCase()} preferences... (e.g., "I love rainy rooftops and bitter coffee, but I hate crowded trains.")`}
                                            className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-5 text-white focus:border-cherry-blossom/40 outline-none transition-all resize-none font-serif text-lg custom-scrollbar placeholder:text-white/20"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[8px] uppercase tracking-[0.3em] text-cherry-blossom block font-black">Likes (Comma separated)</label>
                                            <input
                                                value={likes.join(', ')}
                                                onChange={(e) => setLikes(e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0))}
                                                placeholder="Rain, Coffee, Cats"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs focus:border-cherry-blossom/40 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[8px] uppercase tracking-[0.3em] text-soft-lavender block font-black">Dislikes (Comma separated)</label>
                                            <input
                                                value={dislikes.join(', ')}
                                                onChange={(e) => setDislikes(e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0))}
                                                placeholder="Crowds, Noise, Heat"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs focus:border-soft-lavender/40 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-4 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 font-black tracking-[0.3em] text-[10px] transition-all"
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        onClick={handleSaveSurvey}
                                        className="flex-[2] py-4 rounded-full bg-soft-lavender text-midnight font-black tracking-[0.3em] text-[10px] shadow-lg hover:scale-105 transition-all"
                                    >
                                        ENSHRINE PREFERENCES
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProfileModal;
