from fastapi import APIRouter, status, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.db.session import SessionDep
from app.schemas.users_schemas import SUserRegister, STokenResponse
from app.service.auth_service import register_user, login_user

router = APIRouter(prefix="/auth", tags=["Авторизация"])

@router.post("/register", response_model=STokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: SUserRegister, session: SessionDep):
    token = await register_user(data.username, data.password, session)
    return STokenResponse(access_token=token, token_type="bearer")

@router.post("/login", response_model=STokenResponse, status_code=status.HTTP_200_OK)
async def login(session: SessionDep, form_data: OAuth2PasswordRequestForm = Depends()):
    token = await login_user(form_data.username, form_data.password, session)
    return STokenResponse(access_token=token, token_type="bearer")