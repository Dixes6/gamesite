from datetime import datetime
from sqlalchemy import ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Model

class CaseModel(Model):
    __tablename__ = "case"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(nullable=False)
    image: Mapped[str] = mapped_column(nullable=False)
    unlock_level: Mapped[int] = mapped_column(nullable=False)
    price: Mapped[int] = mapped_column(nullable=False)

    __table_args__ = (
        CheckConstraint("name IN ('Кварцевый скол', "
                        "'Аметистовый ларец', "
                        "'Сапфировый сундук', "
                        "'Изумрудный тайник', "
                        "'Рубиновый реликварий', "
                        "'Алмазный артефакт')",
                        name="check_name"),
    )

class CaseItemModel(Model):
    __tablename__ = "case_item"

    id: Mapped[int] = mapped_column(primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("case.id"))
    item_type: Mapped[str] = mapped_column(nullable=False)
    value: Mapped[int | None] = mapped_column(nullable=True)
    shop_item_id: Mapped[int | None] = mapped_column(ForeignKey("shop_item.id"), nullable=True)
    weight: Mapped[int] = mapped_column(nullable=False)

    __table_args__ = (
        CheckConstraint("item_type IN ('rubies', 'xp', 'shop_item')", name="check_item_type"),
        CheckConstraint(
            (item_type.in_(["rubies", "xp"]) & value.is_not(None)) |
            (~item_type.in_(["rubies", "xp"]) & value.is_(None)),
            name="check_rubies_xp_value"
        ),
        CheckConstraint(
            ((item_type == 'shop_item') & shop_item_id.is_not(None)) |
            ((item_type != 'shop_item') & shop_item_id.is_(None)),
            name="check_shop_item_integrity"
        )
    )

class UserCaseHistoryModel(Model):
    __tablename__ = "user_case_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete='CASCADE'), nullable=False)
    case_id: Mapped[int] = mapped_column(ForeignKey("case.id"), nullable=False)
    case_item_id: Mapped[int] = mapped_column(ForeignKey("case_item.id"), nullable=False)
    opened_at: Mapped[datetime] = mapped_column(nullable=False, default=func.now())