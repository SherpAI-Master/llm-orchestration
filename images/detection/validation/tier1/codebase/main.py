# Execution of detection_incomplete_tier1

import pandas as pd
from pathlib import Path
import re

import time
import requests
import zeep
from zeep.exceptions import Fault

from sherpai_schemas import SherpAIInstance, get_pure_data, parse_dimensions_from_str, parse_dimensions_to_str, Prompts, inference_conversation, smart_cast


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

USER_AGENT = "MasterThesis_DataQualityBot (rklinghammer@uni-potsdam.de)"


def _validate_basics(
        hybrid: str,
        typ: str,
        nr: str,
        klassifik: str,
    ) -> list[str]:
        """Validate basic/simple descriptive stats of entity.

        :param hybrid: Combination entry of typ and nr
        :type hybrid: str
        :param typ: Type of entity (customer, supplier, prospect)
        :type typ: str
        :param nr: ID
        :type nr: str
        :param klassifik: Type of customer (firm, person, divers)
        :type klassifik: str
        :return: List of basic stats which validation is faulty
        :rtype: list[str]
        """
        faulty_cols = []

        # Hybrid
        if f"PERS_{typ}_{nr}" != hybrid:
            faulty_cols.append("hybrid")
        # typ and str
        print("HIER DER HYBRID: ", hybrid, type(hybrid))
        hybrid_typ, hybrid_nr = hybrid.split("_")[1:]
        if hybrid_typ != typ:
            faulty_cols.append("typ")
        if hybrid_nr != nr:
            faulty_cols.append("nr")
        # klassifik not possible to validate (own metric/ individual data)

        return faulty_cols

def _validate_address(street: str, city: str, zip_code: str, country: str) -> list[str]:
    """Check existence of address on OSM.

    :param street: Street name with house number
    :type street: str
    :param city: City name
    :type city: str
    :param zip: Zip code/ PLZ
    :type zip: str
    :param country: Country name
    :type country: str
    :return: list with every unvalidatable column
    :rtype: list[str]
    """
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
        return ["zeile1", "plz", "ort"]

def _validate_identifiers(ustid: str, steuernr: str, iln: str) -> list[str]:
    """Validate legal identifieres of entity.

    :param ustid: Umsatzsteuer-Identifikationsnummer (USt-IdNr.)
    :type ustid: str
    :param steuernr: TaxID
    :type steuernr: str
    :param iln: Global Location Number (ILN/GLN)
    :type iln: str
    :return: A list of unvalidated identifiers (empty if all valid).
    :rtype: list[str]
    """
    # SteurNr is Private
    # ILN ...
    # Validation of Ust.-ID
    wsdl_url = "https://ec.europa.eu/taxation_customs/vies/services/checkVatService.wsdl"

    client = zeep.Client(wsdl=wsdl_url)
    country_code = ustid[:2].upper()
    vat_number = ustid[2:]
    print(f"Checking: {country_code} - {vat_number}...")

    try:
        response = client.service.checkVat(
            countryCode=country_code,
            vatNumber=vat_number,
        )
        print("USTID Verification: ", response)

    except Fault as e:
        print(f"API Error: {e.message}")
        return ["ustid"]
    except Exception as e:
        msg = f"System Error: {e}"
        raise SystemError(msg) from e
    else:
        return []

def detect_validation(data_row: pd.Series) -> SherpAIInstance:
    """Identify misplaced values in data row."""
    proposal: SherpAIInstance = data_row["SherpAISpace"]
    pure_data = get_pure_data(data_row)
    format_problem_cols = set(
        proposal.formatting + proposal.missing_value,
    )

    basic_cols = ["hybrid", "typ", "nr", "klassifik"]
    address_cols = ["zeile1", "ort", "plz", "land"]
    id_cols = ["ustid", "steuernr", "iln"]
    basics, address, identifiers = [], [], []

    if format_problem_cols.isdisjoint(set(basic_cols)):
        basics = _validate_basics(*(pure_data[c] for c in basic_cols))

    if format_problem_cols.isdisjoint(set(address_cols)):
        address = _validate_address(*(pure_data[c] for c in address_cols))

    if format_problem_cols.isdisjoint(set(id_cols)):
        identifiers = _validate_identifiers(*(pure_data[c] for c in id_cols))

    proposal.validation = basics + address + identifiers
    print("--- Detect Validation---", proposal.validation)
    return proposal

if __name__ == "__main__":
    df = pd.read_json(INPUT, lines=True)
    df = parse_dimensions_from_str(df)
    df["SherpAISpace"] = df.apply(detect_validation, axis=1)
    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")
