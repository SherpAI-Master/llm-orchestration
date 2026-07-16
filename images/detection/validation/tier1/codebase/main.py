# Execution of detection_validation_tier1

import time

import pandas as pd
import requests
import zeep
from zeep.exceptions import Fault

from sherpai_schemas import (
    Finding,
    FieldChange,
    PipelineRunner,
    PipelineStage,
    PipelineTool,
    ProblemType,
    Proposal,
    SherpAIInstance,
    ToolIdentity,
    get_pure_data,
)

USER_AGENT = "MasterThesis_DataQualityBot (rklinghammer@uni-potsdam.de)"


def _finding(identity: ToolIdentity, column: str, value) -> Finding:
    detection = Proposal(identity=identity, changes=[FieldChange(column=column, value=value)])
    detection.mark_review_ready()
    return Finding(problem_type=ProblemType.VALIDATION, detection=detection)


def _validate_basics(basic_row: pd.Series, identity: ToolIdentity) -> list[Finding]:
    """Validate basic/simple descriptive stats of entity."""

    faulty_cols = []

    # Hybrid
    if f"PERS_{basic_row['typ']}_{basic_row['nr']}" != basic_row["hybrid"]:
        faulty_cols.append(_finding(identity, "hybrid", basic_row["hybrid"]))
    # typ and str
    hybrid_typ, hybrid_nr = basic_row["hybrid"].split("_")[1:]
    if hybrid_typ != basic_row["typ"]:
        faulty_cols.append(_finding(identity, "typ", basic_row["typ"]))
    if hybrid_nr != basic_row["nr"]:
        faulty_cols.append(_finding(identity, "nr", basic_row["nr"]))
    # klassifik not possible to validate (own metric/ individual data)

    return faulty_cols


def _validate_address(address_row: pd.Series, identity: ToolIdentity) -> list[Finding]:
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
        return [
            _finding(identity, "zeile1", street),
            _finding(identity, "plz", zip_code),
            _finding(identity, "ort", city),
            _finding(identity, "land", country),
        ]


def _validate_identifiers(id_row: pd.Series, identity: ToolIdentity) -> list[Finding]:
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
        return [_finding(identity, "ustid", ustid)]
    except Exception as e:
        msg = f"System Error: {e}"
        raise SystemError(msg) from e
    else:
        return []


class ValidationDetectionTool(PipelineTool):
    """Cross-checks basic identifiers, address, and legal IDs against outside sources."""

    identity = ToolIdentity(stage=PipelineStage.DETECTION, tool="validation", tier=1)

    def process_row(self, row: pd.Series, instance: SherpAIInstance) -> SherpAIInstance:
        # PipelineRunner has already applied any previously-accepted corrections
        # onto `row` before calling this method.
        pure_data = get_pure_data(row)
        format_problem_cols = set(
            instance.get_affected_cols(ProblemType.FORMATTING, ProblemType.MISSING_VALUE)
        )

        basic_cols = ["hybrid", "typ", "nr", "klassifik"]
        address_cols = ["zeile1", "ort", "plz", "land"]
        id_cols = ["ustid", "steuernr", "iln"]
        findings: list[Finding] = []

        if format_problem_cols.isdisjoint(basic_cols):
            findings += _validate_basics(pure_data[basic_cols], self.identity)

        if format_problem_cols.isdisjoint(address_cols):
            findings += _validate_address(pure_data[address_cols], self.identity)

        if format_problem_cols.isdisjoint(id_cols):
            findings += _validate_identifiers(pure_data[id_cols], self.identity)

        for finding in findings:
            instance.add_finding(finding)

        print("--- Detect Validation---", findings)
        return instance


if __name__ == "__main__":
    PipelineRunner(ValidationDetectionTool()).run()
