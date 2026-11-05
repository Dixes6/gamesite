from datetime import datetime
from sqlalchemy import ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

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

    user_tasks: Mapped[list["UserTaskModel"]] = relationship(
        back_populates="task_template"
    )

    __table_args__ = (
        CheckConstraint("period IN ('day', 'week', 'month')", name="check_period"),
        CheckConstraint(
            "condition_type IN ('score_in_game', 'open_case', 'pass_levels')",
            name="check_condition_type",
        ),
        CheckConstraint(
            (condition_type.in_(["open_case", "pass_levels"]) & game_type.is_(None))
            | (
                ~condition_type.in_(["open_case", "pass_levels"])
                & game_type.in_(["clicker", "reaction", "2048"])
            ),
            name="check_task_game_type",
        ),
    )


class UserTaskModel(Model):
    __tablename__ = "user_task"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    task_template_id: Mapped[int] = mapped_column(
        ForeignKey("task_template.id"), nullable=False
    )
    progress: Mapped[int] = mapped_column(nullable=False)
    is_completed: Mapped[bool] = mapped_column(nullable=False)
    reward_claimed: Mapped[bool] = mapped_column(nullable=False)
    period_start: Mapped[datetime] = mapped_column(nullable=False, default=func.now())

    task_template: Mapped["TaskTemplateModel"] = relationship(
        back_populates="user_tasks"
    )


class CurrentTasksModel(Model):
    __tablename__ = "current_tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    period: Mapped[str] = mapped_column(nullable=False)
    task_template_id: Mapped[int] = mapped_column(
        ForeignKey("task_template.id"), nullable=False
    )
    progress: Mapped[int] = mapped_column(nullable=False)
    is_completed: Mapped[bool] = mapped_column(nullable=False)
    reward_claimed: Mapped[bool] = mapped_column(nullable=False)
    period_start: Mapped[datetime] = mapped_column(nullable=False, default=func.now())
