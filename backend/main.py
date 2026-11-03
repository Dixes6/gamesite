from pathlib import Path
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from zoneinfo import ZoneInfo
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from contextlib import asynccontextmanager

from app.service.task_service import generate_tasks
from app.db.session import async_session

from app.api.v1.routers.users_router import router as user_router
from app.api.v1.routers.games_router import router as game_router
from app.api.v1.routers.cases_router import router as case_router
from app.api.v1.routers.shop_router import router as shop_router
from app.api.v1.routers.tasks_router import router as task_router
from app.api.v1.routers.auth_router import router as auth_router

scheduler = AsyncIOScheduler(timezone=ZoneInfo("Europe/Moscow"))

async def scheduled_generate_tasks(period: str):
    async with async_session() as session:
        await generate_tasks(period=period, session=session)


scheduler.add_job(
    scheduled_generate_tasks,
    trigger="cron",
    hour=0,
    minute=0,
    kwargs={"period": "day"},
)

scheduler.add_job(
    scheduled_generate_tasks,
    trigger="cron",
    day_of_week="mon",
    hour=0,
    minute=0,
    kwargs={"period": "week"},
)

scheduler.add_job(
    scheduled_generate_tasks,
    trigger="cron",
    day=1,
    hour=0,
    minute=0,
    kwargs={"period": "month"},
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)

app = FastAPI(lifespan=lifespan)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(game_router)
app.include_router(case_router)
app.include_router(shop_router)
app.include_router(task_router)

BASE_DIR = Path(__file__).resolve().parent
app.mount("/image", StaticFiles(directory=BASE_DIR / "app" / "image"), name="images")

if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)