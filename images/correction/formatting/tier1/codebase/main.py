# Execution of detection_formatting_tier1

import pandas as pd
from pathlib import Path
import re

from sherpai_schemas import SherpAIInstance, parse_dimensions_from_str, parse_dimensions_to_str, sherpai_completion, FormattingRules, Prompts, ToolUse, ToolID, Phase


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def fix_formatting(data_row: pd.Series) -> SherpAIInstance:
    """Fix detected formatting if possible, else mark part as missing."""
    proposal: SherpAIInstance = data_row["SherpAISpace"]
    data_row = proposal.apply_solutions(data_row)
    bad_format_cols = proposal.formatting

    if not bad_format_cols:
        return proposal

    print("\n--- Fixing Formatting Values ---")
    for pair in bad_format_cols:
        problem_dict = iter(pair.problem.value.items())
        formatting_col, _ = next(problem_dict)
        print("formatting_col: ", formatting_col)
        col_rule = FormattingRules.get_pattern(formatting_col)
        print("col_rule: ", col_rule)

        pair.solution = ToolUse(
            value={formatting_col: Prompts.FIX_FORMATTING_USER.format(col_name=formatting_col, col_value=data_row[formatting_col], col_rule=col_rule)},
            tool_id=ToolID.CORRECTION_FORMATTING_TIER1,
            phase= Phase.BATCHING_READY
        )
    return proposal


if __name__ == "__main__":
    df = pd.read_json(INPUT, lines=True)
    df = parse_dimensions_from_str(df)
    df["SherpAISpace"] = df.apply(fix_formatting, axis=1)
    df["SherpAISpace"] = sherpai_completion(
            df["SherpAISpace"], "formatting", "solution", Prompts.FIX_FORMATTING_SYSTEM, max_tokens=240
        )
    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")
