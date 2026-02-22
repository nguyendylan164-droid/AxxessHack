import json
from typing import Any, Dict, List

from .ai_service import send_msg

def _strip_code_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 2 and lines[-1].strip().startswith("```"):
            lines = lines[1:-1]
        if lines and lines[0].strip().lower() == "json":
            lines = lines[1:]
        text = "\n".join(lines).strip()
    return text

def generate_questions(emr_text: str) -> List[Dict[str, Any]]:
    if not emr_text or not emr_text.strip():
        raise ValueError("emr_text is required")

    system_prompt = (
        "You are a clinical assistant. "
        "Return ONLY valid JSON array. No markdown, no extra text."
    )

    user_prompt = f"""
    Given the EMR below, create 2-7 follow-up after-care cards.
    Each card should be a yes/no question.

    Return JSON array with objects containing:
    - id (string)
    - title (string)
    - description (string)
    - rationale (string)
    - category (string)

    EMR:
    \"\"\"{emr_text}\"\"\"
    """

    content = send_msg(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
    )

    cleaned = _strip_code_fences(content)

    try:
        cards = json.loads(cleaned)
    except Exception as exc:
        raise ValueError(f"Model did not return valid JSON: {exc}") from exc

    if not isinstance(cards, list):
        raise ValueError("Model output must be a JSON array")

    required = {"id", "title", "description"}
    for i, card in enumerate(cards):
        if not isinstance(card, dict):
            raise ValueError(f"Card at index {i} is not an object")
        missing = required - set(card.keys())
        if missing:
            raise ValueError(f"Card at index {i} missing fields: {sorted(missing)}")

    return cards