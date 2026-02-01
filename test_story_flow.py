import requests
import base64
import json
import time

url = "http://localhost:3001/generate"

payload = {
    "summary_of_previous": "A clumsy goblin accidentally drinks a potion that makes him talk like a refined Victorian gentleman. He is currently in a dragon's lair.",
    "user_gender": "male"
}

print("Sending request to /generate...")
start_time = time.time()

try:
    response = requests.post(url, json=payload, timeout=600) # Long timeout for model loading/generation
    print(f"Response received in {time.time() - start_time:.2f}s")
    
    if response.status_code == 200:
        data = response.json()
        
        if "error" in data:
            print("Error from server:", data["error"])
        else:
            print("Story Segment:")
            print(data.get("story", "No story found"))
            
            print("\nNarrative Parameters:")
            print(f"Mood: {data.get('mood', 'N/A')}")
            print(f"Tension: {data.get('tension', 'N/A')}")
            print(f"Trust: {data.get('trust', 'N/A')}")
            print(f"Location: {data.get('location_name', 'N/A')}")
            print(f"Time: {data.get('time_of_day', 'N/A')}")
                
    else:
        print(f"Request failed: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"Request Error: {e}")
