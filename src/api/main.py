"""FastAPI-Bruecke zwischen SherpAI-Frontend und llm-orchestration Scheduler."""

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .analyzer import csv_analysieren
from .runner import schritte_lesen

app = FastAPI(title="SherpAI Bridge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    """Liveness-Pruefung fuer das Frontend."""
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(file: UploadFile) -> dict:
    """CSV hochladen, durch Scheduler leiten und AnalysisResult zurueckgeben."""
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Nur CSV-Dateien erlaubt")
    try:
        csv_bytes = await file.read()
        return await csv_analysieren(csv_bytes)
    except Exception as fehler:
        raise HTTPException(status_code=500, detail=str(fehler)) from fehler


@app.get("/run/{ordner_name}/steps")
def run_steps(ordner_name: str) -> list:
    """Pipeline-Schritte eines bestimmten Run-Ordners fuer die Timeline lesen."""
    schritte = schritte_lesen(ordner_name)
    if not schritte:
        raise HTTPException(status_code=404, detail=f"Run-Ordner '{ordner_name}' nicht gefunden")
    return schritte
