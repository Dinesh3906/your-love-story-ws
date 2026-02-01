export interface Effects {
  relationship?: number;
  trust?: number;
}

import { useGameStore } from "../../store/gameStore";

export interface Choice {
  id: string;
  text: string;
  intent?: string;
  effects: {
    relationship?: number;
    trust?: number;
  };
}

export const BranchEngine = {
  generateChoices: async (): Promise<Choice[]> => {
    const { rawNarrative } = useGameStore.getState();

    if (!rawNarrative) {
      return [];
    }

    try {
      const data = JSON.parse(rawNarrative);
      if (data.options && Array.isArray(data.options)) {
        return data.options.map((opt: any, index: number) => {
          // LLM now returns objects per SYSTEM_PROMPT in server.py
          const text = typeof opt === 'string' ? opt : (opt.text || "Continue...");
          const intent = typeof opt === 'object' ? opt.intent : "";

          // Determine effects based on intent or text content
          const effects: Effects = {};
          const lowerIntent = (intent || "").toLowerCase();
          const lowerText = text.toLowerCase();

          if (lowerIntent.includes("romance") || lowerText.includes("love") || lowerText.includes("warm") || lowerIntent.includes("passion")) {
            effects.relationship = 5;
          } else if (lowerIntent.includes("confront") || lowerText.includes("harsh") || lowerText.includes("cold") || lowerIntent.includes("conflict")) {
            effects.relationship = -3;
            effects.trust = -2;
          } else if (lowerIntent.includes("honest") || lowerText.includes("truth") || lowerIntent.includes("vulnerability")) {
            effects.trust = 5;
            effects.relationship = 2;
          } else if (lowerIntent.includes("humor") || lowerIntent.includes("funny")) {
            effects.relationship = 3;
            effects.trust = 1;
          } else if (lowerIntent.includes("fantasy") || lowerIntent.includes("mystery")) {
            effects.trust = 2;
          } else {
            effects.relationship = 1;
          }

          return {
            id: opt.id || `choice_${Date.now()}_${index}`,
            text: text,
            intent: intent,
            effects
          };
        });
      }
    } catch (e) {
      console.error("Failed to parse options from narrative JSON:", e);
    }

    // Dynamic fallback instead of prewritten ones
    return [
      {
        id: 'retry',
        text: "The path is unclear. Search for another way...",
        effects: {}
      }
    ];
  }
};