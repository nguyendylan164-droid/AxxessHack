from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.emr_repo import get_emr_by_user_id
from ..services.question_generator import generate_questions

router = APIRouter(prefix="/api/cards", tags=["cards"])

class GenerateQuestionRequest(BaseModel):
    user_id: str

class Card(BaseModel):
    id: str
    title: str
    description: str
    rationale: Optional[str] = None
    category: Optional[str] = None

@router.post("/generate", response_model=List[Card])
def generate_cards(req: GenerateQuestionRequest):
    try:
        emr_report = get_emr_by_user_id(req.user_id)
        if not emr_report:
            raise HTTPException(status_code=404, detail="EMR not found for user")

        return generate_questions(emr_report)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate cards")