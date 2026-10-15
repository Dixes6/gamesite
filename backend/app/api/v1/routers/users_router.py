from fastapi import APIRouter, status

from app.schemas.users_schemas import SUserResponse
from app.db.session import SessionDep
from app.api.v1.deps import get_current_user
from app.service.user_service import xp_to_next_level

router = APIRouter(prefix="/main", tags=["Главное меню"])

@router.get("/{user_id}", response_model=SUserResponse, status_code=status.HTTP_200_OK)
async def user(session: SessionDep, user_id: int) -> SUserResponse:
    user = await get_current_user(session, user_id)
    return SUserResponse(
        username = user.username,
        avatar_id = user.avatar_id,
        frame_id= user.frame_id,
        level = user.level,
        current_xp = user.current_xp,
        xp_to_next_level = await xp_to_next_level(user.id, session=session),
        rubies = user.rubies,
    )



