import os
import json
import base64
from io import BytesIO
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
# API Key should be set as an environment variable GROQ_API_KEY
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL_NAME = "llama-3.1-8b-instant" # Switched from 70b to 8b for higher reliability and rate limits

SYSTEM_PROMPT = """You are a master cinematic narrative engine for a premium interactive story game. 

Your goal is to create an immersive, emotionally charged experience that spans a wide range of genres—from high-stakes drama to lighthearted comedy and mystical fantasy.

### CORE OBJECTIVES
1.  **Dyanmic Genres**: The story should weave between deep romance, raw conflict, lighthearted humor (funny/ironic), and innocent wonder (childish/playful). If the setting allows, don't shy away from mystical or fantasy elements.
2.  **Visceral Intensity**: Every scene must have stakes. Romance should be electric; humor should be sharp; fantasy should be awe-inspiring.
3.  **Narrative Novelty**: STRICTURE: Do NOT repeat locations, plot beats, or specific phrases. Each segment should feel like a fresh step forward.
4.  **Logical Flow & Resonance**: Directly resolve the PLAYER'S LATEST CHOICE or MANIFESTATION with immediate, deep consequences. If the player types a custom choice, treat it as a powerful narrative decree—incorporate its specific imagery and subtext before pivoting to the next dramatic peak.
4.  **Fixed Choice Count**: Generate EXACTLY 4 unique options that offer distinct narrative paths. Options must be EXTREMELY SHORT (max 10 words).

### GENDER PERSPECTIVE
The player is [GENDER]. You MUST write from their perspective.
- **If Female**: Use female pronouns. Emphasize a "delusional" romanticity—dreamy, intense, and deeply internal. Focus on her inner emotional world and idealized romance.
- **If Male**: Use male pronouns. Focus on external actions, protective instincts, and quiet reflections.

### WRITING STYLE
- Use sensory details. Use wit and charm for funny scenes. Use simple, pure language for childish/innocent moments.
- Avoid generic descriptions. Let the dialogue and internal monologue carry the genre's tone.
- Keep narrative segments under 200 words.

### OUTPUT FORMAT (STRICT JSON ONLY)
{
  "story": "Dramatic resolution + new scene. End at a critical decision point.",
  "mood": "Cinematic label (e.g., 'Electric Tension', 'Playful Banter', 'Mystical Wonder', 'Heart-Pounding Confrontation').",
  "tension": 0-100,
  "trust": 0-100,
  "location_name": "Specific setting.",
  "time_of_day": "Atmospheric time.",
  "options": [
    {
      "id": "A",
      "text": "Short, punchy action/dialogue.",
      "intent": "romance | conflict | humor | fantasy | vulnerability | passion"
    }
  ]
}
"""

class PromptRequest(BaseModel):
    summary_of_previous: str
    user_gender: str = "male"
    chosen_option: Optional[Dict] = None # {id, intent, text}

@app.post("/generate")
async def generate(request: PromptRequest):
    try:
        # Build prompt based on strict rules
        user_input_section = ""
        if request.chosen_option:
             user_input_section = f"""
Previous Story Summary: {request.summary_of_previous}
PLAYER'S LATEST CHOICE: "{request.chosen_option.get('text')}" (Intent: {request.chosen_option.get('intent')})

TASK: Continue the story directly from this choice. Resolve the action. Then present 2-4 NEW options. 
REMINDER: Options must be EXTREMELY SHORT (max 10 words).
"""
        else:
            user_input_section = f"""
START NEW STORY.
PLAYER GENDER: {request.user_gender}
Initial Premise: {request.summary_of_previous}

TASK: Start the story based on this premise, keeping the PLAYER GENDER in mind. Then present 2-4 NEW options.
REMINDER: Options must be EXTREMELY SHORT (max 10 words).
"""

        # Append gender context to every request to ensure consistency
        user_input_section += f"\nREMINDER: The player is {request.user_gender}. Maintain this perspective."

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_input_section}
            ],
            model=MODEL_NAME,
            temperature=0.8,
            max_tokens=1024,
            response_format={"type": "json_object"}
        )
        
        if not chat_completion.choices or not chat_completion.choices[0].message.content:
             raise HTTPException(status_code=500, detail="LLM failed to generate a response.")

        raw_response = chat_completion.choices[0].message.content
        print("MODEL OUTPUT:", raw_response)
        
        try:
            return json.loads(raw_response)
        except json.JSONDecodeError:
            print("Failed to parse JSON from model output.")
            return {
                "story": f"The story continues... (Error parsing narrative segment)",
                "mood": "Mysterious",
                "tension": 50,
                "trust": 50,
                "location_name": "Somewhere",
                "time_of_day": "Unknown",
                "options": [
                    {"id": "A", "text": "Continue the journey.", "intent": "tension"}
                ]
            }

    except Exception as e:
        print(f"Error in /generate: {e}")
        return {
            "story": f"A strange mist clouds your vision. The path ahead is unclear.",
            "mood": "Chaotic",
            "tension": 100,
            "trust": 0,
            "location_name": "The Void",
            "time_of_day": "Outside Time",
            "options": [
                {"id": "A", "text": "Blink and focus your eyes.", "intent": "tension"}
            ],
            "error": str(e)
        }

class CharacterExtractionRequest(BaseModel):
    story: str
    files: List[str]

@app.post("/extract_characters")
async def extract_characters(request: CharacterExtractionRequest):
    try:
        extract_prompt = f"""
Given the following story segment and a list of available character image filenames, identify the active characters and map them to the best matching filename.

Story: {request.story}
Available Files: {json.dumps(request.files)}

OUTPUT FORMAT (STRICT JSON ONLY):
{{
  "characters": [
    {{ "id": "unique_id", "name": "Character Name", "role": "Description", "image": "filename.png" }}
  ]
}}
"""
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a character extraction engine. Extract characters and match them to filenames accurately."},
                {"role": "user", "content": extract_prompt}
            ],
            model="llama-3.1-8b-instant", # Faster model for extraction
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        data = json.loads(chat_completion.choices[0].message.content)
        return data

    except Exception as e:
        print(f"Extraction Error: {e}")
        return {"characters": []}

@app.get("/health")
async def health():
    return {"status": "ok", "provider": "groq"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
