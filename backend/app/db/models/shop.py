from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.base import Model

if TYPE_CHECKING:
    from app.db.models.user import InventoryModel

class ShopItemModel(Model):
    __tablename__ = "shop_item"

    id: Mapped[int] = mapped_column(primary_key=True)
    name_key: Mapped[str] = mapped_column(nullable=False)
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