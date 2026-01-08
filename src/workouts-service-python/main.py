from fastapi import FastAPI
from pymongo import MongoClient
import requests

app = FastAPI(title="GameFit Workouts API")

# MongoDB
client = MongoClient("mongodb://mongo:27017/")
db = client.gamefit

workouts_collection = db.workouts
routines_collection = db.routines
history_collection = db.history

EXERCISE_API_URL = "https://api.api-ninjas.com/v1/exercises"
API_KEY = "YOUR_API_KEY_HERE"

# 🔥 WORKOUTS POR PERSONAJE
@app.get("/workouts/{character}")
def get_workout(character: str):
    existing = workouts_collection.find_one({"character": character})
    if existing:
        return {
            "character": character,
            "routine": existing["routine"],
            "source": "database"
        }

    routines = {
        "Goku": ["Push-ups", "Squats", "Burpees"],
        "Kratos": ["Deadlift", "Pull-ups", "Plank"],
        "Luffy": ["Jump rope", "Sit-ups", "Running"]
    }

    routine = routines.get(character, ["Push-ups", "Squats"])
    workouts_collection.insert_one({
        "character": character,
        "routine": routine
    })

    return {
        "character": character,
        "routine": routine,
        "source": "local"
    }

# 🏋️ RUTINAS USUARIO
@app.get("/routines/{username}")
def get_user_routines(username: str):
    return list(
        routines_collection.find({"username": username}, {"_id": 0})
    )

@app.post("/routines")
def save_routine(routine: dict):
    routines_collection.insert_one(routine)
    return {"message": "Rutina guardada"}

# 📜 HISTORIAL
@app.get("/history/{username}")
def get_history(username: str):
    return list(
        history_collection.find({"username": username}, {"_id": 0})
    )

@app.post("/history")
def save_history(entry: dict):
    history_collection.insert_one(entry)
    return {"message": "Historial guardado"}


@app.put("/routines")
def update_routine(data: dict):
    username = data.get("username")
    old_name = data.get("oldName")
    new_name = data.get("newName")
    exercises = data.get("exercises")

    if not username or not old_name:
        return {"error": "Datos incompletos"}

    routines_collection.update_one(
        {"username": username, "name": old_name},
        {"$set": {
            "name": new_name or old_name,
            "exercises": exercises
        }}
    )

    return {"message": "Rutina actualizada"}


@app.delete("/routines")
def delete_routine(data: dict):
    username = data.get("username")
    name = data.get("name")

    routines_collection.delete_one({
        "username": username,
        "name": name
    })

    return {"message": "Rutina eliminada"}
