# Execution of detection_incomplete_tier1

import pandas as pd
from pathlib import Path
import re

import time
import requests
import zeep
from zeep.exceptions import Fault

from sherpai_schemas import (
    SherpAIInstance,
    ToolID,
    ToolUse,
    Pair,
    get_pure_data,
    parse_dimensions_from_str,
    parse_dimensions_to_str,
    Prompts,
    inference_conversation,
    smart_cast,
)


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

USER_AGENT = "MasterThesis_DataQualityBot (rklinghammer@uni-potsdam.de)"


def _validate_basics(basic_row: pd.Series) -> list[Pair]:
    """Validate basic/simple descriptive stats of entity."""

    faulty_cols = []

    # Hybrid
    if f"PERS_{basic_row['typ']}_{basic_row['nr']}" != basic_row["hybrid"]:
        problem_ToolUse = ToolUse(value=[basic_row["hybrid"]], tool_id=ToolID.DETECTION_VALIDATION_TIER1)
        pair = Pair(row_id=data_row.name, affected_col=["hybrid"], problem=problem_ToolUse)
        faulty_cols.append(pair)
    # typ and str
    hybrid_typ, hybrid_nr = basic_row["hybrid"].split("_")[1:]
    if hybrid_typ != basic_row["typ"]:
        problem_ToolUse = ToolUse(value=[basic_row["typ"]], tool_id=ToolID.DETECTION_VALIDATION_TIER1)
        pair = Pair(row_id=data_row.name, affected_col=["typ"], problem=problem_ToolUse)
        faulty_cols.append(pair)
    if hybrid_nr != basic_row["nr"]:
        problem_ToolUse = ToolUse(value=[basic_row["nr"]], tool_id=ToolID.DETECTION_VALIDATION_TIER1)
        pair = Pair(row_id=data_row.name, affected_col=["nr"], problem=problem_ToolUse)
        faulty_cols.append(pair)
    # klassifik not possible to validate (own metric/ individual data)

    return faulty_cols


def _validate_address(address_row: pd.Series) -> list[Pair]:
    """Check existence of address on OSM."""
    street = address_row["zeile1"]
    zip_code = address_row["plz"]
    city = address_row["ort"]
    country = address_row["land"]

    # Check not possible if street or region (zip/City) is missing
    if not street or not (zip_code or city):
        print(f"Skipping validation for non-German company: {country} or not ({zip_code}|{city})")
        return []

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "street": street,
        "city": city,
        "postalcode": zip_code,
        "country": country,
        "format": "json",
        "addressdetails": 1,
        "limit": 1,
    }

    try:
        response = requests.get(url, params=params, headers={"User-Agent": USER_AGENT}, timeout=10)
        time.sleep(1)  # required timemout for OSM API
        response.raise_for_status()
        data = response.json()
        print(data)

        if data:
            return []
        print(f"Validation failed for: {street}, {zip_code} {city}")

    except Exception as e:
        print(f"API Error: {e}")
        return []
    else:
        address_pair = Pair(row_id=data_row.name, 
            affected_col=["zeile1"],
            problem=ToolUse(value=street, tool_id=ToolID.DETECTION_VALIDATION_TIER1)
        )
        zip_pair = Pair(row_id=data_row.name, 
            affected_col=["plz"],
            problem=ToolUse(value=zip_code, tool_id=ToolID.DETECTION_VALIDATION_TIER1)
        )
        city_pair = Pair(row_id=data_row.name, 
            affected_col=["ort"],
            problem=ToolUse(value=city, tool_id=ToolID.DETECTION_VALIDATION_TIER1)
        )
        country_pair = Pair(row_id=data_row.name, 
            affected_col=["land"],
            problem=ToolUse(value=country, tool_id=ToolID.DETECTION_VALIDATION_TIER1)
        )
        return [address_pair,zip_pair,city_pair,country_pair]


def _validate_identifiers(id_row: pd.Series) -> list[Pair]:
    """Validate legal identifieres of entity."""
    # SteurNr is Private
    # ILN ...
    # Validation of Ust.-ID
   
    ustid = id_row["ustid"]
    
    
    wsdl_url = "https://ec.europa.eu/taxation_customs/vies/services/checkVatService.wsdl"

    client = zeep.Client(wsdl=wsdl_url)
    country_code = ustid[:2].upper()
    vat_number = ustid[2:]
    print(f"Checking: {country_code} - {vat_number}...")
    
    try:
        ### Todo: check if error when not existing
        response = client.service.checkVat(
            countryCode=country_code,
            vatNumber=vat_number,
        )
        print("USTID Verification: ", response)

    except Fault as e:
        print(f"API Error: {e.message}")
        ustid_pair = Pair(row_id=data_row.name, 
            affected_col=["ustid"],
            problem=ToolUse(value=ustid,tool_id=ToolID.DETECTION_VALIDATION_TIER1)
            )
        return [ustid_pair]
    except Exception as e:
        msg = f"System Error: {e}"
        raise SystemError(msg) from e
    else:
        return []


def detect_validation(data_row: pd.Series) -> SherpAIInstance:
    """Identify misplaced values in data row."""
    proposal: SherpAIInstance = data_row["SherpAISpace"]
    pure_data = get_pure_data(data_row)
    format_problem_cols = set(proposal.get_affected_cols("formatting", "missing_value"))

    basic_cols = ["hybrid", "typ", "nr", "klassifik"]
    address_cols = ["zeile1", "ort", "plz", "land"]
    id_cols = ["ustid", "steuernr", "iln"]
    basics, address, identifiers = [], [], []

    if format_problem_cols.isdisjoint(set(basic_cols)):
        basics = _validate_basics(pure_data[basic_cols])

    if format_problem_cols.isdisjoint(set(address_cols)):
        address = _validate_address(pure_data[address_cols])

    if format_problem_cols.isdisjoint(set(id_cols)):
        identifiers = _validate_identifiers(pure_data[id_cols])

    proposal.validation.extend(basics + address + identifiers)
    print("--- Detect Validation---", proposal.validation)
    return proposal


if __name__ == "__main__":
    df = pd.read_json(INPUT, lines=True)
    df = parse_dimensions_from_str(df)
    df["SherpAISpace"] = df.apply(detect_validation, axis=1)
    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")
