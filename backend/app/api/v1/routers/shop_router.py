from fastapi import APIRouter, status, Depends

from app.db.session import SessionDep
from app.db.models.user import UsersModel
from app.service.shop_service import get_shop_items, buy_item, sell_item
from app.schemas.shop_schemas import SGetShopResponse, SShopBuyResponse
from app.core.lexicon import LEXICON_RU
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/shop", tags=["Магазин"])

@router.get("", response_model=SGetShopResponse, status_code=status.HTTP_200_OK)
async def get_shop(session: SessionDep, user: UsersModel = Depends(get_current_user)):
    shop = await get_shop_items(user.id, session)
    return {
        "page_title": LEXICON_RU["shop"]["page_title"],
        "page_description": LEXICON_RU["shop"]["page_description"],
        "shop": shop
    }

@router.post("/buy/{shop_item_id}", response_model=SShopBuyResponse, status_code=status.HTTP_201_CREATED)
async def buy_in_shop_item(session: SessionDep, shop_item_id: int, user: UsersModel = Depends(get_current_user)):
    return await buy_item(user.id, shop_item_id, session)

@router.delete("/sell/{inventory_item_id}", status_code=status.HTTP_200_OK)
async def sell_in_shop_item(session: SessionDep, inventory_item_id: int, user: UsersModel = Depends(get_current_user)):
    await sell_item(user.id, inventory_item_id, session)
    return {"success": True}