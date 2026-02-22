# connect to featherless AI

import os
from openai import OpenAI
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()
FEATHERLESS_API_KEY = os.getenv("FEATHERLESS_API_KEY")

if not FEATHERLESS_API_KEY:
    raise ValueError("FEATHERLESS_API_KEY is not set")

client = OpenAI(base_url="https://api.featherless.ai/v1", api_key=FEATHERLESS_API_KEY)

# send message to Featherless API
def send_msg(messages: List[Dict[str,str]], model: str = "deepseek-ai/DeepSeek-V3-0324",) -> str:
    # get response from Featherless API
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.5, # Adjust for creativity
        max_tokens=500 # 
    )
    return response.choices[0].message.content