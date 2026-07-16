# Execution of correction_validation_missing_tier1

import os
import re

import pandas as pd
import requests

from sherpai_schemas import (
    Finding,
    FieldChange,
    PipelineRunner,
    PipelineStage,
    PipelineTool,
    ProblemType,
    Prompts,
    Proposal,
    SherpAIInstance,
    ToolIdentity,
    inference_conversation,
    smart_cast,
)

MODEL = "unsloth/gemma-3-27b-it-bnb-4bit"


def _propose(identity: ToolIdentity, column: str, value, reason: str = "") -> Proposal:
    proposal = Proposal(identity=identity, reason=reason, changes=[FieldChange(column=column, value=value)])
    proposal.mark_review_ready()
    return proposal


def _combine_hybrid(identity: ToolIdentity, typ: str, nr: str) -> Proposal | None:
    """Combine typ and nr to their hybrid form."""
    if not (typ and nr):
        return None
    return _propose(identity, "hybrid", f"PERS_{typ}_{nr}", reason="Combination of typ and nr!")


def _extract_typ(identity: ToolIdentity, hybrid: str) -> Proposal | None:
    """Extract 'typ' from the combined data column 'hybrid' (PERS_#_###)."""
    if not hybrid:
        return None
    return _propose(identity, "typ", hybrid.split("_")[1], reason="Extracted from 'hybrid'!")


def _extract_nr(identity: ToolIdentity, hybrid: str) -> Proposal | None:
    """Extract 'nr' from the combined data column 'hybrid' (PERS_#_###)."""
    if not hybrid:
        return None
    return _propose(identity, "nr", hybrid.split("_")[-1], reason="Extracted from 'hybrid'!")


def _remember_klassifik(identity: ToolIdentity, name: str) -> Proposal | None:
    """Predict if data is company, person or unknown via LLM."""
    if not name:
        return None

    assistant_response = inference_conversation(
        system_prompt=Prompts.EXTRACT_KLASSIFIK_SYSTEM,
        user_prompt=name,
        model=MODEL,
    )
    match = re.search(r"\{.*\}", assistant_response, re.DOTALL) if assistant_response else None
    obj_for_failed = {"prediction": 90, "reason": "Failed process!"}
    imputed = smart_cast(match.group(0), return_on_fail=obj_for_failed) if match else obj_for_failed

    return _propose(identity, "klassifik", imputed["prediction"], reason=imputed["reason"])


def _extract_address(user_input: str) -> dict:
    """Take a Google-snippet string and return an extracted address dict."""
    assistant_response = inference_conversation(
        system_prompt=Prompts.EXTRACT_ADDRESS_SYSTEM,
        user_prompt=user_input,
        model=MODEL,
    )
    if not assistant_response:
        return {}
    match = re.search(r"\{.*\}", assistant_response, re.DOTALL)
    if not match:
        return {}
    return smart_cast(match.group(0), return_on_fail={})


def _score_address(addr_list: list[dict]) -> dict | None:
    """Evaluate completeness of extracted address candidates; keep the best one."""
    best_addr, best_score = None, float("-inf")
    for addr in addr_list:
        if not addr:
            continue
        score = 0
        if re.match(r"^([A-Za-zÄÖÜäöüß])(?=.*\d).+", addr.get("street", "")):
            score += 3
        if addr.get("city") or len(addr.get("zip", "")) == 5:
            score += 2
        if addr.get("country"):
            score += 1
        if score > best_score:
            best_addr, best_score = addr, score
    return best_addr


def _remember_company_address(identity: ToolIdentity, company_name: str, location: str) -> list[Proposal]:
    """Scrape company address, city, zip code and country from the web.

    1. Get search-result snippets from Google for the company.
    2. Extract an address candidate from each snippet via LLM.
    3. Keep the most complete candidate.
    """
    if not company_name:
        return []

    print(f"\n--- Searching for {company_name} in Scraper ---")
    query = f"{company_name} {location} adresse"
    payload = {"q": query}
    headers = {"X-API-KEY": os.getenv("SERPER_API"), "Content-Type": "application/json"}
    response = requests.request(
        "POST", "https://google.serper.dev/search", headers=headers, json=payload, timeout=10
    ).json()
    snippets = [item.get("snippet") for item in response.get("organic", [])]

    best = _score_address([_extract_address(snippet) for snippet in snippets])
    if not best:
        return []

    return [
        _propose(identity, "zeile1", str(best.get("street", "")).replace(",", "_")),
        _propose(identity, "ort", str(best.get("city", "")).replace(",", "_")),
        _propose(identity, "plz", str(best.get("zip", "")).replace(",", "_")),
        _propose(identity, "land", str(best.get("country", "")).replace(",", "_")),
    ]


class ValidationMissingCorrectionTool(PipelineTool):
    """Fills in missing/invalid identifiers, klassifik, and address fields."""

    identity = ToolIdentity(stage=PipelineStage.CORRECTION, tool="validation_missing", tier=1)

    def process_row(self, row: pd.Series, instance: SherpAIInstance) -> SherpAIInstance:
        # PipelineRunner has already applied any previously-accepted corrections
        # onto `row` before calling this method.
        findings: list[Finding] = [
            f
            for f in instance.by_type(ProblemType.MISSING_VALUE) + instance.by_type(ProblemType.VALIDATION)
            if f.correction is None
        ]

        if not findings:
            return instance

        print("Previously identified missing/validation error findings: ", findings)

        findings_by_column: dict[str, list[Finding]] = {}
        for finding in findings:
            findings_by_column.setdefault(finding.detection.single().column, []).append(finding)

        def _apply(column: str, correction: Proposal | None) -> None:
            if correction is None:
                return
            for finding in findings_by_column.get(column, []):
                # Each Finding gets its own copy so accepting/rejecting one doesn't
                # affect the others sharing the same computed correction.
                finding.correction = correction.model_copy(deep=True)

        if "hybrid" in findings_by_column:
            _apply("hybrid", _combine_hybrid(self.identity, row.get("typ"), row.get("nr")))
        if "typ" in findings_by_column:
            _apply("typ", _extract_typ(self.identity, row.get("hybrid")))
        if "nr" in findings_by_column:
            _apply("nr", _extract_nr(self.identity, row.get("hybrid")))
        if "klassifik" in findings_by_column:
            _apply("klassifik", _remember_klassifik(self.identity, row.get("name1")))
        # name1: too essential to guess; ustid/steuernr/iln: not currently handled here.

        address_cols = {"zeile1", "plz", "ort", "land"}
        if address_cols & findings_by_column.keys():
            for proposal in _remember_company_address(self.identity, row.get("name1"), row.get("ort")):
                _apply(proposal.changes[0].column, proposal)

        return instance


if __name__ == "__main__":
    PipelineRunner(ValidationMissingCorrectionTool()).run()
