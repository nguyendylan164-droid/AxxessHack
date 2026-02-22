import json
from typing import Any, Dict, List

from .ai_service import send_msg
from .emr_repo import format_emr_report_as_text

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

def generate_questions(emr_report: Dict[str, Any], transcript_emr: str) -> List[Dict[str, Any]]:
    if not emr_report:
        raise ValueError("emr_report is required")
    if not transcript_emr or not transcript_emr.strip():
        raise ValueError("transcript_emr is required")

    emr_text = format_emr_report_as_text(emr_report)

    system_prompt = (
        "You are a clinical follow-up question generator and diagnostic assistant for post-visit after care. "
        "Output MUST be a valid JSON array only. "
        "Do not include markdown, code fences, commentary, or trailing text. "
        "Do not invent diagnoses, labs, or medications not present in the inputs. "
        "Focus on actionable follow-up and patient safety."
    )

    user_prompt = f"""
    Task:
    Generate follow-up aftercare cards/questions using both EMR sources.

    Structured EMR Report:
    \"\"\"{emr_text}\"\"\"

    Transcript-Derived EMR Notes:
    \"\"\"{transcript_emr.strip()}\"\"\"

    Requirements:
    - Return as many cards as needed.
    - Every card must be a yes/no question relevant to the patient context.
    - Prioritize high-risk and time-sensitive issues first.
    - Questions must be specific, plain language, and patient-facing.
    - Avoid duplicate or overlapping questions.
    - Reconcile both sources; if details conflict, prefer safer follow-up questions.

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
    - If inputs lack detail, still generate conservative, general follow-up cards without fabricating facts.
    """

    content = send_msg(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=2000,
    )

    return _parse_cards(content)


def generate_questions_from_emr_text(emr_text: str) -> List[Dict[str, Any]]:
    """Generate follow-up cards from raw EMR text (e.g., from formatted EMR or visit notes)."""
    if not emr_text or not emr_text.strip():
        raise ValueError("emr_text is required")

    system_prompt = (
        "You are a clinical follow-up question generator for post-visit after care. "
        "Output MUST be a valid JSON array only. No markdown, no code fences, no commentary. "
        "Do not invent diagnoses or medications not in the input. Focus on actionable follow-up."
    )

    user_prompt = f"""
Generate follow-up aftercare cards from this EMR/clinical summary:

\"\"\"
{emr_text.strip()}
\"\"\"

Requirements:
- Return up to 6 cards as a JSON array.
- Each card: yes/no question relevant to the patient.
- Prioritize high-risk and time-sensitive issues first.
- Plain language, patient-facing.

Output format (JSON array only):
- id: string ("q1", "q2", ...)
- title: string (short question, ends with "?")
- description: string (1–2 sentences, what to check/ask)
- rationale: string (why this matters clinically)
- category: string (one of: "medication", "symptom", "red_flag", "recovery", "follow_up")
"""

    content = send_msg(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=2000,
    )

    return _parse_cards(content)


def _parse_cards(content: str) -> List[Dict[str, Any]]:
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