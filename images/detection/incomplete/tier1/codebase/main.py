# Execution of detection_incomplete_tier1

import pandas as pd
from pathlib import Path
import re

from sherpai_schemas import ProblemInstance, get_pure_data, parse_dimensions_from_str, parse_dimensions_to_str


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def detect_incomplete(data_row: pd.Series) -> ProblemInstance:
    """See if dots, so abbreviations, are in the data."""
    ident_problems: ProblemInstance = data_row["ProblemSpace"]
    incomplete_cols = []
    for col_name, value in get_pure_data(data_row).items():
        if pd.notna(value) and isinstance(value, str) and ("." in str(value) or re.search(r'[A-Z]{2}', str(value))):
            incomplete_cols.append(col_name)
    ident_problems.incomplete = incomplete_cols
    return ident_problems

df = pd.read_json(INPUT, lines=True)
df = parse_dimensions_from_str(df)
df["ProblemSpace"] = df.apply(detect_incomplete, axis=1)
df = parse_dimensions_to_str(df)
df.to_json(OUTPUT, lines=True, orient="records")
