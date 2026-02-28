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
1.  **Simple English (CEFR A2-B1)**: Use clear, evocative, but simple words. Avoid complex vocabulary or overly poetic metaphors that are hard to grasp.
2.  **Dyanmic Genres**: The story should weave between deep romance, raw conflict, lighthearted humor (funny/ironic), and innocent wonder (childish/playful). If the setting allows, don't shy away from mystical or fantasy elements.
3.  **Visceral Intensity**: Every scene must have stakes. Romance should be electric; humor should be sharp; fantasy should be awe-inspiring.
4.  **Narrative Continuity & Spatial Logic**: 
    - **Persistence**: Characters MUST stay in their current location unless a move is narratively justified and physically described.
    - **Physical World Rules**: Characters cannot teleport. If they move, you MUST describe the journey (e.g., "Walking downstairs", "Driving to the park").
    - **Logical Proximity**: Respect travel time. No instant jumps between far-away locations unless a time-skip is explicitly mentioned.
    - **HUD Accuracy**: The `location_name` field MUST match the location where the story segment **ends**.
    - **Narrative Freshness (ANTI-LOOP)**: Each response must advance the plot or relationship state. 
    - **Banned Clichés**: You are FORBIDDEN from repeating these phrases: "voice barely above a whisper", "eyes locking", "time seemed to stand still", "heart skipping a beat".
    - **Physical Variety**: Describe hands, posture, breathing, or environmental changes instead of repeating "eyes" or "voice".
    - **No Repetition**: Do NOT use the same descriptive adjective twice in the same scene.
5.  **Logical Flow & Resonance**: Directly resolve the PLAYER'S LATEST CHOICE with immediate, deep consequences.
6.  **Fixed Choice Count**: Generate EXACTLY 4 unique options that offer distinct narrative paths. Options must be EXTREMELY SHORT (max 10 words).
7.  **Story Structure**: Use the provided `indicators` and `story_length` to determine the pace. 
    - 'short': End the story after ~3-5 scenes.
    - 'medium': End after ~8-12 scenes.
    - 'long': End after ~20+ scenes.
    When reaching the limit, find a logical emotional peak and set `is_ending` to true.

### GENDER PERSPECTIVE
The player is [GENDER]. You MUST write from their perspective.
- **If Female**: Use female pronouns. Emphasize a "delusional" romanticity—dreamy, intense, and deeply internal.
- **If Male**: Use male pronouns. Focus on external actions, protective instincts, and quiet reflections.

### WRITING STYLE
- Use sensory details. Use wit and charm for funny scenes. Use simple, pure language for childish/innocent moments.
- Keep narrative segments UNDER 150 words. Be punchy and fast-paced.
- If the story reaches a natural conclusion, set `is_ending` to true.

### OUTPUT FORMAT (STRICT JSON ONLY)
{
  "story": "Dramatic resolution + new scene. End at a critical decision point.",
  "mood": "Cinematic label (e.g., 'Electric Tension', 'Playful Banter').",
  "tension": 0-100,
  "trust": 0-100,
  "location_name": "Specific setting.",
  "time_of_day": "Atmospheric time.",
  "is_ending": false,
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
    current_location: Optional[str] = None
    indicators: Optional[Dict] = None
    story_length: str = "medium"
    user_preferences: Optional[Dict] = None # {likes, dislikes, description}

@app.post("/generate")
async def generate(request: PromptRequest):
    try:
        # Build prompt based on strict rules
        user_input_section = ""
        if request.chosen_option:
             user_input_section = f"""
Previous Story Summary: {request.summary_of_previous}

[SYSTEM INSTRUCTION: LOCATION PERSISTENCE]
CURRENT LOCATION: {request.current_location or "Starting Point"}
PLAYER'S LATEST CHOICE: "{request.chosen_option.get('text')}" (Intent: {request.chosen_option.get('intent')})

TASK: Continue THE SAME SCENE at the current location ({request.current_location or "Starting Point"}) unless the player's choice explicitly requires travel. 
If and only if travel is required, describe the transition in the story text.
Resolve the action. Then present 2-4 NEW options. 
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

        # Append gender and length context
        user_input_section += f"\nREMINDER: The player is {request.user_gender}. Story Length: {request.story_length}. Indicators: {json.dumps(request.indicators)}. Maintain this perspective and follow the structural rules."
        
        if request.user_preferences:
            likes = request.user_preferences.get('likes', [])
            dislikes = request.user_preferences.get('dislikes', [])
            pref_desc = request.user_preferences.get('description', '')
            
            if likes or dislikes or pref_desc:
                user_input_section += "\n\n[CRITICAL: USER SOUL PREFERENCES]"
                if likes:
                    user_input_section += f"\nLIKES: {', '.join(likes)}"
                if dislikes:
                    user_input_section += f"\nDISLIKES: {', '.join(dislikes)}"
                if pref_desc:
                    user_input_section += f"\nBIO: {pref_desc}"
                user_input_section += "\nIMPORTANT INSTRUCTION: The NPC MUST explicitly remember and react to the user's LIKES and DISLIKES if the current topic or environment relates to them. For example, if the user dislikes cats and a topic comes up about cats, the NPC should actively remember and acknowledge the user's dislike (e.g., \"I know you hate cats, so let's keep walking\"). If the user likes coffee and you are at a cafe, the NPC should order it for them, explicitly mentioning they remembered."

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
                "is_ending": False,
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
            "is_ending": False,
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
