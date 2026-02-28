import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function EndingScreen({ onRestart }: { onRestart: () => void }) {
  const { stats } = useGameStore();

  return (
    <div className='h-full w-full flex items-center justify-center p-6 lg:p-12 relative overflow-hidden depth-container'>
      {/* Background Bloom Glow */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cherry-blossom/10 rounded-full blur-[140px] animate-pulse-bloom z-0'></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className='max-w-[450px] sm:max-w-[600px] w-full glass-morphism p-8 sm:p-16 lg:p-20 rounded-[40px] sm:rounded-[56px] text-center relative z-10 neon-border mx-auto'
      >
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className='text-[10px] sm:text-[12px] uppercase tracking-[0.4em] sm:tracking-[0.6em] text-cherry-blossom font-black mb-6 sm:mb-10 block'>The Blossom Fades</span>
          <h2 className='text-6xl sm:text-8xl xl:text-9xl font-serif text-white mb-2 sm:mb-4 text-glow-romantic font-light'>{stats.relationship}%</h2>
          <p className='text-[10px] sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.4em] text-white/30 font-sans mb-8 sm:mb-16'>Relationship Affinity</p>

          <div className='h-[1px] w-24 bg-white/10 mx-auto mb-16 shadow-[0_0_10px_rgba(255,183,197,0.3)]'></div>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255, 183, 197, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onRestart}
            className='w-full py-6 rounded-2xl bg-gradient-to-r from-cherry-blossom to-soft-lavender text-midnight font-black tracking-[0.5em] text-[12px] transition-all relative overflow-hidden group shadow-2xl'
          >
            <span className='relative z-10'>REVISIT THE DREAM</span>
            <div className='absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700'></div>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}