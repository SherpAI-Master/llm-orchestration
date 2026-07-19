"""Umwandlung von llm-orchestration JSONL-Ausgaben in AnalysisResult."""

import json
import re
from pathlib import Path

PROBLEM_ID_TYP = {1: "INCOMPLETE", 2: "MISPLACED", 3: "FORMAT", 4: "FORMAT", 5: "MISSING"}

GEBAUER_FELDER = ["hybrid", "typ", "nr", "klassifik", "name1", "zeile1", "plz", "ort", "land", "ustid", "steuernr", "iln"]


def problem_space_parsen(text: str) -> dict[int, list[str]]:
    """ProblemSpace-String in Dict (ProblemID → Felder) umwandeln."""
    ergebnis: dict[int, list[str]] = {}
    for match in re.finditer(r"(\d)\[(.+?)\]", text):
        pid = int(match.group(1))
        felder = [f.strip().strip("'\"") for f in match.group(2).split(",")]
        ergebnis[pid] = felder
    return ergebnis


def solution_space_parsen(text: str) -> dict[str, str]:
    """SolutionSpace-String in Feld-Wert-Zuordnung umwandeln."""
    ergebnis: dict[str, str] = {}
    for match in re.finditer(r"([a-zA-Z0-9_]+)\['([^']*)',\s*'([^']*)'\]", text):
        feld, wert = match.group(1), match.group(2)
        if wert and wert.lower() not in ("none", "null", ""):
            ergebnis[feld] = wert
    return ergebnis


def letzte_korrektur_lesen(run_ordner: Path) -> list[dict]:
    """Schritt 14 (letzte Korrektur vor Ditto) einlesen, Fallback auf Schritt 8."""
    for muster in ["14_*.jsonl", "8_*.jsonl", "0_*.jsonl"]:
        kandidaten = sorted(run_ordner.glob(muster))
        if kandidaten:
            zeilen = [l for l in kandidaten[0].read_text(encoding="utf-8").splitlines() if l.strip()]
            return [json.loads(z) for z in zeilen]
    return []


def ditto_paare_lesen(run_ordner: Path) -> list[dict]:
    """Schritt 16 (Ditto-Matching) fuer Dublettenpaare einlesen."""
    ditto = sorted(run_ordner.glob("16_*.jsonl"))
    if not ditto:
        return []
    return [json.loads(z) for z in ditto[0].read_text(encoding="utf-8").splitlines() if z.strip()]


def zeile_zu_record(zeile: dict, idx: int) -> dict:
    """Rohe JSONL-Zeile in GebauerRecord umwandeln (id = hybrid-Wert)."""
    hybrid = str(zeile.get("hybrid") or f"ROW_{idx + 1}")
    return {
        "id": hybrid,
        "hybrid": hybrid,
        "typ": str(zeile.get("typ") or ""),
        "nr": str(zeile.get("nr") or ""),
        "klassifik": str(zeile.get("klassifik") or ""),
        "name1": str(zeile.get("name1") or ""),
        "zeile1": str(zeile.get("zeile1") or ""),
        "plz": str(zeile.get("plz") or ""),
        "ort": str(zeile.get("ort") or ""),
        "land": str(zeile.get("land") or ""),
        "ustid": str(zeile.get("ustid") or ""),
        "steuernr": str(zeile.get("steuernr") or ""),
        "iln": str(zeile.get("iln") or ""),
    }


def review_items_erstellen(missing: list, format_: list, incomplete: list, clusters: list) -> list:
    """ReviewItems aus Issues und Duplikaten fuer das Frontend aufbauen."""
    items = []

    kategorie_map = {"INCOMPLETE": "INCOMPLETE", "FORMAT": "FORMAT", "MISPLACED": "MISSING"}

    for issue in missing + format_ + incomplete:
        sugg = issue.get("suggestion", {})
        hat_wert = sugg.get("status") == "AVAILABLE" and bool(sugg.get("text"))
        kategorie = kategorie_map.get(issue["type"], "MISSING")
        items.append({
            "itemId": issue["itemId"],
            "category": kategorie,
            "kind": "ISSUE",
            "code": issue["code"],
            "decision": "PENDING",
            "canApply": hat_wert,
            "recordId": issue["recordId"],
            "field": issue["field"],
            "currentValue": issue.get("currentValue"),
            "suggestion": {
                "kind": "VALUE" if hat_wert else "NONE",
                "text": sugg.get("text") if hat_wert else None,
                "confidence": sugg.get("confidence", 0.9) if hat_wert else 0.0,
                "source": "DATA",
            },
        })

    for cluster in clusters:
        items.append({
            "itemId": cluster["itemId"],
            "category": "DUPLICATE",
            "kind": "DUPLICATE_CLUSTER",
            "code": "DUP_CLUSTER",
            "decision": "PENDING",
            "canApply": False,
            "clusterId": cluster["clusterId"],
            "suggestion": {
                "kind": "HINT",
                "text": f"Ähnlichkeit: {int(cluster['similarityAvg'] * 100)}%",
                "confidence": cluster["similarityAvg"],
                "source": "DATA",
            },
        })

    return items


def run_ordner_parsen(run_ordner: Path) -> dict:
    """Vollständige Umwandlung eines process_runs-Ordners in AnalysisResult + ReviewItems."""
    datensaetze = letzte_korrektur_lesen(run_ordner)
    ditto_paare = ditto_paare_lesen(run_ordner)

    records: list[dict] = []
    missing_issues: list[dict] = []
    format_issues: list[dict] = []
    incomplete_issues: list[dict] = []
    enrichments: list[dict] = []

    for idx, zeile in enumerate(datensaetze):
        record = zeile_zu_record(zeile, idx)
        records.append(record)
        record_id = record["id"]

        probleme = problem_space_parsen(str(zeile.get("ProblemSpace", "")))
        korrekturen = solution_space_parsen(str(zeile.get("SolutionSpace", "")))

        for pid, felder in probleme.items():
            typ = PROBLEM_ID_TYP.get(pid, "MISSING")
            for feld_raw in felder:
                feld = feld_raw.split(">")[0].strip()
                if feld not in GEBAUER_FELDER:
                    continue
                item_id = f"{typ}:{record_id}:{feld}:{pid}"
                korrektur = korrekturen.get(feld)

                issue: dict = {
                    "recordId": record_id,
                    "type": typ,
                    "field": feld,
                    "code": f"SHERP_{pid}_{feld.upper()}",
                    "itemId": item_id,
                    "currentValue": str(zeile.get(feld) or ""),
                }

                if korrektur:
                    issue["suggestion"] = {
                        "status": "AVAILABLE",
                        "field": feld,
                        "confidence": 0.9,
                        "text": korrektur,
                    }
                    enrichments.append({
                        "itemId": item_id,
                        "recordId": record_id,
                        "field": feld,
                        "suggestedValue": korrektur,
                        "code": f"LLM_{feld.upper()}",
                        "source": "LLM",
                    })

                if typ == "INCOMPLETE":
                    incomplete_issues.append(issue)
                elif typ == "FORMAT":
                    format_issues.append(issue)
                else:
                    missing_issues.append(issue)

    duplicate_clusters: list[dict] = []
    for i, paar in enumerate(ditto_paare, start=1):
        if paar.get("match") == 1:
            links_id = str(paar["left"].get("hybrid", ""))
            rechts_id = str(paar["right"].get("hybrid", ""))
            cluster_id = f"clu_{i}"
            duplicate_clusters.append({
                "clusterId": cluster_id,
                "referenceId": links_id,
                "memberIds": [rechts_id],
                "similarityAvg": round(float(paar.get("match_confidence", 0.99)), 4),
                "itemId": f"dup:{cluster_id}",
            })

    review_items = review_items_erstellen(missing_issues, format_issues, incomplete_issues, duplicate_clusters)

    return {
        "result": {
            "records": records,
            "missingIssues": missing_issues,
            "formatIssues": format_issues,
            "incompleteIssues": incomplete_issues,
            "duplicateClusters": duplicate_clusters,
            "enrichments": enrichments,
        },
        "reviewItems": review_items,
        "runFolder": run_ordner.name,
    }
