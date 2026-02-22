# Gives a report after the patient answers the generated question
# for the patient and clinician

from typing import List, Dict, Any

from .ai_service import send_msg
from .emr_repo import format_emr_report_as_text

def _normalize_answer(value: Any) -> str:
    if value is None:
        return "Not Provided"

    if isinstance(value, bool):
        return "Yes" if value else "No"

    text = str(value).strip().lower()
    if text in {"yes", "y", "true", "1"}:
        return "Yes"
    if text in {"no", "n", "false", "0"}:
        return "No"
    if not text:
        return "Not Provided"

    return str(value).strip()

def generate_report(emr_report: Dict[str, Any], selected_questions: List[Dict[str, Any]]) -> str:
    if not emr_report:
        raise ValueError("EMR report is required")
    if not selected_questions:
        raise ValueError("Selected questions are required")

    emr_text = format_emr_report_as_text(emr_report)
    
    system_prompt = (
        "You are a clinical diagnostic/documentation assistant for a clinician. "
        "Write accurate, structured, clinician-facing reports for charting and handoff. "
        "Do not invent patient facts, labs, vitals, medications, or timelines not present in the input. "
        "If data is missing, explicitly state 'Data Not Provided'. "
        "Use concise medical language and include safety-focused recommendations."
    )

    question_lines = []
    for q in selected_questions:
        answer = _normalize_answer(q.get("answer"))
        question_lines.append(
            f"- [{q.get('id', 'unknown')}] {q.get('title', 'Untitled')}: "
            f"{q.get('description', '')} | Patient answer: {answer}"
        )
    question_str = "\n".join(question_lines)

    user_prompt = f"""
    Task:
    Create a detaiiled clinician-facing follow-up report from the EMR and selected follow-up cards/question with patient answers.

    EMR:
    \"\"\"{emr_text}\"\"\"

    Selected follow-up cards with patient answers:
    {question_str}

    Output requirements:
    1) Chief Concern / Context
    - 2-4 sentences summarizing reason for follow-up and current phase of care.

    2) Clinical Summary
    - Problem-oriented summary of relevant symptoms, progression, and treatment response.
    - Include pertinent positives and negatives from the EMR.

    3) Follow-up Card Synthesis
    - For each selected card, include:
        - Card ID and Title
        - Patient answer (Yes/No/Not Provided)
        - Why it matters clinically
        - Clinical implication of the recorded answer

    4) Risk & Red Flags
    - List immediate warning signs that should trigger urgent evaluation.
    - Prioritize by potential severity.

    5) Assessment
    - Brief clinical impression integrating EMR + selected cards + patient answers.
    - Note uncertainty where information is incomplete.

    6) Plan / Recommendations
    - Clear next-step actions for clinician handoff/charting.
    - Include monitoring suggestions and follow-up timing language.

    Formatting rules:
    - Use section headers exactly as above.
    - Use bullet points under sections 3, 4, and 6.
    - Keep total length between 350 and 550 words.
    - Professional, neutral tone; no markdown code fences.
    - Do not mention being an AI.
    """

    result = send_msg(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
    )
    return result