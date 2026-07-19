"""Pipeline-Schritte eines process_runs-Ordners fuer das RunDetails-Frontend lesen."""

import json
import os
from pathlib import Path

JOB_RUN_FOLDER = Path(os.getenv("JOB_RUN_FOLDER", "/hostData/process_runs"))

TOOL_NAMEN: dict[str, str] = {
    "detection_incomplete_tier1": "Vollständigkeitsprüfung",
    "detection_misplaced_tier1": "Fehlplatzierungserkennung",
    "detection_formatting_tier1": "Formatierungsprüfung",
    "detection_misspelled_tier1": "Rechtschreibprüfung",
    "detection_missing_tier1": "Fehlwertprüfung",
    "detection_validation_tier1": "Validierungsprüfung",
    "correction_incomplete_tier1": "Vollständigkeitskorrektur",
    "correction_misplaced_tier1": "Fehlplatzierungskorrektur",
    "correction_lora_tier2": "KI-Korrektur (LoRA)",
    "detection_formatting_tier2": "Formatierungsprüfung (Tier 2)",
    "detection_missing_tier1_2": "Fehlwertprüfung (2)",
    "detection_validation_tier1_2": "Validierungsprüfung (2)",
    "correction_formatting_tier1": "Formatierungskorrektur",
    "correction_misspelled_tier1": "Rechtschreibkorrektur",
    "correction_validation_missing_tier1": "Validierungskorrektur",
    "integration_duplication_pairs_tier1": "Dublettenpaare erstellen",
    "integration_ditto_tier1": "Dublettenerkennung (Ditto KI)",
}


def timestamp_aus_meta(zeile_text: str) -> str | None:
    """Letzten MetaDataSpace-Timestamp aus einer JSONL-Zeile extrahieren."""
    try:
        daten = json.loads(zeile_text)
        meta = daten.get("MetaDataSpace")
        if isinstance(meta, list) and meta:
            return meta[-1].get("time_stamp")
    except Exception:
        pass
    return None


def schritte_lesen(ordner_name: str) -> list[dict]:
    """Alle Verarbeitungsschritte eines Runs aus dem Dateisystem lesen."""
    run_ordner = JOB_RUN_FOLDER / ordner_name
    if not run_ordner.exists():
        return []

    schritte: list[dict] = []
    for jsonl_datei in sorted(run_ordner.glob("*.jsonl")):
        teile = jsonl_datei.stem.split("_", 1)
        if len(teile) < 2 or not teile[0].isdigit():
            continue

        schritt_nr = int(teile[0])
        tool_key = teile[1]
        zeilen = [l for l in jsonl_datei.read_text(encoding="utf-8").splitlines() if l.strip()]

        timestamp = timestamp_aus_meta(zeilen[0]) if zeilen else None

        schritte.append({
            "schritt": schritt_nr,
            "toolKey": tool_key,
            "name": TOOL_NAMEN.get(tool_key, tool_key.replace("_", " ").title()),
            "datensaetze": len(zeilen),
            "timestamp": timestamp,
            "datei": jsonl_datei.name,
        })

    return schritte
