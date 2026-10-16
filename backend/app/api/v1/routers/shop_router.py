from fastapi import APIRouter, status

from app.db.session import SessionDep
from app.service.shop_service import get_shop_items, buy_item
from app.schemas.shop_schemas import SShopListResponse, SShopBuyResponse

router = APIRouter(prefix="/shop", tags=["Магазин"])

@router.get("/{user_id}", response_model=SShopListResponse, status_code=status.HTTP_200_OK)
async def get_shop(session: SessionDep, user_id: int):
    return await get_shop_items(user_id, session)

@router.post("/{user_id}/{shop_item_id}", response_model=SShopBuyResponse, status_code=status.HTTP_201_CREATED)
async def buy_shop_item(session: SessionDep, user_id: int, shop_item_id: int):
    return await buy_item(user_id, shop_item_id, session)