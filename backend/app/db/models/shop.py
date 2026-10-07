from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Model

class ShopItemModel(Model):
    __tablename__ = "shop_item"

    id: Mapped[int] = mapped_column(primary_key=True)
    name_key: Mapped[str] = mapped_column(nullable=False)
    type: Mapped[str] = mapped_column(nullable=False)
    price: Mapped[int | None] = mapped_column(nullable=True)
    is_exclusive: Mapped[bool] = mapped_column(nullable=False)
    is_starter: Mapped[bool] = mapped_column(nullable=False)
    rarity: Mapped[str] = mapped_column(nullable=False)