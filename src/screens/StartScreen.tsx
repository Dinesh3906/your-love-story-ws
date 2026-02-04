import { useState, useEffect, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

const CherryPetalSystem = () => {
  const petals = useMemo(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      size: Math.random() * 20 + 10,
      x: Math.random() * 100,
      y: -10, // Start above screen
      z: Math.random() * 500 - 250, // Depth
      rotX: Math.random() * 360,
      rotY: Math.random() * 360,
      rotZ: Math.random() * 360,
      windX: (Math.random() - 0.2) * 400 + 200, // Drift right predominantly
      windY: Math.random() * 600 + 800, // Fall down
      windZ: (Math.random() - 0.5) * 400, // Move in depth
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 10,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none depth-container">
      {petals.map((p) => (
        <motion.div
          key={p.id}
          className="cherry-petal"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundImage: 'url("/cherry_petal.png")',
            backgroundSize: 'cover',
            '--wind-x': `${p.windX}px`,
            '--wind-y': `${p.windY}px`,
            '--wind-z': `${p.windZ}px`,
          } as any}
          animate={{
            x: [0, p.windX],
            y: [0, p.windY],
            z: [0, p.windZ],
            rotateX: [p.rotX, p.rotX + 720],
            rotateY: [p.rotY, p.rotY + 360],
            rotateZ: [p.rotZ, p.rotZ + 180],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: [0.45, 0, 0.55, 1], // Custom cubic-bezier for natural drift
          }}
        />
      ))}
    </div>
  );
};

export default function StartScreen({ onStart }: { onStart: () => void }) {
  const [input, setInput] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const { resetGame, setUserPrompt, setUserGender } = useGameStore();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 40, stiffness: 80 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Parallax for the card
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const handleStart = () => {
    resetGame();
    setUserPrompt(input);
    setUserGender(gender);
    onStart();
  };

  return (
    <div className='h-full w-full flex flex-col lg:flex-row relative z-20 overflow-hidden depth-container'>
      <CherryPetalSystem />

      {/* LEFT SIDE: Emotional atmosphere zone (60%) */}
      <div className='hidden lg:flex lg:w-[60%] h-full flex-col justify-center px-12 lg:px-20 xl:px-28 relative z-10'>
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className='relative z-20'
        >
          <h1 className='text-7xl lg:text-8xl xl:text-9xl font-serif text-white tracking-widest leading-[0.95] text-glow-romantic animate-title-shimmer select-none font-black'>
            YOUR LOVE <br />
            STORY
          </h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex items-center gap-6 mt-8"
          >
            <div className="h-[1px] w-16 bg-cherry-blossom/50"></div>
            <p className='text-xl xl:text-3xl text-white/90 font-script tracking-wide'>
              Only the heart remembers what the mind forgets.
            </p>
          </motion.div>

          <div className='mt-20 space-y-8 italic font-light text-white/50 max-w-lg'>
            <motion.p animate={{ x: [0, 10, 0], opacity: [0.4, 0.7, 0.4] }} transition={{ repeat: Infinity, duration: 8 }} className='text-xl xl:text-2xl'>"In the whisper of falling petals, I found your name."</motion.p>
            <motion.p animate={{ x: [0, -10, 0], opacity: [0.4, 0.7, 0.4] }} transition={{ repeat: Infinity, duration: 10, delay: 2 }} className='text-xl xl:text-2xl font-cursive'>"A spring that never ends, as long as we remain."</motion.p>
          </div>
        </motion.div>

        {/* Dynamic Bloom Aura */}
        <div className='absolute top-1/2 left-0 -translate-y-1/2 w-[1000px] h-[1000px] bg-cherry-blossom/10 rounded-full blur-[160px] animate-pulse-bloom z-0'></div>
      </div>

      <div className='lg:hidden w-full pt-safe pb-4 text-center relative z-20 px-6'>
        <h1 className='text-3xl sm:text-5xl font-serif text-white tracking-widest text-glow-romantic animate-title-shimmer inline-block font-black'>YOUR LOVE STORY</h1>
        <p className='mt-2 text-[14px] sm:text-[16px] text-white/80 font-script'>Only the heart remembers what the mind forgets.</p>
      </div>

      {/* RIGHT SIDE: Interactive glassmorphism card (40%) */}
      <div className='flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 xl:p-24 relative z-30 depth-container'>
        <motion.div
          style={{ rotateX, rotateY, perspective: 1500, translateZ: 100 }}
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.8, type: 'spring' }}
          className='w-full max-w-[560px] lg:max-w-[500px] glass-morphism p-7 sm:p-10 lg:p-12 rounded-[36px] sm:rounded-[40px] neon-border animate-float relative overflow-hidden group'
        >
          {/* Internal Bloom for the card */}
          <div className='absolute -top-32 -right-32 w-64 h-64 bg-cherry-blossom/5 rounded-full blur-[70px] group-hover:bg-cherry-blossom/15 transition-all duration-1000'></div>

          <div className='space-y-8 relative z-10'>
            <div className='space-y-4'>
              <div className="flex items-center justify-center sm:justify-start gap-4">
                <span className="text-cherry-blossom text-xl">✧</span>
                <label className='text-[10px] uppercase tracking-[0.5em] text-cherry-blossom font-black text-center sm:text-left'>The Heart's Beginning</label>
              </div>
              <div className='relative'>
                <textarea
                  className='w-full h-48 sm:h-64 lg:h-72 p-7 sm:p-8 rounded-[24px] sm:rounded-[28px] lg:rounded-[24px] bg-black/50 border border-white/40 outline-none transition-all resize-none font-sans text-base sm:text-lg text-white/90 placeholder-white/40 focus:border-cherry-blossom/20 focus:ring-1 focus:ring-cherry-blossom/5 custom-scrollbar leading-relaxed'
                  placeholder='Write your fantacy or story here in 3-4 lines...'
                  value={input}
                  onChange={e => setInput(e.target.value)}
                />
              </div>

              {/* Gender Selection */}
              <div className='space-y-4'>
                <div className="flex items-center justify-center sm:justify-start gap-4">
                  <span className="text-cherry-blossom text-sm">✧</span>
                  <label className='text-[10px] uppercase tracking-[0.5em] text-cherry-blossom font-black text-center sm:text-left'>Who are you?</label>
                </div>
                <div className='flex p-1 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md relative overflow-hidden'>
                  <motion.div
                    className='absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-xl border border-white/20'
                    animate={{ x: gender === 'male' ? 0 : '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                  <button
                    onClick={() => setGender('male')}
                    className={`flex-1 py-3 text-[10px] font-black tracking-[0.2em] uppercase relative z-10 transition-colors duration-300 ${gender === 'male' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
                  >
                    Male
                  </button>
                  <button
                    onClick={() => setGender('female')}
                    className={`flex-1 py-3 text-[10px] font-black tracking-[0.2em] uppercase relative z-10 transition-colors duration-300 ${gender === 'female' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
                  >
                    Female
                  </button>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(255, 183, 197, 0.4)' }}
              whileTap={{ scale: 0.96 }}
              onClick={handleStart}
              className='w-full py-5 sm:py-6 lg:py-5 rounded-2xl bg-gradient-to-br from-cherry-blossom via-soft-lavender to-cherry-blossom bg-[length:200%_auto] hover:bg-right transition-all duration-700 text-midnight font-black tracking-[0.4em] text-[11px] sm:text-[12px] lg:text-[10px] shadow-[0_20px_60px_-15px_rgba(255,183,197,0.3)] relative overflow-hidden group'
            >
              <span className='relative z-10'>BEGIN JOURNEY</span>
              <div className='absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700'></div>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Ambient light for mobile */}
      <div className='lg:hidden absolute bottom-[-15%] left-1/2 -translate-x-1/2 w-96 h-96 bg-cherry-blossom/20 rounded-full blur-[120px] z-10 animate-pulse-bloom'></div>
    </div>
  );
}