import uvicorn
from fastapi import FastAPI

from app.api.v1.routers.users_router import router as user_router
from app.api.v1.routers.games_router import router as game_router

app = FastAPI()

app.include_router(user_router)
app.include_router(game_router)

if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)