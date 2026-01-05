from fastapi import FastAPI

app = FastAPI(title="GameFit Workouts API")

@app.get("/workouts/{character}")
def get_workout(character: str):
    routines = {
        "Goku": ["Push-ups", "Squats", "Burpees"],
        "Kratos": ["Deadlift", "Pull-ups", "Plank"],
        "Luffy": ["Jump rope", "Sit-ups", "Running"]
    }
    return {
        "character": character,
        "routine": routines.get(character, [])
    }
