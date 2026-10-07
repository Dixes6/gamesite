from datetime import datetime
from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Model

class TaskTemplateModel(Model):
    __tablename__ = "task_template"

    id: Mapped[int] = mapped_column(primary_key=True)
    period: Mapped[str] = mapped_column(nullable=False)
    condition_type: Mapped[str] = mapped_column(nullable=False)
    game_type: Mapped[str | None] = mapped_column(nullable=True)
    target_value: Mapped[int] = mapped_column(nullable=False)
    reward_rubies: Mapped[int] = mapped_column(nullable=False)
    reward_xp: Mapped[int] = mapped_column(nullable=False)

class UserTaskModel(Model):
    __tablename__ = "user_task"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete='CASCADE'), nullable=False)
    task_template_id: Mapped[int] = mapped_column(ForeignKey("task_template.id"), nullable=False)
    progress: Mapped[int] = mapped_column(nullable=False)
    is_completed: Mapped[bool] = mapped_column(nullable=False)
    reward_claimed: Mapped[bool] = mapped_column(nullable=False)
    period_start: Mapped[datetime] = mapped_column(nullable=False, default=func.now)