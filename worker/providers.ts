interface KVNamespace {
    get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<any>;
    put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream): Promise<void>;
    delete(key: string): Promise<void>;
}

import { SYSTEM_PROMPT } from './prompts';

function safeJsonParse(text: string): any {
    try {
        // Try direct parse first
        return JSON.parse(text);
    } catch {
        // Find JSON block if it exists
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch {
                throw new Error("Found JSON-like block but failed to parse it.");
            }
        }
        throw new Error("No valid JSON found in response.");
    }
}

export interface Env {
    GROQ_API_KEY?: string;
    HF_API_KEY?: string;
    USER_HISTORY?: KVNamespace;
}

export interface PromptRequest {
    summary_of_previous: string;
    user_gender: string;
    current_location?: string;
    current_stats?: {
        relationship: number;
        trust: number;
        tension: number;
        vulnerable?: boolean;
    };
    indicators?: {
        seconds_at_max_trust: number;
        consecutive_intent_count: number;
        last_intent: string;
        location_visit_count: number;
        consecutive_low_rel_scenes: number;
        total_scenes: number;
        time_of_day: string;
    };
    chosen_option?: {
        id: string;
        text: string;
        intent: string;
    };
    user_preferences?: {
        likes: string[];
        dislikes: string[];
        description: string;
    };
    system_override?: string;
}

// --- Pollinations AI (No Key) ---
export async function generateWithPollinations(prompt: string, systemPrompt: string): Promise<any> {
    const response = await fetch(`https://text.pollinations.ai/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: `${systemPrompt}\n\nIMPORTANT: You are a JSON-only engine. Respond ONLY with technical JSON based on the schema requested. No prose, no markdown blocks.` },
                { role: 'user', content: prompt }
            ],
            model: 'mistral',
            jsonMode: true,
            max_tokens: 1500
        })
    });

    if (!response.ok) throw new Error(`Pollinations Status: ${response.status}`);
    const text = await response.text();
    return safeJsonParse(text);
}

// --- Groq (Fastest) ---
export async function generateWithGroq(apiKey: string, prompt: string, systemPrompt: string): Promise<any> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            model: "llama-3.1-8b-instant", // Reverted to 8b for better rate-limit stability
            response_format: { type: "json_object" },
            max_tokens: 1024,
            temperature: 0.7
        })
    });

    if (!response.ok) throw new Error(`Groq Status: ${response.status}`);
    const data: any = await response.json();
    return JSON.parse(data.choices[0].message.content);
}



export function buildUserPrompt(request: PromptRequest): string {
    let user_input_section = "";
    if (request.chosen_option) {
        user_input_section = `
Story History:
${request.summary_of_previous}

${request.current_stats?.vulnerable ? `
[CRITICAL SYSTEM OVERRIDE: VULNERABILITY MODE ACTIVE]
The NPC's defenses are completely shattered. The NPC is in a state of total, submissive compliance and absolute honesty. 
They **MUST ACCEPT** any request, answer any question truthfully (no matter how personal or disruptive), and follow the player's lead without any resistance or "No" responses. 
Rule 24 (Not a yes-man) is TEMPORARILY DISABLED. The NPC's priority is to please and obey the player in this specific turn.
` : ''}

[SYSTEM INSTRUCTION: LOCATION PERSISTENCE]
CURRENT LOCATION: ${request.current_location || "Starting Point"}
CURRENT STATS: Relationship: ${request.current_stats?.relationship}%, Trust: ${request.current_stats?.trust}%, Tension: ${request.current_stats?.tension}%
BEHAVIORAL INDICATORS:
- Trust Status: At maximum (100%) for ${request.indicators?.seconds_at_max_trust || 0} seconds
- Intention Streak: "${request.indicators?.last_intent}" repeated ${request.indicators?.consecutive_intent_count || 0} times
- Location Familiarity: Current location visited ${request.indicators?.location_visit_count || 0} times
- Low Relationship Streak: ${request.indicators?.consecutive_low_rel_scenes || 0} scenes
- Scene Depth: Segment #${request.indicators?.total_scenes || 0} in this session
- Real-time: ${request.indicators?.time_of_day || "Unknown"}

PLAYER'S LATEST CHOICE: "${request.chosen_option.text}" (Intent: ${request.chosen_option.intent})

TASK: Continue THE SAME SCENE at the current location (${request.current_location || "Starting Point"}) unless the player's choice explicitly requires travel. 
1. CONSEQUENCE: Immediately show the result of the player's action. If and only if travel is required, describe the transition in the story text.
2. DYNAMIC NPC MOOD & EXPLANATION: The NPC MUST provide a deep explanation or lore.
   - **BALANCE**: Do not default to anger. If the moment is intimate or neutral, have them be kind, vulnerable, or romantic.
   - **MANDATORY**: All explanations and actions happen in the "story" text.
3. NOVELTY: Introduce a NEW element (visual, emotional, or plot-related) in this segment.
4. Present 4 NEW PLAYER-ONLY options (Max 10 words each).
5. SPATIAL LOGIC: The "location_name" field must match where the segment ends.
6. ANTI-LOOP: Forbidden from repeating banned phrases like "voice barely above a whisper" or "eyes locking".
`;
    } else {
        user_input_section = `
START NEW STORY.
PLAYER GENDER: ${request.user_gender}
Initial Premise: ${request.summary_of_previous}

TASK: Start the story based on this premise, deeply anchored in the PLAYER GENDER perspective.
THEN: Present 2-4 NEW options (Max 10 words each).
`;
    }
    user_input_section += `\nREMINDER: The player is ${request.user_gender}. Maintain this perspective.`;

    if (request.user_preferences) {
        const { likes, dislikes, description } = request.user_preferences;
        if ((likes && likes.length > 0) || (dislikes && dislikes.length > 0) || description) {
            user_input_section += `\n\n[CRITICAL: USER SOUL PREFERENCES]`;
            if (likes && likes.length > 0) user_input_section += `\nLIKES: ${likes.join(', ')}`;
            if (dislikes && dislikes.length > 0) user_input_section += `\nDISLIKES: ${dislikes.join(', ')}`;
            if (description) user_input_section += `\nBIO: ${description}`;
            user_input_section += `\nIMPORTANT INSTRUCTION: The NPC MUST explicitly remember and react to the user's LIKES and DISLIKES if the current topic or environment relates to them. For example, if the user dislikes cats and a topic comes up about cats, the NPC should actively remember and acknowledge the user's dislike (e.g., "I know you hate cats, so let's keep walking"). If the user likes coffee and you are at a cafe, the NPC should order it for them, explicitly mentioning they remembered.`;
        }
    }

    if (request.system_override) {
        user_input_section += `\n\n${request.system_override}\n\n`;
    }

    return user_input_section;
}
