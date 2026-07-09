# Execution of detection_missing__tier1

import pandas as pd
from pathlib import Path

from sherpai_schemas import SherpAIInstance, ToolUse, ToolID, Pair, get_pure_data, parse_dimensions_from_str, parse_dimensions_to_str


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def detect_missing(data_row: pd.Series) -> SherpAIInstance:
    """See if a value is missing or represents a missing value"""
    proposal: SherpAIInstance = data_row["SherpAISpace"]
    missing_cols = []
    for key, value in get_pure_data(data_row).items():
        if not value or pd.isna(value):
            problem_toolUse = ToolUse(value=[value],used_tool=ToolID.DETECTION_MISSING_TIER1)
            pair = Pair(affected_col=[key],problem=problem_toolUse)
            missing_cols.append(pair)
            
    proposal.missing_value.extend(missing_cols)
    return proposal

if __name__ == "__main__":
    df = pd.read_json(INPUT, lines=True)
    df = parse_dimensions_from_str(df)
    df["SherpAISpace"] = df.apply(detect_missing, axis=1)
    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")
