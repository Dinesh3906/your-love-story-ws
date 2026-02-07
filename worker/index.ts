import { Env, generateWithGroq, generateWithPollinations, buildUserPrompt } from './providers';
import { SYSTEM_PROMPT } from './prompts';

export default {
    async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
        // Handle CORS
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
        };

        // Handle CORS Preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.url.endsWith("/health")) {
            return new Response(JSON.stringify({ status: "ok" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        if (request.method !== "POST") {
            return new Response("Method not allowed", { status: 405, headers: corsHeaders });
        }

        let reqBody: any = null;
        let keyInfo = "(Keys: Not yet checked)";
        try {
            reqBody = await request.json();
            const userPrompt = buildUserPrompt(reqBody);

            // --- STRATEGY: Key Rotation & Provider Fallback ---
            // Only use keys that look valid for Groq (must start with gsk_)
            const groqKeys = Object.keys(env)
                .filter(k => k.startsWith('GROQ_API_KEY'))
                .map(k => (env as any)[k])
                .filter(key => key && key.startsWith('gsk_'));

            keyInfo = `(Groq Keys: ${groqKeys.length})`;

            let result = null;
            let errors = [];

            // 1. Try Groq (With full key rotation)
            if (groqKeys.length > 0) {
                const shuffledKeys = [...groqKeys].sort(() => Math.random() - 0.5);

                for (const key of shuffledKeys) {
                    try {
                        result = await generateWithGroq(key, userPrompt, SYSTEM_PROMPT);
                        if (result) break;
                    } catch (e: any) {
                        const status = e.message.includes('429') ? 'Rate Limited' : e.message;
                        errors.push(`Groq (${status})`);
                    }
                }
            }


            // 3. Fallback: Pollinations (with retry)
            if (!result) {
                for (let i = 0; i < 2; i++) {
                    try {
                        result = await generateWithPollinations(userPrompt, SYSTEM_PROMPT);
                        if (result) break;
                    } catch (e: any) {
                        errors.push(`Pollinations: ${e.message}`);
                        if (i === 0) await new Promise(r => setTimeout(r, 1000));
                    }
                }
            }

            if (!result) {
                throw new Error(errors.join(", "));
            }

            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });

        } catch (e: any) {
            // Return 503 to trigger frontend retry logic (SceneBuilder.ts has a retry loop)
            return new Response(e.message || "Service Unavailable", {
                status: 503,
                headers: corsHeaders
            });
        }
    }
};
