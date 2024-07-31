from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from server.db import FirebaseClient
from fastapi.responses import JSONResponse
from fastapi import Request
import json

router = APIRouter()

firebase_client = FirebaseClient()

class Prompt(BaseModel):
    origin: str
    use_case: str
    prompt: str

class Assistant(BaseModel):
    assistant_id: str
    assistant_apikey: str
    assistant_version: str
    use_case: str

@router.get("/random_prompts/{use_case}")
async def get_random_prompts(use_case: str):
    return firebase_client.get_random_prompts(use_case)

@router.post("/add_response")
async def add_response(response_data: Request):
    response_data = json.loads(await response_data.body())
    firebase_client.add_response(response_data)
    return {"message": "Response added successfully"}

@router.post("/update_elo")
async def update_elo(result: Request):
    result = json.loads(await result.body())
    firebase_client.update_elo(result)
    return {"message": "ELO updated successfully"}

@router.post("/increment_total_games")
async def increment_total_games():
    game_no = firebase_client.increment_total_games()
    return {"game_no": game_no, "message": "Total games incremented successfully"}

@router.get("/fetch_use_cases")
async def fetch_use_cases():
    return firebase_client.fetch_use_cases()

@router.get("/fetch_models")
async def fetch_models():
    return firebase_client.fetch_models()

@router.post("/add_prompt")
async def add_prompt(prompt: Prompt):
    firebase_client.add_or_update_prompt(prompt.model_dump())
    return {"message": "Prompt added successfully"}

@router.post("/add_use_case")
async def add_use_case(request: Request):
    use_case = json.loads(await request.body())
    firebase_client.add_or_update_use_case(use_case['use_case'])
    return {"message": "Use case added successfully"}

@router.post("/add_assistant")
async def add_assistant(assistant: Assistant):
    firebase_client.add_or_update_assistant(assistant.model_dump())
    return {"message": "Assistant added successfully"}

@router.get("/view_prompts/{model}/{use_case}")
async def view_prompts(model: str, use_case: str):
    prompts = firebase_client.db.collection('prompt').where('origin', '==', model).where('use_case', '==', use_case).stream()
    prompts_list = [p.to_dict() for p in prompts]
    return sorted(prompts_list, key=lambda x: x['version'], reverse=True)

@router.get("/view_assistants")
async def view_assistants():
    assistants = firebase_client.db.collection('assistants').stream()
    return [a.to_dict() for a in assistants]


@router.get("/leaderboard/{use_case}")
async def get_leaderboard(use_case: str):
    elo_docs = firebase_client.db.collection('elo').stream()
    leaderboard_data = []
    for doc in elo_docs:
        model_data = doc.to_dict()
        if 'use_case' not in model_data or model_data['use_case'] == use_case:
            leaderboard_data.append({
                'model_name': model_data['model_name'],
                'score': model_data['score'],
                'no_of_games': model_data['no_of_games']
            })
    return leaderboard_data

@router.get("/total_games")
async def get_total_games():
    total_games_doc = firebase_client.db.collection('total_games').document('total').get()
    if total_games_doc.exists:
        return total_games_doc.to_dict().get('total_games', 0)
    return 0