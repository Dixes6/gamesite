from fastapi import APIRouter, HTTPException, status

from app.core.lexicon import LEXICON_RU
from app.schemas.games_schemas import SGamesRequest, SGamesResponse
from app.db.session import SessionDep
from app.service.game_service import gameplay

router = APIRouter(prefix="/games", tags=["Игры"])

@router.get("")
async def games():
    return {
        "page_title": LEXICON_RU["game"]["page_title"],
        "page_description": LEXICON_RU["game"]["page_description"],
        "games": [
            {"game_name": "Кликер", "game_icon": None, "game_link": "/games/clicker"},
            {"game_name": "На реакцию", "game_icon": None, "game_link": "/games/reaction"},
            {"game_name": "2048", "game_icon": None, "game_link": "/games/2048"},
        ]
    }

@router.post("/clicker", response_model=SGamesResponse, status_code=status.HTTP_201_CREATED)
async def reward_clicker(data: SGamesRequest, session: SessionDep):
    game_reward = await gameplay(data.user_id, "clicker", data.result_value, session)
    return SGamesResponse(
        result_value=data.result_value,
        reward=game_reward
    )