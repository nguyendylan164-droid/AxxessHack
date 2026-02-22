"""Generate EMR visit notes from a clinician/client-labeled transcript."""

from typing import Any, Dict, List

from .ai_service import send_msg


def generate_emr_from_transcript(processed: Dict[str, Any]) -> str:
    """Generate structured EMR visit notes from processed transcript.

    Input processed has:
        - utterances: [{speaker, text}, ...]
        - clinician_questions: [...]
        - client_responses: [...]
        - summary: str
    """
    utterances = processed.get("utterances", [])
    clinician_q = processed.get("clinician_questions", [])
    client_resp = processed.get("client_responses", [])
    summary = processed.get("summary", "")

    # Build dialogue representation
    dialogue_lines = []
    for u in utterances:
        speaker = u.get("speaker", "unknown")
        text = u.get("text", "").strip()
        if text:
            dialogue_lines.append(f"[{speaker.upper()}] {text}")

    dialogue = "\n".join(dialogue_lines) if dialogue_lines else "No dialogue."

    system_prompt = (
        "You are a clinical documentation assistant. Create structured EMR (Electronic Medical Record) "
        "visit notes from a clinician-patient conversation. Use standard medical terminology. "
        "Do not invent facts not present in the transcript. If information is missing, state 'Not documented'. "
        "Output professional, concise notes suitable for charting. Do not use markdown code fences."
    )

    user_prompt = f"""
Transcript (clinician vs client labeled):
{dialogue}

Clinician questions asked: {clinician_q}
Client-reported symptoms/responses: {client_resp}
Brief summary: {summary}

Create EMR visit notes with these sections:

1) Chief Complaint
   - 1-2 sentences on reason for visit.

2) History of Present Illness (HPI)
   - Relevant symptoms, onset, duration, exacerbating/relieving factors from client.
   - Pertinent positives and negatives.

3) Review of Systems (pertinent only)
   - Only include systems relevant to this visit.

4) Assessment / Clinical Impression
   - Working diagnosis or impressions based on the conversation.

5) Plan
   - Recommended next steps, medications, follow-up, patient education.

Rules:
- Use section headers exactly as above.
- Bullet points where appropriate.
- 250–400 words total.
- Professional tone, no AI disclaimers.
"""

    return send_msg(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=2000,
    )
