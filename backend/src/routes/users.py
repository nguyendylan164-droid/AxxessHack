"""Mock users API."""

from fastapi import APIRouter, HTTPException
from src.services.mock_db import get_users, get_user_by_id

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("")
@router.get("/")
def list_users():
    """Return all mock users."""
    return {"users": get_users()}


@router.get("/{user_id}")
def get_user(user_id: str):
    """Return a single user by id."""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
