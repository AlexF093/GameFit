from fastapi import FastAPI
import requests
from pymongo import MongoClient

app = FastAPI(title="GameFit Workouts API")

# Conexión MongoDB
client = MongoClient("mongodb://mongo:27017/")
db = client.gamefit
workouts_collection = db.workouts

# API externa gratuita (opcional)
EXERCISE_API_URL = "https://api.api-ninjas.com/v1/exercises"
API_KEY = "YOUR_API_KEY_HERE"  # Reemplaza con tu key de API Ninjas (gratuita con límite)

@app.get("/workouts/{character}")
def get_workout(character: str):
    # Verificar si ya existe en DB
    existing = workouts_collection.find_one({"character": character})
    if existing:
        return {
            "character": character,
            "routine": existing["routine"],
            "source": "database"
        }

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
            source = "external_api"
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
        source = "local_fallback"

    # Guardar en DB
    workouts_collection.insert_one({
        "character": character,
        "routine": routine
    })

    return {
        "character": character,
        "routine": routine,
        "source": source
    }
