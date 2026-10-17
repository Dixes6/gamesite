from fastapi import APIRouter, status

from app.db.session import SessionDep
from app.service.task_service import get_user_task_service, claim_reward_service
from app.schemas.tasks_schemas import SUserTasksResponse, SClaimRewardResponse

router = APIRouter(prefix="/tasks", tags=["Задания"])

@router.get("/{user_id}", response_model=SUserTasksResponse, status_code=status.HTTP_200_OK)
async def get_user_tasks(session: SessionDep, user_id: int):
    return await get_user_task_service(user_id, session)

@router.post("/{user_id}/{user_task_id}", response_model=SClaimRewardResponse, status_code=status.HTTP_201_CREATED)
async def claim_reward(session: SessionDep, user_id: int, user_task_id: int):
    return await claim_reward_service(user_id, user_task_id, session)