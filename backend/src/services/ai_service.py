# connect to featherless AI

import os
import threading
from openai import OpenAI
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()
FEATHERLESS_API_KEY = os.getenv("FEATHERLESS_API_KEY")

if not FEATHERLESS_API_KEY:
    raise ValueError("FEATHERLESS_API_KEY is not set")

client = OpenAI(base_url="https://api.featherless.ai/v1", api_key=FEATHERLESS_API_KEY)

# Serialize all AI calls to stay within Featherless concurrency limit (4 units = 1 request at a time)
_ai_lock = threading.Lock()


def send_msg(
    messages: List[Dict[str, str]],
    model: str = "deepseek-ai/DeepSeek-V3-0324",
    max_tokens: int = 500,
) -> str:
    with _ai_lock:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.5,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content