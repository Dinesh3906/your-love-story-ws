import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, ArchivedStory } from '../store/gameStore';
import { censorText } from '../lib/utils/CensorUtils';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: () => void;
}

export default function HistoryModal({ isOpen, onClose, onSelect }: HistoryModalProps) {
    const { archive, resumeStory, deleteStory } = useGameStore();

    const handleResume = (id: string) => {
        resumeStory(id);
        onSelect?.();
        onClose();
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this memory? This action cannot be undone.")) {
            deleteStory(id);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-xl"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        className="w-full max-w-4xl max-h-[80vh] glass-morphism rounded-[40px] overflow-hidden flex flex-col border border-white/10"
                    >
                        {/* Header */}
                        <div className="p-8 sm:p-12 border-b border-white/5 flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-widest uppercase">The Heart's Archive</h2>
                                <p className="text-cherry-blossom/60 text-xs sm:text-sm uppercase tracking-[0.3em] mt-2 font-black">Memories of seasons past</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-cherry-blossom transition-all group"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 group-hover:rotate-90 transition-transform">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 sm:p-12 custom-scrollbar space-y-8">
                            {archive.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                                    <span className="text-4xl">❀</span>
                                    <p className="text-white/30 font-serif italic text-xl">No stories have been written yet...</p>
                                </div>
                            ) : (
                                archive.map((story: ArchivedStory) => (
                                    <motion.div
                                        key={story.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        viewport={{ once: true }}
                                        onClick={() => handleResume(story.id)}
                                        className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-cherry-blossom/40 transition-all group relative overflow-hidden cursor-pointer"
                                    >
                                        <div className='absolute -top-24 -right-24 w-48 h-48 bg-cherry-blossom/5 rounded-full blur-[60px] group-hover:bg-cherry-blossom/10 transition-all duration-1000'></div>

                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 relative z-10">
                                            <div className="flex-1">
                                                <div className='flex items-center gap-3'>
                                                    <span className="text-[10px] uppercase tracking-[0.4em] text-cherry-blossom font-black">Initial Premise</span>
                                                    <span className='px-3 py-1 bg-cherry-blossom/20 text-cherry-blossom text-[8px] font-black uppercase tracking-[0.2em] rounded-full opacity-0 group-hover:opacity-100 transition-opacity'>Resume Story</span>
                                                </div>
                                                <h3 className="text-white/90 text-lg sm:text-xl font-serif mt-2 line-clamp-2 italic">"{censorText(story.prompt)}"</h3>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <button
                                                    onClick={(e) => handleDelete(e, story.id)}
                                                    className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-all absolute top-6 right-6 z-20 group/delete"
                                                    title="Delete memory"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                                <div className="text-white/40 text-[10px] uppercase tracking-widest mb-2 font-bold mt-8">
                                                    {new Date(story.timestamp).toLocaleDateString()}
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="text-right">
                                                        <div className="text-[7px] uppercase tracking-widest text-cherry-blossom font-black">Relationship</div>
                                                        <div className="text-white font-serif text-lg">{story.stats.relationship}%</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[7px] uppercase tracking-widest text-soft-lavender font-black">Trust</div>
                                                        <div className="text-white font-serif text-lg">{story.stats.trust}%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            <div className="h-[1px] w-full bg-white/5"></div>
                                            <p className="text-white/60 text-sm leading-relaxed font-sans line-clamp-3">
                                                {censorText(story.fullHistory
                                                    .filter(h => !h.startsWith('User Prompt:') && !h.startsWith('Choice:'))
                                                    .map(h => h.replace(/^Story:\s*/, ''))
                                                    .join(' '))}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
