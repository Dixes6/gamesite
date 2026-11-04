from pydantic import BaseModel, ConfigDict

class SShopResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    image: str
    type: str
    price: int | None = None
    is_exclusive: bool
    is_starter: bool
    rarity: str

class SShopListResponse(BaseModel):
    available: list[SShopResponse]
    unavailable: list[SShopResponse]

class SStartAvatarsAndFramesResponse(BaseModel):
    avatars: list[SShopResponse]
    frames: list[SShopResponse]

class SGetShopResponse(BaseModel):
    page_title: str
    page_description: str
    shop: SShopListResponse

class SShopBuyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    type: str
    rarity: str