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
            {"game_type": "clicker", "game_name": "Кликер", "game_icon": "image/games/clicker.png", "game_link": "/games/clicker"},
            {"game_type": "reaction", "game_name": "На реакцию", "game_icon": "image/games/reaction.png", "game_link": "/games/reaction"},
            {"game_type": "2048", "game_name": "2048", "game_icon": "image/games/2048.png", "game_link": "/games/2048"},
        ]
    }

@router.post("/{game_type}", response_model=SGamesResponse, status_code=status.HTTP_201_CREATED)
async def reward_game(data: SGamesRequest, game_type: str, session: SessionDep):
    game_reward = await gameplay(data.user_id, game_type, data.result_value, session)
    return SGamesResponse(
        result_value=data.result_value,
        reward=game_reward
    )