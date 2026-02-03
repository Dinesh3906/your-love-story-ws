import { Env, generateWithGroq, generateWithGemini, generateWithPollinations, buildUserPrompt } from './providers';
import { SYSTEM_PROMPT } from './prompts';

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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

        try {
            const reqBody: any = await request.json();
            const userPrompt = buildUserPrompt(reqBody);

            // --- STRATEGY: Key Rotation & Provider Fallback ---
            const groqKeys = Object.keys(env).filter(k => k.startsWith('GROQ_API_KEY')).map(k => (env as any)[k]);
            const geminiKeys = Object.keys(env).filter(k => k.startsWith('GEMINI_API_KEY')).map(k => (env as any)[k]);

            let result = null;
            let errors = [];

            // 1. Try Groq
            if (groqKeys.length > 0) {
                const randomKey = groqKeys[Math.floor(Math.random() * groqKeys.length)];
                try {
                    result = await generateWithGroq(randomKey, userPrompt, SYSTEM_PROMPT);
                } catch (e: any) {
                    errors.push(`Groq Error: ${e.message}`);
                }
            }

            // 2. Fallback: Gemini
            if (!result && geminiKeys.length > 0) {
                const randomKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
                try {
                    result = await generateWithGemini(randomKey, userPrompt, SYSTEM_PROMPT);
                } catch (e: any) {
                    errors.push(`Gemini Error: ${e.message}`);
                }
            }

            // 3. Fallback: Pollinations
            if (!result) {
                try {
                    result = await generateWithPollinations(userPrompt, SYSTEM_PROMPT);
                } catch (e: any) {
                    errors.push(`Pollinations Error: ${e.message}`);
                }
            }

            if (!result) {
                const detailedError = `AI Providers Exhausted: ${errors.join(" | ")}`;
                throw new Error(detailedError);
            }

            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });

        } catch (e: any) {
            return new Response(JSON.stringify({
                error: e.message,
                details: "Check Cloudflare or API keys status",
                fallback_active: true
            }), {
                status: 200, // Return 200 so the frontend catch doesn't trigger immediately, allowing us to see the error message in JSON
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
    }
};
