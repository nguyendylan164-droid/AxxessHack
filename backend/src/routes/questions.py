from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.emr_repo import get_emr_by_user_id
from ..services.question_generator import generate_questions, generate_questions_from_emr_text

router = APIRouter(prefix="/api/cards", tags=["cards"])

class GenerateQuestionRequest(BaseModel):
    user_id: str
    transcript_emr: str

class GenerateFromTextRequest(BaseModel):
    emr_text: str

class Card(BaseModel):
    id: str
    title: str
    description: str
    rationale: Optional[str] = None
    category: Optional[str] = None

@router.post("/generate-from-text", response_model=List[Card])
def generate_cards_from_text(req: GenerateFromTextRequest):
    """Generate follow-up cards from raw EMR text. Use when you have EMR content (e.g. from visit notes) without a user_id."""
    try:
        cards = generate_questions_from_emr_text(emr_text=req.emr_text)
        return cards
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate cards")

@router.post("/generate", response_model=List[Card])
def generate_cards(req: GenerateQuestionRequest):
    try:
        emr_report = get_emr_by_user_id(req.user_id)
        if not emr_report:
            raise HTTPException(status_code=404, detail="EMR not found for user")

        return generate_questions(emr_report, req.transcript_emr)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate cards")