import asyncio

from sqlalchemy import delete, insert

from app.db.session import async_engine, async_session
from app.db.models.user import UsersModel
from app.db.models.shop import ShopItemModel
from app.db.models.case import CaseModel, CaseItemModel
from app.db.models.task import TaskTemplateModel, CurrentTasksModel, UserTaskModel


async def delete_all(session) -> None:
    await session.execute(delete(UserTaskModel))
    await session.execute(delete(CurrentTasksModel))
    await session.execute(delete(TaskTemplateModel))
    await session.execute(delete(UsersModel))
    await session.execute(delete(CaseItemModel))
    await session.execute(delete(CaseModel))
    await session.execute(delete(ShopItemModel))


async def seed_shop_item(session) -> None:
    add_shop_item = [
        {
            "id": 1,
            "name": "Дух дубравы",
            "image": "image/items/common-1.png",
            "type": "avatar",
            "price": None,
            "selling_price": None,
            "unlock_level": 1,
            "is_exclusive": False,
            "is_starter": True,
            "rarity": "common",
        },
        {
            "id": 2,
            "name": "Рогатый пушистик",
            "image": "image/items/common-2.png",
            "type": "avatar",
            "price": None,
            "selling_price": None,
            "unlock_level": 1,
            "is_exclusive": False,
            "is_starter": True,
            "rarity": "common",
        },
        {
            "id": 3,
            "name": "Дубовый спил",
            "image": "image/items/common-frame-1.png",
            "type": "frame",
            "price": None,
            "selling_price": None,
            "unlock_level": 1,
            "is_exclusive": False,
            "is_starter": True,
            "rarity": "common",
        },
        {
            "id": 4,
            "name": "Крепостной камень",
            "image": "image/items/common-frame-2.png",
            "type": "frame",
            "price": None,
            "selling_price": None,
            "unlock_level": 1,
            "is_exclusive": False,
            "is_starter": True,
            "rarity": "common",
        },
        {
            "id": 5,
            "name": "Владыка магмы",
            "image": "image/items/epic-1.png",
            "type": "avatar",
            "price": 4000,
            "selling_price": 500,
            "unlock_level": 25,
            "is_exclusive": False,
            "is_starter": False,
            "rarity": "epic",
        },
        {
            "id": 6,
            "name": "Хранительница рощи",
            "image": "image/items/epic-2.png",
            "type": "avatar",
            "price": 6000,
            "selling_price": 750,
            "unlock_level": 30,
            "is_exclusive": False,
            "is_starter": False,
            "rarity": "epic",
        },
        {
            "id": 7,
            "name": "Королевское золото",
            "image": "image/items/epic-frame-1.png",
            "type": "frame",
            "price": 5000,
            "selling_price": 2500,
            "unlock_level": 20,
            "is_exclusive": False,
            "is_starter": False,
            "rarity": "epic",
        },
        {
            "id": 8,
            "name": "Оправа странника",
            "image": "image/items/epic-frame-2.png",
            "type": "frame",
            "price": 3500,
            "selling_price": 1750,
            "unlock_level": 30,
            "is_exclusive": False,
            "is_starter": False,
            "rarity": "epic",
        },
        {
            "id": 9,
            "name": "Обсидиановый дракон",
            "image": "image/items/legendary-1.png",
            "type": "avatar",
            "price": 12000,
            "selling_price": 5000,
            "unlock_level": 50,
            "is_exclusive": False,
            "is_starter": False,
            "rarity": "legendary",
        },
        {
            "id": 10,
            "name": "Астральный паладин",
            "image": "image/items/legendary-2.png",
            "type": "avatar",
            "price": None,
            "selling_price": None,
            "unlock_level": 1,
            "is_exclusive": True,
            "is_starter": False,
            "rarity": "legendary",
        },
        {
            "id": 11,
            "name": "Драконье пламя",
            "image": "image/items/legendary-frame-1.png",
            "type": "frame",
            "price": 8000,
            "selling_price": 4000,
            "unlock_level": 55,
            "is_exclusive": False,
            "is_starter": False,
            "rarity": "legendary",
        },
        {
            "id": 12,
            "name": "Звездная бездна",
            "image": "image/items/legendary-frame-2.png",
            "type": "frame",
            "price": None,
            "selling_price": None,
            "unlock_level": 1,
            "is_exclusive": True,
            "is_starter": False,
            "rarity": "legendary",
        },
        {
            "id": 13,
            "name": "Мшистый голем",
            "image": "image/items/rare-1.png",
            "type": "avatar",
            "price": 1200,
            "selling_price": 600,
            "unlock_level": 3,
            "is_exclusive": False,
            "is_starter": False,
            "rarity": "rare",
        },
        {
            "id": 14,
            "name": "Дварф-изобретатель",
            "image": "image/items/rare-2.png",
            "type": "avatar",
            "price": 1000,
            "selling_price": 500,
            "unlock_level": 5,
            "is_exclusive": False,
            "is_starter": False,
            "rarity": "rare",
        },
        {
            "id": 15,
            "name": "Кованая сталь",
            "image": "image/items/rare-frame-1.png",
            "type": "frame",
            "price": 1200,
            "selling_price": 600,
            "unlock_level": 5,
            "is_exclusive": False,
            "is_starter": False,
            "rarity": "rare",
        },
        {
            "id": 16,
            "name": "Оправа странника",
            "image": "image/items/rare-frame-2.png",
            "type": "frame",
            "price": 700,
            "selling_price": 350,
            "unlock_level": 3,
            "is_exclusive": False,
            "is_starter": False,
            "rarity": "rare",
        },
    ]

    await session.execute(insert(ShopItemModel).values(add_shop_item))


async def seed_case(session) -> None:
    add_cases = [
        {
            "id": 1,
            "name": "Кварцевый скол",
            "image": "image/cases/кварцевый_скол.png",
            "unlock_level": 1,
            "price": 100,
        },
        {
            "id": 2,
            "name": "Аметистовый ларец",
            "image": "image/cases/аметистовый_ларец.png",
            "unlock_level": 10,
            "price": 200,
        },
        {
            "id": 3,
            "name": "Сапфировый сундук",
            "image": "image/cases/сапфировый_сундук.png",
            "unlock_level": 25,
            "price": 300,
        },
        {
            "id": 4,
            "name": "Изумрудный тайник",
            "image": "image/cases/изумрудный_тайник.png",
            "unlock_level": 50,
            "price": 500,
        },
        {
            "id": 5,
            "name": "Рубиновый реликварий",
            "image": "image/cases/рубиновый_реликварий.png",
            "unlock_level": 80,
            "price": 800,
        },
        {
            "id": 6,
            "name": "Алмазный артефакт",
            "image": "image/cases/алмазный_артефакт.png",
            "unlock_level": 100,
            "price": 1000,
        },
    ]
    await session.execute(insert(CaseModel).values(add_cases))


async def seed_case_item(session) -> None:
    add_case_item = [
        {
            "case_id": 1,
            "item_type": "rubies",
            "value": 100,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 1,
            "item_type": "rubies",
            "value": 50,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 1,
            "item_type": "rubies",
            "value": 150,
            "shop_item_id": None,
            "weight": 40,
        },
        {
            "case_id": 1,
            "item_type": "rubies",
            "value": 20,
            "shop_item_id": None,
            "weight": 40,
        },
        {
            "case_id": 1,
            "item_type": "rubies",
            "value": 350,
            "shop_item_id": None,
            "weight": 10,
        },
        {
            "case_id": 1,
            "item_type": "xp",
            "value": 750,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 1,
            "item_type": "xp",
            "value": 200,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 1,
            "item_type": "xp",
            "value": 1000,
            "shop_item_id": None,
            "weight": 10,
        },
        {
            "case_id": 1,
            "item_type": "xp",
            "value": 150,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 1,
            "item_type": "xp",
            "value": 400,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 2,
            "item_type": "rubies",
            "value": 100,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 2,
            "item_type": "rubies",
            "value": 50,
            "shop_item_id": None,
            "weight": 40,
        },
        {
            "case_id": 2,
            "item_type": "rubies",
            "value": 250,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 2,
            "item_type": "rubies",
            "value": 400,
            "shop_item_id": None,
            "weight": 40,
        },
        {
            "case_id": 2,
            "item_type": "xp",
            "value": 500,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 2,
            "item_type": "xp",
            "value": 750,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 2,
            "item_type": "xp",
            "value": 1000,
            "shop_item_id": None,
            "weight": 35,
        },
        {
            "case_id": 2,
            "item_type": "xp",
            "value": 1200,
            "shop_item_id": None,
            "weight": 30,
        },
        {
            "case_id": 2,
            "item_type": "xp",
            "value": 150,
            "shop_item_id": None,
            "weight": 35,
        },
        {
            "case_id": 2,
            "item_type": "shop_item",
            "value": None,
            "shop_item_id": 10,
            "weight": 5,
        },
        {
            "case_id": 3,
            "item_type": "rubies",
            "value": 100,
            "shop_item_id": None,
            "weight": 30,
        },
        {
            "case_id": 3,
            "item_type": "rubies",
            "value": 50,
            "shop_item_id": None,
            "weight": 30,
        },
        {
            "case_id": 3,
            "item_type": "rubies",
            "value": 300,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 3,
            "item_type": "rubies",
            "value": 500,
            "shop_item_id": None,
            "weight": 40,
        },
        {
            "case_id": 3,
            "item_type": "xp",
            "value": 500,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 3,
            "item_type": "xp",
            "value": 750,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 3,
            "item_type": "xp",
            "value": 1200,
            "shop_item_id": None,
            "weight": 35,
        },
        {
            "case_id": 3,
            "item_type": "xp",
            "value": 1000,
            "shop_item_id": None,
            "weight": 35,
        },
        {
            "case_id": 3,
            "item_type": "xp",
            "value": 1500,
            "shop_item_id": None,
            "weight": 25,
        },
        {
            "case_id": 3,
            "item_type": "shop_item",
            "value": None,
            "shop_item_id": 12,
            "weight": 5,
        },
        {
            "case_id": 4,
            "item_type": "rubies",
            "value": 100,
            "shop_item_id": None,
            "weight": 30,
        },
        {
            "case_id": 4,
            "item_type": "rubies",
            "value": 250,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 4,
            "item_type": "rubies",
            "value": 1000,
            "shop_item_id": None,
            "weight": 30,
        },
        {
            "case_id": 4,
            "item_type": "xp",
            "value": 300,
            "shop_item_id": None,
            "weight": 25,
        },
        {
            "case_id": 4,
            "item_type": "xp",
            "value": 750,
            "shop_item_id": None,
            "weight": 40,
        },
        {
            "case_id": 4,
            "item_type": "xp",
            "value": 1000,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 4,
            "item_type": "xp",
            "value": 1200,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 4,
            "item_type": "xp",
            "value": 3000,
            "shop_item_id": None,
            "weight": 35,
        },
        {
            "case_id": 4,
            "item_type": "shop_item",
            "value": None,
            "shop_item_id": 10,
            "weight": 8,
        },
        {
            "case_id": 4,
            "item_type": "shop_item",
            "value": None,
            "shop_item_id": 12,
            "weight": 8,
        },
        {
            "case_id": 5,
            "item_type": "rubies",
            "value": 250,
            "shop_item_id": None,
            "weight": 25,
        },
        {
            "case_id": 5,
            "item_type": "rubies",
            "value": 500,
            "shop_item_id": None,
            "weight": 30,
        },
        {
            "case_id": 5,
            "item_type": "rubies",
            "value": 1000,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 5,
            "item_type": "rubies",
            "value": 1500,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 5,
            "item_type": "xp",
            "value": 1200,
            "shop_item_id": None,
            "weight": 30,
        },
        {
            "case_id": 5,
            "item_type": "xp",
            "value": 3000,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 5,
            "item_type": "xp",
            "value": 5000,
            "shop_item_id": None,
            "weight": 40,
        },
        {
            "case_id": 5,
            "item_type": "xp",
            "value": 7000,
            "shop_item_id": None,
            "weight": 40,
        },
        {
            "case_id": 5,
            "item_type": "xp",
            "value": 10000,
            "shop_item_id": None,
            "weight": 30,
        },
        {
            "case_id": 5,
            "item_type": "shop_item",
            "value": None,
            "shop_item_id": 10,
            "weight": 15,
        },
        {
            "case_id": 6,
            "item_type": "rubies",
            "value": 400,
            "shop_item_id": None,
            "weight": 30,
        },
        {
            "case_id": 6,
            "item_type": "rubies",
            "value": 700,
            "shop_item_id": None,
            "weight": 40,
        },
        {
            "case_id": 6,
            "item_type": "rubies",
            "value": 1000,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 6,
            "item_type": "rubies",
            "value": 1500,
            "shop_item_id": None,
            "weight": 45,
        },
        {
            "case_id": 6,
            "item_type": "rubies",
            "value": 2500,
            "shop_item_id": None,
            "weight": 35,
        },
        {
            "case_id": 6,
            "item_type": "xp",
            "value": 5000,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 6,
            "item_type": "xp",
            "value": 10000,
            "shop_item_id": None,
            "weight": 50,
        },
        {
            "case_id": 6,
            "item_type": "xp",
            "value": 15000,
            "shop_item_id": None,
            "weight": 45,
        },
        {
            "case_id": 6,
            "item_type": "shop_item",
            "value": None,
            "shop_item_id": 10,
            "weight": 20,
        },
        {
            "case_id": 6,
            "item_type": "shop_item",
            "value": None,
            "shop_item_id": 12,
            "weight": 15,
        },
    ]

    await session.execute(insert(CaseItemModel).values(add_case_item))


async def seed_task(session) -> None:
    add_task = [
        {
            "id": 1,
            "period": "day",
            "condition_type": "score_in_game",
            "game_type": "2048",
            "target_value": 1024,
            "reward_rubies": 100,
            "reward_xp": 500,
        },
        {
            "id": 2,
            "period": "day",
            "condition_type": "open_case",
            "game_type": None,
            "target_value": 3,
            "reward_rubies": 300,
            "reward_xp": 1000,
        },
        {
            "id": 3,
            "period": "day",
            "condition_type": "pass_levels",
            "game_type": None,
            "target_value": 1,
            "reward_rubies": 200,
            "reward_xp": 500,
        },
        {
            "id": 4,
            "period": "week",
            "condition_type": "score_in_game",
            "game_type": "clicker",
            "target_value": 2000,
            "reward_rubies": 750,
            "reward_xp": 5000,
        },
        {
            "id": 5,
            "period": "month",
            "condition_type": "open_case",
            "game_type": None,
            "target_value": 80,
            "reward_rubies": 1000,
            "reward_xp": 12000,
        },
    ]

    await session.execute(insert(TaskTemplateModel).values(add_task))


async def seed_current_task(session) -> None:
    add_task = [
        {
            "period": "day",
            "task_template_id": 1,
            "progress": 0,
            "is_completed": False,
            "reward_claimed": False,
        },
        {
            "period": "day",
            "task_template_id": 2,
            "progress": 0,
            "is_completed": False,
            "reward_claimed": False,
        },
        {
            "period": "day",
            "task_template_id": 3,
            "progress": 0,
            "is_completed": False,
            "reward_claimed": False,
        },
        {
            "period": "week",
            "task_template_id": 4,
            "progress": 0,
            "is_completed": False,
            "reward_claimed": False,
        },
        {
            "period": "month",
            "task_template_id": 5,
            "progress": 0,
            "is_completed": False,
            "reward_claimed": False,
        },
    ]

    await session.execute(insert(CurrentTasksModel).values(add_task))


async def seed() -> None:
    async with async_session() as session:
        async with session.begin():
            await delete_all(session)
            await seed_shop_item(session)
            await seed_case(session)
            await seed_case_item(session)
            await seed_task(session)
            await seed_current_task(session)


async def main() -> None:
    try:
        await seed()
        print("Seed успешно выполнен")
    finally:
        await async_engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
