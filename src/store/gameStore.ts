import { create } from 'zustand';

export interface Character {
  id: string;
  name: string;
  role: string;
  themeColor?: string;
  image?: string;
  emotionalState?: string;
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
  isMusicPlaying: boolean;
  characterBindings: Record<string, string>; // Maps relational roles to names
  stateTracker: StateTracker;
  notifications: { id: string; title: string; subtitle: string; icon?: string }[];

  setScenes: (scenes: Scene[]) => void;
  setCharacters: (chars: Character[]) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  setCurrentScene: (id: string) => void;
  setCurrentPOV: (id: string) => void;
  setUserPrompt: (prompt: string) => void;
  setUserGender: (gender: 'male' | 'female') => void;
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
}

const initialState: Omit<GameState, 'setScenes' | 'setCharacters' | 'updateCharacter' | 'setCurrentScene' | 'setCurrentPOV' | 'setUserPrompt' | 'setUserGender' | 'setIsMusicPlaying' | 'setRawNarrative' | 'setCharacterBindings' | 'getCurrentScene' | 'updateStats' | 'setStats' | 'updateStateTracker' | 'addToHistory' | 'applyEphemeralReward' | 'addNotification' | 'removeNotification' | 'resetGame'> = {
  currentSceneId: null,
  currentPOV: null,
  characters: [],
  scenes: [],
  userPrompt: '',
  stats: { relationship: 50, trust: 50, tension: 0, emotionalStability: 50, vulnerable: false },
  history: [],
  rawNarrative: '',
  userGender: 'male' as const,
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
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,
  setScenes: (scenes) => set({ scenes, currentSceneId: scenes[0]?.id || null }),
  setCharacters: (characters) => set({ characters, currentPOV: get().currentPOV || characters[0]?.id || null }),
  updateCharacter: (id, updates) => set((s) => ({
    characters: s.characters.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  setCurrentScene: (id) => set({ currentSceneId: id }),
  setCurrentPOV: (id) => set({ currentPOV: id }),
  setUserPrompt: (prompt) => set({ userPrompt: prompt }),
  setUserGender: (gender) => set({ userGender: gender }),
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

    // 1. Apply Reward and Trigger Notification
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

    // 2. Start Decay Timer (120 seconds)
    console.log(`[Reward] ${type} applied. Resetting in 120 seconds...`);
    setTimeout(() => {
      console.log(`[Reward] 120s elapsed. Resetting ${type} to baseline.`);
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
    // Auto-remove after 6 seconds
    setTimeout(() => get().removeNotification(id), 6000);
  },
  removeNotification: (id) => set(s => ({
    notifications: s.notifications.filter(n => n.id !== id)
  })),
  resetGame: () => set(initialState),
}));