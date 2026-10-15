from datetime import datetime
from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Model

class CaseModel(Model):
    __tablename__ = "case"

    id: Mapped[int] = mapped_column(primary_key=True)
    name_key: Mapped[str] = mapped_column(nullable=False)
    unlock_level: Mapped[int] = mapped_column(nullable=False)
    price: Mapped[int] = mapped_column(nullable=False)

class CaseItemModel(Model):
    __tablename__ = "case_item"

    id: Mapped[int] = mapped_column(primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("case.id"))
    item_type: Mapped[str] = mapped_column(nullable=False)
    value: Mapped[int | None] = mapped_column(nullable=True)
    shop_item_id: Mapped[int | None] = mapped_column(ForeignKey("shop_item.id"), nullable=True)
    weight: Mapped[int] = mapped_column(nullable=False)

class UserCaseHistoryModel(Model):
    __tablename__ = "user_case_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete='CASCADE'), nullable=False)
    case_id: Mapped[int] = mapped_column(ForeignKey("case.id"), nullable=False)
    case_item_id: Mapped[int] = mapped_column(ForeignKey("case_item.id"), nullable=False)
    opened_at: Mapped[datetime] = mapped_column(nullable=False, default=func.now())