# Execution of detection_formatting_tier1

import pandas as pd
from pathlib import Path
import re

from sherpai_schemas import SolutionInstance, Fix, parse_dimensions_from_str, parse_dimensions_to_str, FormattingRules, Prompts, batch_inference_fix_formatting


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def remember_formatting(data_row: pd.Series) -> SolutionInstance:
    """Fix detected formatting if possible, else mark part as missing."""
    proposal: SolutionInstance = data_row["SolutionSpace"]
    bad_format_cols = data_row["ProblemSpace"].formatting

    if not bad_format_cols:
        return proposal

    print("\n--- Fixing Formatting Values ---")

    row_batches = []
    for col in bad_format_cols:
        col_rule = FormattingRules.get_pattern(col)
        col_value = data_row[col]
        row_batches.append((data_row.name, col, Prompts.FIX_FORMATTING_USER.format(col_rule=col_rule, col_value=col_value)))

    df.at[data_row.name, "BATCH_LATER_formatting"] = row_batches
    return proposal


if __name__ == "__main__":
    df = pd.read_json(INPUT, lines=True)
    df = parse_dimensions_from_str(df)
    df["BATCH_LATER_formatting"] = None
    df["SolutionSpace"] = df.apply(remember_formatting, axis=1)
    print("HIERHIERHIER", df["BATCH_LATER_formatting"].head(), "\n")
    formatting_mask = df["BATCH_LATER_formatting"].notna()
    formatting_input = df[formatting_mask]["BATCH_LATER_formatting"]
    all_proposals = batch_inference_fix_formatting(formatting_input)
    print("AHAHAHAAH", all_proposals, "\n")

    df.loc[formatting_mask, "BATCH_LATER_formatting"] = all_proposals
    df[formatting_mask].apply(
        lambda row: row["SolutionSpace"].combine(row["BATCH_LATER_formatting"]),
        axis=1
    )
    df = df.drop(columns=["BATCH_LATER_formatting"])
    df = df.apply(lambda row: row["SolutionSpace"].apply_proposal(row), axis=1)
    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")
