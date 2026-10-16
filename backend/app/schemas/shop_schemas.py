from pydantic import BaseModel, ConfigDict

class SShopResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name_key: str
    type: str
    price: int | None = None
    is_exclusive: bool
    is_starter: bool
    rarity: str

class SShopListResponse(BaseModel):
    available: list[SShopResponse]
    unavailable: list[SShopResponse]

class SShopBuyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name_key: str
    type: str
    rarity: str