import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Character {
  id: string;
  name: string;
  role: string;
  themeColor?: string;
  image?: string;
  emotionalState?: string;
}

export interface ArchivedStory {
  id: string;
  prompt: string;
  timestamp: number;
  fullHistory: string[];
  scenes: Scene[];
  currentSceneId: string | null;
  rawNarrative: string;
  stats: GameState['stats'];
  userGender: 'male' | 'female';
  storyLength: 'short' | 'medium' | 'long';
  characterBindings: Record<string, string>;
  stateTracker: StateTracker;
}

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  token?: string;
}

export interface UserPreferences {
  likes: string[];
  dislikes: string[];
  description: string;
}

export interface Scene {
  id: string;
  title: string;
  summary: string;
  dialogue: string;
  backgroundImage?: string; // Base64
  characterImage?: string; // Base64
  speaker?: string;
  mood?: string;
  tension?: number;
  location?: string;
  time?: string;
  is_ending?: boolean;
}

export interface StateTracker {
  lastTrust100Timestamp: number | null;
  consecutiveIntents: Record<string, number>;
  locationVisitCounts: Record<string, number>;
  consecutiveLowRelScenes: number;
  lastIntents: string[];
  lastMoods: string[];
}

export interface GameState {
  currentSceneId: string | null;
  currentPOV: string | null;
  characters: Character[];
  scenes: Scene[];
  userPrompt: string;
  stats: {
    relationship: number;
    trust: number;
    tension: number;
    emotionalStability: number;
    vulnerable: boolean;
  };
  history: string[];
  rawNarrative: string;
  userGender: 'male' | 'female';
  storyLength: 'short' | 'medium' | 'long';
  isMusicPlaying: boolean;
  characterBindings: Record<string, string>; // Maps relational roles to names
  stateTracker: StateTracker;
  notifications: { id: string; title: string; subtitle: string; icon?: string }[];
  archive: ArchivedStory[];
  user: User | null;
  preferences: UserPreferences;
  isSyncing: boolean;
  currentStoryId: string | null;

  setScenes: (scenes: Scene[]) => void;
  setCharacters: (chars: Character[]) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  setCurrentScene: (id: string) => void;
  setCurrentPOV: (id: string) => void;
  setUserPrompt: (prompt: string) => void;
  setUserGender: (gender: 'male' | 'female') => void;
  setStoryLength: (length: 'short' | 'medium' | 'long') => void;
  setIsMusicPlaying: (playing: boolean) => void;
  setRawNarrative: (narrative: string) => void;
  setCharacterBindings: (bindings: Record<string, string>) => void;
  getCurrentScene: () => Scene | null;
  updateStats: (effects: { relationship?: number; trust?: number; vulnerable?: boolean }) => void;
  setStats: (stats: { relationship?: number; trust?: number; tension?: number; vulnerable?: boolean }) => void;
  updateStateTracker: (updates: Partial<StateTracker>) => void;
  addToHistory: (entry: string) => void;
  applyEphemeralReward: (type: 'trust' | 'relationship' | 'vulnerable') => void;
  addNotification: (title: string, subtitle: string, icon?: string) => void;
  removeNotification: (id: string) => void;
  resetGame: () => void;
  archiveCurrentStory: () => void;
  setUser: (user: User | null) => void;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => void;
  syncWithCloud: () => Promise<void>;
  resumeStory: (storyId: string) => void;
}

const initialState = {
  currentSceneId: null,
  currentPOV: null,
  characters: [],
  scenes: [],
  userPrompt: '',
  stats: { relationship: 50, trust: 50, tension: 0, emotionalStability: 50, vulnerable: false },
  history: [],
  rawNarrative: '',
  userGender: 'male' as const,
  storyLength: 'medium' as const,
  isMusicPlaying: true,
  characterBindings: {},
  stateTracker: {
    lastTrust100Timestamp: null,
    consecutiveIntents: {},
    locationVisitCounts: {},
    consecutiveLowRelScenes: 0,
    lastIntents: [],
    lastMoods: [],
  },
  notifications: [],
  user: null,
  preferences: { likes: [], dislikes: [], description: '' },
  isSyncing: false,
  currentStoryId: null,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,
      archive: [],
      setScenes: (scenes) => set({ scenes, currentSceneId: scenes[0]?.id || null }),
      setCharacters: (characters) => set({ characters, currentPOV: get().currentPOV || characters[0]?.id || null }),
      updateCharacter: (id, updates) => set((s) => ({
        characters: s.characters.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      setCurrentScene: (id) => set({ currentSceneId: id }),
      setCurrentPOV: (id) => set({ currentPOV: id }),
      setUserPrompt: (prompt) => set({ userPrompt: prompt }),
      setUserGender: (gender) => set({ userGender: gender }),
      setStoryLength: (storyLength) => set({ storyLength }),
      setIsMusicPlaying: (playing) => set({ isMusicPlaying: playing }),
      setRawNarrative: (narrative) => set({ rawNarrative: narrative }),
      setCharacterBindings: (bindings) => set({ characterBindings: bindings }),
      getCurrentScene: () => {
        const state = get();
        return state.scenes.find(s => s.id === state.currentSceneId) || null;
      },
      updateStats: (effects) => set((s) => ({
        stats: {
          ...s.stats,
          relationship: Math.min(100, Math.max(0, s.stats.relationship + (effects.relationship || 0))),
          trust: Math.min(100, Math.max(0, s.stats.trust + (effects.trust || 0))),
          vulnerable: effects.vulnerable !== undefined ? effects.vulnerable : s.stats.vulnerable,
        }
      })),
      setStats: (newStats) => set((s) => ({
        stats: {
          ...s.stats,
          relationship: newStats.relationship !== undefined ? Math.min(100, Math.max(0, newStats.relationship)) : s.stats.relationship,
          trust: newStats.trust !== undefined ? Math.min(100, Math.max(0, newStats.trust)) : s.stats.trust,
          tension: newStats.tension !== undefined ? Math.min(100, Math.max(0, newStats.tension)) : s.stats.tension,
          vulnerable: newStats.vulnerable !== undefined ? newStats.vulnerable : s.stats.vulnerable,
        }
      })),
      updateStateTracker: (updates) => set((s) => ({
        stateTracker: { ...s.stateTracker, ...updates }
      })),
      addToHistory: (entry) => set((s) => ({ history: [...s.history, entry] })),
      applyEphemeralReward: (type) => {
        const { stats, setStats, addNotification } = get();

        if (type === 'trust') {
          setStats({ ...stats, trust: 100 });
          addNotification("ABSOLUTE TRUST", "She places her faith in you entirely.");
        } else if (type === 'relationship') {
          setStats({ ...stats, relationship: 100 });
          addNotification("SOUL CONNECTION", "The invisible red threads are glowing.");
        } else if (type === 'vulnerable') {
          setStats({ ...stats, vulnerable: true });
          addNotification("OPEN HEART", "Her defenses are down. Ask her anything.");
        }

        setTimeout(() => {
          const currentStats = get().stats;
          if (type === 'trust') setStats({ ...currentStats, trust: 50 });
          else if (type === 'relationship') setStats({ ...currentStats, relationship: 50 });
          else if (type === 'vulnerable') setStats({ ...currentStats, vulnerable: false });
        }, 120000);
      },
      addNotification: (title, subtitle, icon) => {
        const id = Math.random().toString(36).substr(2, 9);
        set(s => ({
          notifications: [{ id, title, subtitle, icon }, ...s.notifications]
        }));
        setTimeout(() => get().removeNotification(id), 6000);
      },
      removeNotification: (id) => set(s => ({
        notifications: s.notifications.filter(n => n.id !== id)
      })),
      resetGame: () => set((s) => ({ ...initialState, archive: s.archive })),
      archiveCurrentStory: () => {
        const state = get();
        if (state.history.length === 0 && state.scenes.length === 0) return;

        let currentStoryId = state.currentStoryId;
        if (!currentStoryId) {
          currentStoryId = Math.random().toString(36).substr(2, 9);
          set({ currentStoryId });
        }

        const newArchive: ArchivedStory = {
          id: currentStoryId,
          prompt: state.userPrompt,
          timestamp: Date.now(),
          fullHistory: state.history,
          scenes: state.scenes,
          currentSceneId: state.currentSceneId,
          rawNarrative: state.rawNarrative,
          stats: state.stats,
          userGender: state.userGender,
          storyLength: state.storyLength,
          characterBindings: state.characterBindings,
          stateTracker: state.stateTracker
        };

        set((s) => {
          const existingIndex = s.archive.findIndex(a => a.id === currentStoryId);
          let newArchiveList = [...s.archive];
          if (existingIndex >= 0) {
            newArchiveList[existingIndex] = newArchive;
          } else {
            newArchiveList = [newArchive, ...newArchiveList];
          }
          return { archive: newArchiveList };
        });
        get().syncWithCloud();
      },
      resumeStory: (storyId) => {
        const { archive } = get();
        const story = archive.find(s => s.id === storyId);
        if (!story) return;

        set({
          currentStoryId: story.id,
          userPrompt: story.prompt,
          history: story.fullHistory,
          scenes: story.scenes,
          currentSceneId: story.currentSceneId,
          rawNarrative: story.rawNarrative,
          stats: story.stats,
          userGender: story.userGender,
          storyLength: story.storyLength,
          characterBindings: story.characterBindings,
          stateTracker: story.stateTracker
        });
      },
      setUser: (user) => {
        set({ user });
        if (user) get().syncWithCloud();
      },
      updateUserPreferences: (prefs) => set((s) => ({
        preferences: { ...s.preferences, ...prefs }
      })),
      syncWithCloud: async () => {
        const { user, archive } = get();
        if (!user) return;

        set({ isSyncing: true });
        try {
          const API_URL = import.meta.env.VITE_API_URL;
          const response = await fetch(`${API_URL}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              archive: archive
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.archive) {
              // Simple merge: cloud archive takes priority for same IDs
              const localArchive = get().archive;
              const cloudArchive = data.archive as ArchivedStory[];
              const merged = [...cloudArchive];

              localArchive.forEach(la => {
                if (!merged.find(ca => ca.id === la.id)) {
                  merged.push(la);
                }
              });

              set({ archive: merged.sort((a, b) => b.timestamp - a.timestamp) });
            }
          }
        } catch (error) {
          console.error("Cloud sync failed:", error);
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'your-love-story-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentSceneId: state.currentSceneId,
        scenes: state.scenes,
        userPrompt: state.userPrompt,
        stats: state.stats,
        history: state.history,
        userGender: state.userGender,
        storyLength: state.storyLength,
        characterBindings: state.characterBindings,
        archive: state.archive,
        user: state.user,
        preferences: state.preferences,
        currentStoryId: state.currentStoryId,
      }),
    }
  )
);
