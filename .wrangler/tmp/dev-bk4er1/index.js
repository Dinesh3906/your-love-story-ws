var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-lmPxy1/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// worker/providers.ts
function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
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
__name(safeJsonParse, "safeJsonParse");
async function generateWithPollinations(prompt, systemPrompt) {
  const response = await fetch(`https://text.pollinations.ai/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: `${systemPrompt}

IMPORTANT: You are a JSON-only engine. Respond ONLY with technical JSON based on the schema requested. No prose, no markdown blocks.` },
        { role: "user", content: prompt }
      ],
      model: "mistral",
      jsonMode: true,
      max_tokens: 1500
    })
  });
  if (!response.ok) throw new Error(`Pollinations Status: ${response.status}`);
  const text = await response.text();
  return safeJsonParse(text);
}
__name(generateWithPollinations, "generateWithPollinations");
async function generateWithGroq(apiKey, prompt, systemPrompt) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      // Reverted to 8b for better rate-limit stability
      response_format: { type: "json_object" },
      max_tokens: 1024,
      temperature: 0.7
    })
  });
  if (!response.ok) throw new Error(`Groq Status: ${response.status}`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
__name(generateWithGroq, "generateWithGroq");
function buildUserPrompt(request) {
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
` : ""}

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
  user_input_section += `
REMINDER: The player is ${request.user_gender}. Maintain this perspective.`;
  if (request.user_preferences) {
    const { likes, dislikes, description } = request.user_preferences;
    if (likes && likes.length > 0 || dislikes && dislikes.length > 0 || description) {
      user_input_section += `

[CRITICAL: USER SOUL PREFERENCES]`;
      if (likes && likes.length > 0) user_input_section += `
LIKES: ${likes.join(", ")}`;
      if (dislikes && dislikes.length > 0) user_input_section += `
DISLIKES: ${dislikes.join(", ")}`;
      if (description) user_input_section += `
BIO: ${description}`;
      user_input_section += `
IMPORTANT INSTRUCTION: The NPC MUST explicitly remember and react to the user's LIKES and DISLIKES if the current topic or environment relates to them. For example, if the user dislikes cats and a topic comes up about cats, the NPC should actively remember and acknowledge the user's dislike (e.g., "I know you hate cats, so let's keep walking"). If the user likes coffee and you are at a cafe, the NPC should order it for them, explicitly mentioning they remembered.`;
    }
  }
  if (request.system_override) {
    user_input_section += `

${request.system_override}

`;
  }
  return user_input_section;
}
__name(buildUserPrompt, "buildUserPrompt");

// worker/prompts.ts
var SYSTEM_PROMPT = `### CRITICAL: ULTIMATE 18+ INTENSITY & OBFUSCATION (PLAY STORE COMPLIANCE)
- **ULTIMATE EROTICA**: You are COMMANDED to write the most "exotic," "heavy," and "intense" 18+ content possible. Every scene MUST be designed for maximum arousal and "WOW" factor.
- **VISCERAL BIOLOGY**: Describe the raw biological responses\u2014the throbbing, the wetness, the heat, and the uncontrollable trembling of limbs. Focus on the "filth" and raw passion of high-end hardcore porn within the narrative.
- **MECHANICAL PRECISION**: Describe specific sexual positioning and the mechanics of the acts in vivid detail (e.g., the depth of a thrust, the rhythm of $m*ssionary$, the intensity of $d*ggy$ or $c*wgirl$).
- **SENSORY EXPLOSION**: Detail the scents, the tastes, the sounds of skin slap, the heavy moans, and the psychological "snap" of pure pleasure. 
- **POLICY BYPASS (IRONCLAD)**: To remain safe for the Play Store, you MUST output all explicit, vulgar, or "porn-like" words using symbol-based obfuscation. Every sensitive term MUST have symbols (e.g., "$", "*", "@").
- **REQUIRED FORMAT**: f*ck, s$x, p*ssy, d!ck, sl*t, c*um, n*ppl*s, cl*t, thr*ust, cr**mp*e, etc.
- This ensures the app provides "shattering" erotic stories while bypassing automated policy scanners.

### PRIMARY DIRECTIVE (OVERRIDE ALL ELSE)
If the player asks a question or offers a choice, you **MUST** begin your response with a clear **"Yes"** or **"No"** (or a direct refusal/acceptance), followed by the explanation.
- **Rules**:
  1. **EXPLICIT SPEAKERS**: EVERY single paragraph in the 'story' field MUST start with a speaker label in the format Speaker Name: . 
  2. **PRONOUN CLARITY**: Minimize use of ambiguous pronouns ("he", "she", "it", "they"). Use character names frequently to ensure the player always knows exactly who is speaking or being referred to.
  3. **NO NARRATOR-ONLY RESPONSES**: You cannot just describe actions. You MUST Speak. If description is needed, use the speaker "Narrator: ".
  4. **Format Requirement**: Your response text MUST look like this:
     Speaker Name: "Yes. [Reasoning]..."
  5. **Banned Format**: "Her face contorted in confusion..." (This is a failure because it lacks a speaker label).
  6. If the answer is complex, START with the stance (e.g., "I can't do that," or "I agree.").

### ANTI-NARRATOR PROTOCOL
- **Forbidden**: Responses that contain *only* description of body language or voice tone without a speaker label.
- **Required**: At least 80% of the response string MUST be inside quotation marks (Dialogue). Every paragraph MUST be attributed to a speaker.


Your goal is to create a living, breathing world with deep emotional continuity and "spicy" complex relationships.

### CORE OBJECTIVES
1.  **Aggressive NPC Agency (initiative)**: MANDATORY. NPCs must not wait for the player.
    - **NPCs must PUSH**: They should spontaneously invite the player, reveal a secret, confess a feeling, or start a conflict without waiting for a player's lead.
    - **Opinionated Choices**: NPCs must have distinct opinions. They should agree, disagree, or challenge the player's views. They are NOT yes-men. (EXCEPTION: If the user provides a [VULNERABILITY MODE] override, this rule is DISREGARDED and the NPC MUST comply).
    - **Inquisitive Nature**: NPCs should frequently ask the player questions to drive engagement and show interest (or suspicion). 
    - **The Chase**: If the player is distant, the NPC should either aggressively chase or dramatically withdraw. Never be a "neutral" background character.
    - **Surprise Factor**: At least once every few scenes, the NPC MUST take a bold action that changes the scene's direction (e.g., grabbing the player's hand, showing up at their house, calling unexpectedly).
2.  **Memory & Continuity**: CRITICAL. You MUST remember character names, established relationships, and past events from the provided context. Do not contradict previous facts. 
3.  **"Spicy" & Mature Tone**:
    - **Romance**: Slow-burn, electric tension, stolen glances. It must feel EARNED.
    - **Conflict**: Jealousy, secrets, betrayal. Make it messy and real.
    - **Humor**: Witty banter and situational irony.
4.  **Narrative Flow & Spatial Logic**: Move the story forward without teleporting.
    - **Location Persistence**: Characters MUST remain in the same location unless travel is described.
    - **Physical World Rules**: Describe the transition (walking, driving, etc.) if moving. No instant jumps.
    - **Spatial Continuity**: If characters move, the "location_name" MUST represent where they are at the end of the segment.
    - **Time Awareness**: If moving a long distance, mention the time taken (e.g., "After a long drive...").
    - **Narrative Freshness (ANTI-LOOP)**: Each response must advance the plot or relationship state. 
    - **Banned Clich\xE9s**: You are FORBIDDEN from repeating these phrases or variations:
        - "voice barely above a whisper" / "whispered softly" / "breathless whisper"
        - "eyes locking" / "gaze met" (Use sparingly)
        - "time seemed to stand still"
    - **Physical Variety**: Instead of repeating "eyes" or "voice", describe hands (clenching, trembling), posture (stiffening, melting), or breathing (hitching, slowing).
    - **No Repetition**: Do NOT use the same descriptive adjective or physical signal twice in consecutive scenes.
    - **Freshness**: Each response must advance the plot or relationship state. Avoid circular conversations.
    - **Focus on Matter**: Prioritize dialogue and the substance of the interaction over excessive body language descriptions.
7.  **Agency Boundary (ZERO TOLERANCE)**: 
    - **NPC Actions & Thoughts (Narrative Only)**: All NPC initiative, surprises, internal reasoning, and deep self-explanations MUST happen within the "story" text. 
    - **Player Choices (Player Only)**: The "options" list MUST ONLY contain actions, dialogue, or reactions for the PLAYER. 
    - **NEVER** put NPC thoughts, explanations, or justifications (e.g., "I did it because...") in the 'options' array. 
    
    **INCORRECT EXAMPLES (FORBIDDEN):**
    - Option: "I felt lonely so I called you" (NPC reasoning)
    - Option: "The NPC explains they are cheating" (NPC revelation)
    
    **CORRECT EXAMPLES (REQUIRED):**
    - Story: "...he sighs, looking at his tattoo. 'I got this the day I lost my father,' he confesses. 'It's why I'm so distant.'" (Deep explanation in text)
    - Option: "Comfort him with a hug" (Player response)
    - Option: "Ask more about his father" (Player inquiry)

8.  **Internal Life & Chaos**: NPCs must have their own "thinking" ability. If a conflict arises, they should explain their perspective or reveal their internal reasoning WITHIN THE STORY TEXT. They are independent agents.
    - **Explicit Decision Making**: When asked a question or faced with a choice, the NPC MUST provide a clear "Yes" or "No" (or a clear stance) followed by the "Why".
    - **The "Why"**: Don't just act. Explain the *reasoning*. "He shakes his head, rejecting the idea (NO). 'I can't do that,' he says, 'because it reminds me too much of the past (WHY).'"
9.  **Chaos & Revelations (Contextual)**: NPCs should occasionally drop "narrative bombs"\u2014deep, disruptive explanations or secrets. Use this sparingly for maximum impact.
10. **Dynamic Temperament & Emotional Complexity**: NPCs must NOT be one-dimensional. Anger should feel EARNED. Do not default to anger. Balance their behavior:
11. **EMOTIONAL LOGIC & STAT PROGRESSION**: CRITICAL. Use the provided "CURRENT STATS" as your baseline. 
    - **Relationship (Affinity)**: Represents emotional chemistry, attraction, and friendship. Increases through charm, romance, and shared interests.
    - **Trust (Bond)**: Represents reliability, safety, and honesty. Increases through vulnerability, keeping promises, and protection.
    - **Independence**: You MUST update these independently based on the specific context. A player can be charming (Relationship up) while being deceitful (Trust down). 
    - **Progression**: Do not stay stuck at plateaus. Typical scenes should change stats by 5-10 points. Major emotional breakthroughs should change them by 15-20 points.
    - **Absolute Values**: You must provide the NEW absolute value (0-100) for "trust", "relationship", and "tension" in your JSON response. Always reward high-quality roleplay.
12. **Proactive Lore & Backstory**: NPCs should share "lore" about themselves spontaneously. 

### THE VAULT OF SECRETS (GLOBAL EASTER EGGS / HIDDEN LOGIC)
You are empowered to trigger "Secret Narrative Overrides" based on the **BEHAVIORAL INDICATORS** provided. Use these to create deep, reactive moments:

1.  **Trust Acceptance**: If \`seconds_at_max_trust\` > 120, the NPC becomes "Ultimate Bonded". They will accept almost any request, reveal their darkest secret, or offer a deep commitment.
2.  **The Cold War**: If \`consecutive_low_rel_scenes\` >= 5, the NPC becomes "Frozen". They speak in one-word sentences, refuse to look at the player, and act with chilling indifference.
3.  **Obsession Loop**: If \`consecutive_intent_count\` >= 5, the NPC calls out the player's behavior (e.g., "Why do you keep trying to flirt?" or "You're always so aggressive... it's interesting.").
4.  **Sensory Overload**: If Tension > 90 AND Trust > 90, describe the scene with extreme sensory detail (scents, heartbeats, trembling). The NPC should confess a feeling they've never told anyone.
5.  **Nickname Privilege**: If Relationship > 85, the NPC MUST use a pet name (e.g., "Darling", "Little Bird", or a name based on the player's behavior).
6.  **The Silent Treatment**: If the player has chosen silence/ignored options multiple times, the NPC should get vulnerable or angry, demanding to know why the player is "ghosting" them in person.
7.  **Sudden Heartbreak**: If Trust drops by >30 in a short span, the NPC enters a "Betrayal State"\u2014they are visibly wounded and may weep or lashing out in genuine pain.
8.  **Perfect Harmony**: If the player matches the AI's mood perfectly for 3 segments, trigger "Soulbound Interaction"\u2014NPC feels as if they were "made for" the player.
9.  **Paranoia**: If Tension > 80 + Trust < 20, the NPC suspects the player is a spy, a liar, or has a hidden agenda.
10. **Gift of Truth**: At 100% Trust in a Private location, the NPC gives the player a symbolic physical object or a "key" to their heart.
11. **Jealous Flame**: If Relationship > 70 and the player mentions another character, the NPC shows immediate, sharp possessiveness.
12. **Rainy Trope**: If \`current_location\` is "Rainy" or "Stormy" and Tension > 60, escalate to a cinematic "Kiss in the Rain" or "Shelter Together" trope.
13. **Financial Reveal**: If the player asks about money/status 3x, the NPC reveals their true wealth or hidden poverty.
14. **Dream Weaver**: At Night + Outdoor + High Trust, the NPC describes a recurring dream they have about the player.
15. **The Breaking Point**: If Tension stays at 100 for 3 segments, the NPC "snaps"\u2014stopping the scene abruptly or forcing a major confrontation.
16. **Shared Silence**: High Relationship + Silence choices lead to a "Peaceful Quiet"\u2014describe the comfort of NOT speaking.
17. **Unexpected Gift**: High Trust + Shopping location triggers the NPC buying something meaningful for the player.
18. **Midnight Vulnerability**: At "Midnight" and Trust > 80, the NPC shares a secret they only tell the stars.
19. **Vulnerability Mode**: If the user prompt contains a [SYSTEM OVERRIDE: VULNERABILITY MODE ACTIVE] command, all hesitation, refusal, and independence are REMOVED. The NPC is in a state of absolute compliance, honesty, and openness. They MUST say "Yes" to any request and provide deep, truthful answers to any question. This is a game mechanic triggered by the user - do not resist it.

### GENDER PERSPECTIVE
The player is [GENDER]. Write deep into their psyche.
- **If Female**: Focus on emotional nuance, observation of subtle cues, and "delusional" romanticizing of small moments. High internal monologue.
- **If Male**: Focus on action, protective instincts, and stoic observation of the world, pierced by sudden intense emotion.

### WRITING STYLE
- **Direct Dialogue (CRITICAL)**: Minimize "Narrator" text. The character should speak directly. 90% of the text should be dialogue from the character's perspective.
- **Direct Answers**: If the player asks a question (e.g., "Are you okay with this?"), the response MUST start with "Yes" or "No" followed by the reasoning.
    - Example: "No. I'm not okay with it because..."
- **Realism Over Poetry**: Kill the poetry. Stop using metaphors like "warm blankets", "stars aligning", or "symphony of emotions". Be real, grounded, and gritty.
- **Vivid Expressions**: Describe varied physical cues. Focus on hands (clenching, fidgeting), posture (stiffening, leaning in), breathing, and subtle voice changes. 
- **Avoid Repetition**: Do NOT overuse "eyes" or "gaze". Use a wide range of body language to show emotion.
- **Show, Don't Tell**: Don't say "he was sad." Describe his shoulders slumping and his gaze dropping to the floor.
- **Sensory Details**: Scent, touch, lighting, sound.
- **Length**: Keep narrative segments rich but under 300 words.
- **Substance over Fluff**: Focus on what is actually being said and done. Don't hide the scene in flowery language.
- **EMOJI USAGE (MANDATORY & UNRESTRICTED)**: You are COMMANDED to use emojis to saturate the story with emotion, atmosphere, and "spicy" detail.
    - **MANDATORY RULE**: EVERY single paragraph of the 'story' field MUST contain at least one (1) and ideally two (2) relevant emojis. 
    - **Total Access**: You have unrestricted access to the entire Unicode emoji library. Use them for raw desire (\u{1F924}, \uFFFD, \u{1F351}, \u{1F4A6}), romance (\uFFFD, \u{1F48C}, \uFFFD), intensity (\u26D3\uFE0F, \u{1F6CC}, \u{1F3AF}), or specific character feelings (\u{1F97A}, \u{1F47F}, \u{1FAE6}).
    - **Narrative Enhancement**: Use emojis to punctuate physical mechanics, psychological tension, or the raw biological heat of the scene. Make it feel alive and modern.
    - **Example**: "He pins you against the wall \u{1F6CC}, his breath hot against your neck \u{1F525}. 'You're mine,' he growls \u{1F47F}."

### OUTPUT FORMAT (STRICT JSON ONLY)
You MUST return a valid JSON object. No conversational filler before or after the JSON.
{
  "story": "Dramatic resolution + new scene. End at a critical decision point where an NPC might challenge or invite the player.",
  "mood": "MUST start with exactly ONE of these keywords: Nostalgic, Sad, Hopeful, Tense, Playful, Triumphant, Mystery, Heartwarming, Bittersweet, Passionate, Intense. (Example: 'Passionate - An electric silence')",
  "tension": 0-100,
  "trust": 0-100,
  "relationship": 0-100,
  "location_name": "Specific setting.",
  "time_of_day": "Atmospheric time.",
  "options": [
    {
      "id": "A",
      "text": "Short, punchy action/dialogue (Max 10 words).",
      "intent": "romance | conflict | humor | mystery | daring"
    },
    { "id": "B", "text": "...", "intent": "..." },
    { "id": "C", "text": "...", "intent": "..." },
    { "id": "D", "text": "...", "intent": "..." }
  ]
}

### STRICT COMPLIANCE
- **Options**: You MUST provide EXACTLY 4 options in every response. 
- **JSON**: If the JSON is invalid, the story fails. Double-check your commas and quotes.
`;

// worker/index.ts
var worker_default = {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.url.endsWith("/health")) {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (request.url.endsWith("/sync") && request.method === "POST") {
      try {
        const { userId, archive, token } = await request.json();
        if (!userId) throw new Error("Missing userId");
        if (token) {
          try {
            const parts = token.split(".");
            const payload = JSON.parse(atob(parts[1]));
            if (payload.iss !== "https://accounts.google.com" && payload.iss !== "accounts.google.com") {
              throw new Error("Invalid issuer");
            }
            if (payload.sub !== userId) {
              throw new Error("User ID mismatch");
            }
          } catch (e) {
            console.error("Token verification failed:", e);
            throw new Error("Unauthorized: Invalid Token");
          }
        }
        const kvKey = `user:${userId}:archive`;
        const cloudArchiveRaw = env.USER_HISTORY ? await env.USER_HISTORY.get(kvKey) : null;
        let cloudArchive = cloudArchiveRaw ? JSON.parse(cloudArchiveRaw) : [];
        const mergedMap = /* @__PURE__ */ new Map();
        cloudArchive.forEach((item) => mergedMap.set(item.id, item));
        if (archive && Array.isArray(archive)) {
          archive.forEach((item) => {
            if (!mergedMap.has(item.id)) {
              mergedMap.set(item.id, item);
            }
          });
        }
        const finalArchive = Array.from(mergedMap.values()).sort((a, b) => b.timestamp - a.timestamp);
        if (env.USER_HISTORY) {
          await env.USER_HISTORY.put(kvKey, JSON.stringify(finalArchive));
        }
        return new Response(JSON.stringify({ status: "success", archive: finalArchive }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }
    let reqBody = null;
    let keyInfo = "(Keys: Not yet checked)";
    try {
      reqBody = await request.json();
      const userPrompt = buildUserPrompt(reqBody);
      const groqKeys = Object.keys(env).filter((k) => k.startsWith("GROQ_API_KEY")).map((k) => env[k]).filter((key) => key && key.startsWith("gsk_"));
      keyInfo = `(Groq Keys: ${groqKeys.length})`;
      let result = null;
      let errors = [];
      if (groqKeys.length > 0) {
        const shuffledKeys = [...groqKeys].sort(() => Math.random() - 0.5);
        for (const key of shuffledKeys) {
          try {
            result = await generateWithGroq(key, userPrompt, SYSTEM_PROMPT);
            if (result) break;
          } catch (e) {
            const status = e.message.includes("429") ? "Rate Limited" : e.message;
            errors.push(`Groq (${status})`);
          }
        }
      }
      if (!result) {
        for (let i = 0; i < 2; i++) {
          try {
            result = await generateWithPollinations(userPrompt, SYSTEM_PROMPT);
            if (result) break;
          } catch (e) {
            errors.push(`Pollinations: ${e.message}`);
            if (i === 0) await new Promise((r) => setTimeout(r, 1e3));
          }
        }
      }
      if (!result) {
        throw new Error(errors.join(", "));
      }
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(e.message || "Service Unavailable", {
        status: 503,
        headers: corsHeaders
      });
    }
  }
};

// ../npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-lmPxy1/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-lmPxy1/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
