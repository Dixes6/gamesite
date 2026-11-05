from sqlalchemy import select, or_
from fastapi import HTTPException, status
from app.db.session import SessionDep
from app.db.models.user import UsersModel
from app.core.security import hash_password, verify_password, create_access_token
from app.db.models.shop import ShopItemModel
from app.service.user_service import add_item_to_inventory
from app.service.task_service import assign_current_tasks_to_user


async def register_user(
    username: str, password: str, avatar_id: int, frame_id: int, session: SessionDep
) -> str | None:
    result = await session.execute(
        select(UsersModel).where(UsersModel.username == username)
    )
    user = result.scalar_one_or_none()

    if user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким ником уже существует",
        )

    result = await session.execute(
        select(ShopItemModel)
        .where(ShopItemModel.is_starter == True)  # Общее условие для всех
        .where(
            or_(
                (ShopItemModel.id == frame_id) & (ShopItemModel.type == "frame"),
                (ShopItemModel.id == avatar_id) & (ShopItemModel.type == "avatar"),
            )
        )
    )

    items = result.scalars().all()
    if len(items) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не найдено подходящего предмета",
        )

    password_hash = hash_password(password)
    new_user = UsersModel(
        username=username,
        password_hash=password_hash,
        avatar_id=avatar_id,
        frame_id=frame_id,
        level=1,
        current_xp=0,
        rubies=0,
    )
    session.add(new_user)

    await session.flush()

    await add_item_to_inventory(
        user_id=new_user.id,
        shop_item_id=avatar_id,
        source="default",
        quantity=1,
        session=session,
    )
    await add_item_to_inventory(
        user_id=new_user.id,
        shop_item_id=frame_id,
        source="default",
        quantity=1,
        session=session,
    )

    await assign_current_tasks_to_user(user_id=new_user.id, session=session)

    await session.commit()
    return create_access_token(str(new_user.id))


async def login_user(username: str, password: str, session: SessionDep) -> str | None:
    result = await session.execute(
        select(UsersModel).where(UsersModel.username == username)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный логин или пароль"
        )

    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный логин или пароль"
        )

    return create_access_token(str(user.id))
