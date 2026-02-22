# Gives a report after the patient answers the generated question
# for the patient and clinician

from typing import List, Dict, Any

from .ai_service import send_msg

def generate_report(emr_text: str, selected_questions: List[Dict[str, Any]]) -> str:
    if not emr_text or not emr_text.strip():
        raise ValueError("EMR text is required")
    if not selected_questions:
        raise ValueError("Selected questions are required")
    
    system_prompt = (
        "You are a clinical diagnostic/documentation assistant for a clinician. "
        "You turn structured follow-up items into a clear, concise report. "
    )

    question_lines = []
    for q in selected_questions:
        question_lines.append(
            f"- [{q.get('id', 'unknown')}] {q.get('title', 'Untitled')}: "
            f"{q.get('description', '')}"
        )
    question_str = "\n".join(question_lines)

    user_prompt = f"""
    EMR:
    \"\"\"{emr_text}\"\"\"
    Selected follow-up cards:
    {question_str}

    Write a concise clinician-facing report that:
    - Synthesizes the EMR and the selected follow-up cards into the report
    - Make sure it is suitable for charting or a provider handoff
    - Uses professional tone
    """

    result = send_msg(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
    )
    return result