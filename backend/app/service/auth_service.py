from sqlalchemy import select, insert
from fastapi import HTTPException, status
from app.db.session import SessionDep
from app.db.models.user import UsersModel
from app.core.security import hash_password, verify_password, create_access_token


async def register_user(username: str, password: str, session: SessionDep) -> str | None:
    result = await session.execute(select(UsersModel).where(UsersModel.username == username))
    user = result.scalar_one_or_none()

    if user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Пользователь с таким ником уже существует")

    password_hash = hash_password(password)
    user_data = [{
        "username": username,
        "password_hash": password_hash,
        "avatar_id": None,
        "frame_id": None,
        "level": 1,
        "current_xp": 0,
        "rubies": 0,
    }]

    await session.execute(
        insert(UsersModel)
        .values(user_data)
    )
    await session.commit()

    result = await session.execute(select(UsersModel).where(UsersModel.username == username))
    new_user = result.scalar_one()
    return create_access_token(str(new_user.id))

async def login_user(username: str, password: str, session: SessionDep) -> str | None:
    result = await session.execute(select(UsersModel).where(UsersModel.username == username))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный логин или пароль")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный логин или пароль")

    return create_access_token(str(user.id))