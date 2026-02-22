"""Generate progress summary from EMR and agreed cards using AI."""

from typing import Any, Dict, List, Optional

from .ai_service import send_msg


def generate_progress_summary(
    emr_text: Optional[str] = None,
    agreed_items: Optional[List[Dict[str, Any]]] = None,
) -> str:
    """Generate a clinician-facing progress summary from EMR and items the user agreed need attention."""
    agreed_items = agreed_items or []

    if not emr_text and not agreed_items:
        return "No EMR or agreed items yet. Select a client and agree on cards to generate a progress summary."

    emr_block = emr_text.strip() if emr_text and emr_text.strip() else "No EMR on file."
    agreed_block = ""
    if agreed_items:
        lines = []
        for i, item in enumerate(agreed_items, 1):
            title = item.get("title", "Unknown")
            detail = item.get("detail", "")
            severity = item.get("severity", "low")
            lines.append(f"{i}. {title} ({severity}): {detail}")
        agreed_block = "\n".join(lines)

    system_prompt = (
        "You are a clinical documentation assistant. Write a concise progress summary for a clinician. "
        "Use the EMR and agreed items (topics the patient/clinician flagged for attention). "
        "Be professional, factual, and highlight what matters most for follow-up. "
        "Do not invent information. If data is sparse, say so. "
        "Output 2-4 short paragraphs. No markdown, no section headers."
    )

    user_prompt = f"""
EMR / Clinical context:
\"\"\"
{emr_block}
\"\"\"

Items agreed as needing attention:
\"\"\"
{agreed_block if agreed_block else "None yet."}
\"\"\"

Write a brief progress summary (2-4 paragraphs) that a clinician can quickly scan. Focus on:
- Current status and key concerns
- What to watch based on agreed items
- Any gaps or areas needing follow-up
"""

    return send_msg(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=600,
    )
