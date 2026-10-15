from sqlalchemy import insert
from fastapi import APIRouter, status, HTTPException

from app.db.session import SessionDep
from app.db.models.user import UsersModel
from app.db.models.game_session import GameSessionModel
from app.service.user_service import add_or_remove_rubies
from app.service.task_service import register_task_event

async def gameplay(user_id: int, game_type: str, result_value: int, session: SessionDep) -> int | None:
    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    if game_type == "clicker":
        reward = result_value
    elif game_type == "reaction":
        reward = result_value*100
    elif game_type == "2048":
        reward = 0

        REWARDS = {
            128: 100,
            256: 200,
            512: 400,
            1024: 800,
            2048: 1600,
            4096: 3200,
        }

        for tile in sorted(REWARDS.keys(), reverse=True):
            if result_value >= tile:
                reward = REWARDS[tile]
                break
    else:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Такой игры не существует")

    await add_or_remove_rubies(user_id=user_id, amount=reward, reason="game_reward", session=session)

    result = [{
        "user_id": user_id,
        "game_type": game_type,
        "score": result_value,
        "rubies_earned": reward
    }]

    await session.execute(
        insert(GameSessionModel)
        .values(result)
    )

    await register_task_event(user_id=user_id, condition_type="score_in_game", game_type=game_type, amount=result_value, session=session)

    await session.commit()

    return reward