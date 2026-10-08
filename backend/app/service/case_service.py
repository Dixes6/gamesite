import random
from sqlalchemy import insert, select, and_

from app.db.session import SessionDep
from app.db.models.user import UsersModel
from app.db.models.case import CaseModel, CaseItemModel, UserCaseHistoryModel
from app.service.user_service import add_or_remove_rubies, add_xp, add_item_to_inventory
from app.service.task_service import register_task_event


async def open_case(user_id: int, case_id: int, session: SessionDep) -> int | str | None:
    case = await session.get(CaseModel, case_id)

    if case is None:
        return

    case_items_stmt = await session.execute(
        select(CaseItemModel)
        .where(CaseItemModel.case_id == case_id)
    )

    case_items = list(case_items_stmt.scalars())

    if not case_items:
        return

    user_stmt = await session.execute(
        select(UsersModel)
        .where(UsersModel.id == user_id)
    )

    user_result = user_stmt.scalar()

    if user_result is None:
        return

    if user_result.level >= case.unlock_level and user_result.rubies >= case.price:
        await add_or_remove_rubies(user_id=user_id, amount=case.price, reason="case_open", session=session)
        await register_task_event(user_id=user_id, condition_type="open_case", session=session)

        variants = [item.id for item in case_items]
        chances = [item.weight for item in case_items]

        drop = random.choices(variants, weights=chances, k=1)[0]

        item_drop = await session.get(CaseItemModel, drop)

        if item_drop is None:
            return

        if item_drop.item_type == "rubies":
            await add_or_remove_rubies(user_id=user_id, amount=item_drop.value, reason="case_open", session=session)
            await session.commit()
            return f"{item_drop.value} ♦️"
        elif item_drop.item_type == "xp":
            await add_xp(user_id=user_id, amount=item_drop.value, session=session)
            await session.commit()
            return f"{item_drop.value} xp"
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
            await session.commit()
            return shop_item_id

    elif user_result.level < case.unlock_level:
        return
    elif user_result.rubies < case.price:
        return
