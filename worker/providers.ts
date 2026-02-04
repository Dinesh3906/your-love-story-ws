import { SYSTEM_PROMPT } from './prompts';

export interface Env {
    GROQ_API_KEY?: string;
    GEMINI_API_KEY?: string;
    HF_API_KEY?: string;
}

export interface PromptRequest {
    summary_of_previous: string;
    user_gender: string;
    current_location?: string;
    chosen_option?: {
        id: string;
        text: string;
        intent: string;
    };
}

// --- Pollinations AI (No Key) ---
export async function generateWithPollinations(prompt: string, systemPrompt: string): Promise<any> {
    const response = await fetch(`https://text.pollinations.ai/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            model: 'openai',
            jsonMode: true,
            max_tokens: 1500
        })
    });

    if (!response.ok) throw new Error(`Pollinations Status: ${response.status}`);
    const text = await response.text();
    return JSON.parse(text);
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

// --- Gemini (Free Tier) ---
export async function generateWithGemini(apiKey: string, prompt: string, systemPrompt: string): Promise<any> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: `${systemPrompt}\n\n${prompt}\n\nIMPORTANT: Return EXACTLY 4 options in the JSON schema.` }]
            }],
            generationConfig: {
                responseMimeType: "application/json",
                maxOutputTokens: 2048,
                temperature: 0.8
            }
        })
    });

    if (!response.ok) throw new Error(`Gemini Status: ${response.status}`);
    const data: any = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
}

export function buildUserPrompt(request: PromptRequest): string {
    let user_input_section = "";
    if (request.chosen_option) {
        user_input_section = `
Story History:
${request.summary_of_previous}

[SYSTEM INSTRUCTION: LOCATION PERSISTENCE]
CURRENT LOCATION: ${request.current_location || "Starting Point"}
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
    return user_input_section;
}
