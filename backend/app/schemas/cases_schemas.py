from pydantic import BaseModel, ConfigDict


class SCaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    image: str
    unlock_level: int
    price: int


class SCasesResponse(BaseModel):
    available: list[SCaseResponse]
    unavailable: list[SCaseResponse]


class SGetCasesResponse(BaseModel):
    page_title: str
    page_description: str
    cases: SCasesResponse


class SOpenCaseResponse(BaseModel):
    item_type: str
    value: int | None
    shop_item_id: int | None
    name: str | None
    image: str | None
    type: str | None
    rarity: str | None
    is_exclusive: bool | None
