from datetime import datetime, timedelta
from sqlalchemy import select, and_, case, insert
from sqlalchemy.orm import selectinload, joinedload
import random

from app.db.session import SessionDep
from app.db.models.user import UsersModel
from app.db.models.task import UserTaskModel, TaskTemplateModel
from app.service.user_service import add_xp, add_or_remove_rubies

async def register_task_event(
        user_id: int,
        condition_type: str,
        session: SessionDep,
        game_type: str | None = None,
        amount: int = 1,
):
    user = await session.get(UsersModel, user_id)

    if user is None:
        return

    now = datetime.now()

    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_week = start_of_day - timedelta(days=start_of_day.weekday())
    start_of_month = start_of_day.replace(day=1)

    tasks_stmt = await session.execute(
        select(UserTaskModel)
        .options(selectinload(UserTaskModel.task_template))
        .where(
            and_(
                UserTaskModel.user_id == user_id,
                UserTaskModel.is_completed == False,
                UserTaskModel.task_template.has(
                    TaskTemplateModel.condition_type == condition_type
                ),

                UserTaskModel.period_start >= case(
                    (TaskTemplateModel.period == "day", start_of_day),
                    (TaskTemplateModel.period == "week", start_of_week),
                    (TaskTemplateModel.period == "month", start_of_month),
                ),
            )
        )
    )

    tasks = list(tasks_stmt.scalars())

    if not tasks:
        return

    for task in tasks:
        if game_type is not None:
            if task.task_template.game_type != game_type:
                continue

        task.progress += amount

        if task.progress >= task.task_template.target_value:
            task.progress = task.task_template.target_value
            task.is_completed = True

    await session.commit()

async def claim_reward(user_id: int, user_task_id: int, session: SessionDep) -> int | None:
    user = await session.get(UsersModel, user_id)

    if user is None:
        return

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
        return

    if task.is_completed == True and task.reward_claimed == False:
        amount_xp = task.task_template.reward_xp
        amount_rubies = task.task_template.reward_rubies
        await add_xp(user_id=user_id, amount=amount_xp, session=session)
        await add_or_remove_rubies(user_id=user_id, amount=amount_rubies, reason="task_reward", session=session)
        task.reward_claimed = True
        await session.commit()
        return amount_xp, amount_rubies
    else:
        return

async def generate_tasks(period: str, session: SessionDep):
    tasks_stmt = await session.execute(
        select(TaskTemplateModel)
        .where(TaskTemplateModel.period == period)
    )

    tasks = list(tasks_stmt.scalars())

    if not tasks:
        return

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
        return

    user_task = []

    for user in users:
        for task_id in list_task_id:
            user_task.append({
                "user_id": user.id,
                "task_template_id": task_id,
                "progress": 0,
                "is_completed": False,
                "reward_claimed": False,
            })

    await session.execute(
        insert(UserTaskModel)
        .values(user_task)
    )
    await session.commit()




