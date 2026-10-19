from typing import Literal
from sqlalchemy import insert, select, and_
from sqlalchemy.orm import selectinload
from fastapi import status, HTTPException

from app.db.models import ShopItemModel
from app.db.session import SessionDep
from app.db.models.user import UsersModel, InventoryModel
from app.db.models.transaction import TransactionModel

BASE_XP = 5000
XP_STEP = 500
MAX_LEVEL = 100

LEVEL_THRESHOLDS = [None, 0]

current_xp = 0

for level in range(2, MAX_LEVEL + 1):
    step = BASE_XP + XP_STEP * (level - 2)
    current_xp += step
    LEVEL_THRESHOLDS.append(current_xp)

async def xp_to_next_level(user_id: int, session: SessionDep) -> int | None:
    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    to_next_level = LEVEL_THRESHOLDS[user.level + 1] - user.current_xp

    return to_next_level

async def add_xp(user_id: int, amount: int, session: SessionDep):
    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    user.current_xp += amount

    while user.level < MAX_LEVEL and user.current_xp >= LEVEL_THRESHOLDS[user.level + 1]:
        user.level += 1

    await session.commit()

async def add_or_remove_rubies(user_id: int, amount: int, reason: str, session: SessionDep):
    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    user.rubies += amount

    await session.execute(
        insert(TransactionModel)
        .values({
                "user_id": user_id,
                "amount": amount,
                "reason": reason,
            })
    )

    await session.commit()

async def check_level(user_id: int, need_level: int, session: SessionDep) -> bool:
    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    if user.level >= need_level:
        return True
    else:
        return False

async def add_item_to_inventory(user_id: int, shop_item_id: int, source: str, quantity: int, session: SessionDep):
    result = await session.execute(
        select(InventoryModel)
        .where(and_(
            InventoryModel.user_id == user_id,
            InventoryModel.shop_item_id == shop_item_id,
        ))
    )

    item = result.scalar_one_or_none()

    if item is None:
        item = InventoryModel(
            user_id=user_id,
            shop_item_id=shop_item_id,
            source=source,
            quantity=quantity,
        )
        session.add(item)
    else:
        item.quantity += quantity

    await session.commit()

async def remove_item_from_inventory(user_id: int, shop_item_id: int, quantity: int, session: SessionDep):
    result = await session.execute(
        select(InventoryModel)
        .where(and_(
            InventoryModel.user_id == user_id,
            InventoryModel.shop_item_id == shop_item_id,
        ))
    )

    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Предмет не найден")

    if item.quantity < quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя продать предмет")

    item.quantity -= quantity

    if item.quantity <= 0:
        await session.delete(item)

    await session.commit()

async def change_avatar_service(user_id: int, shop_item_id: int, session: SessionDep):
    result = await session.execute(
        select(InventoryModel)
        .where(and_(
            InventoryModel.user_id == user_id,
            InventoryModel.shop_item_id == shop_item_id,
        ))
    )

    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Предмет не найден")

    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    user.avatar_id = item.shop_item_id

    await session.commit()

async def change_frame_service(user_id: int, shop_item_id: int, session: SessionDep):
    result = await session.execute(
        select(InventoryModel)
        .where(and_(
            InventoryModel.user_id == user_id,
            InventoryModel.shop_item_id == shop_item_id,
        ))
    )

    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Предмет не найден")

    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    user.frame_id = item.shop_item_id

    await session.commit()

async def get_inventory_user_service(user_id: int, session: SessionDep):
    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    user_inventory_stmt = await session.execute(
        select(InventoryModel)
        .join(InventoryModel.shop_item)
        .options(selectinload(InventoryModel.shop_item))
        .where(
            InventoryModel.user_id == user_id
        )
    )
    user_inventory = user_inventory_stmt.scalars().all()

    return [
        {
            "shop_item_id": item.shop_item_id,
            "name_key": item.shop_item.name_key,
            "type": item.shop_item.type,
            "selling_price": item.shop_item.selling_price,
            "is_exclusive": item.shop_item.is_exclusive,
            "is_starter": item.shop_item.is_starter,
            "rarity": item.shop_item.rarity,
            "obtained_at": item.obtained_at,
            "quantity": item.quantity,
        }
        for item in user_inventory
    ]

async def get_avatar_or_frame_user_service(user_id: int, item_type: Literal["avatar", "frame"], session: SessionDep):
    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    user_inventory_stmt = await session.execute(
        select(InventoryModel)
        .join(ShopItemModel, InventoryModel.shop_item_id == ShopItemModel.id)
        .options(selectinload(InventoryModel.shop_item))
        .where(
            InventoryModel.user_id == user_id,
            ShopItemModel.type == item_type,
        )
    )
    user_inventory = user_inventory_stmt.scalars().all()

    return [
        {
            "shop_item_id": item.shop_item_id,
            "name_key": item.shop_item.name_key,
            "type": item.shop_item.type,
            "is_exclusive": item.shop_item.is_exclusive,
            "is_starter": item.shop_item.is_starter,
            "rarity": item.shop_item.rarity,
        }
        for item in user_inventory
    ]