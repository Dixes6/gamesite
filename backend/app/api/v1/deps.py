from fastapi import HTTPException, status

from app.db.session import SessionDep
from app.db.models.user import UsersModel

async def get_current_user(session: SessionDep, user_id: int) -> UsersModel:
    user = await session.get(UsersModel, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")
    return user