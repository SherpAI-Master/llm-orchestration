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

from sherpai_schemas import SolutionInstance, parse_dimensions_from_str, parse_dimensions_to_str, Prompts, inference_conversation, smart_cast, batch_inference_klassifik, batch_inference_address_extraction


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

def _remember_klassifik(row: pd.Series) -> SolutionInstance:
    """Predict if data is company, person or unknown via LLM."""
    proposal = SolutionInstance()
    name = row.get("name1")

    if not name:
        return proposal

    df.at[row.name, "BATCH_LATER_klassifik"] = name

    """ assistant_response = inference_conversation(
        system_prompt=Prompts.EXTRACT_KLASSIFIK_SYSTEM,
        user_prompt=name,
        model="unsloth/gemma-3-27b-it-bnb-4bit"
        ) """
    """ print("IMPUTE KLASSIFIK ASSISTANT: ", assistant_response)

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
    """
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

def _remember_company_address(row: pd.Series) -> SolutionInstance:
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
    company_name = row.get("name1")
    location = row.get("ort")

    if not company_name:
        return proposal_missing

    # 1. Scrape google snippets
    print(f"\n--- Searching for {company_name} in Scraper ---")
    query = f"{company_name} {location} adresse"
    payload = {"q": query}
    headers = {'X-API-KEY': os.getenv("SERPER_API"), 'Content-Type': 'application/json'}
    response = requests.request("POST", "https://google.serper.dev/search", headers=headers, json=payload, timeout=10).json()
    #print("RESPONSE ", response)
    snippets = [item.get("snippet") for item in response.get("organic", [])]
    #print("Snippets: ", snippets)

    # Parse snippets with LLM
    df.at[row.name, "BATCH_LATER_address"] = snippets
    return proposal_missing

def fix_validation_missing( row: pd.Series) -> SolutionInstance:
    """Retrive every possible missing or validation error value .

    :param row: Dict row of data
    :type row: dict
    """
    # Check if missing values / or validation errors even exist
    current_proposal: SolutionInstance = row["SolutionSpace"]
    missing_cols: list[str] = row["ProblemSpace"].missing_value
    validation_cols: list[str] = row["ProblemSpace"].validation
    needed_cols = missing_cols + validation_cols

    print("Previously identified missing/validation error cols: ", needed_cols)
    if not needed_cols:
        return current_proposal

    # Map each missing column to a function to get the value
    tool_map = {
        "hybrid": _combine_hybrid,
        "typ": _extract_typ,
        "nr": _extract_nr,
        "klassifik": _remember_klassifik,
        "name1": None,  # So essential. will be hard without. Maybe look for address and see if found
        "zeile1": _remember_company_address,
        "plz": _remember_company_address,
        "ort": _remember_company_address,
        "land": _remember_company_address,
        "ustid": None,  # possible to verify --> https://ec.europa.eu/taxation_customs/vies/services/checkVatService.wsdl
        "steuernr": None,  # Private / not really possible
        "iln": None,
    }

    # Execute needed tools
    needed_tools = list({tool_map[col] for col in needed_cols if tool_map.get(col)})
    for method in needed_tools:
        for method in needed_tools:
            if method == _combine_hybrid:
                current_proposal.combine(_combine_hybrid(row.get("typ"), row.get("nr")))
            elif method == _extract_typ:
                current_proposal.combine(_extract_typ(row.get("hybrid")))
            elif method == _extract_nr:
                current_proposal.combine(_extract_nr(row.get("hybrid")))
            elif method == _remember_klassifik:
                current_proposal.combine(_remember_klassifik(row))
            elif method == _remember_company_address:
                current_proposal.combine(_remember_company_address(row))
    return current_proposal


if __name__ == "__main__":
    df = pd.read_json(INPUT, lines=True)
    df = parse_dimensions_from_str(df)
    df["BATCH_LATER_klassifik"] = None # Col for saving LLM calls
    df["BATCH_LATER_address"] = None # Col for saving LLM calls
    df["SolutionSpace"] = df.apply(fix_validation_missing, axis=1)
    print("--- Inspection: HERE FIRST ---")
    print(df[["SolutionSpace", "BATCH_LATER_klassifik"]].head(10))

    # Batch inference klassifik imputation
    klassifik_mask = df["BATCH_LATER_klassifik"].notna()
    klassifik_input = df[klassifik_mask]["BATCH_LATER_klassifik"]
    all_proposals = batch_inference_klassifik(klassifik_input)
    df.loc[klassifik_mask, "BATCH_LATER_klassifik"] = all_proposals
    df[klassifik_mask].apply(
        lambda row: row["SolutionSpace"].combine(row["BATCH_LATER_klassifik"]),
        axis=1
    )

    # Batch inference address extraction
    address_mask = df["BATCH_LATER_address"].notna()
    address_input =df[address_mask]["BATCH_LATER_address"]
    all_proposals2 = batch_inference_address_extraction(address_input)
    df.loc[address_mask, "BATCH_LATER_address"] = all_proposals2
    df[address_mask].apply(
        lambda row: row["SolutionSpace"].combine(row["BATCH_LATER_address"]),
        axis=1
    )

    # Apply all changes
    df.drop(columns=["BATCH_LATER_klassifik", "BATCH_LATER_address"], inplace=True)
    df = df.apply(lambda row: row["SolutionSpace"].apply_proposal(row), axis=1)
    df["MetaDataSpace"].apply(lambda instance: instance.now(tool_name=fix_validation_missing.__name__, trainable=False, model_name="unsloth/gemma-3-27b-it-bnb-4bit"))
    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")
