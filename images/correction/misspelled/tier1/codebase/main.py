# Execution of correction_missing__tier1

import pandas as pd
from pathlib import Path

from sherpai_schemas import SolutionInstance, Fix, parse_dimensions_from_str, parse_dimensions_to_str


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def fix_misspelled(data_row: pd.Series) -> SolutionInstance:
    """Implement detected misspellings changes."""
    proposal: SolutionInstance = data_row["SolutionSpace"]
    misspelled_cols = data_row["ProblemSpace"].misspelled
    if not misspelled_cols:
        return proposal

    for problem in misspelled_cols:
        col, replacement = problem.strip("()").split("|", 1)
        fix: Fix = getattr(proposal, col)
        fix.value = replacement

    return proposal

df = pd.read_json(INPUT, lines=True)
df = parse_dimensions_from_str(df)
df["SolutionSpace"] = df.apply(fix_misspelled, axis=1)
df = df.apply(lambda row: row["SolutionSpace"].apply_proposal(row), axis=1)
df = parse_dimensions_to_str(df)
df.to_json(OUTPUT, lines=True, orient="records")
