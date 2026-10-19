from fastapi import APIRouter, status

from app.schemas.users_schemas import SUserResponse, SUserInventoryResponse, SRewardStreakResponse, SUserAvatarOrFrameResponse
from app.db.session import SessionDep
from app.api.v1.deps import get_current_user
from app.service.user_service import xp_to_next_level, get_inventory_user_service, get_avatar_or_frame_user_service, change_avatar_service, change_frame_service
from app.service.streak_service import streak_status, claim_reward

router = APIRouter(prefix="/main", tags=["Главное меню"])

@router.get("/{user_id}", response_model=SUserResponse, status_code=status.HTTP_200_OK)
async def user(session: SessionDep, user_id: int) -> SUserResponse:
    user = await get_current_user(session, user_id)
    streak = await streak_status(user_id, session)
    return SUserResponse(
        username = user.username,
        avatar_id = user.avatar_id,
        frame_id= user.frame_id,
        level = user.level,
        current_xp = user.current_xp,
        xp_to_next_level = await xp_to_next_level(user.id, session=session),
        rubies = user.rubies,
        current_streak=streak["current_streak"],
        last_claim_date=streak["last_claim_date"],
    )

@router.post("/{user_id}/streak_claim_reward",response_model=SRewardStreakResponse, status_code=status.HTTP_201_CREATED)
async def streak_claim_reward(session: SessionDep, user_id: int):
    return await claim_reward(user_id, session)

@router.get("/{user_id}/inventory", response_model=list[SUserInventoryResponse], status_code=status.HTTP_200_OK)
async def get_user_inventory(session: SessionDep, user_id: int):
    return await get_inventory_user_service(user_id, session)

@router.get("/{user_id}/avatar", response_model=list[SUserAvatarOrFrameResponse], status_code=status.HTTP_200_OK)
async def avatars(session: SessionDep, user_id: int):
    return await get_avatar_or_frame_user_service(user_id, "avatar", session)

@router.get("/{user_id}/frame", response_model=list[SUserAvatarOrFrameResponse], status_code=status.HTTP_200_OK)
async def frames(session: SessionDep, user_id: int):
    return await get_avatar_or_frame_user_service(user_id, "frame", session)

@router.patch("/{user_id}/avatar/{shop_item_id}", status_code=status.HTTP_200_OK)
async def change_avatar(session: SessionDep, user_id: int, shop_item_id: int):
    await change_avatar_service(user_id, shop_item_id, session)
    return {"success": True}

@router.patch("/{user_id}/frame/{shop_item_id}", status_code=status.HTTP_200_OK)
async def change_avatar(session: SessionDep, user_id: int, shop_item_id: int):
    await change_frame_service(user_id, shop_item_id, session)
    return {"success": True}