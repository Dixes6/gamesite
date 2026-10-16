from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from fastapi import status, HTTPException

from app.db.session import SessionDep
from app.db.models.user import UsersModel, StreakModel
from app.service.user_service import add_or_remove_rubies

REWARDS = {
    1: 100,
    2: 300,
    3: 500,
    4: 800,
    5: 1000,
    6: 1200,
    7: 1600
}

async def claim_reward(user_id: int, session: SessionDep) -> int | None:
    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    streak_stmt = await session.execute(
        select(StreakModel)
        .where(StreakModel.user_id == user_id)
    )

    streak = streak_stmt.scalar_one_or_none()

    if streak is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Не найден стрик для пользователя")

    if datetime.now(ZoneInfo("Europe/Moscow")) - streak.last_claim_date >= timedelta(days=1):
        streak.current_streak += 1
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Невозможно продлить стрик")

    if streak.current_streak > streak.best_streak:
        streak.best_streak = streak.current_streak

    days_row = ((streak.current_streak - 1) % 7) + 1

    amount = REWARDS[days_row]

    await add_or_remove_rubies(user_id=user_id, amount=amount, reason="streak_bonus", session=session)

    streak.last_claim_date = datetime.now(ZoneInfo("Europe/Moscow"))

    await session.commit()
    return amount

async def streak_status(user_id: int, session: SessionDep) -> tuple[int, datetime] | None:
    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    streak_stmt = await session.execute(
        select(StreakModel)
        .where(StreakModel.user_id == user_id)
    )

    streak = streak_stmt.scalar_one_or_none()

    if streak is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Не найден стрик для пользователя")

    if datetime.now(ZoneInfo("Europe/Moscow")) - streak.last_claim_date >= timedelta(days=2):
        streak.current_streak = 0

    await session.commit()
    return streak.current_streak, streak.last_claim_date