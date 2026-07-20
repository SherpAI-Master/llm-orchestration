# Execution of fix_validation_missing_tier1

import json
import os
import re
from pathlib import Path
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import pandas as pd
import requests

from sherpai_schemas import (
    Pair,
    Phase,
    Prompts,
    SherpAIInstance,
    ToolID,
    ToolUse,
    parse_dimensions_from_str,
    parse_dimensions_to_str,
    sherpai_completion,
)

INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

USER_AGENT = "MasterThesis_DataQualityBot (rklinghammer@uni-potsdam.de)"

# Columns handled directly (no LLM needed) vs. columns that need to be
# resolved by an LLM. `klassifik` is resolved in its own batching pass;
# the address columns are resolved in a separate batching pass, so that a
# single `sherpai_completion` call never mixes two different prompts.
_ADDRESS_COLS = {"zeile1", "plz", "ort", "land"}
_ADDRESS_KEY_MAP = {"street": "zeile1", "city": "ort", "zip": "plz", "country": "land"}


# --------------------------------------------------------------------------- #
# Deterministic (non-LLM) corrections
# --------------------------------------------------------------------------- #
def _combine_hybrid(data_row: pd.Series) -> tuple[dict, str]:
    """Combine typ and nr into the hybrid form."""
    typ, nr = data_row.get("typ"), data_row.get("nr")
    if not (typ and nr):
        return {}, ""
    return {"hybrid": f"PERS_{typ}_{nr}"}, "Combination of typ and nr!"


def _extract_typ(data_row: pd.Series) -> tuple[dict, str]:
    """Extract 'typ' from the combined data column 'hybrid' (PERS_#_###)."""
    hybrid = data_row.get("hybrid")
    if not hybrid:
        return {}, ""
    return {"typ": hybrid.split("_")[1]}, "Extracted from 'hybrid'!"


def _extract_nr(data_row: pd.Series) -> tuple[dict, str]:
    """Extract 'nr' from the combined data column 'hybrid' (PERS_#_###)."""
    hybrid = data_row.get("hybrid")
    if not hybrid:
        return {}, ""
    return {"nr": hybrid.split("_")[-1]}, "Extracted from 'hybrid'!"


_DIRECT_TOOL_MAP = {
    "hybrid": _combine_hybrid,
    "typ": _extract_typ,
    "nr": _extract_nr,
}


# --------------------------------------------------------------------------- #
# Web scraping helpers for company-address recovery
# --------------------------------------------------------------------------- #
def _filter_with_robots_txt(link_list: list[str]) -> list[str]:
    """Check robots.txt to see if a list of links may be scraped.

    :param link_list: List of possible links
    :type link_list: list[str]
    :return: List of allowed links to scrape
    :rtype: list[str]
    """
    allowed_links = []
    for link in link_list:
        parsed_link = urlparse(link)
        robots_url = f"{parsed_link.scheme}://{parsed_link.netloc}/robots.txt"

        robot_parser = RobotFileParser()
        robot_parser.set_url(robots_url)
        try:
            robot_parser.read()
            if robot_parser.can_fetch(USER_AGENT, link):
                allowed_links.append(link)
        except Exception:
            print(f"Error: No robots.txt found or not allowed for link: {link}")

    return allowed_links


def _score_res_address(addr_list: list[dict]) -> dict | None:
    """Evaluate completeness of extracted address candidates."""
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


def _scrape_company_address_snippets(data_row: pd.Series) -> list[str]:
    """Scrape google snippets that might contain a company's address.

    This is step 1 of the two-step address recovery: gather raw text.
    The actual JSON address extraction happens afterwards, as an LLM
    batching pass (Prompts.EXTRACT_ADDRESS_SYSTEM via sherpai_completion).

    :param data_row: Data row
    :type data_row: pd.Series
    :return: List of google search snippets possibly containing an address
    :rtype: list[str]
    """
    company_name = data_row.get("name1")
    location = data_row.get("ort")
    if not company_name:
        return []

    print(f"\n--- Searching for {company_name} in Scraper ---")
    query = f"{company_name} {location} adresse"
    payload = {"q": query}
    headers = {
        "X-API-KEY": os.getenv("SERPER_API"),
        "Content-Type": "application/json",
    }
    try:
        response = requests.request(
            "POST",
            "https://google.serper.dev/search",
            headers=headers,
            json=payload,
            timeout=10,
        ).json()
    except Exception as exc:
        print(f"Error while scraping address for {company_name}: {exc}")
        return []

    return [item.get("snippet") for item in response.get("organic", []) if item.get("snippet")]


def fix_validation_missing(data_row: pd.Series) -> SherpAIInstance:
    """First pass: resolve deterministic missing/validation problems directly
    (hybrid/typ/nr) and stage 'klassifik' predictions for LLM batching.

    Address-related problems (zeile1/plz/ort/land) are deliberately left
    untouched here and are staged separately in `stage_company_address`,
    after the klassifik batch has completed. This keeps the two different
    LLM prompts from ever being mixed inside a single `sherpai_completion`
    call.
    """
    proposal: SherpAIInstance = data_row["SherpAISpace"]
    data_row = proposal.apply_solutions(data_row)

    pair_queue: list[Pair] = proposal.missing_value + proposal.validation
    print("Previously identified missing/validation error cols: ", pair_queue)
    if not pair_queue:
        return proposal

    for pair in pair_queue:
        if pair.solution is not None or pair.problem is None:
            continue

        affected_cols = list(pair.problem.value)

        # 1) Direct, deterministic corrections (no LLM needed)
        direct_value: dict = {}
        direct_reasons: list[str] = []
        for col in affected_cols:
            handler = _DIRECT_TOOL_MAP.get(col)
            if handler is None:
                continue
            value, reason = handler(data_row)
            if value:
                direct_value.update(value)
                direct_reasons.append(reason)

        if direct_value:
            pair.solution = ToolUse(
                value=direct_value,
                reason=" ".join(direct_reasons),
                tool_id=ToolID.CORRECTION_VALIDATION_MISSING_TIER1,
                phase=Phase.REVIEW_READY,
            )
            continue

        # 2) klassifik needs an LLM call -> stage it for batching
        if "klassifik" in affected_cols:
            name = data_row.get("name1")
            if name:
                pair.solution = ToolUse(
                    value={"klassifik": name},
                    reason="Queued for company/person classification.",
                    tool_id=ToolID.CORRECTION_VALIDATION_MISSING_TIER1,
                    phase=Phase.BATCHING_READY,
                )
            continue

        # name1 / ustid / steuernr / iln: no automated fix available, leave unresolved

    return proposal


def stage_company_address(data_row: pd.Series) -> SherpAIInstance:
    """Second pass: scrape web snippets for still-unresolved address problems
    (zeile1/plz/ort/land) and stage them for LLM-based address extraction.

    Runs after the klassifik batch, so only address pairs carry
    Phase.BATCHING_READY when Prompts.EXTRACT_ADDRESS_SYSTEM is applied.
    """
    proposal: SherpAIInstance = data_row["SherpAISpace"]
    pair_queue: list[Pair] = proposal.missing_value + proposal.validation

    for pair in pair_queue:
        if pair.solution is not None or pair.problem is None:
            continue

        affected_cols = list(pair.problem.value)
        if not any(col in _ADDRESS_COLS for col in affected_cols):
            continue

        snippets = _scrape_company_address_snippets(data_row)
        if snippets:
            pair.solution = ToolUse(
                value={"address": json.dumps(snippets, ensure_ascii=False)},
                reason="Queued for address extraction from web snippets.",
                tool_id=ToolID.CORRECTION_VALIDATION_MISSING_TIER1,
                phase=Phase.BATCHING_READY,
            )

    return proposal


def _remap_address_solution(instance: SherpAIInstance) -> SherpAIInstance:
    """Translate the generic street/city/zip/country keys produced by
    Prompts.EXTRACT_ADDRESS_SYSTEM into the actual dataframe column names
    so `apply_solutions` can write them back onto the row.
    """
    for pair in instance.missing_value + instance.validation:
        if pair.solution is None or pair.solution.phase == Phase.BATCHING_READY:
            continue
        if any(key in pair.solution.value for key in _ADDRESS_KEY_MAP):
            pair.solution.value = {
                _ADDRESS_KEY_MAP.get(k, k): v for k, v in pair.solution.value.items()
            }
    return instance


if __name__ == "__main__":
    df = pd.read_json(INPUT, lines=True)
    df = parse_dimensions_from_str(df)

    # Pass 1: direct corrections (hybrid/typ/nr) + stage klassifik predictions
    df["SherpAISpace"] = df.apply(fix_validation_missing, axis=1)
    df["SherpAISpace"] = sherpai_completion(
        df["SherpAISpace"], "missing_value", "solution", Prompts.EXTRACT_KLASSIFIK_SYSTEM, max_tokens=120
    )
    df["SherpAISpace"] = sherpai_completion(
        df["SherpAISpace"], "validation", "solution", Prompts.EXTRACT_KLASSIFIK_SYSTEM, max_tokens=120
    )

    # Pass 2: scrape + stage company address, then extract structured address via LLM
    df["SherpAISpace"] = df.apply(stage_company_address, axis=1)
    df["SherpAISpace"] = sherpai_completion(
        df["SherpAISpace"], "missing_value", "solution", Prompts.EXTRACT_ADDRESS_SYSTEM, max_tokens=200
    )
    df["SherpAISpace"] = sherpai_completion(
        df["SherpAISpace"], "validation", "solution", Prompts.EXTRACT_ADDRESS_SYSTEM, max_tokens=200
    )
    df["SherpAISpace"] = df["SherpAISpace"].apply(_remap_address_solution)

    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")