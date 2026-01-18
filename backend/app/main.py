from fastapi import FastAPI
from app.api import users

app = FastAPI(title="BizTrack KE")

app.include_router(users.router, prefix="/users", tags=["Users"])

@app.get("/")
def health():
    return {"status": "ok"}
