from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.report_generator import generate_report

router = APIRouter(prefix="/api/report", tags=["report"])

class QuestionInput(BaseModel):
    id: str
    title: str
    description: str
    rationale: Optional[str] = None
    category: Optional[str] = None

class GenerateReportRequest(BaseModel):
    emr_text: str
    selected_questions: List[QuestionInput]

class GenerateReportResponse(BaseModel):
    report: str

@router.post("/generate", response_model=GenerateReportResponse)
def generate_report_endpoint(req: GenerateReportRequest):
    try:
        report_text = generate_report(
            emr_text=req.emr_text,
            selected_questions=[q.dict() for q in req.selected_questions],
        )
        return GenerateReportResponse(report=report_text)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate report")