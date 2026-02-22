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


def get_clients_with_last_visit() -> List[Dict[str, Any]]:
    """Return users with role=client, each with id, name, lastVisit (human-readable or 'No visit yet')."""
    from datetime import date

    sb = get_supabase()
    users_res = (
        sb.table("users")
        .select("id,name,date_of_birth,role")
        .eq("role", "client")
        .order("name")
        .execute()
    )
    if getattr(users_res, "error", None):
        raise RuntimeError(f"Supabase error: {users_res.error}")
    users_data = users_res.data or []

    # Get last_visit for each user from emr_reports
    emr_res = sb.table("emr_reports").select("user_id,last_visit").execute()
    if getattr(emr_res, "error", None):
        raise RuntimeError(f"Supabase error: {emr_res.error}")
    emr_data = {r["user_id"]: r.get("last_visit") for r in (emr_res.data or [])}

    today = date.today()
    out = []
    for row in users_data:
        uid = row.get("id")
        last_visit = emr_data.get(uid) if uid else None
        if last_visit:
            try:
                if isinstance(last_visit, str):
                    from datetime import datetime
                    d = datetime.strptime(last_visit[:10], "%Y-%m-%d").date()
                else:
                    d = last_visit
                delta = (today - d).days
                last_visit_str = f"{delta} days ago" if delta != 1 else "1 day ago"
            except Exception:
                last_visit_str = str(last_visit)
        else:
            last_visit_str = "No visit yet"
        out.append({
            "id": uid,
            "name": row.get("name") or "Unknown",
            "lastVisit": last_visit_str,
        })
    return out