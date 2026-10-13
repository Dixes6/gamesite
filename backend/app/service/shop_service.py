from sqlalchemy import select, and_, case, insert

from app.db.session import SessionDep
from app.db.models.user import UsersModel, InventoryModel
from app.db.models.shop import ShopItemModel
from app.service.user_service import add_or_remove_rubies, add_item_to_inventory, remove_item_from_inventory

async def get_shop_items(user_id: int, session: SessionDep) -> tuple[list, list] | None:
    user = await session.get(UsersModel, user_id)

    if user is None:
        return

    user_lvl = user.level

    available_stmt = await session.execute(select(ShopItemModel).where(ShopItemModel.unlock_level <= user_lvl))
    unavailable_stmt = await session.execute(select(ShopItemModel).where(ShopItemModel.unlock_level > user_lvl))

    available = list(available_stmt.scalars())
    unavailable = list(unavailable_stmt.scalars())

    return available, unavailable

async def buy_item(user_id: int, shop_item_id: int, session: SessionDep):
    user = await session.get(UsersModel, user_id)

    if user is None:
        return

    item = await session.get(ShopItemModel, shop_item_id)

    if item is None:
        return
    if item.price is None:
        return

    if (
        item.unlock_level <= user.level and
        not item.is_starter and
        not item.is_exclusive
    ):
        if user.rubies < item.price:
            return
        await add_or_remove_rubies(user_id=user_id, amount=-item.price, reason="shop_purchase", session=session)
        await add_item_to_inventory(user_id=user_id, shop_item_id=shop_item_id, source="purchase", quantity=1, session=session)

    await session.commit()

async def sell_item(user_id: int, inventory_item_id: int, session: SessionDep):
    user = await session.get(UsersModel, user_id)

    if user is None:
        return

    item = await session.get(InventoryModel, inventory_item_id)

    if item is None:
        return

    shop_item = await session.get(ShopItemModel, item.shop_item_id)

    if shop_item is None:
        return

    if shop_item.selling_price == None:
        return

    if item.quantity <= 1 and (user.avatar_id == item.shop_item_id or user.frame_id == item.shop_item_id):
        return

    await remove_item_from_inventory(user_id=user_id, shop_item_id=item.shop_item_id, quantity=1, session=session)
    await add_or_remove_rubies(user_id=user_id, amount=shop_item.selling_price, reason="shop_sale", session=session)

    await session.commit()
