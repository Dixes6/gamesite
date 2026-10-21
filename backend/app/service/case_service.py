import random
from sqlalchemy import insert, select
from fastapi import status, HTTPException

from app.db.models import ShopItemModel
from app.db.session import SessionDep
from app.db.models.user import UsersModel
from app.db.models.case import CaseModel, CaseItemModel, UserCaseHistoryModel
from app.service.user_service import add_or_remove_rubies, add_xp, add_item_to_inventory
from app.service.task_service import register_task_event

async def get_cases(user_id: int, session: SessionDep) -> dict | None:
    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    user_lvl = user.level

    available_stmt = await session.execute(select(CaseModel).where(CaseModel.unlock_level <= user_lvl))
    unavailable_stmt = await session.execute(select(CaseModel).where(CaseModel.unlock_level > user_lvl))

    available = list(available_stmt.scalars())
    unavailable = list(unavailable_stmt.scalars())

    return {
        "available": available,
        "unavailable": unavailable,
    }

async def open_case_service(user_id: int, case_id: int, session: SessionDep) -> dict | None:
    case = await session.get(CaseModel, case_id)

    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Кейс не найден")

    case_items_stmt = await session.execute(
        select(CaseItemModel)
        .where(CaseItemModel.case_id == case_id)
    )

    case_items = list(case_items_stmt.scalars())

    if not case_items:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Предмет не найден")

    user_stmt = await session.execute(
        select(UsersModel)
        .where(UsersModel.id == user_id)
    )

    user_result = user_stmt.scalar()

    if user_result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    if user_result.level >= case.unlock_level and user_result.rubies >= case.price:
        await add_or_remove_rubies(user_id=user_id, amount=-case.price, reason="case_open", session=session)
        await register_task_event(user_id=user_id, condition_type="open_case", session=session)

        variants = [item.id for item in case_items]
        chances = [item.weight for item in case_items]

        drop = random.choices(variants, weights=chances, k=1)[0]

        item_drop = await session.get(CaseItemModel, drop)

        if item_drop is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Предмет не найден")

        if item_drop.item_type == "rubies":
            await add_or_remove_rubies(user_id=user_id, amount=item_drop.value, reason="case_open", session=session)
            await session.commit()
            return {
                "rubies": item_drop.value
            }
        elif item_drop.item_type == "xp":
            await add_xp(user_id=user_id, amount=item_drop.value, session=session)
            await session.commit()
            return {
                "xp": item_drop.value
            }
        elif item_drop.item_type == "shop_item":
            shop_item_id = item_drop.shop_item_id
            await add_item_to_inventory(user_id=user_id, shop_item_id=shop_item_id, source="case", quantity=1, session=session)
            user_case_history = [{
                "user_id": user_id,
                "case_id": case_id,
                "case_item_id": drop
            }]
            await session.execute(
                insert(UserCaseHistoryModel)
                .values(user_case_history)
            )

            shop_item_stmt = await session.execute(
                select(ShopItemModel)
                .where(ShopItemModel.id == shop_item_id)
            )
            shop_item = shop_item_stmt.scalar_one_or_none()

            await session.commit()
            return {
                "shop_item": shop_item_id,
                "name": shop_item.name,
                "image": shop_item.image,
                "type": shop_item.type,
                "is_exclusive": shop_item.is_exclusive,
                "rarity": shop_item.rarity,
            }

    elif user_result.level < case.unlock_level:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Недостаточный уровень")
    elif user_result.rubies < case.price:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Недостаточно средств")
