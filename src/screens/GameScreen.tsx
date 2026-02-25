import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

import { useGameStore } from '../store/gameStore';
import DialogueBox from '../components/DialogueBox';
import ChoiceButtons from '../components/ChoiceButtons';
import ProfileModal from '../components/ProfileModal';
import HistoryModal from '../components/HistoryModal';

import { SceneBuilder } from '../lib/engines/SceneBuilder';
import { BranchEngine, Choice } from '../lib/engines/BranchEngine';

import { memo, useMemo } from 'react';

const CherryPetalSystem = memo(() => {
  const petals = useMemo(() => Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    size: Math.random() * 12 + 6,
    x: Math.random() * 100,
    y: -5,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
    windX: Math.random() * 200 + 50,
    windY: 1000,
    windZ: (Math.random() - 0.5) * 200,
  })), []);

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
            willChange: 'transform, opacity'
          }}
          animate={{
            x: [0, p.windX],
            y: [0, p.windY],
            z: [0, p.windZ],
            rotateX: [0, 360],
            rotateY: [0, 720],
            opacity: [0, 0.4, 0.4, 0],
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
});

export default function GameScreen({ onGameOver }: { onGameOver: () => void }) {
  const { stats, scenes, setScenes, getCurrentScene, setCurrentScene, updateStats, setStats, userPrompt, history, addToHistory, user } = useGameStore();
  const [showChoices, setShowChoices] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
        if (generatedScenes[0]?.id !== 'fallback_mist_scene') {
          const fullStory = generatedScenes.map(s => `${s.speaker}: ${s.dialogue}`).join("\n");
          addToHistory(`Story: ${fullStory}`);
        }
        // Save to archive immediately after initial scenes are built
        useGameStore.getState().archiveCurrentStory();
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
  const [customInput, setCustomInput] = useState('');
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleCustomSubmit = () => {
    if (!customInput.trim()) return;
    handleChoiceSelect({
      id: 'custom_' + Date.now(),
      text: customInput,
      intent: 'manifestation',
      effects: {}
    });
    setCustomInput('');
    setIsInputOpen(false);
  };

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
    setIsInputOpen(false);

    try {
      const nextScenes = await SceneBuilder.buildScenes(userPrompt, history, choice);

      // Check if the narrative has ended
      const lastSceneRaw = nextScenes[nextScenes.length - 1] as any;
      if (lastSceneRaw.is_ending) {
        // APPEND scenes
        const updatedScenes = [...scenes, ...nextScenes];
        setScenes(updatedScenes);

        // Final text segment
        const newIndex = scenes.length;
        setSceneIndex(newIndex);
        setCurrentScene(nextScenes[0].id);

        // Archive and transition after a delay or on next click
        useGameStore.getState().archiveCurrentStory();
        setTimeout(() => onGameOver(), 5000); // Give time to read the final segment
      } else {
        // APPEND scenes instead of replacing to allow "Previous" navigation
        const updatedScenes = [...scenes, ...nextScenes];
        setScenes(updatedScenes);

        // Start at the first NEW scene
        const newIndex = scenes.length;
        setSceneIndex(newIndex);
        setCurrentScene(nextScenes[0].id);
      }

      // ONLY add to history if it's NOT a fallback scene
      if (nextScenes[0].id !== 'fallback_mist_scene') {
        const fullStory = nextScenes.map(s => `${s.speaker}: ${s.dialogue}`).join("\n");
        addToHistory(fullStory);
      }

      // Continuous Archiving
      useGameStore.getState().archiveCurrentStory();
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
      <div className='absolute top-0 left-0 right-0 z-40 px-3 py-3 sm:px-6 sm:py-6 lg:px-16 lg:py-10 flex flex-row items-start justify-between gap-2 pointer-events-none pt-safe'>
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className='flex flex-col sm:flex-row items-start gap-2 sm:gap-4'
        >
          <div className='flex gap-2 pointer-events-auto'>
            <button
              onClick={() => setIsProfileOpen(true)}
              className='glass-morphism p-2.5 sm:p-4 rounded-full border-white/5 text-white/60 hover:text-white transition-colors cursor-pointer group'
            >
              {user ? (
                <img src={user.picture} alt="Profile" className="w-5 h-5 rounded-full" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => {
                if (window.confirm("Return to main menu? Your current progress is saved.")) {
                  onGameOver();
                }
              }}
              className='glass-morphism p-2.5 sm:p-4 rounded-full border-white/5 text-white/60 hover:text-white transition-colors cursor-pointer group'
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </button>

            <button
              onClick={() => setIsHistoryOpen(true)}
              className='glass-morphism p-2.5 sm:p-4 rounded-full border-white/5 text-white/60 hover:text-white transition-colors cursor-pointer group'
              title="Story Archive"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
              </svg>
            </button>
          </div>

          {/* Relationship Stats - More compact for mobile */}
          <div className='glass-morphism px-3 py-2 sm:px-6 sm:py-3 rounded-[16px] sm:rounded-[20px] flex items-center gap-3 sm:gap-6 border-white/5 pointer-events-auto'>
            <div className='flex flex-col'>
              <span className='text-[6px] sm:text-[9px] uppercase tracking-[0.2em] text-cherry-blossom font-black opacity-70'>Rel</span>
              <span className='text-xs sm:text-xl font-serif text-white uppercase leading-tight'>{stats.relationship}%</span>
            </div>
            <div className='w-[1px] h-5 sm:h-8 bg-white/10'></div>
            <div className='flex flex-col'>
              <span className='text-[6px] sm:text-[9px] uppercase tracking-[0.2em] text-soft-lavender font-black opacity-70'>Trust</span>
              <span className='text-xs sm:text-xl font-serif text-white uppercase leading-tight'>{stats.trust}%</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className='flex flex-col items-end gap-3 pointer-events-none'
        >
          <div className='text-right pointer-events-auto'>
            <div className='text-[7px] sm:text-[11px] uppercase tracking-[0.4em] text-white/50 mb-0.5 sm:mb-1'>Location</div>
            <div className='text-xs sm:text-lg xl:text-xl text-white font-serif italic text-glow-romantic font-light leading-tight'>{currentScene.location || 'Spring Echoes'}</div>
          </div>

          <div className='flex flex-col items-end gap-1.5'>
            <div className='w-24 sm:w-32 xl:w-40 h-[1.5px] bg-white/10 rounded-full overflow-hidden shadow-[0_0_10px_rgba(255,183,197,0.1)]'>
              <motion.div
                className='h-full bg-gradient-to-r from-cherry-blossom to-soft-lavender shadow-[0_0_20px_rgba(255,183,197,0.4)]'
                animate={{ width: `${stats.tension}%` }}
                transition={{ duration: 1.5 }}
              />
            </div>
            <div className='text-[7px] sm:text-[9px] uppercase tracking-[0.3em] text-white/40 mr-1'>Tension</div>
          </div>

          {/* Vulnerable Mode Toggle - Moved into Flow */}
          <button
            onClick={() => {
              const current = stats.vulnerable;
              setStats({ ...stats, vulnerable: !current });
              if (!current) {
                useGameStore.getState().addNotification("VULNERABLE MODE", "The wall around her heart has crumbled.");
              }
            }}
            className={`pointer-events-auto px-3 py-1.5 rounded-full border text-[7px] sm:text-[9px] uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-1.5 ${stats.vulnerable ? 'bg-cherry-blossom/20 border-cherry-blossom text-cherry-blossom shadow-[0_0_15px_rgba(255,183,197,0.3)]' : 'bg-black/20 border-white/10 text-white/40 hover:text-white/60'}`}
          >
            <div className={`w-1 h-1 rounded-full ${stats.vulnerable ? 'bg-cherry-blossom animate-pulse' : 'bg-white/20'}`}></div>
            Vulnerable
          </button>
        </motion.div>

      </div>

      {/* Dynamic Scene Background */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentScene.backgroundImage || currentScene.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className='absolute inset-0 z-0'
          style={{
            backgroundImage: currentScene.backgroundImage ? `url(${currentScene.backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#0a0a0f',
            willChange: 'transform, opacity'
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
      <div className='flex-1 flex flex-col justify-center sm:justify-end pt-12 md:pt-20 lg:pt-24 xl:pt-32 pb-12 sm:pb-8 px-4 sm:px-10 lg:px-20 relative z-30 depth-container'>
        <div className='w-full max-w-[1100px] xl:max-w-[1400px] mx-auto'>
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
                <span className='px-8 py-2.5 glass-morphism text-cherry-blossom rounded-full text-[10px] font-black uppercase tracking-[0.4em] neon-border'>
                  THE WHISPER OF FATE
                </span>
              </div>
              <div className='max-w-[850px] mx-auto space-y-6'>
                {!isInputOpen ? (
                  <>
                    <ChoiceButtons
                      choices={choices}
                      onChoiceSelect={handleChoiceSelect}
                    />
                    <div className="flex justify-center">
                      <button
                        onClick={() => setIsInputOpen(true)}
                        className="py-2 px-8 text-[9px] uppercase tracking-[0.4em] text-white/40 hover:text-cherry-blossom transition-all border border-white/5 rounded-full hover:bg-white/5"
                      >
                        Write your own response...
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="glass-morphism p-6 sm:p-8 rounded-[32px] border-white/10 animate-in fade-in zoom-in duration-300">
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Type your heart's desire..."
                      className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-cherry-blossom/50 outline-none transition-all resize-none font-serif text-lg custom-scrollbar"
                      autoFocus
                    />
                    <div className="flex justify-between items-center mt-4">
                      <button
                        onClick={() => setIsInputOpen(false)}
                        className="text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCustomSubmit}
                        disabled={!customInput.trim()}
                        className="py-3 px-10 bg-cherry-blossom rounded-xl text-midnight font-black text-[11px] uppercase tracking-[0.3em] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
                      >
                        Seal Fate
                      </button>
                    </div>
                  </div>
                )}
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
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={() => {
          // Reset scene index to the end of the resumed story or specific point?
          // The resumeStory action in store already updates currentSceneId and scenes.
          // We should reset the local sceneIndex to match the state.
          const resumeIndex = useGameStore.getState().scenes.length - 1;
          setSceneIndex(resumeIndex >= 0 ? resumeIndex : 0);
          setShowChoices(false);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
