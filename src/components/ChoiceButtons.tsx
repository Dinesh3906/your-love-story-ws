import { useState } from 'react';
import { motion } from 'framer-motion';
import { Choice } from '../lib/engines/BranchEngine';

interface Props {
    choices: Choice[];
    onChoiceSelect: (choice: Choice) => void;
}

export default function ChoiceButtons({ choices, onChoiceSelect }: Props) {
    const [customChoice, setCustomChoice] = useState('');

    const handleCustomSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!customChoice.trim()) return;

        onChoiceSelect({
            id: `custom_${Date.now()}`,
            text: customChoice.trim(),
            effects: { relationship: 1, trust: 1 },
            intent: "custom"
        } as any);
        setCustomChoice('');
    };

    return (
        <div className="w-full flex flex-col gap-1.5 sm:gap-3 py-1">
            {choices.slice(0, 4).map((choice, index) => (
                <motion.button
                    key={index}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.6 }}
                    whileHover={{ scale: 1.01, x: 5, backgroundColor: 'rgba(255, 183, 197, 0.15)' }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onChoiceSelect(choice)}
                    className="group relative w-full text-left glass-morphism p-2.5 sm:p-4 lg:p-5 rounded-[16px] sm:rounded-[24px] border border-white/10 overflow-hidden transition-all duration-300 bg-cherry-blossom/5"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-cherry-blossom/0 via-cherry-blossom/10 to-cherry-blossom/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                    <div className="flex items-center gap-3 sm:gap-6 relative z-10">
                        <span className="text-cherry-blossom font-serif text-base sm:text-xl opacity-80 group-hover:opacity-100 group-hover:rotate-12 transition-all duration-300">✧</span>
                        <span className="flex-1 text-white/95 text-xs sm:text-sm lg:text-lg font-serif tracking-wide italic">
                            {choice.text}
                        </span>
                    </div>
                </motion.button>
            ))}

            {/* Custom Choice Input */}
            <motion.form
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onSubmit={handleCustomSubmit}
                className="mt-1 sm:mt-2 relative group"
            >
                <div className="relative flex items-center glass-morphism rounded-[16px] sm:rounded-[24px] border border-cherry-blossom/20 overflow-hidden bg-cherry-blossom/5">
                    <input
                        type="text"
                        value={customChoice}
                        onChange={(e) => setCustomChoice(e.target.value)}
                        placeholder="Manifest your own path..."
                        className="flex-1 bg-transparent px-4 py-2.5 sm:px-8 sm:py-4 lg:py-5 text-white placeholder:text-cherry-blossom/30 focus:outline-none text-xs sm:text-sm lg:text-base font-serif italic"
                    />
                    <button
                        type="submit"
                        disabled={!customChoice.trim()}
                        className={`px-4 sm:px-8 h-full py-2.5 sm:py-4 lg:py-5 transition-all duration-300 flex items-center gap-2 border-l border-cherry-blossom/20 ${customChoice.trim()
                            ? 'bg-cherry-blossom/20 text-cherry-blossom hover:bg-cherry-blossom/30'
                            : 'opacity-10 grayscale'
                            }`}
                    >
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] hidden sm:block">Manifest</span>
                        <span className="text-base sm:text-lg">✦</span>
                    </button>
                </div>
            </motion.form>
        </div>
    );
}
