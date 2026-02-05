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
  };
  history: string[];
  rawNarrative: string;
  userGender: 'male' | 'female';
  isMusicPlaying: boolean;
  characterBindings: Record<string, string>; // Maps relational roles to names
  stateTracker: StateTracker;

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
  updateStats: (effects: { relationship?: number; trust?: number }) => void;
  setStats: (stats: { relationship?: number; trust?: number; tension?: number }) => void;
  updateStateTracker: (updates: Partial<StateTracker>) => void;
  addToHistory: (entry: string) => void;
  resetGame: () => void;
}

const initialState: Omit<GameState, 'setScenes' | 'setCharacters' | 'updateCharacter' | 'setCurrentScene' | 'setCurrentPOV' | 'setUserPrompt' | 'setUserGender' | 'setIsMusicPlaying' | 'setRawNarrative' | 'setCharacterBindings' | 'getCurrentScene' | 'updateStats' | 'setStats' | 'updateStateTracker' | 'addToHistory' | 'resetGame'> = {
  currentSceneId: null,
  currentPOV: null,
  characters: [],
  scenes: [],
  userPrompt: '',
  stats: { relationship: 50, trust: 50, tension: 0, emotionalStability: 50 },
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
    }
  })),
  setStats: (newStats) => set((s) => ({
    stats: {
      ...s.stats,
      relationship: newStats.relationship !== undefined ? Math.min(100, Math.max(0, newStats.relationship)) : s.stats.relationship,
      trust: newStats.trust !== undefined ? Math.min(100, Math.max(0, newStats.trust)) : s.stats.trust,
      tension: newStats.tension !== undefined ? Math.min(100, Math.max(0, newStats.tension)) : s.stats.tension,
    }
  })),
  updateStateTracker: (updates) => set((s) => ({
    stateTracker: { ...s.stateTracker, ...updates }
  })),
  addToHistory: (entry) => set((s) => ({ history: [...s.history, entry] })),
  resetGame: () => set(initialState),
}));