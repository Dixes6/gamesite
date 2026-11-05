from fastapi import APIRouter, status, Depends

from app.db.session import SessionDep
from app.service.task_service import get_user_task_service, claim_reward_service
from app.schemas.tasks_schemas import SUserTasksResponse, SClaimRewardResponse
from app.db.models.user import UsersModel
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/tasks", tags=["Задания"])


@router.get("", response_model=SUserTasksResponse, status_code=status.HTTP_200_OK)
async def get_user_tasks(
    session: SessionDep, user: UsersModel = Depends(get_current_user)
):
    return await get_user_task_service(user.id, session)


@router.post(
    "/{user_task_id}",
    response_model=SClaimRewardResponse,
    status_code=status.HTTP_201_CREATED,
)
async def claim_reward(
    session: SessionDep, user_task_id: int, user: UsersModel = Depends(get_current_user)
):
    return await claim_reward_service(user.id, user_task_id, session)
