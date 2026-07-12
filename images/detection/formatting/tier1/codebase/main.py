# Execution of detection_formatting_tier1

import pandas as pd
from pathlib import Path

from sherpai_schemas import SherpAIInstance, Pair, ToolUse, ToolID, get_pure_data, parse_dimensions_from_str, parse_dimensions_to_str, FormattingRules


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def detect_formatting(data_row: pd.Series) -> SherpAIInstance:
    """See if dots, so abbreviations, are in the data."""
    proposal: SherpAIInstance = data_row["SherpAISpace"]
    incorrect_cols = []

    pure_data = get_pure_data(data_row)
    
    for col, value in pure_data.items():
        if not FormattingRules.is_valid(col, value):
            toolUse = ToolUse(value={col: value}, tool_id=ToolID.DETECTION_FORMATTING_TIER1)
            pair = Pair(row_id=data_row.name, problem=toolUse)
            incorrect_cols.append(pair)

    proposal.formatting.extend(incorrect_cols)
    return proposal

if __name__ == "__main__":
    df = pd.read_json(INPUT, lines=True)
    df = parse_dimensions_from_str(df)
    df["SherpAISpace"] = df.apply(detect_formatting, axis=1)
    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")
