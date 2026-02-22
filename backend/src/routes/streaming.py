"""Streaming transcription API - AssemblyAI temp token."""

import os

import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/streaming", tags=["streaming"])


@router.get("/token")
def get_streaming_token(expires_in_seconds: int = 300):
    """Return a temporary AssemblyAI token for WebSocket streaming.

    Token is used to connect to wss://streaming.assemblyai.com/v3/ws
    without exposing the API key in the browser.
    """
    api_key = os.getenv("ASSEMBLYAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="ASSEMBLYAI_API_KEY not configured",
        )
    expires = min(max(60, expires_in_seconds), 600)  # 60–600 seconds
    url = f"https://streaming.assemblyai.com/v3/token?expires_in_seconds={expires}"
    try:
        with httpx.Client() as client:
            resp = client.get(url, headers={"Authorization": api_key}, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            token = data.get("token")
            if not token:
                raise HTTPException(status_code=500, detail="No token in response")
            return {"token": token, "expires_in": expires}
    except httpx.HTTPStatusError as e:
        body = e.response.text
        if e.response.status_code == 402:
            raise HTTPException(
                status_code=402,
                detail="AssemblyAI streaming requires an upgraded account. Add a payment method at app.assemblyai.com",
            ) from e
        raise HTTPException(
            status_code=e.response.status_code,
            detail=body or "Failed to get streaming token",
        ) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
