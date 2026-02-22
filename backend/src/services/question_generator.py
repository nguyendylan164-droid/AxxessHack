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
        "You are a clinical follow-up question generator and diagnostic assistant for post-visit after care. "
        "Output MUST be a valid JSON array only. "
        "Do not include markdown, code fences, commentary, or trailing text. "
        "Do not invent diagnoses, labs, or medications not present in the EMR. "
        "Focus on actionable follow-up and patient safety."
    )

    user_prompt = f"""
    Task:
    Generate follow-up aftercare cards/questions from the EMR.

    EMR:
    \"\"\"{emr_text}\"\"\"

    Requirements:
    - Return as many cards as needed.
    - Every card must be a yes/no question relevant to the EMR.
    - Prioritize high-risk and time-sensitive issues first.
    - Questions must be specific, plain language, and patient-facing.
    - Avoid duplicate or overlapping questions.

    Output format:
    Return ONLY a JSON array of objects with exactly these keys:
    - id: string (format "q1", "q2", ...)
    - title: string (short yes/no question, max 80 chars, ends with "?")
    - description: string (1 sentence, what to check/ask)
    - rationale: string (1 sentence, why this matters clinically)
    - category: string (one of: "medication", "symptom", "red_flag", "recovery", "follow_up")

    Quality rules:
    - Include at least 1 card in category "red_flag" when EMR suggests any potential complication.
    - Use clinically meaningful distinctions (e.g., worsening SOB vs mild stable SOB).
    - Keep each field concise and non-redundant.
    - If EMR lacks detail, still generate conservative, general follow-up cards without fabricating facts.
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