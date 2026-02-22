"""EMR API."""

from fastapi import APIRouter, HTTPException
from src.services.emr_repo import get_emr_by_user_id

router = APIRouter(prefix="/api/emr", tags=["emr"])


@router.get("/{user_id}")
def get_emr(user_id: str):
    try:
        emr = get_emr_by_user_id(user_id)
        if not emr:
            raise HTTPException(status_code=404, detail="EMR not found for user")
        return emr
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
def get_emr(user_id: str):
   
    emr = get_emr_by_user_id(user_id)
    if not emr:
        raise HTTPException(status_code=404, detail="EMR not found for user")
    return emr
