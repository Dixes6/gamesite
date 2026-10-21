import asyncio

from sqlalchemy import delete, insert

from app.db.session import async_engine, async_session
from app.db.models.shop import ShopItemModel
from app.db.models.case import CaseModel, CaseItemModel
from app.db.models.task import TaskTemplateModel

async def delete_all(session) -> None:
    await session.execute(delete(TaskTemplateModel))
    await session.execute(delete(CaseItemModel))
    await session.execute(delete(CaseModel))
    await session.execute(delete(ShopItemModel))

async def seed_shop_item(session) -> None:
    add_shop_item = [
        {
            "id": 1,
            "name": "АВА-1",
            "image": "image/items/1.png",
            "type": "avatar",
            "price": 200,
            "selling_price": 100,
            "unlock_level": 1,
            "is_exclusive": False,
            "is_starter": False,
            "rarity": "common",
        },
        {
            "id": 2,
            "name": "АВА-2",
            "image": "image/items/2.png",
            "type": "avatar",
            "price": 500,
            "selling_price": 250,
            "unlock_level": 1,
            "is_exclusive": False,
            "is_starter": False,
            "rarity": "rare",
        },
        {
            "id": 3,
            "name": "РАМКА-1",
            "image": "image/items/3.png",
            "type": "frame",
            "price": 250,
            "selling_price": 125,
            "unlock_level": 1,
            "is_exclusive": False,
            "is_starter": False,
            "rarity": "common",
        },
        {
            "id": 4,
            "name": "АВА-3",
            "image": "image/items/4.png",
            "type": "avatar",
            "price": None,
            "selling_price": None,
            "unlock_level": 1,
            "is_exclusive": True,
            "is_starter": False,
            "rarity": "epic",
        },
        {
            "id": 5,
            "name": "АВА-4",
            "image": "image/items/5.png",
            "type": "avatar",
            "price": None,
            "selling_price": None,
            "unlock_level": 1,
            "is_exclusive": False,
            "is_starter": True,
            "rarity": "common",
        },
        {
            "id": 6,
            "name": "РАМКА-2",
            "image": "image/items/6.png",
            "type": "frame",
            "price": None,
            "selling_price": None,
            "unlock_level": 1,
            "is_exclusive": True,
            "is_starter": False,
            "rarity": "epic",
        },
        {
            "id": 7,
            "name": "РАМКА-3",
            "image": "image/items/7.png",
            "type": "frame",
            "price": None,
            "selling_price": None,
            "unlock_level": 1,
            "is_exclusive": False,
            "is_starter": True,
            "rarity": "common",
        },
    ]

    await session.execute(insert(ShopItemModel).values(add_shop_item))

async def seed_case(session) -> None:
    add_cases = [
        {
            "id": 1,
            "name": "Кварцевый скол",
            "image": "image/cases/1.png",
            "unlock_level": 1,
            "price": 100,
        },
        {
            "id": 2,
            "name": "Аметистовый ларец",
            "image": "image/cases/2.png",
            "unlock_level": 10,
            "price": 200,
        },
        {
            "id": 3,
            "name": "Сапфировый сундук",
            "image": "image/cases/3.png",
            "unlock_level": 25,
            "price": 300,
        },
        {
            "id": 4,
            "name": "Изумрудный тайник",
            "image": "image/cases/4.png",
            "unlock_level": 50,
            "price": 500,
        },
        {
            "id": 5,
            "name": "Рубиновый реликварий",
            "image": "image/cases/5.png",
            "unlock_level": 80,
            "price": 800,
        },
        {
            "id": 6,
            "name": "Алмазный артефакт",
            "image": "image/cases/6.png",
            "unlock_level": 100,
            "price": 1000,
        },
    ]
    await session.execute(insert(CaseModel).values(add_cases))

async def seed_case_item(session) -> None:
    add_case_item = [
        {"case_id": 1, "item_type": "rubies", "value": 100, "shop_item_id": None, "weight": 30},
        {"case_id": 1, "item_type": "rubies", "value": 50, "shop_item_id": None, "weight": 30},
        {"case_id": 1, "item_type": "rubies", "value": 150, "shop_item_id": None, "weight": 30},
        {"case_id": 1, "item_type": "rubies", "value": 200, "shop_item_id": None, "weight": 20},
        {"case_id": 1, "item_type": "xp", "value": 500, "shop_item_id": None, "weight": 30},
        {"case_id": 1, "item_type": "xp", "value": 750, "shop_item_id": None, "weight": 30},
        {"case_id": 1, "item_type": "xp", "value": 200, "shop_item_id": None, "weight": 35},
        {"case_id": 1, "item_type": "xp", "value": 1000, "shop_item_id": None, "weight": 10},
        {"case_id": 2, "item_type": "rubies", "value": 150, "shop_item_id": None, "weight": 30},
        {"case_id": 2, "item_type": "rubies", "value": 400, "shop_item_id": None, "weight": 15},
        {"case_id": 2, "item_type": "xp", "value": 500, "shop_item_id": None, "weight": 40},
        {"case_id": 2, "item_type": "xp", "value": 750, "shop_item_id": None, "weight": 30},
        {"case_id": 2, "item_type": "xp", "value": 1000, "shop_item_id": None, "weight": 20},
        {"case_id": 3, "item_type": "rubies", "value": 250, "shop_item_id": None, "weight": 30},
        {"case_id": 3, "item_type": "rubies", "value": 500, "shop_item_id": None, "weight": 25},
        {"case_id": 3, "item_type": "xp", "value": 750, "shop_item_id": None, "weight": 30},
        {"case_id": 3, "item_type": "xp", "value": 1000, "shop_item_id": None, "weight": 25},
        {"case_id": 3, "item_type": "xp", "value": 1500, "shop_item_id": None, "weight": 15},
        {"case_id": 3, "item_type": "shop_item", "value": None, "shop_item_id": 4, "weight": 5},
        {"case_id": 3, "item_type": "shop_item", "value": None, "shop_item_id": 6, "weight": 5},
        {"case_id": 4, "item_type": "rubies", "value": 750, "shop_item_id": None, "weight": 20},
        {"case_id": 4, "item_type": "xp", "value": 750, "shop_item_id": None, "weight": 30},
        {"case_id": 4, "item_type": "xp", "value": 1000, "shop_item_id": None, "weight": 30},
        {"case_id": 4, "item_type": "xp", "value": 1500, "shop_item_id": None, "weight": 20},
        {"case_id": 5, "item_type": "rubies", "value": 500, "shop_item_id": None, "weight": 25},
        {"case_id": 5, "item_type": "rubies", "value": 1000, "shop_item_id": None, "weight": 25},
        {"case_id": 5, "item_type": "rubies", "value": 1200, "shop_item_id": None, "weight": 20},
        {"case_id": 5, "item_type": "xp", "value": 750, "shop_item_id": None, "weight": 30},
        {"case_id": 5, "item_type": "xp", "value": 1000, "shop_item_id": None, "weight": 30},
        {"case_id": 5, "item_type": "xp", "value": 1500, "shop_item_id": None, "weight": 30},
        {"case_id": 5, "item_type": "xp", "value": 1750, "shop_item_id": None, "weight": 20},
        {"case_id": 5, "item_type": "shop_item", "value": None, "shop_item_id": 4, "weight": 15},
        {"case_id": 5, "item_type": "shop_item", "value": None, "shop_item_id": 6, "weight": 15},
        {"case_id": 6, "item_type": "rubies", "value": 750, "shop_item_id": None, "weight": 20},
        {"case_id": 6, "item_type": "rubies", "value": 1000, "shop_item_id": None, "weight": 30},
        {"case_id": 6, "item_type": "rubies", "value": 1200, "shop_item_id": None, "weight": 30},
        {"case_id": 6, "item_type": "rubies", "value": 1500, "shop_item_id": None, "weight": 20},
        {"case_id": 6, "item_type": "rubies", "value": 2000, "shop_item_id": None, "weight": 15},
        {"case_id": 6, "item_type": "xp", "value": 2000, "shop_item_id": None, "weight": 25},
    ]

    await session.execute(insert(CaseItemModel).values(add_case_item))


async def seed_task(session) -> None:
    add_task = [
        {
            "period": "day",
            "condition_type": "score_in_game",
            "game_type": "2048",
            "target_value": 1024,
            "reward_rubies": 100,
            "reward_xp": 500,
        },
        {
            "period": "day",
            "condition_type": "open_case",
            "game_type": None,
            "target_value": 3,
            "reward_rubies": 300,
            "reward_xp": 1000,
        },
        {
            "period": "day",
            "condition_type": "pass_levels",
            "game_type": None,
            "target_value": 1,
            "reward_rubies": 200,
            "reward_xp": 500,
        },
        {
            "period": "week",
            "condition_type": "score_in_game",
            "game_type": "clicker",
            "target_value": 2000,
            "reward_rubies": 750,
            "reward_xp": 5000,
        },
        {
            "period": "month",
            "condition_type": "open_case",
            "game_type": None,
            "target_value": 80,
            "reward_rubies": 1000,
            "reward_xp": 12000,
        },
    ]

    await session.execute(insert(TaskTemplateModel).values(add_task))

async def seed() -> None:
    async with async_session() as session:
        async with session.begin():
            await delete_all(session)
            await seed_shop_item(session)
            await seed_case(session)
            await seed_case_item(session)
            await seed_task(session)


async def main() -> None:
    try:
        await seed()
        print("Seed успешно выполнен")
    finally:
        await async_engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
