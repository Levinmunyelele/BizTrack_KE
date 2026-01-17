from fastapi import FastAPI

app = FastAPI(title="BizTrack KE")

@app.get("/")
def health_check():
    return {"status": "Backend running"}
