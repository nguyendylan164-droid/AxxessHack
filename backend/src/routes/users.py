"""Users API."""

from fastapi import APIRouter, HTTPException
from src.services.users_repo import get_users, get_user_by_id

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("")
@router.get("/")
def list_users():
    try:
        return {"users": get_users()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}")
def get_user(user_id: str):
    try:
        user = get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
