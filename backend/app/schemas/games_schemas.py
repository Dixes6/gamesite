from pydantic import BaseModel, ConfigDict

class SGamesRequest(BaseModel):
    user_id: int
    result_value: int

class SGamesResponse(BaseModel):
    result_value: int
    reward: int