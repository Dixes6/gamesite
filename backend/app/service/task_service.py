from datetime import datetime, timedelta
from sqlalchemy import select, and_, case, insert, delete, join
from sqlalchemy.orm import selectinload, joinedload
from fastapi import status, HTTPException
import random

from app.db.models import InventoryModel
from app.db.session import SessionDep
from app.db.models.user import UsersModel
from app.db.models.task import UserTaskModel, TaskTemplateModel, CurrentTasksModel
from app.service.user_service import add_xp, add_or_remove_rubies

async def get_user_task_service(user_id: int, session: SessionDep) -> dict:
    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    now = datetime.now()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_week = start_of_day - timedelta(days=start_of_day.weekday())
    start_of_month = start_of_day.replace(day=1)

    completed_stmt = await session.execute(
        select(UserTaskModel)
        .join(UserTaskModel.task_template)
        .options(selectinload(UserTaskModel.task_template))
        .where(
            UserTaskModel.user_id == user_id,
            UserTaskModel.is_completed == True,
            UserTaskModel.reward_claimed == False,
        )
    )

    unfulfilled_stmt = await session.execute(
        select(UserTaskModel)
        .join(UserTaskModel.task_template)
        .options(selectinload(UserTaskModel.task_template))
        .where(
            UserTaskModel.user_id == user_id,
            UserTaskModel.is_completed == False,
            UserTaskModel.reward_claimed == False,
        )
    )

    completed_tasks = completed_stmt.scalars().all()
    filtered_completed = []

    for task in completed_tasks:
        period = task.task_template.period

        if period == "day" and task.period_start >= start_of_day:
            filtered_completed.append(task)
        elif period == "week" and task.period_start >= start_of_week:
            filtered_completed.append(task)
        elif period == "month" and task.period_start >= start_of_month:
            filtered_completed.append(task)

    unfulfilled_tasks = unfulfilled_stmt.scalars().all()
    filtered_unfulfilled = []

    for task in unfulfilled_tasks:
        period = task.task_template.period

        if period == "day" and task.period_start >= start_of_day:
            filtered_unfulfilled.append(task)
        elif period == "week" and task.period_start >= start_of_week:
            filtered_unfulfilled.append(task)
        elif period == "month" and task.period_start >= start_of_month:
            filtered_unfulfilled.append(task)

    completed = [
        {
            "id": task.id,
            "task_template_id": task.task_template_id,
            "period": task.task_template.period,
            "progress": task.progress,
            "target_value": task.task_template.target_value,
            "reward_rubies": task.task_template.reward_rubies,
            "reward_xp": task.task_template.reward_xp,
            "is_completed": task.is_completed,
        }
        for task in filtered_completed
    ]

    unfulfilled = [
        {
            "id": task.id,
            "task_template_id": task.task_template_id,
            "period": task.task_template.period,
            "progress": task.progress,
            "target_value": task.task_template.target_value,
            "reward_rubies": task.task_template.reward_rubies,
            "reward_xp": task.task_template.reward_xp,
            "is_completed": task.is_completed,
        }
        for task in filtered_unfulfilled
    ]

    return {
        "completed": completed,
        "unfulfilled": unfulfilled,
    }

async def register_task_event(
        user_id: int,
        condition_type: str,
        session: SessionDep,
        game_type: str | None = None,
        amount: int = 1,
):
    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    now = datetime.now()

    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_week = start_of_day - timedelta(days=start_of_day.weekday())
    start_of_month = start_of_day.replace(day=1)

    tasks_stmt = await session.execute(
        select(UserTaskModel)
        .join(UserTaskModel.task_template)
        .options(selectinload(UserTaskModel.task_template))
        .where(
            and_(
                UserTaskModel.user_id == user_id,
                UserTaskModel.is_completed == False,
                TaskTemplateModel.condition_type == condition_type,
            )
        )
    )

    tasks = list(tasks_stmt.scalars())

    if not tasks:
        return

    filtered_tasks = []
    for task in tasks:
        period = task.task_template.period

        if period == "day" and task.period_start >= start_of_day:
            filtered_tasks.append(task)
        elif period == "week" and task.period_start >= start_of_week:
            filtered_tasks.append(task)
        elif period == "month" and task.period_start >= start_of_month:
            filtered_tasks.append(task)

    if not filtered_tasks:
        return

    for task in filtered_tasks:
        if game_type is not None:
            if task.task_template.game_type:
                continue

        task.progress += amount

        if task.progress >= task.task_template.target_value:
            task.progress = task.task_template.target_value
            task.is_completed = True

    await session.commit()

async def claim_reward_service(user_id: int, user_task_id: int, session: SessionDep) -> tuple(int, int):
    user = await session.get(UsersModel, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    task_stmt = await session.execute(
        select(UserTaskModel)
        .options(joinedload(UserTaskModel.task_template))
        .where(
            and_(
                UserTaskModel.id == user_task_id,
                UserTaskModel.user_id == user_id,
                ),
            )
        )

    task = task_stmt.scalar_one_or_none()

    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задание не найдено")

    if task.is_completed == True and task.reward_claimed == False:
        amount_xp = task.task_template.reward_xp
        amount_rubies = task.task_template.reward_rubies
        await add_xp(user_id=user_id, amount=amount_xp, session=session)
        await add_or_remove_rubies(user_id=user_id, amount=amount_rubies, reason="task_reward", session=session)
        task.reward_claimed = True
        await session.commit()
        return {
            "amount_xp": amount_xp,
            "amount_rubies": amount_rubies,
        }
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя забрать награду")

async def generate_tasks(period: str, session: SessionDep):
    tasks_stmt = await session.execute(
        select(TaskTemplateModel)
        .where(TaskTemplateModel.period == period)
    )

    tasks = list(tasks_stmt.scalars())

    if not tasks:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задание не найдено")

    tasks_len = len(tasks)
    list_task_id = []

    if period == "day":
        random_number = random.randint(1, 3)

        if tasks_len < random_number:
            random_number = tasks_len

        while random_number != 0:
            task = random.choice(tasks).id

            if task not in list_task_id:
                list_task_id.append(task)
                random_number -= 1

    elif period == "week":
        random_number = random.randint(1, 2)

        if tasks_len < random_number:
            random_number = tasks_len

        while random_number != 0:
            task = random.choice(tasks).id

            if task not in list_task_id:
                list_task_id.append(task)
                random_number -= 1

    elif period == "month":
        task = random.choice(tasks).id
        list_task_id.append(task)

    users_stmt = await session.execute(
        select(UsersModel)
    )
    users = list(users_stmt.scalars())

    if not users:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    user_task = []
    current_tasks = []

    for user in users:
        for task_id in list_task_id:
            user_task.append({
                "user_id": user.id,
                "task_template_id": task_id,
                "progress": 0,
                "is_completed": False,
                "reward_claimed": False,
            })

    for task_id in list_task_id:
        current_tasks.append({
            "period": period,
            "task_template_id": task_id,
            "progress": 0,
            "is_completed": False,
            "reward_claimed": False,
        })

    await session.execute(
        insert(UserTaskModel)
        .values(user_task)
    )

    await session.execute(
        delete(CurrentTasksModel)
        .where(CurrentTasksModel.period == period)
    )

    await session.execute(
        insert(CurrentTasksModel)
        .values(current_tasks)
    )

    await session.commit()

async def get_user_tasks(user_id: int, session: SessionDep):
    inventory_user = await session.execute(
        select(InventoryModel)
        .where(InventoryModel.user_id == user_id)
    )

    if inventory_user.first() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Инвентарь пользователя не найден",
        )

    tasks_stmt = await session.execute(
        select(CurrentTasksModel)
    )
    tasks = list(tasks_stmt.scalars())

    if not tasks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Актуальные задания не найдены",
        )

    current_tasks = []

    for task in tasks:
        current_tasks.append({
            "user_id": user_id,
            "task_template_id": task.task_template_id,
            "progress": task.progress,
            "is_completed": task.is_completed,
            "reward_claimed": task.reward_claimed,
        })

    await session.execute(
        insert(UserTaskModel)
        .values(current_tasks)
    )
    await session.commit()