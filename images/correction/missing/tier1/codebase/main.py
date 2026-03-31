# Execution of detection_missing__tier1

import pandas as pd
from pathlib import Path

from sherpai_schemas import ProblemInstance, get_pure_data, parse_dimensions_from_str, parse_dimensions_to_str


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def detect_missing(data_row: pd.Series) -> ProblemInstance:
    """See if dots, so abbreviations, are in the data."""
    ident_problems: ProblemInstance = data_row["ProblemSpace"]
    missing_cols = []
    for key, value in get_pure_data(data_row).items():
        if not value:
            missing_cols.append(key)
    ident_problems.missing_value = missing_cols

    return ident_problems

df = pd.read_json(INPUT, lines=True)
df = parse_dimensions_from_str(df)
df["ProblemSpace"] = df.apply(detect_missing, axis=1)
df = parse_dimensions_to_str(df)
df.to_json(OUTPUT, lines=True, orient="records")
