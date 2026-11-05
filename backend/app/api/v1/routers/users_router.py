from fastapi import APIRouter, status, Depends

from app.db.models.user import UsersModel
from app.schemas.users_schemas import (
    SUserResponse,
    SUserInventoryResponse,
    SRewardStreakResponse,
    SUserAvatarOrFrameResponse,
)
from app.db.session import SessionDep
from app.api.v1.deps import get_current_user
from app.service.user_service import (
    xp_to_next_level,
    get_inventory_user_service,
    get_avatar_or_frame_user_service,
    change_avatar_service,
    change_frame_service,
    get_image,
)
from app.service.streak_service import streak_status, claim_reward

router = APIRouter(prefix="/main", tags=["Главное меню"])


@router.get("/", response_model=SUserResponse, status_code=status.HTTP_200_OK)
async def user(
    session: SessionDep, user: UsersModel = Depends(get_current_user)
) -> SUserResponse:
    streak = await streak_status(user.id, session)
    return SUserResponse(
        username=user.username,
        avatar_id=user.avatar_id,
        avatar_image=await get_image(item_id=user.avatar_id, session=session),
        frame_id=user.frame_id,
        frame_image=await get_image(item_id=user.frame_id, session=session),
        level=user.level,
        current_xp=user.current_xp,
        xp_to_next_level=await xp_to_next_level(user.id, session=session),
        rubies=user.rubies,
        current_streak=streak["current_streak"],
        last_claim_date=streak["last_claim_date"],
    )


@router.post(
    "/streak_claim_reward",
    response_model=SRewardStreakResponse,
    status_code=status.HTTP_201_CREATED,
)
async def streak_claim_reward(
    session: SessionDep, user: UsersModel = Depends(get_current_user)
):
    return await claim_reward(user.id, session)


@router.get(
    "/inventory",
    response_model=list[SUserInventoryResponse],
    status_code=status.HTTP_200_OK,
)
async def get_user_inventory(
    session: SessionDep, user: UsersModel = Depends(get_current_user)
):
    return await get_inventory_user_service(user.id, session)


@router.get(
    "/avatar",
    response_model=list[SUserAvatarOrFrameResponse],
    status_code=status.HTTP_200_OK,
)
async def avatars(session: SessionDep, user: UsersModel = Depends(get_current_user)):
    return await get_avatar_or_frame_user_service(user.id, "avatar", session)


@router.get(
    "/frame",
    response_model=list[SUserAvatarOrFrameResponse],
    status_code=status.HTTP_200_OK,
)
async def frames(session: SessionDep, user: UsersModel = Depends(get_current_user)):
    return await get_avatar_or_frame_user_service(user.id, "frame", session)


@router.patch("/avatar/{shop_item_id}", status_code=status.HTTP_200_OK)
async def change_avatar(
    session: SessionDep, shop_item_id: int, user: UsersModel = Depends(get_current_user)
):
    await change_avatar_service(user.id, shop_item_id, session)
    return {"success": True}


@router.patch("/frame/{shop_item_id}", status_code=status.HTTP_200_OK)
async def change_frame(
    session: SessionDep, shop_item_id: int, user: UsersModel = Depends(get_current_user)
):
    await change_frame_service(user.id, shop_item_id, session)
    return {"success": True}
