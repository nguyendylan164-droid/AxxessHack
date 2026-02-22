import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend dir, then repo root (so Supabase vars are available when run from backend/)
_here = Path(__file__).resolve().parent
load_dotenv(_here / ".env")
load_dotenv(_here.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import users, emr, questions, report, streaming, transcript, summary, tasks
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(users.router)
app.include_router(emr.router)
app.include_router(questions.router)
app.include_router(report.router)
app.include_router(streaming.router)
app.include_router(transcript.router)
app.include_router(summary.router)
app.include_router(tasks.router)

@app.get("/")
def root():
    return {"ok": True}


