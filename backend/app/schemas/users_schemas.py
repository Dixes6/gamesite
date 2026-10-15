from pydantic import BaseModel, ConfigDict

class SUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    username: str
    avatar_id: int
    frame_id: int
    level: int
    current_xp: int
    xp_to_next_level: int
    rubies: int