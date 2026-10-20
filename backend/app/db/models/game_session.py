from datetime import datetime
from sqlalchemy import ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Model

class GameSessionModel(Model):
    __tablename__ = "game_session"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete='CASCADE'), nullable=False)
    game_type: Mapped[str] = mapped_column(nullable=False)
    score: Mapped[int] = mapped_column(nullable=False)
    rubies_earned: Mapped[int] = mapped_column(nullable=False)
    played_at: Mapped[datetime] = mapped_column(nullable=False, default=func.now())

    __table_args__ = (
        CheckConstraint("game_type IN ('clicker', 'reaction', '2048')"),
    )