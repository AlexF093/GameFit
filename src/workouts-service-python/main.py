from fastapi import FastAPI
import requests

app = FastAPI(title="GameFit Workouts API")

# API externa gratuita (opcional)
EXERCISE_API_URL = "https://api.api-ninjas.com/v1/exercises"
API_KEY = "YOUR_API_KEY_HERE"  # Reemplaza con tu key de API Ninjas (gratuita con límite)

@app.get("/workouts/{character}")
def get_workout(character: str):
    # Intentar consumir API externa
    try:
        headers = {'X-Api-Key': API_KEY}
        muscle_map = {
            "Goku": "chest",
            "Kratos": "back",
            "Luffy": "abdominals"
        }
        muscle = muscle_map.get(character, "chest")
        response = requests.get(f"{EXERCISE_API_URL}?muscle={muscle}&limit=3", headers=headers)
        if response.status_code == 200:
            exercises = response.json()
            routine = [ex['name'] for ex in exercises]
        else:
            raise Exception("API error")
    except:
        # Fallback a datos locales si API falla
        routines = {
            "Goku": ["Push-ups", "Squats", "Burpees"],
            "Kratos": ["Deadlift", "Pull-ups", "Plank"],
            "Luffy": ["Jump rope", "Sit-ups", "Running"]
        }
        routine = routines.get(character, [])

    return {
        "character": character,
        "routine": routine,
        "source": "external_api" if 'exercises' in locals() else "local_fallback"
    }
