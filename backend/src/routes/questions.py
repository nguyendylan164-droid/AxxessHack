from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.question_generator import generate_questions

router = APIRouter(prefix="/api/cards", tags=["cards"])

class GenerateQuestionRequest(BaseModel):
    emr_text: str

class Card(BaseModel):
    id: str
    title: str
    description: str
    rationale: Optional[str] = None
    category: Optional[str] = None

@router.post("/generate", response_model=List[Card])
def generate_cards(req: GenerateQuestionRequest):
    try:
        return generate_questions(req.emr_text)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate cards")