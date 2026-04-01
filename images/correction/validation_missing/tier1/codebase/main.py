# Execution of fix_validation_missing_tier1

import pandas as pd
from pathlib import Path
import re
import json

import os
import requests
import urllib.parse
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

from sherpai_schemas import SolutionInstance, parse_dimensions_from_str, parse_dimensions_to_str, Prompts, inference_conversation, smart_cast


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

USER_AGENT = "MasterThesis_DataQualityBot (rklinghammer@uni-potsdam.de)"


def _combine_hybrid( typ: str, nr: str) -> SolutionInstance:
    """Combine typ and nr to their hybrid form."""
    proposal = SolutionInstance()

    if not (typ and nr):
        return proposal

    proposal.hybrid.value = f"PERS_{typ}_{nr}"
    proposal.hybrid.reason = "Combination of typ and nr!"

    return proposal

def _extract_typ( hybrid: str) -> SolutionInstance:
    """Extract 'typ' from the combined data column 'hybrid'(PERS_#_###)."""
    proposal = SolutionInstance()

    if not hybrid:
        return proposal

    proposal.typ.value = hybrid.split("_")[1]
    proposal.typ.reason = "Extracted from 'hybrid'!"

    return proposal

def _extract_nr( hybrid: str) -> SolutionInstance:
    """Extract 'nr' from the combined data column 'hybrid'(PERS_#_###)."""
    proposal = SolutionInstance()

    if not hybrid:
        return proposal

    proposal.nr.value = hybrid.split("_")[-1]
    proposal.nr.reason = "Extracted from 'hybrid'!"

    return proposal

def _impute_klassifik( name: str) -> SolutionInstance:
    """Predict if data is company, person or unknown via LLM."""
    proposal = SolutionInstance()

    if not name:
        return proposal

    assistant_response = inference_conversation(
        system_prompt=Prompts.EXTRACT_KLASSIFIK_SYSTEM,
        user_prompt=name,
        model="unsloth/gemma-3-27b-it-bnb-4bit"
        )
    print("IMPUTE KLASSIFIK ASSISTANT: ", assistant_response)

    obj_for_failed = {"prediction": 90, "reason": "Failed process!"}
    imputed_klassifik = obj_for_failed

    if assistant_response:
        match = re.search(r"\{.*\}", assistant_response, re.DOTALL)
        if match:
            imputed_klassifik = smart_cast(match.group(0), return_on_fail=obj_for_failed)
        else:
            print("No JSON object found in output")

    proposal.klassifik.value = imputed_klassifik["prediction"]
    proposal.klassifik.reason = imputed_klassifik["reason"]

    return proposal


def _filter_with_robots_txt( link_list: list[str]) -> list[str]:
    """Check robots txt if list of links are allowed to scrape.

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

def _score_res_address( addr_list: list[dict]) -> int:
    """Evaluate completeness of extracted address by model."""
    best_addr = None, float("-inf")
    for addr in addr_list:
        score = 0
        if not addr:
            continue
        if re.match(r"^([A-Za-zÄÖÜäöüß])(?=.*\d).+", addr["street"]):
            score += 3
        if addr["city"] or len(addr["zip"]) == 5:
            score += 2
        if addr["country"]:
            score += 1
        if score > best_addr[1]:
            best_addr = addr, score
    return best_addr[0]

def _extract_address(user_input: str) -> dict:
    """Take string and return json format for addresses.

    :param user_input: Google Snippets from scraper
    :type user_input: str
    :return: Dict with found values for address
    :rtype: dict
    """
    assistant_response = inference_conversation(
        system_prompt=Prompts.EXTRACT_ADDRESS_SYSTEM,
        user_prompt=user_input,
        model="unsloth/gemma-3-27b-it-bnb-4bit"
        )
    print("EXTRACT ADDRESS ASSISTANT: ", assistant_response)

    if assistant_response:
        match = re.search(r"\{.*\}", assistant_response, re.DOTALL)
        if not match:
            print("No JSON object found in output")
            return {}
        return smart_cast(match.group(0), return_on_fail={})
    return {}

def _find_company_address( company_name: str, location: str) -> SolutionInstance:
    """Scrape company address, city, zip code and country form the web.

    Function for scraping an up-to-data address of a company with the following plan:
    1. Getting 10 search results from google and looking for most addresses in snippets
    2. If no good find, check robots.txt of top 5 sites and try to scrape if possible.
    3. if no find or not allowed, return ""

    :param json_str: Data row
    :type json_str: str
    :return: String with new found address
    :rtype: str
    """
    proposal_missing = SolutionInstance()
    if not company_name:
        return proposal_missing

    google_token = os.getenv("GOOGLE_TOKEN")
    seach_engine_id = os.getenv("SEACH_ENGINE_ID")

    # 1. Scrape google snippets
    print(f"\n--- Searching for {company_name} in Scraper ---")
    query = f"{company_name} {location} adresse"
    encoded_query = urllib.parse.quote_plus(query)
    url = f"https://www.googleapis.com/customsearch/v1?key={google_token}&cx={seach_engine_id}&q={encoded_query}&gl=de&hl=de&google_domain=google.de"
    print("Current search url: ", url)
    response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=10).json()
    error = response.get("error", {})
    if error:
        msg = f"Google Search failed: {error.get('message', 'Unknown error.')}"
        raise PermissionError(msg)
    print("RESPONSE ", response)
    snippets = [item.get("snippet") for item in response.get("items", [])]
    print("Snippets: ", snippets)

    # Parse snippets with LLM
    response_collection = [_extract_address(snip) for snip in snippets]
    best_res = _score_res_address(response_collection)
    if best_res:
        try:
            proposal_missing.zeile1.value = best_res["street"].replace(",", "_")
            proposal_missing.ort.value = best_res["city"].replace(",", "_")
            proposal_missing.land.value = best_res["country"].replace(",", "_")
            proposal_missing.plz.value = best_res["zip"].replace(",", "_")
        except json.JSONDecodeError:
            proposal_missing.zeile1.value = "LLM Error!"
            proposal_missing.ort.value = "LLM Error!"
            proposal_missing.land.value = "LLM Error!"
            proposal_missing.plz.value = "LLM Error!"
    # else: LOOK INTO Crawl4AI
    # Scrape links directly for more information about the addresses
    links = [item["link"] for item in response.get("items", [])]
    print("ALL Links found: ", links)
    allowed_links = _filter_with_robots_txt(links)
    print("All allowed links: ", allowed_links)
    print("Final proposal --> ", proposal_missing, "\n\n")
    return proposal_missing

def fix_validation_missing( row_dict: dict) -> SolutionInstance:
    """Retrive every possible missing or validation error value .

    :param row_dict: Dict row of data
    :type row_dict: dict
    """
    # Check if missing values / or validation errors even exist
    current_proposal: SolutionInstance = row_dict["SolutionInstance"]
    missing_cols: list[str] = row_dict["ProblemSpace"].missing_value
    validation_cols: list[str] = row_dict["ProblemSpace"].validation
    needed_cols = missing_cols + validation_cols

    if not missing_cols and not validation_cols:
        return current_proposal

    # Map each missing column to a function to get the value
    tool_map = {
        "hybrid": _combine_hybrid,
        "typ": _extract_typ,
        "nr": _extract_nr,
        "klassifik": _impute_klassifik,
        "name1": None,  # So essential. will be hard without. Maybe look for address and see if found
        "zeile1": _find_company_address,
        "plz": _find_company_address,
        "ort": _find_company_address,
        "land": _find_company_address,
        "ustid": None,  # possible to verify --> https://ec.europa.eu/taxation_customs/vies/services/checkVatService.wsdl
        "steuernr": None,  # Private / not really possible
        "iln": None,
    }

    # Execute needed tools
    combined_proposal = SolutionInstance()
    needed_tools = list({tool_map[col] for col in needed_cols if tool_map.get(col)})
    for method in needed_tools:
        for method in needed_tools:
            if method == _combine_hybrid:
                combined_proposal.combine(_combine_hybrid(row_dict.get("typ"), row_dict.get("nr")))
            elif method == _extract_typ:
                combined_proposal.combine(_extract_typ(row_dict.get("hybrid")))
            elif method == _extract_nr:
                combined_proposal.combine(_extract_nr(row_dict.get("hybrid")))
            elif method == _impute_klassifik:
                combined_proposal.combine(_impute_klassifik(row_dict.get("name1")))
            elif method == _find_company_address:
                combined_proposal.combine(_find_company_address(row_dict.get("name1"), row_dict.get("ort")))
    return combined_proposal

df = pd.read_json(INPUT, lines=True)
df = parse_dimensions_from_str(df)
df["SolutionSpace"] = df.apply(fix_validation_missing, axis=1)
df = df.apply(lambda row: row["SolutionSpace"].apply_proposal(row), axis=1)
df = parse_dimensions_to_str(df)
df.to_json(OUTPUT, lines=True, orient="records")
