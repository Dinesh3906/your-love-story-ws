import { useGameStore } from "../../store/gameStore";
import { Choice } from "./BranchEngine";

export interface Scene {
  id: string;
  title: string;
  summary: string;
  dialogue: string;
  backgroundImage?: string;
  characterImage?: string;
  speaker?: string;
  mood?: string;
  tension?: number;
  location?: string;
  time?: string;
}

export const SceneBuilder = {
  buildScenes: async (userPrompt: string, history: string[] = [], chosenOption: Choice | null = null): Promise<Scene[]> => {
    try {
      const { setRawNarrative, updateStats, userGender } = useGameStore.getState();

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary_of_previous: history.length > 0
            ? `PAST EVENTS:\n${history.slice(-15).join("\n---\n")}\n\nCURRENT SITUATION:`
            : userPrompt,
          user_gender: userGender,
          chosen_option: chosenOption ? {
            id: chosenOption.id,
            text: chosenOption.text,
            intent: (chosenOption as any).intent || ""
          } : null
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }

      const data = await res.json();
      setRawNarrative(JSON.stringify(data));

      if (!data.story) {
        throw new Error("Invalid story content received.");
      }

      // Update global stats
      if (data.trust !== undefined) {
        updateStats({
          trust: data.trust - 50,
          relationship: data.trust - 50
        });
      }

      if (data.tension !== undefined) {
        useGameStore.setState((s: any) => ({
          stats: { ...s.stats, tension: data.tension }
        }));
      }

      const paragraphs = data.story.split(/\n\n+/).filter((p: string) => p.trim().length > 0);

      return paragraphs.map((p: string, index: number) => {
        let speaker = 'Narrator';
        let dialogue = p.trim();
        const speakerMatch = dialogue.match(/^([^:\n]+):\s*([\s\S]+)$/);

        if (speakerMatch) {
          speaker = speakerMatch[1];
          dialogue = speakerMatch[2];
        }

        return {
          id: `scene_${Date.now()}_${index}`,
          title: data.location_name || 'Ongoing Story',
          summary: data.mood || 'Interactive Adventure',
          dialogue: dialogue,
          backgroundImage: undefined,
          characterImage: undefined,
          speaker: speaker,
          mood: data.mood,
          tension: data.tension,
          location: data.location_name,
          time: data.time_of_day
        };
      });

    } catch (error) {
      console.error("Story generation failed:", error);
      return [{
        id: 'fallback_scene',
        title: 'Story Delay',
        summary: 'Fallback',
        dialogue: "Connecting to the mystical narrative stream...",
        speaker: 'System'
      }];
    }
  }
};