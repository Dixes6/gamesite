from pydantic import BaseModel, ConfigDict

class SCaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name_key: str
    unlock_level: int
    price: int

class SCasesResponse(BaseModel):
    available: list[SCaseResponse]
    unavailable: list[SCaseResponse]
