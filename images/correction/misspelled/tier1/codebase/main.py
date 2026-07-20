# Execution of correction_missing__tier1

import pandas as pd
from pathlib import Path

from sherpai_schemas import SherpAIInstance, Fix, parse_dimensions_from_str, parse_dimensions_to_str


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def fix_misspelled(data_row: pd.Series) -> SherpAIInstance:
    """Implement detected misspellings changes."""
    proposal: SherpAIInstance = data_row["SherpAISpace"]
    return proposal

df = pd.read_json(INPUT, lines=True)
df = parse_dimensions_from_str(df)
df["SherpAISpace"] = df.apply(fix_misspelled, axis=1)
df = parse_dimensions_to_str(df)
df.to_json(OUTPUT, lines=True, orient="records")
