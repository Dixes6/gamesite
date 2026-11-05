from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from app.core.config import settings
from app.db.session import SessionDep
from app.db.models.user import UsersModel

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    session: SessionDep, token: str = Depends(oauth2_scheme)
) -> UsersModel:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Пользователь не найден",
            )

        user = await session.get(UsersModel, int(user_id))

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден"
            )
        return user
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Не подходящий токен"
        )
