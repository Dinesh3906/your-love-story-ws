import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

declare const google: any;

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, setUser, preferences, updateUserPreferences, isSyncing } = useGameStore();
    const [view, setView] = React.useState<'profile' | 'survey'>('profile');

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

    React.useEffect(() => {
        /* global google */
        if (typeof google !== 'undefined' && !user) {
            google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                callback: (response: any) => {
                    handleCredentialResponse(response);
                }
            });
            google.accounts.id.renderButton(
                document.getElementById("googleBtn"),
                { theme: "outline", size: "large", width: "100%" }
            );
        }
    }, [user, isOpen]);

    const handleCredentialResponse = async (response: any) => {
        try {
            // Fetch user info from our backend or decode locally
            // For now, decode JWT locally to get basic profile
            const base64Url = response.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            const newUser = {
                id: payload.sub,
                name: payload.name,
                email: payload.email,
                picture: payload.picture,
                token: response.credential, // Keep for backend verification
            };

            setUser(newUser as any);
        } catch (error) {
            console.error("Auth failed:", error);
        }
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

                            {view === 'survey' ? (
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
                                                    onChange={(e) => setLikes(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                                    placeholder="Rain, Coffee, Cats"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs focus:border-cherry-blossom/40 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[8px] uppercase tracking-[0.3em] text-soft-lavender block font-black">Dislikes (Comma separated)</label>
                                                <input
                                                    value={dislikes.join(', ')}
                                                    onChange={(e) => setDislikes(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                                    placeholder="Crowds, Noise, Heat"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs focus:border-soft-lavender/40 outline-none"
                                                />
                                            </div>
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
                            ) : user ? (
                                <div className="space-y-6">
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
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="text-center space-y-4">
                                        <p className="text-white/60 text-sm leading-relaxed">
                                            Signin to preserve your love story across all your devices, or customize your soul anonymously below.
                                        </p>
                                    </div>

                                    <div className="pt-4 space-y-4">
                                        <div id="googleBtn" className="w-full"></div>

                                        <button
                                            onClick={() => setView('survey')}
                                            className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-cherry-blossom font-black tracking-[0.3em] text-[10px] hover:bg-white/10 transition-all"
                                        >
                                            CUSTOMIZE SOUL (GUEST)
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
