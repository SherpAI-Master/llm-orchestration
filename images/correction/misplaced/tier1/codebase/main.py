# Execution of detection_incomplete_tier1

import pandas as pd
from pathlib import Path
import re
from pydantic import BaseModel

from sherpai_schemas import (
    SherpAIInstance,
    ToolID,
    ToolUse,
    Pair,
    Prompts,
    Phase,
    get_pure_data,
    sherpai_completion,
    parse_dimensions_from_str,
    parse_dimensions_to_str,
    inference_conversation,
    smart_cast,
)


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

# FT_MODEL = "fix_misplaced_gemma"


def fix_misplaced(data_row: pd.Series) -> SherpAIInstance:
    """Correct misplaced values in data row."""
    proposal: SherpAIInstance = data_row["SherpAISpace"]
    data_row = proposal.apply_solutions(data_row)
    misplaced: list[Pair] = proposal.misplaced

    if not misplaced:
        return proposal

    print(f"\n--- Fixing Misplaced Values of {misplaced} ---")

    for pair in misplaced:
        problem_dict = iter(pair.problem.value.items())
        missing_col, _ = next(problem_dict)
        overfilled_col, _ = next(problem_dict)

        pair.solution = ToolUse(
            value={
                missing_col: Prompts.FIX_MISPLACED_USER.format(
                    missing_col=missing_col,
                    overfilled_col=overfilled_col,
                    overfilled_value=data_row[overfilled_col],
                )
            },
            tool_id=ToolID.CORRECTION_MISPLACED_TIER1,
            phase=Phase.BATCHING_READY
        )
        print("HERE PAIR SOLUTION IN CORRECTION MISPLACED", pair.solution)

    return proposal


df = pd.read_json(INPUT, lines=True)
df = parse_dimensions_from_str(df)
# df = df.apply(lambda row: row["SherpAIInstance"].apply_solution()) Todo: Apply solutions within this logic section
df["SherpAISpace"] = df.apply(fix_misplaced, axis=1)
df["SherpAISpace"] = sherpai_completion(
        df["SherpAISpace"], "misplaced", "solution", Prompts.FIX_MISPLACED_SYSTEM, max_tokens=240
    )
df = parse_dimensions_to_str(df)
df.to_json(OUTPUT, lines=True, orient="records")
