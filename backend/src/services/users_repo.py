from typing import Any, Dict, List, Optional
from src.services.supabase_client import get_supabase

def _map_user_row(row: Dict[str, Any]) -> Dict[str, Any]:
    # DB uses snake_case; API returns camelCase like your JSON
    return {
        "id": row.get("id"),
        "name": row.get("name"),
        "dateOfBirth": row.get("date_of_birth"),
        "role": row.get("role") or "client",
    }

def get_users() -> List[Dict[str, Any]]:
    sb = get_supabase()
    res = sb.table("users").select("id,name,date_of_birth,role").order("id").execute()

    if getattr(res, "error", None):
        raise RuntimeError(f"Supabase error: {res.error}")

    data = res.data or []
    return [_map_user_row(r) for r in data]

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    sb = get_supabase()
    res = (
        sb.table("users")
        .select("id,name,date_of_birth,role")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )

    if getattr(res, "error", None):
        raise RuntimeError(f"Supabase error: {res.error}")

    if not res.data:
        return None

    return _map_user_row(res.data)