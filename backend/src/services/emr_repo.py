from typing import Any, Dict, Optional
from src.services.supabase_client import get_supabase

def _map_emr_row(row: Dict[str, Any]) -> Dict[str, Any]:
    # Keep API response identical to your mock JSON keys
    return {
        "user_id": row.get("user_id"),
        "lastVisit": row.get("last_visit"),
        "conditions": row.get("conditions") or [],
        "medications": row.get("medications") or [],
        "procedures": row.get("procedures") or [],
        "vitals": row.get("vitals") or {},
        "visitNotes": row.get("visit_notes"),
        "alerts": row.get("alerts") or [],
    }

def get_emr_by_user_id(user_id: str) -> Optional[Dict[str, Any]]:
    sb = get_supabase()
    res = (
        sb.table("emr_reports")
        .select("user_id,last_visit,conditions,medications,procedures,vitals,visit_notes,alerts")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if getattr(res, "error", None):
        raise RuntimeError(f"Supabase error: {res.error}")

    if not res.data:
        return None

    return _map_emr_row(res.data)