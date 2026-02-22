"""Progress summary API."""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.progress_summary_generator import generate_progress_summary

router = APIRouter(prefix="/api/summary", tags=["summary"])


class AgreedItem(BaseModel):
    title: str
    detail: str
    severity: Optional[str] = "low"


class GenerateSummaryRequest(BaseModel):
    emr_text: Optional[str] = None
    agreed_items: Optional[List[AgreedItem]] = None


class GenerateSummaryResponse(BaseModel):
    summary: str


@router.post("/generate", response_model=GenerateSummaryResponse)
def generate_summary_endpoint(req: GenerateSummaryRequest):
    """Generate AI progress summary from EMR text and agreed items."""
    try:
        agreed = [a.model_dump() for a in (req.agreed_items or [])]
        summary = generate_progress_summary(
            emr_text=req.emr_text,
            agreed_items=agreed if agreed else None,
        )
        return GenerateSummaryResponse(summary=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
