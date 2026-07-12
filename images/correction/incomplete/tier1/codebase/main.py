# Execution of detection_incomplete_tier1

import pandas as pd
from pathlib import Path

from sherpai_schemas import SherpAIInstance, ToolUse, Pair, Prompts, Phase, parse_dimensions_from_str, parse_dimensions_to_str, sherpai_completion

INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def remember_incomplete(data_row: pd.Series) -> SherpAIInstance:
    """Write out any abbreviation found in data."""
    proposal: SherpAIInstance = data_row["SherpAISpace"]
    incomplete: list[Pair] = proposal.incomplete

    if not incomplete:
        return proposal

    print(f"\n--- Fixing Incomplete Values of {incomplete} ---")
    for incomplete_pair in incomplete:
        incomplete_pair.solution = ToolUse(value=[Prompts.FIX_INCOMPLETE_USER.format(col_value=str(incomplete_pair.problem.value[0]), col_name=incomplete_pair.affected_col[0])], phase=Phase.BATCHING_READY)
    return proposal

if __name__ == "__main__":
    df = pd.read_json(INPUT, lines=True)
    df = parse_dimensions_from_str(df)
    df["SherpAISpace"] = df.apply(remember_incomplete, axis=1)
    df["SherpAISpace"] = sherpai_completion(df["SherpAISpace"], "incomplete", "solution", Prompts.FIX_INCOMPLETE_SYSTEM)
    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")
