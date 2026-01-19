from fastapi import FastAPI
from app.api import auth, users, customers, sales

app = FastAPI(title="BizTrack KE")

app.include_router(auth.router)
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(customers.router)
app.include_router(sales.router)


@app.get("/")
def health():
    return {"status": "ok"}
