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
      const { setRawNarrative, setStats, userGender, getCurrentScene, stats, stateTracker, updateStateTracker } = useGameStore.getState();
      const currentScene = getCurrentScene();
      const currentLocation = currentScene?.location;

      // Update State Tracker Logic (Before request)
      const now = Date.now();
      let lastTrustTimestamp = stateTracker.lastTrust100Timestamp;
      if (stats.trust >= 100) {
        if (!lastTrustTimestamp) lastTrustTimestamp = now;
      } else {
        lastTrustTimestamp = null;
      }

      const locationCounts = { ...stateTracker.locationVisitCounts };
      if (currentLocation) {
        locationCounts[currentLocation] = (locationCounts[currentLocation] || 0) + 1;
      }

      const currentIntent = chosenOption?.intent || "";
      const lastIntents = [...stateTracker.lastIntents, currentIntent].slice(-10);

      let consecutiveIntentCount = 1;
      for (let i = lastIntents.length - 2; i >= 0; i--) {
        if (lastIntents[i] === currentIntent && currentIntent !== "") consecutiveIntentCount++;
        else break;
      }

      const consecutiveLowRel = stats.relationship < 10 ? stateTracker.consecutiveLowRelScenes + 1 : 0;

      const indicators = {
        seconds_at_max_trust: lastTrustTimestamp ? Math.floor((now - lastTrustTimestamp) / 1000) : 0,
        consecutive_intent_count: consecutiveIntentCount,
        last_intent: currentIntent,
        location_visit_count: currentLocation ? locationCounts[currentLocation] : 0,
        consecutive_low_rel_scenes: consecutiveLowRel,
        total_scenes: history.length,
        time_of_day: currentScene?.time || "Unknown"
      };

      // Sync back to store
      updateStateTracker({
        lastTrust100Timestamp: lastTrustTimestamp,
        locationVisitCounts: locationCounts,
        lastIntents,
        consecutiveLowRelScenes: consecutiveLowRel
      });

      const API_URL = import.meta.env.VITE_API_URL || 'https://your-love-story-ai-backend.yourlovestory.workers.dev';

      let res;
      let data;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          res = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              summary_of_previous: history.length > 0
                ? `INITIAL PREMISE: ${userPrompt}\n\nPAST EVENTS:\n${history.slice(-15).join("\n---\n")}\n\nCURRENT SITUATION:`
                : `INITIAL PREMISE: ${userPrompt}`,
              user_gender: userGender,
              current_location: currentLocation,
              current_stats: {
                relationship: stats.relationship,
                trust: stats.trust,
                tension: stats.tension
              },
              indicators: indicators,
              chosen_option: chosenOption ? {
                id: chosenOption.id,
                text: chosenOption.text,
                intent: (chosenOption as any).intent || ""
              } : null
            }),
          });

          if (!res.ok) {
            throw new Error(`Status: ${res.status}`);
          }

          data = await res.json();

          if (!data || !data.story) {
            console.error("Invalid response data:", data);
            throw new Error("Invalid story content received (missing story field).");
          }

          // If we got here, we have valid data
          break;

        } catch (e) {
          attempts++;
          console.warn(`Attempt ${attempts} failed:`, e);
          if (attempts >= maxAttempts) throw e;
          await new Promise(r => setTimeout(r, 1500)); // Wait 1.5s before retry
        }
      }

      if (!data) {
        throw new Error("Failed to retrieve valid story data after multiple attempts.");
      }

      setRawNarrative(JSON.stringify(data));

      // Logical Stat Update:
      // We now expect 'trust' and 'tension' to be absolute values from the AI
      // And we might add 'relationship' as well.
      setStats({
        relationship: data.relationship,
        trust: data.trust,
        tension: data.tension
      });

      const paragraphs = data.story.split(/\n\n+/).filter((p: string) => p.trim().length > 0);

      return paragraphs.map((p: string, index: number) => {
        let speaker = 'Narrator';
        let dialogue = p.trim();
        const speakerMatch = dialogue.match(/^([^:\n]+):\s*([\s\S]+)$/);

        if (speakerMatch) {
          speaker = speakerMatch[1];
          dialogue = speakerMatch[2];
        }

        // Logical Location Update:
        // If the location has changed, only apply the NEW location to the LAST paragraph.
        // Earlier paragraphs are considered transitional and keep the previous location.
        const isLastParagraph = index === paragraphs.length - 1;
        const currentParagraphLocation = (data.location_name !== currentLocation && !isLastParagraph)
          ? (currentLocation || data.location_name)
          : data.location_name;

        return {
          id: `scene_${Date.now()}_${index}`,
          title: currentParagraphLocation || 'Ongoing Story',
          summary: data.mood || 'Interactive Adventure',
          dialogue: dialogue,
          backgroundImage: undefined,
          characterImage: undefined,
          speaker: speaker,
          mood: data.mood,
          tension: data.tension,
          location: currentParagraphLocation,
          time: data.time_of_day
        };
      });

    } catch (error: any) {
      console.error("Story generation failed:", error);

      const errorMessage = error.message || "Unknown Connection Error";
      const isRateLimit = errorMessage.includes("429") || errorMessage.toLowerCase().includes("limit");

      return [{
        id: 'fallback_scene',
        title: isRateLimit ? 'Narrative Traffic' : 'Story Delay',
        summary: 'System Note',
        dialogue: isRateLimit
          ? "The whispers of fate are currently overwhelmed. Please wait a moment for the stars to align... (Rate Limit Hit)"
          : `Connecting to the mystical narrative stream... (Error: ${errorMessage})`,
        speaker: 'System'
      }];
    }
  }
};