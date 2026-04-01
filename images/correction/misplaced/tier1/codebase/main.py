# Execution of detection_incomplete_tier1

import pandas as pd
from pathlib import Path
import re

from sherpai_schemas import SolutionInstance, Fix, get_pure_data, parse_dimensions_from_str, parse_dimensions_to_str, Prompts, inference_conversation, smart_cast


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def fix_misplaced(data_row: pd.Series) -> SolutionInstance:
    """Correct misplaced values in data row."""
    proposal: SolutionInstance = data_row["SolutionSpace"]
    misplaced: list[str] = data_row["ProblemSpace"].misplaced

    if not misplaced:
        return proposal

    print(f"\n--- Fixing Misplaced Values of {misplaced} ---")

    for problem in misplaced:
        missing_col, overfilled_col = problem.strip("[]'").split(">", 1)
        overfilled_value = data_row[overfilled_col]

        assistant_response = inference_conversation(
            system_prompt=Prompts.FIX_MISPLACED_SYSTEM,
            user_prompt=Prompts.FIX_MISPLACED_USER.format(
                missing_col=missing_col,
                overfilled_col=overfilled_col,
                overfilled_value=overfilled_value,
            ),
            model="fix_misplaced_gemma"
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
            for key, value in useable_response.items():
                fix: Fix = getattr(proposal, key)
                fix.value = value

    return proposal
    

df = pd.read_json(INPUT, lines=True)
df = parse_dimensions_from_str(df)
df["SolutionSpace"] = df.apply(fix_misplaced, axis=1)
df = df.apply(lambda row: row["SolutionSpace"].apply_proposal(row), axis=1)
df = parse_dimensions_to_str(df)
df.to_json(OUTPUT, lines=True, orient="records")
