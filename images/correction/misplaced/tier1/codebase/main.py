# Execution of detection_incomplete_tier1

import pandas as pd
from pathlib import Path
import re
from pydantic import BaseModel

from sherpai_schemas import SherpAIInstance, ToolID, ToolUse, Pair, Prompts, get_pure_data, parse_dimensions_from_str, parse_dimensions_to_str, inference_conversation, smart_cast


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

FT_MODEL = "fix_misplaced_gemma"

def fix_misplaced(data_row: pd.Series) -> SherpAIInstance:
    """Correct misplaced values in data row."""
    proposal: SherpAIInstance = data_row["SherpAISpace"]
    data_row = proposal.apply_solutions(data_row)
    misplaced: list[Pair] = proposal.misplaced

    if not misplaced:
        return proposal

    print(f"\n--- Fixing Misplaced Values of {misplaced} ---")

    for pair in misplaced:
        missing_col, overfilled_col = pair.affected_col[0], pair.affected_col[1]
        overfilled_value = pair.problem.value[1]

        assistant_response = inference_conversation(
            system_prompt=Prompts.FIX_MISPLACED_SYSTEM,
            user_prompt=Prompts.FIX_MISPLACED_USER.format(
                missing_col=missing_col,
                overfilled_col=overfilled_col,
                overfilled_value=overfilled_value,
            ),
            model=FT_MODEL
        )
        print("MISPLACED ASSISTANT: ", assistant_response)

        useable_response = None
        if assistant_response:
            match = re.search(r"\{.*\}", assistant_response, re.DOTALL)
            if not match:
                print("No JSON object found in LLM output!")
                return {}
            useable_response = smart_cast(match.group(0), return_on_fail=None)

        if useable_response:
            solution_values = [useable_response[col] for col in pair.affected_col]
            solution_toolUse = ToolUse(value=solution_values, tool_id=ToolID.CORRECTION_MISPLACED_TIER1)
            pair.solution = solution_toolUse

    return proposal


df = pd.read_json(INPUT, lines=True)
df = parse_dimensions_from_str(df)
df["SherpAISpace"] = df.apply(fix_misplaced, axis=1)
df = parse_dimensions_to_str(df)
df.to_json(OUTPUT, lines=True, orient="records")
