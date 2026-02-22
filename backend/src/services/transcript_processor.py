"""Process raw transcript: separate clinician vs client using LLM."""

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


def process_transcript(raw_transcript: str) -> Dict[str, Any]:
    """Given a raw conversation transcript (no speaker labels), use LLM to label
    each utterance as clinician or client and structure the dialogue.

    Returns:
        {
            "utterances": [{"speaker": "clinician"|"client", "text": "..."}],
            "clinician_questions": [...],
            "client_responses": [...],  # symptoms, side effects, etc.
            "summary": "..."
        }
    """
    if not raw_transcript or not raw_transcript.strip():
        raise ValueError("raw_transcript is required")

    system_prompt = (
        "You are a clinical documentation assistant. Given a transcript of a clinician-patient conversation, "
        "split it into utterances and label each as 'clinician' or 'client'. "
        "Clinicians typically ask questions, give instructions, or provide medical information. "
        "Clients (patients) typically describe symptoms, side effects, answer questions, and report how they feel. "
        "Output ONLY valid JSON. No markdown, no code fences, no commentary."
    )

    user_prompt = f"""
Raw transcript:
\"\"\"
{raw_transcript}
\"\"\"

Task:
1. Split into logical utterances (sentences or short exchanges).
2. For each utterance, decide: "clinician" or "client".
3. Return a JSON object with:
   - utterances: array of {{"speaker": "clinician"|"client", "text": "..."}}
   - clinician_questions: array of strings (key questions the clinician asked)
   - client_responses: array of strings (symptoms, side effects, patient answers)
   - summary: 1-2 sentence summary of the conversation

Rules:
- Preserve the original wording; do not paraphrase.
- If unsure, use context: questions → clinician; symptoms/answers → client.
- Keep utterances in chronological order.
"""

    content = send_msg(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=4000,
    )

    cleaned = _strip_code_fences(content)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM did not return valid JSON: {e}") from e

    if not isinstance(data, dict):
        raise ValueError("Output must be a JSON object")

    # Ensure required keys
    data.setdefault("utterances", [])
    data.setdefault("clinician_questions", [])
    data.setdefault("client_responses", [])
    data.setdefault("summary", "")

    return data
