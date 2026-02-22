"""Generate clinician tasks (Follow-up, Medication, Screening, Routine) from patient context."""

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


def generate_clinician_tasks(
    emr_text: str | None,
    agreed_items: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Generate clinician tasks for Follow-up, Medication, Screening, and Routine.
    Returns list of { id, label, priority, source, category }.
    """
    context_parts = []
    if emr_text and emr_text.strip():
        context_parts.append(f"Patient/EMR notes:\n{emr_text.strip()}")
    if agreed_items:
        agreed_str = "\n".join(
            f"- {a.get('title', '')}: {a.get('detail', '')}" for a in agreed_items
        )
        context_parts.append(f"Agreed follow-up items:\n{agreed_str}")

    if not context_parts:
        return []

    context = "\n\n".join(context_parts)

    system_prompt = (
        "You are a clinical task assistant for nurses. "
        "Output MUST be a valid JSON array only. No markdown, no code fences. "
        "Generate actionable clinician tasks from the patient context."
    )

    user_prompt = f"""
Given this patient context:

{context}

Generate clinician tasks for the nurse. Return a JSON array of objects with:
- id: string (e.g. "task-f1", "task-m1", "task-s1", "task-r1")
- label: string (short actionable task, e.g. "Discuss headache management at next visit")
- priority: string ("high", "medium", or "low")
- source: string (e.g. "AI-generated")
- category: string (one of: "Follow-up", "Medication", "Screening", "Routine")

Requirements:
- Include 1-3 tasks total across Follow-up, Medication, Screening, Routine as relevant.
- Only include categories that make sense for this patient (e.g. if no meds mentioned, skip Medication).
- Prioritize high-risk and time-sensitive items.
- Keep labels concise and actionable.
- Do not include Escalation (those come from agreed items separately).
"""

    content = send_msg(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=800,
    )

    return _parse_tasks(content)


def _parse_tasks(content: str) -> List[Dict[str, Any]]:
    cleaned = _strip_code_fences(content)
    try:
        tasks = json.loads(cleaned)
    except Exception as exc:
        raise ValueError(f"Model did not return valid JSON: {exc}") from exc
    if not isinstance(tasks, list):
        raise ValueError("Model output must be a JSON array")
    required = {"id", "label", "priority", "category"}
    for i, t in enumerate(tasks):
        if not isinstance(t, dict):
            raise ValueError(f"Task at index {i} is not an object")
        missing = required - set(t.keys())
        if missing:
            raise ValueError(f"Task at index {i} missing fields: {sorted(missing)}")
        t.setdefault("source", "AI-generated")
        # Normalize category
        cat = str(t.get("category", "")).strip()
        if cat not in ("Follow-up", "Medication", "Screening", "Routine"):
            t["category"] = "Follow-up"
        else:
            t["category"] = cat
    return tasks
