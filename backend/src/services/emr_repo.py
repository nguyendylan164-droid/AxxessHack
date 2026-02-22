from typing import Any, Dict, Optional
from src.services.supabase_client import get_supabase

def _map_emr_row(row: Dict[str, Any]) -> Dict[str, Any]:
    # Normalize EMR keys to API snake_case contract.
    return {
        "user_id": row.get("user_id"),
        "last_visit": row.get("last_visit") or row.get("lastVisit"),
        "conditions": row.get("conditions") or [],
        "medications": row.get("medications") or [],
        "procedures": row.get("procedures") or [],
        "vitals": row.get("vitals") or {},
        "visit_notes": row.get("visit_notes") or row.get("visitNotes"),
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

def format_emr_report_as_text(emr_report: Dict[str, Any]) -> str:
    conditions = emr_report.get("conditions") or []
    medications = emr_report.get("medications") or []
    procedures = emr_report.get("procedures") or []
    vitals = emr_report.get("vitals") or {}
    alerts = emr_report.get("alerts") or []

    vitals_text = ", ".join(f"{k}: {v}" for k, v in vitals.items()) if vitals else "Data Not Provided"

    sections = [
        f"User ID: {emr_report.get('user_id', 'Data Not Provided')}",
        f"Last Visit: {emr_report.get('last_visit') or emr_report.get('lastVisit') or 'Data Not Provided'}",
        f"Conditions: {', '.join(conditions) if conditions else 'Data Not Provided'}",
        f"Medications: {', '.join(medications) if medications else 'Data Not Provided'}",
        f"Procedures: {', '.join(procedures) if procedures else 'Data Not Provided'}",
        f"Vitals: {vitals}",
        f"Visit Notes: {emr_report.get('visit_notes') or emr_report.get('visitNotes') or 'Data Not Provided'}",
        f"Alerts: {', '.join(alerts) if alerts else 'Data Not Provided'}",
    ]
    return "\n".join(sections)