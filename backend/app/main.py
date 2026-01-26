from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, users, customers, sales

app = FastAPI(title="BizTrack KE")

# CORS: allow your local dev frontend + Render frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://biztrack-ke-1.onrender.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"^https://biztrack-ke-1\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)


app.include_router(auth.router)
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(customers.router)
app.include_router(sales.router)

@app.get("/")
def health():
    return {"status": "ok"}
