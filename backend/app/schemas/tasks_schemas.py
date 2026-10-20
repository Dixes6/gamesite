from pydantic import BaseModel, ConfigDict

class SUserTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_template_id: int
    period: str
    progress: int
    target_value: int
    reward_rubies: int
    reward_xp: int
    is_completed: bool


class SUserTasksResponse(BaseModel):
    completed: list[SUserTaskResponse]
    unfulfilled: list[SUserTaskResponse]

class SClaimRewardResponse(BaseModel):
    amount_xp: int
    amount_rubies: int