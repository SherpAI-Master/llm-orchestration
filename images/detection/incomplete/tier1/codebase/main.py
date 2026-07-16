# Execution of detection_incomplete_tier1

import pandas as pd
from pathlib import Path
import re

from sherpai_schemas import SherpAIInstance, Pair, ToolUse,ToolID, get_pure_data, parse_dimensions_from_str, parse_dimensions_to_str


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def detect_incomplete(data_row: pd.Series) -> SherpAIInstance:
    """See if dots, so abbreviations, are in the data."""
    proposal: SherpAIInstance = data_row["SherpAISpace"]
    data_row = proposal.apply_solutions(data_row)
    incomplete_cols: list[Pair]= []
    for col_name, value in get_pure_data(data_row).items():
        if pd.notna(value) and isinstance(value, str) and has_abbreviation(value):
            problem: ToolUse = ToolUse(value={col_name: value},tool_id=ToolID.CORRECTION_INCOMPLETE_TIER1)
            problem_pair: Pair = Pair(row_id=data_row.name, problem=problem)         
            incomplete_cols.append(problem_pair) 
    proposal.incomplete = incomplete_cols
    return proposal

def has_abbreviation(value: str) -> bool:
    """Heuristic: value contains a dot or two consecutive capitals (acronym)."""
    return "." in value or re.search(r"[A-Z]{2}", value) is not None

if __name__ == "__main__":
    df = pd.read_json(INPUT, lines=True)
    df = parse_dimensions_from_str(df)
    df["SherpAISpace"] = df.apply(detect_incomplete, axis=1)
    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")

