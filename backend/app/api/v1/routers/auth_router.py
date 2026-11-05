from fastapi import APIRouter, status, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.db.session import SessionDep
from app.schemas.users_schemas import SUserRegister, STokenResponse
from app.service.auth_service import register_user, login_user
from app.schemas.shop_schemas import SStartAvatarsAndFramesResponse
from app.service.shop_service import get_avatar_and_frame_for_register

router = APIRouter(prefix="/auth", tags=["Авторизация"])


@router.get(
    "/starter-items",
    response_model=SStartAvatarsAndFramesResponse,
    status_code=status.HTTP_200_OK,
)
async def starter_items(session: SessionDep):
    return await get_avatar_and_frame_for_register(session)


@router.post(
    "/register", response_model=STokenResponse, status_code=status.HTTP_201_CREATED
)
async def register(data: SUserRegister, session: SessionDep):
    token = await register_user(
        data.username, data.password, data.avatar_id, data.frame_id, session
    )
    return STokenResponse(access_token=token, token_type="bearer")


@router.post("/login", response_model=STokenResponse, status_code=status.HTTP_200_OK)
async def login(session: SessionDep, form_data: OAuth2PasswordRequestForm = Depends()):
    token = await login_user(form_data.username, form_data.password, session)
    return STokenResponse(access_token=token, token_type="bearer")
