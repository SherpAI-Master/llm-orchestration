# Execution of detection_incomplete_tier1

import pandas as pd
from pathlib import Path
import re

from sherpai_schemas import SolutionInstance, Fix, parse_dimensions_from_str, parse_dimensions_to_str, inference_conversation, smart_cast, Prompts


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def fix_incomplete(data_row: pd.Series) -> SolutionInstance:
    """Write out any abbreviation found in data.

    :param data_row:  Current row of an df
    :type data_row: pd.Series
    :return: A proposal withe fixes in the current row
    :rtype: SolutionInstance
    """
    proposal = SolutionInstance()
    incomplete: list[str] = data_row["ProblemSpace"].incomplete

    if not incomplete:
        return proposal

    print(f"\n--- Fixing Incomplete Values of {incomplete} ---")

    for incomplete_col in incomplete:
        assistant_response = inference_conversation(
            system_prompt=Prompts.FIX_INCOMPLETE_SYSTEM,
            user_prompt=str(data_row[incomplete_col]),
            model="unsloth/gemma-3-27b-it-bnb-4bit")
        matches = re.search(r'"([^"]*)"', assistant_response)
        if not matches:
            print(f"No STRING found in LLM output! ({incomplete_col})")
            continue
        useable_response = smart_cast(f'"{matches.group(0)}"', return_on_fail=None)
        if useable_response:
            print(f"Fixing incomplete with: {useable_response}")
            fix: Fix = getattr(proposal, incomplete_col)
            fix.value = useable_response

    return proposal

df = pd.read_json(INPUT, lines=True)
df = parse_dimensions_from_str(df)
df["SolutionSpace"] = df.apply(fix_incomplete, axis=1)
df = parse_dimensions_to_str(df)
df.to_json(OUTPUT, lines=True, orient="records")
