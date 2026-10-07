from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import Annotated
from fastapi import Depends

from app.core.config import settings

async_engine = create_async_engine(
    url=settings.database_url_asyncpg,
    echo=True,
    pool_size=10,
)

async_session = async_sessionmaker(async_engine, expire_on_commit=False)

async def get_session():
    async with async_session() as session:
        yield session

SessionDep = Annotated[AsyncSession, Depends(get_session)]