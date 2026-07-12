# Execution of detection_incomplete_tier1

import pandas as pd
from pathlib import Path
import re

from sherpai_schemas import SherpAIInstance, ToolID, ToolUse, Pair, get_pure_data, parse_dimensions_from_str, parse_dimensions_to_str, Prompts, inference_conversation, smart_cast


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

MODEL = "unsloth/gemma-3-27b-it-bnb-4bit"

def detect_misspelled(data_row: pd.Series) -> SherpAIInstance:
    """Identify misplaced values in data row."""
    proposal: SherpAIInstance = data_row["SherpAISpace"]
    pure_data = get_pure_data(data_row)
    assistant_response = inference_conversation(
        system_prompt=Prompts.DETECT_MISSPELLED_SYSTEM,
        user_prompt=pure_data.to_json(),
        model=MODEL
        )
    matches = re.search(r"\{.*\}", assistant_response)
    if not matches:
        return proposal

    casted_response = smart_cast(matches.group(0), return_on_fail={})
    print("IDENTIFY MISSPELLED ASSISTANT: ", casted_response)
    if casted_response:
        for col, fix in casted_response.items():
            problem_toolUse = ToolUse(value=[data_row[col]], tool_id=ToolID.DETECTION_MISSPELLED_TIER1)
            solution_toolUse = ToolUse(value=[fix], tool_id=ToolID.DETECTION_MISSPELLED_TIER1)
            pair = Pair(row_id=data_row.name, affected_col=[col],problem=problem_toolUse,solution=solution_toolUse)
        proposal.misspelled.append(pair)
        return proposal

    return proposal

if __name__ == "__main__":
    df = pd.read_json(INPUT, lines=True)
    df = parse_dimensions_from_str(df)
    df["SherpAISpace"] = df.apply(detect_misspelled, axis=1)
    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")
