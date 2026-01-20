from fastapi import FastAPI
from app.api import auth, users, customers, sales
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="BizTrack KE")

app.include_router(auth.router)
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(customers.router)
app.include_router(sales.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

allow_origins=[
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://YOUR_NETLIFY_SITE.netlify.app",
]

@app.get("/")
def health():
    return {"status": "ok"}
