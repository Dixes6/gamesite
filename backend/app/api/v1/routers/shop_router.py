from fastapi import APIRouter, status

from app.db.session import SessionDep
from app.service.shop_service import get_shop_items, buy_item, sell_item
from app.schemas.shop_schemas import SGetShopResponse, SShopBuyResponse
from app.core.lexicon import LEXICON_RU

router = APIRouter(prefix="/shop", tags=["Магазин"])

@router.get("/{user_id}", response_model=SGetShopResponse, status_code=status.HTTP_200_OK)
async def get_shop(session: SessionDep, user_id: int):
    shop = await get_shop_items(user_id, session)
    return {
        "page_title": LEXICON_RU["shop"]["page_title"],
        "page_description": LEXICON_RU["shop"]["page_description"],
        "shop": shop
    }

@router.post("/{user_id}/buy/{shop_item_id}", response_model=SShopBuyResponse, status_code=status.HTTP_201_CREATED)
async def buy_in_shop_item(session: SessionDep, user_id: int, shop_item_id: int):
    return await buy_item(user_id, shop_item_id, session)

@router.delete("/{user_id}/sell/{inventory_item_id}", status_code=status.HTTP_201_CREATED)
async def sell_in_shop_item(session: SessionDep, user_id: int, inventory_item_id: int):
    await sell_item(user_id, inventory_item_id, session)
    return {"success": True}