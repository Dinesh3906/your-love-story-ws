import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, setUser, updateUserPreferences, isSyncing } = useGameStore();
    const [view, setView] = React.useState<'profile' | 'survey'>('profile');

    // Survey State
    const [surveyCategory, setSurveyCategory] = React.useState('General');
    const [likes, setLikes] = React.useState<string[]>(user?.preferences?.likes || []);
    const [dislikes, setDislikes] = React.useState<string[]>(user?.preferences?.dislikes || []);
    const [description, setDescription] = React.useState(user?.preferences?.description || '');

    const handleLogin = () => {
        // Mock Google Login
        const mockUser = {
            id: 'google_' + Math.random().toString(36).substr(2, 9),
            name: 'Dream Traveler',
            email: 'traveler@example.com',
            picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Math.random(),
            preferences: { likes: [], dislikes: [], description: '' }
        };
        setUser(mockUser);
    };

    const handleSaveSurvey = () => {
        updateUserPreferences({ likes, dislikes, description });
        setView('profile');
    };

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out? Local progress will remain.")) {
            setUser(null);
        }
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
                                    {view === 'profile' ? 'YOUR PROFILE' : 'SOUL SURVEY'}
                                </h2>
                                <div className="h-[1px] w-20 bg-cherry-blossom mx-auto opacity-50"></div>
                            </div>

                            {user ? (
                                <div className="space-y-6">
                                    {view === 'profile' ? (
                                        <>
                                            <div className="flex flex-col items-center space-y-4">
                                                <div className="relative group">
                                                    <div className="absolute -inset-1 bg-gradient-to-r from-cherry-blossom to-soft-lavender rounded-full opacity-50 blur-sm group-hover:opacity-100 transition-opacity"></div>
                                                    <img
                                                        src={user.picture}
                                                        alt={user.name}
                                                        className="relative w-24 h-24 rounded-full border-2 border-white/20 bg-midnight object-cover"
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xl font-serif text-white">{user.name}</div>
                                                    <div className="text-xs uppercase tracking-[0.2em] text-white/40">{user.email}</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => setView('survey')}
                                                    className="p-4 glass-morphism rounded-2xl border-white/5 hover:bg-white/5 transition-all group"
                                                >
                                                    <div className="text-[10px] uppercase tracking-[0.2em] text-cherry-blossom font-black mb-1 group-hover:scale-110 transition-transform">Customize Soul</div>
                                                    <div className="text-[9px] text-white/40 italic">Likes/Dislikes & Bio</div>
                                                </button>
                                                <div className="p-4 glass-morphism rounded-2xl border-white/5 flex flex-col justify-center items-center">
                                                    <div className="text-[10px] uppercase tracking-[0.2em] text-soft-lavender font-black">Cloud Sync</div>
                                                    <div className="text-[9px] text-white/40 italic">{isSyncing ? 'Syncing...' : 'Encrypted'}</div>
                                                </div>
                                            </div>

                                            <div className="pt-4 flex flex-col gap-3">
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full py-4 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 font-black tracking-[0.3em] text-[10px] transition-all"
                                                >
                                                    LOG OUT
                                                </button>
                                                <button
                                                    onClick={onClose}
                                                    className="w-full py-4 rounded-full bg-cherry-blossom text-midnight font-black tracking-[0.3em] text-[10px] shadow-lg hover:scale-105 transition-all"
                                                >
                                                    CLOSE PORTAL
                                                </button>
                                            </div>
                                        </>
                                    ) : (
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
                                                        className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-5 text-white focus:border-cherry-blossom/40 outline-none transition-all resize-none font-serif text-lg custom-scrollbar placeholder:text-white/20"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setView('profile')}
                                                    className="flex-1 py-4 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 font-black tracking-[0.3em] text-[10px] transition-all"
                                                >
                                                    BACK
                                                </button>
                                                <button
                                                    onClick={handleSaveSurvey}
                                                    className="flex-[2] py-4 rounded-full bg-soft-lavender text-midnight font-black tracking-[0.3em] text-[10px] shadow-lg hover:scale-105 transition-all"
                                                >
                                                    ENSHRINE PREFERENCES
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="text-center space-y-4">
                                        <p className="text-white/60 text-sm leading-relaxed">
                                            Signin to preserve your love story across all your devices and never lose a chapter.
                                        </p>
                                    </div>

                                    <div className="pt-4 space-y-4">
                                        <button
                                            onClick={handleLogin}
                                            className="w-full py-4 rounded-2xl bg-white text-midnight font-black tracking-[0.2em] text-[11px] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
                                        >
                                            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                            SIGN IN WITH GOOGLE
                                        </button>

                                        <button
                                            onClick={onClose}
                                            className="w-full py-4 text-[10px] uppercase tracking-[0.4em] text-white/30 hover:text-white transition-all font-black"
                                        >
                                            NOT NOW
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProfileModal;
