from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import CheckConstraint
from typing import TYPE_CHECKING

from app.db.base import Model

if TYPE_CHECKING:
    from app.db.models.user import InventoryModel


class ShopItemModel(Model):
    __tablename__ = "shop_item"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(nullable=False)
    image: Mapped[str] = mapped_column(nullable=False)
    type: Mapped[str] = mapped_column(nullable=False)
    price: Mapped[int | None] = mapped_column(nullable=True)
    selling_price: Mapped[int | None] = mapped_column(nullable=True)
    unlock_level: Mapped[int] = mapped_column(default=1)
    is_exclusive: Mapped[bool] = mapped_column(nullable=False)
    is_starter: Mapped[bool] = mapped_column(nullable=False)
    rarity: Mapped[str] = mapped_column(nullable=False)

    inventory_items: Mapped[list["InventoryModel"]] = relationship(
        back_populates="shop_item"
    )

    __table_args__ = (
        CheckConstraint("type IN ('avatar', 'frame')", name="check_type"),
        CheckConstraint(
            (
                price.is_not(None)
                & selling_price.is_not(None)
                & ~is_exclusive
                & ~is_starter
            )
            | (price.is_(None) & selling_price.is_(None) & (is_exclusive | is_starter)),
            name="check_item_price_logic",
        ),
        CheckConstraint(
            "rarity IN ('common', 'rare', 'epic', 'legendary')", name="check_rarity"
        ),
    )
