from sqlalchemy import select
from fastapi import status, HTTPException

from app.db.session import SessionDep
from app.db.models.user import UsersModel, InventoryModel
from app.db.models.shop import ShopItemModel
from app.service.user_service import add_or_remove_rubies, add_item_to_inventory, remove_item_from_inventory

async def get_avatar_and_frame_for_register(session: SessionDep):
    result = await session.execute(
        select(ShopItemModel)
        .where(ShopItemModel.is_starter == True,
               ShopItemModel.rarity == "common")
    )
    items = result.scalars().all()

    avatars = []
    frames = []

    for item in items:
        if item.type == 'avatar':
            avatars.append(item)
        else:
            frames.append(item)

    return {
        "avatars": avatars,
        "frames": frames,
    }

async def get_shop_items(user_id: int, session: SessionDep) -> dict | None:
    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    user_lvl = user.level

    available_stmt = await session.execute(select(ShopItemModel).where(ShopItemModel.unlock_level <= user_lvl))
    unavailable_stmt = await session.execute(select(ShopItemModel).where(ShopItemModel.unlock_level > user_lvl))

    available = list(available_stmt.scalars())
    unavailable = list(unavailable_stmt.scalars())

    return {
        "available": available,
        "unavailable": unavailable,
    }

async def buy_item(user_id: int, shop_item_id: int, session: SessionDep):
    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    item = await session.get(ShopItemModel, shop_item_id)

    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Предмет не найден")
    if item.price is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нету цены")

    if (
        item.unlock_level <= user.level and
        not item.is_starter and
        not item.is_exclusive
    ):
        if user.rubies < item.price:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Недостаточно средств")
        await add_or_remove_rubies(user_id=user_id, amount=-item.price, reason="shop_purchase", session=session)
        await add_item_to_inventory(user_id=user_id, shop_item_id=shop_item_id, source="purchase", quantity=1, session=session)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Вы не можете открыть этот кейс")

    await session.commit()
    return {
        "name": item.name,
        "image": item.image,
        "type": item.type,
        "rarity": item.rarity,
    }

async def sell_item(user_id: int, inventory_item_id: int, session: SessionDep):
    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    item = await session.get(InventoryModel, inventory_item_id)

    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Предмет не найден")

    shop_item = await session.get(ShopItemModel, item.shop_item_id)

    if shop_item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Предмет магазина не найден")

    if shop_item.selling_price == None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нету цены")

    if item.quantity <= 1 and (user.avatar_id == item.shop_item_id or user.frame_id == item.shop_item_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Невозможно продать предмет")

    await remove_item_from_inventory(user_id=user_id, shop_item_id=item.shop_item_id, quantity=1, session=session)
    await add_or_remove_rubies(user_id=user_id, amount=shop_item.selling_price, reason="shop_sale", session=session)

    await session.commit()
