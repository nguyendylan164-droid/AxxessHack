"""Transcript processing and EMR generation from conversation."""

from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.transcript_processor import process_transcript
from ..services.transcript_to_emr import generate_emr_from_transcript

router = APIRouter(prefix="/api/transcript", tags=["transcript"])


class ProcessTranscriptRequest(BaseModel):
    raw_transcript: str


class ProcessTranscriptResponse(BaseModel):
    utterances: List[Dict[str, Any]]
    clinician_questions: List[str]
    client_responses: List[str]
    summary: str


class GenerateEmrRequest(BaseModel):
    processed: Dict[str, Any]


class GenerateEmrResponse(BaseModel):
    emr_notes: str


@router.post("/process", response_model=ProcessTranscriptResponse)
def process_transcript_endpoint(req: ProcessTranscriptRequest):
    """Separate clinician vs client utterances and structure the transcript."""
    try:
        result = process_transcript(raw_transcript=req.raw_transcript)
        return ProcessTranscriptResponse(
            utterances=result.get("utterances", []),
            clinician_questions=result.get("clinician_questions", []),
            client_responses=result.get("client_responses", []),
            summary=result.get("summary", ""),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/generate-emr", response_model=GenerateEmrResponse)
def generate_emr_endpoint(req: GenerateEmrRequest):
    """Generate EMR visit notes from processed (clinician/client labeled) transcript."""
    try:
        emr = generate_emr_from_transcript(processed=req.processed)
        return GenerateEmrResponse(emr_notes=emr)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/full-pipeline")
def full_pipeline(req: ProcessTranscriptRequest):
    """Process transcript and generate EMR in one call. Returns both."""
    try:
        processed = process_transcript(raw_transcript=req.raw_transcript)
        emr = generate_emr_from_transcript(processed=processed)
        return {
            "processed": processed,
            "emr_notes": emr,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
