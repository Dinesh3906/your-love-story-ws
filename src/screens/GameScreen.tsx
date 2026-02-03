import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

import { useGameStore } from '../store/gameStore';
import DialogueBox from '../components/DialogueBox';
import ChoiceButtons from '../components/ChoiceButtons';
import { SceneBuilder } from '../lib/engines/SceneBuilder';
import { BranchEngine, Choice } from '../lib/engines/BranchEngine';

const CherryPetalSystem = () => {
  const petals = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    size: Math.random() * 15 + 8,
    x: Math.random() * 100,
    y: -5,
    duration: Math.random() * 8 + 7,
    delay: Math.random() * 5,
    windX: Math.random() * 300 + 100,
    windY: 1000,
    windZ: (Math.random() - 0.5) * 300,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
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
          }}
          animate={{
            x: [0, p.windX],
            y: [0, p.windY],
            z: [0, p.windZ],
            rotateX: [0, 360],
            rotateY: [0, 720],
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

export default function GameScreen({ onGameOver }: { onGameOver: () => void }) {
  const { stats, scenes, setScenes, getCurrentScene, setCurrentScene, updateStats, userPrompt, history, addToHistory } = useGameStore();
  const [showChoices, setShowChoices] = useState(false);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Parallax Setup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 100 });
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const initializeGame = async () => {
      setIsLoading(true);
      try {
        const generatedScenes = await SceneBuilder.buildScenes(userPrompt, []);
        setScenes(generatedScenes);
        addToHistory(`User Prompt: ${userPrompt}`);
        const fullStory = generatedScenes.map(s => `${s.speaker}: ${s.dialogue}`).join("\n");
        addToHistory(`Story: ${fullStory}`);
      } catch (error) {
        console.error("Initialization failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (scenes.length === 0 && !isLoading) {
      initializeGame();
    }
  }, [scenes.length, setScenes, userPrompt, addToHistory, isLoading]);

  const currentScene = getCurrentScene();

  const handleDialogueComplete = async () => {
    if (!scenes || scenes.length === 0) return;

    if (sceneIndex >= scenes.length - 1) {
      setIsLoading(true);
      try {
        const generatedChoices = await BranchEngine.generateChoices();
        setChoices(generatedChoices);
        setShowChoices(true);
      } catch (error) {
        console.error("Error generating choices:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      const nextIndex = sceneIndex + 1;
      setSceneIndex(nextIndex);
      if (scenes[nextIndex]) {
        setCurrentScene(scenes[nextIndex].id);
      }
    }
  };

  const [lastChoice, setLastChoice] = useState<Choice | null>(null);

  const handleChoiceSelect = async (choice: Choice) => {
    if (choice.id === 'narrative_retry') {
      if (lastChoice) {
        handleChoiceSelect(lastChoice);
        return;
      } else {
        // If we fail on the first scene, just re-initialize
        setShowChoices(false);
        setIsLoading(true);
        const generatedScenes = await SceneBuilder.buildScenes(userPrompt, []);
        setScenes(generatedScenes);
        setIsLoading(false);
        return;
      }
    }

    setLastChoice(choice);
    updateStats(choice.effects);
    addToHistory(`Choice: ${choice.text}`);
    setIsLoading(true);
    setShowChoices(false);

    try {
      const nextScenes = await SceneBuilder.buildScenes(userPrompt, history, choice);

      // APPEND scenes instead of replacing to allow "Previous" navigation
      const updatedScenes = [...scenes, ...nextScenes];
      setScenes(updatedScenes);

      // Start at the first NEW scene
      const newIndex = scenes.length;
      setSceneIndex(newIndex);
      setCurrentScene(nextScenes[0].id);

      const fullStory = nextScenes.map(s => `${s.speaker}: ${s.dialogue}`).join("\n");
      addToHistory(`Story: ${fullStory}`);
    } catch (error) {
      console.error("Failed to continue story:", error);
      onGameOver();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (showChoices) {
      setShowChoices(false);
      return;
    }

    if (sceneIndex > 0) {
      const prevIndex = sceneIndex - 1;
      setSceneIndex(prevIndex);
      setCurrentScene(scenes[prevIndex].id);
    }
  };

  if (isLoading || !currentScene) {
    return (
      <div className='h-full w-full bg-transparent flex items-center justify-center p-4 sm:p-12'>
        <motion.div
          animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.98, 1, 0.98] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className='text-center space-y-8'
        >
          <div className='text-cherry-blossom text-5xl sm:text-6xl font-serif tracking-[0.2em] sm:tracking-[0.4em] uppercase text-glow-romantic drop-shadow-[0_0_20px_rgba(255,183,197,0.5)]'>Awaiting the Season...</div>
          <div className='text-white/60 sm:text-white/20 text-[14px] sm:text-[12px] tracking-[0.3em] sm:tracking-[0.6em] font-sans italic'>The wind carries your next chapter</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='h-full w-full bg-transparent flex flex-col relative overflow-hidden depth-container'>
      <CherryPetalSystem />

      {/* Cinematic HUD (Top) */}
      <div className='absolute top-0 left-0 right-0 z-40 px-3 py-3 sm:px-6 sm:py-6 lg:px-16 lg:py-10 flex flex-row justify-between items-start gap-2 sm:gap-6 pointer-events-none pt-safe'>
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className='flex gap-4'
        >
          {/* Relationship Stats */}
          <div className='glass-morphism px-3 py-2 sm:px-8 sm:py-4 rounded-[16px] sm:rounded-[24px] flex items-center gap-3 sm:gap-8 border-white/5 pointer-events-auto'>
            <div className='flex flex-col'>
              <span className='text-[7px] sm:text-[10px] uppercase tracking-[0.3em] text-cherry-blossom font-black'>Affinity</span>
              <span className='text-sm sm:text-2xl font-serif text-white uppercase leading-tight'>{stats.relationship}%</span>
            </div>
            <div className='w-[1px] h-6 sm:h-10 bg-white/10'></div>
            <div className='flex flex-col'>
              <span className='text-[7px] sm:text-[10px] uppercase tracking-[0.3em] text-soft-lavender font-black'>Bond</span>
              <span className='text-sm sm:text-2xl font-serif text-white uppercase leading-tight'>{stats.trust}%</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className='flex flex-col items-end gap-3 pointer-events-auto'
        >
          <div className='text-right'>
            <div className='text-[7px] sm:text-[11px] uppercase tracking-[0.4em] text-white/50 mb-0.5 sm:mb-1'>Location</div>
            <div className='text-xs sm:text-xl xl:text-2xl text-white font-serif italic text-glow-romantic font-light leading-tight'>{currentScene.location || 'Spring Echoes'}</div>
          </div>
          <div className='w-32 sm:w-48 xl:w-56 h-[1px] sm:h-[2px] bg-white/10 rounded-full overflow-hidden shadow-[0_0_10px_rgba(255,183,197,0.1)]'>
            <motion.div
              className='h-full bg-gradient-to-r from-cherry-blossom to-soft-lavender shadow-[0_0_20px_rgba(255,183,197,0.4)]'
              animate={{ width: `${stats.tension}%` }}
              transition={{ duration: 1.5 }}
            />
          </div>
          <div className='text-[8px] sm:text-[10px] uppercase tracking-[0.3em] text-white/40 mr-1'>Tension</div>
        </motion.div>
      </div>

      {/* Dynamic Scene Background */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentScene.backgroundImage || currentScene.id}
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5 }}
          className='absolute inset-0 z-0'
          style={{
            backgroundImage: currentScene.backgroundImage ? `url(${currentScene.backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#0a0a0f'
          }}
        />
      </AnimatePresence>

      {/* Character Sprite Layer (3D-ish feel) */}
      <AnimatePresence mode='wait'>
        {currentScene.characterImage && (
          <motion.div
            key={currentScene.characterImage}
            initial={{ opacity: 0, x: -80, scale: 0.9, rotateY: 10 }}
            animate={{ opacity: 1, x: 100, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, x: 150, scale: 1.1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className='absolute left-0 bottom-0 z-20 w-full h-[95%] flex justify-start items-end pointer-events-none'
          >
            <img
              src={currentScene.characterImage}
              alt="Character"
              className="h-[90%] lg:h-full object-contain object-bottom drop-shadow-[0_0_60px_rgba(0,0,0,0.9)] filter brightness-95 contrast-105"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Overlays */}
      <div className='absolute inset-x-0 bottom-0 h-2/3 z-10 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none'></div>
      <div className='absolute inset-0 z-10 pointer-events-none noise-overlay opacity-5'></div>

      {/* Story Narrative Layer */}
      <div className='flex-1 flex flex-col justify-center sm:justify-end pt-24 lg:pt-44 pb-16 sm:pb-10 px-4 sm:px-10 lg:px-20 relative z-30 depth-container'>
        <div className='w-full max-w-[1100px] mx-auto'>
          {!showChoices ? (
            <DialogueBox
              speaker={currentScene.speaker}
              text={currentScene.dialogue}
              onComplete={handleDialogueComplete}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 50, rotateX: -10 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              className='space-y-8 sm:space-y-10'
            >
              <div className='text-center px-4'>
                <span className='px-10 py-3 glass-morphism text-cherry-blossom rounded-full text-[11px] font-black uppercase tracking-[0.5em] neon-border shadow-2xl'>
                  THE WHISPER OF FATE
                </span>
              </div>
              <div className='max-w-[850px] mx-auto'>
                <ChoiceButtons
                  choices={choices}
                  onChoiceSelect={handleChoiceSelect}
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Previous Scene Button */}
        {(sceneIndex > 0 || showChoices) && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            whileHover={{ opacity: 1, scale: 1.1 }}
            onClick={handlePrevious}
            className="fixed bottom-8 left-8 z-50 p-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white/60 hover:text-white transition-all group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 group-hover:-translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </motion.button>
        )}
      </div>
    </div>
  );
}
