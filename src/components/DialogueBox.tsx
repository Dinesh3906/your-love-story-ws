import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  speaker?: string;
  text: string;
  onComplete?: () => void;
}

export default function DialogueBox({ speaker, text, onComplete }: Props) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayText('');
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 25); // Elegant, readable pace

    return () => clearInterval(interval);
  }, [text]);

  const handleProceed = () => {
    if (isTyping) {
      setDisplayText(text);
      setIsTyping(false);
    } else {
      onComplete?.();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: 5 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="glass-morphism rounded-[32px] sm:rounded-[48px] p-5 sm:p-12 lg:p-14 shadow-2xl relative z-10 neon-border"
    >
      {/* Soft Cherry Glow Backdrop */}
      <div className='absolute -bottom-32 -right-32 w-80 h-80 bg-cherry-blossom/5 rounded-full blur-[100px] pointer-events-none'></div>

      <AnimatePresence mode="wait">
        {speaker && (
          <motion.div
            key={speaker}
            initial={{ opacity: 0, scale: 0.8, x: -20, rotateZ: -2 }}
            animate={{ opacity: 1, scale: 1, x: 0, rotateZ: 0 }}
            exit={{ opacity: 0, scale: 1.2, x: 20, rotateZ: 2 }}
            className="absolute -top-7 sm:-top-10 left-1/2 -translate-x-1/2 sm:left-14 sm:translate-x-0 py-2 sm:py-4 px-6 sm:px-12 bg-gradient-to-r from-cherry-blossom via-cherry-light to-cherry-blossom bg-[length:200%_auto] rounded-full z-40 shadow-2xl shadow-cherry-blossom/40 border border-white/10"
            style={{ animation: 'backgroundShift 6s linear infinite' }}
          >
            <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.5em] text-midnight text-shadow-sm">
              {speaker}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative pt-4 sm:pt-8">
        <div className="min-h-[80px] sm:min-h-[120px] lg:min-h-[160px] max-h-[40vh] overflow-y-auto custom-scrollbar pr-0 sm:pr-8">
          <p className="text-white/95 text-[17px] sm:text-2xl lg:text-4xl font-serif leading-[1.6] tracking-wide selection:bg-cherry-blossom/30 italic font-light drop-shadow-sm text-center sm:text-left">
            {displayText}
            {isTyping && <motion.span animate={{ opacity: [0, 1, 0], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="inline-block w-2 sm:w-3 h-6 sm:h-10 bg-cherry-blossom ml-3 sm:ml-4 align-middle" />}
          </p>
        </div>
      </div>

      <div className="flex justify-center sm:justify-end mt-6 sm:mt-14">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleProceed}
          className="group relative flex items-center justify-center"
        >
          {/* Subtle Button Glow Backdrop */}
          <div className="absolute inset-0 bg-white/5 rounded-full blur-xl group-hover:bg-cherry-blossom/10 transition-all duration-700"></div>

          <div className="glass-morphism px-8 sm:px-12 py-3 sm:py-5 rounded-full border border-white/5 group-hover:border-white/20 transition-all duration-700 flex items-center gap-4 sm:gap-8 active:scale-95 shadow-2xl relative z-10">
            <span className="text-[9px] sm:text-[11px] uppercase tracking-[0.6em] font-black text-white/40 group-hover:text-white transition-colors duration-500">
              {isTyping ? 'SKIP' : 'PROCEED'}
            </span>
            <div className="w-8 sm:w-12 h-[1px] bg-white/10 group-hover:bg-cherry-blossom group-hover:w-16 transition-all duration-1000" />
            <span className="text-cherry-blossom group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 text-xl sm:text-2xl drop-shadow-[0_0_10px_rgba(255,183,197,0.5)]">✧</span>
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}
