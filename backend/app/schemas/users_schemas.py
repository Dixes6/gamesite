from pydantic import BaseModel, ConfigDict
from datetime import datetime

class SUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    username: str
    avatar_id: int
    avatar_image: str
    frame_id: int
    frame_image: str
    level: int
    current_xp: int
    xp_to_next_level: int
    rubies: int
    current_streak: int
    last_claim_date: datetime

class SUserInventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    inventory_id: int
    shop_item_id: int
    name: str
    image: str
    type: str
    selling_price: int | None = None
    is_exclusive: bool
    is_starter: bool
    rarity: str
    obtained_at: datetime
    quantity: int

class SRewardStreakResponse(BaseModel):
    amount_rubies: int


class SUserAvatarOrFrameResponse(BaseModel):
    shop_item_id: int
    name: str
    image: str
    type: str
    is_exclusive: bool
    is_starter: bool
    rarity: str
