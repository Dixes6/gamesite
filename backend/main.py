from pathlib import Path
import logging
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from zoneinfo import ZoneInfo
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.service.task_service import generate_tasks
from app.db.session import async_session
from app.core.config import settings

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

app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(game_router)
app.include_router(case_router)
app.include_router(shop_router)
app.include_router(task_router)

logging.basicConfig(
    level=logging.getLevelName(level=settings.LOG.level), format=settings.LOG.format
)
logger = logging.getLogger(__name__)

logger.info("Starting API")

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    level = logging.WARNING if exc.status_code < 500 else logging.ERROR
    logger.log(
        level,
        "HTTPException: %s %s -> %s %s",
        request.method,
        request.url.path,
        exc.status_code,
        exc.detail,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

BASE_DIR = Path(__file__).resolve().parent
app.mount("/image", StaticFiles(directory=BASE_DIR / "app" / "image"), name="images")

if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)
