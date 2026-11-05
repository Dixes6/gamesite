from pydantic import BaseModel


class SGamesRequest(BaseModel):
    result_value: int


class SGamesResponse(BaseModel):
    result_value: int
    reward: int
