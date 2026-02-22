from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.emr_repo import get_emr_by_user_id
from ..services.report_generator import generate_report

router = APIRouter(prefix="/api/report", tags=["report"])

class QuestionInput(BaseModel):
    id: str
    title: str
    description: str
    rationale: Optional[str] = None
    category: Optional[str] = None
    answer: Optional[str] = None

class GenerateReportRequest(BaseModel):
    user_id: str
    selected_questions: List[QuestionInput]

class GenerateReportResponse(BaseModel):
    report: str

@router.post("/generate", response_model=GenerateReportResponse)
def generate_report_endpoint(req: GenerateReportRequest):
    try:
        emr_report = get_emr_by_user_id(req.user_id)
        if not emr_report:
            raise HTTPException(status_code=404, detail="EMR not found for user")

        report_text = generate_report(
            emr_report=emr_report,
            selected_questions=[q.dict() for q in req.selected_questions],
        )
        return GenerateReportResponse(report=report_text)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate report")