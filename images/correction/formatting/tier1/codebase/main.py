# Execution of detection_formatting_tier1

import pandas as pd
from pathlib import Path
import re

from sherpai_schemas import SolutionInstance, Fix, parse_dimensions_from_str, parse_dimensions_to_str, FormattingRules, inference_conversation, Prompts, smart_cast


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def fix_formatting(data_row: pd.Series) -> SolutionInstance:
    """Fix detected formatting if possible, else mark part as missing."""
    proposal: SolutionInstance = data_row["SolutionSpace"]
    bad_format_cols = data_row["ProblemSpace"].formatting

    if not bad_format_cols:
        return proposal

    print("\n--- Fixing Formatting Values ---")

    for col in bad_format_cols:
        col_rule = FormattingRules.get_pattern(col)
        col_value = data_row[col]

        assistant_response = inference_conversation(
            system_prompt=Prompts.FIX_FORMATTING_SYSTEM,
            user_prompt=Prompts.FIX_FORMATTING_USER.format(
                col_rule=col_rule,
                col_value=col_value,
            ),
            model="unsloth/gemma-3-27b-it-bnb-4bit"
            )

        useable_response = None
        if assistant_response:
            match = re.search(r"\{.*\}", assistant_response, re.DOTALL)
            if not match:
                print("No JSON object found in LLM output!")
                return {}
            useable_response = smart_cast(match.group(0), return_on_fail={})

        print(f"FORMAT INPUT: {col_rule} with value {col_value}")
        print("FORMAT ASSISTANT: ", useable_response)
        if useable_response and useable_response["fixable"]:
            fix: Fix = getattr(proposal, col)
            fix.value = useable_response["data"]

    return proposal

df = pd.read_json(INPUT, lines=True)
df = parse_dimensions_from_str(df)
df["SolutionSpace"] = df.apply(fix_formatting, axis=1)
df = df.apply(lambda row: row["SolutionSpace"].apply_proposal(row), axis=1)
df = parse_dimensions_to_str(df)
df.to_json(OUTPUT, lines=True, orient="records")
