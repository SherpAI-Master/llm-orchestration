"""CSV-Eingabe in JSONL umwandeln und durch den llm-orchestration Scheduler leiten."""

import csv
import io
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import httpx

from .parser import run_ordner_parsen

SCHEDULER_URL     = os.getenv("SCHEDULER_URL",     "http://orchestration-platform:8090/process")
JOB_RUN_FOLDER    = Path(os.getenv("JOB_RUN_FOLDER",    "/hostData/process_runs"))
INSTRUCTIONS_PATH = Path(os.getenv("INSTRUCTIONS_PATH",  "/app/process-plan.json"))

GEBAUER_FELDER = ["hybrid", "typ", "nr", "klassifik", "name1", "zeile1", "plz", "ort", "land", "ustid", "steuernr", "iln"]


def csv_zu_jsonl(csv_text: str) -> bytes:
    """CSV-Text zeilenweise in Gebauer-JSONL umwandeln."""
    reader = csv.DictReader(io.StringIO(csv_text))
    zeilen: list[str] = []
    for idx, zeile in enumerate(reader):
        datensatz: dict = {"hybrid": zeile.get("hybrid") or f"ROW_{idx + 1}"}
        for feld in GEBAUER_FELDER[1:]:
            rohwert = zeile.get(feld)
            datensatz[feld] = rohwert if rohwert else None
        zeilen.append(json.dumps(datensatz, ensure_ascii=False))
    return "\n".join(zeilen).encode("utf-8")


def neuesten_run_finden(fruehestens: datetime) -> Path:
    """Neuesten process_runs-Ordner nach gegebenem Zeitpunkt suchen."""
    kandidaten = [
        p for p in JOB_RUN_FOLDER.iterdir()
        if p.is_dir() and p.name.startswith("run_")
    ]
    if not kandidaten:
        raise FileNotFoundError("Kein run_*-Ordner in process_runs gefunden")
    kandidaten.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return kandidaten[0]


async def csv_analysieren(csv_bytes: bytes) -> dict:
    """CSV an Romans Scheduler schicken und Ergebnisse aus process_runs lesen."""
    jsonl_bytes = csv_zu_jsonl(csv_bytes.decode("utf-8", errors="replace"))
    instructions = INSTRUCTIONS_PATH.read_bytes()
    startzeit = datetime.now(timezone.utc)

    async with httpx.AsyncClient(timeout=600.0) as client:
        antwort = await client.post(
            SCHEDULER_URL,
            files={
                "data":         ("data.jsonl",        jsonl_bytes,  "application/octet-stream"),
                "instructions": ("instructions.json", instructions, "application/json"),
                "env":          (".job_env",           b"",          "text/plain"),
            },
        )
        antwort.raise_for_status()

    run_ordner = neuesten_run_finden(startzeit)
    return run_ordner_parsen(run_ordner)
