from fastapi import APIRouter, status

from app.db.session import SessionDep
from app.service.case_service import get_cases, open_case_service
from app.schemas.cases_schemas import SGetCasesResponse
from app.core.lexicon import LEXICON_RU

router = APIRouter(prefix="/cases", tags=["Кейсы"])

@router.get("/{user_id}", response_model=SGetCasesResponse, status_code=status.HTTP_200_OK)
async def cases(session: SessionDep, user_id: int):
    all_cases = await get_cases(user_id=user_id, session=session)
    return {
        "page_title": LEXICON_RU["case"]["page_title"],
        "page_description": LEXICON_RU["case"]["page_description"],
        "cases": all_cases
    }

@router.post("/{user_id}/{case_id}", status_code=status.HTTP_201_CREATED)
async def open_case(session: SessionDep, user_id: int, case_id: int):
    return await open_case_service(user_id=user_id, case_id=case_id, session=session)
