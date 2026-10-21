from datetime import datetime
from sqlalchemy import ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.shop import ShopItemModel
from app.db.base import Model


class UsersModel(Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(nullable=False)
    avatar_id: Mapped[int | None] = mapped_column(ForeignKey("shop_item.id"), nullable=True)
    frame_id: Mapped[int | None] = mapped_column(ForeignKey("shop_item.id"), nullable=True)
    level: Mapped[int] = mapped_column(nullable=False)
    current_xp: Mapped[int] = mapped_column(nullable=False)
    rubies: Mapped[int] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=func.now())

    __table_args__ = (
        CheckConstraint("level BETWEEN 1 AND 100", name="check_level"),
        CheckConstraint("rubies >= 0", name="check_rubies"),
        CheckConstraint("current_xp >= 0", name="check_current_xp"),
    )


class InventoryModel(Model):
    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete='CASCADE'), nullable=False)
    shop_item_id: Mapped[int] = mapped_column(ForeignKey("shop_item.id"), nullable=False)
    source: Mapped[str] = mapped_column(nullable=False)
    obtained_at: Mapped[datetime] = mapped_column(nullable=False, default=func.now())
    quantity: Mapped[int] = mapped_column(nullable=False)

    shop_item: Mapped["ShopItemModel"] = relationship(
        back_populates="inventory_items"
    )

    __table_args__ = (
        CheckConstraint("quantity >= 0", name="check_quantity"),
        CheckConstraint("source IN ('purchase', 'case', 'default')", name="check_source"),
    )

class StreakModel(Model):
    __tablename__ = "streak"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete='CASCADE'), nullable=False, unique=True)
    current_streak: Mapped[int] = mapped_column(nullable=False)
    best_streak: Mapped[int] = mapped_column(nullable=False)
    last_claim_date: Mapped[datetime] = mapped_column(nullable=False)