from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from app.db.models.user import StreakModel, UsersModel
from app.db.session import SessionDep
from app.service.user_service import add_or_remove_rubies
from fastapi import HTTPException, status
from sqlalchemy import select

REWARDS = {1: 100, 2: 300, 3: 500, 4: 800, 5: 1000, 6: 1200, 7: 1600}


def get_now_msk() -> datetime:
    """Текущее время по Москве (naive datetime для БД)."""
    return datetime.now(ZoneInfo("Europe/Moscow")).replace(tzinfo=None)


async def get_or_create_streak(
    user_id: int, session: SessionDep, for_update: bool = False
) -> StreakModel:
    stmt = select(StreakModel).where(StreakModel.user_id == user_id)
    if for_update:
        stmt = stmt.with_for_update()
    result = await session.execute(stmt)
    streak = result.scalar_one_or_none()

    if streak is None:
        now_msk = get_now_msk()
        # Вчерашний день по умолчанию, чтобы новый игрок мог сразу забрать 1-й день стрика
        yesterday_msk = now_msk - timedelta(days=1)
        streak = StreakModel(
            user_id=user_id,
            current_streak=0,
            best_streak=0,
            last_claim_date=yesterday_msk,
        )
        session.add(streak)
        await session.flush()

    return streak


async def claim_reward(user_id: int, session: SessionDep) -> dict:
    user = await session.get(UsersModel, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден"
        )

    streak = await get_or_create_streak(user_id, session, for_update=True)
    now_msk = get_now_msk()
    today = now_msk.date()
    last_claimed_day = streak.last_claim_date.date()
    delta_days = (today - last_claimed_day).days

    # Если уже забирали сегодня и стрик уже активен
    if delta_days < 1 and streak.current_streak > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы уже забрали сегодняшнюю награду. Следующая будет доступна в 00:00 по МСК.",
        )

    # Если пропущен календарный день (2+ дня со дня последнего забора) — сброс стрика
    if delta_days >= 2:
        streak.current_streak = 0

    streak.current_streak += 1

    streak.best_streak = max(streak.best_streak, streak.current_streak)

    days_row = ((streak.current_streak - 1) % 7) + 1
    amount = REWARDS[days_row]

    await add_or_remove_rubies(
        user_id=user_id, amount=amount, reason="streak_bonus", session=session
    )

    streak.last_claim_date = now_msk
    await session.commit()

    return {
        "amount_rubies": amount,
        "current_streak": streak.current_streak,
        "best_streak": streak.best_streak,
    }


async def streak_status(user_id: int, session: SessionDep) -> dict:
    user = await session.get(UsersModel, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден"
        )

    streak = await get_or_create_streak(user_id, session)
    now_msk = get_now_msk()
    today = now_msk.date()
    last_claimed_day = streak.last_claim_date.date()
    delta_days = (today - last_claimed_day).days

    # Если пропущен день — сброс стрика
    if delta_days >= 2:
        streak.current_streak = 0

    await session.commit()

    can_claim = (delta_days >= 1) or (streak.current_streak == 0)

    return {
        "current_streak": streak.current_streak,
        "best_streak": streak.best_streak,
        "last_claim_date": streak.last_claim_date,
        "can_claim": can_claim,
    }
