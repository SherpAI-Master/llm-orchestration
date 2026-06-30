# Execution of detection_formatting_tier1

import pandas as pd
from pathlib import Path

from sherpai_schemas import ProblemInstance, get_pure_data, parse_dimensions_from_str, parse_dimensions_to_str, FormattingRules


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def detect_formatting(data_row: pd.Series) -> ProblemInstance:
    """See if dots, so abbreviations, are in the data."""
    ident_problems: ProblemInstance = data_row["ProblemSpace"]
    incorrect_cols = []

    pure_data = get_pure_data(data_row)
    
    for col, value in pure_data.items():
        if not FormattingRules.is_valid(col, value):
            incorrect_cols.append(col)

    ident_problems.formatting = incorrect_cols
    return ident_problems

df = pd.read_json(INPUT, lines=True)
df = parse_dimensions_from_str(df)
df["ProblemSpace"] = df.apply(detect_formatting, axis=1)
df["MetaDataSpace"].apply(lambda instance: instance.now(tool_name=detect_formatting.__name__, trainable=False))
df = parse_dimensions_to_str(df)
df.to_json(OUTPUT, lines=True, orient="records")
