"""Clinician tasks API."""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.task_generator import generate_clinician_tasks

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


class AgreedItemInput(BaseModel):
    title: str
    detail: str
    severity: Optional[str] = None


class GenerateTasksRequest(BaseModel):
    emr_text: Optional[str] = None
    agreed_items: Optional[List[AgreedItemInput]] = None


class TaskOutput(BaseModel):
    id: str
    label: str
    priority: str
    source: str
    category: str


@router.post("/generate", response_model=List[TaskOutput])
def generate_tasks_endpoint(req: GenerateTasksRequest):
    """Generate clinician tasks (Follow-up, Medication, Screening, Routine) from patient context."""
    try:
        agreed = [a.model_dump() for a in (req.agreed_items or [])]
        tasks = generate_clinician_tasks(
            emr_text=req.emr_text or "",
            agreed_items=agreed,
        )
        return [TaskOutput(**t) for t in tasks]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate tasks")
