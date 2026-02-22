from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import users, emr, questions, report
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

@app.get("/")
def root():
    return {"ok": True}


