from fastapi import APIRouter, status, Depends

from app.db.session import SessionDep
from app.db.models.user import UsersModel
from app.service.case_service import get_cases, open_case_service
from app.schemas.cases_schemas import SGetCasesResponse
from app.core.lexicon import LEXICON_RU
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/cases", tags=["Кейсы"])

@router.get("", response_model=SGetCasesResponse, status_code=status.HTTP_200_OK)
async def cases(session: SessionDep, user: UsersModel = Depends(get_current_user)):
    all_cases = await get_cases(user_id=user.id, session=session)
    return {
        "page_title": LEXICON_RU["case"]["page_title"],
        "page_description": LEXICON_RU["case"]["page_description"],
        "cases": all_cases
    }

@router.post("/{case_id}", status_code=status.HTTP_201_CREATED)
async def open_case(session: SessionDep, case_id: int, user: UsersModel = Depends(get_current_user)):
    return await open_case_service(user_id=user.id, case_id=case_id, session=session)
