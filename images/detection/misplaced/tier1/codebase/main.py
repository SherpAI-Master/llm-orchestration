# Execution of detection_incomplete_tier1

import pandas as pd
from pathlib import Path

from sherpai_schemas import SherpAIInstance, ToolUse, Pair, ToolID, get_pure_data, parse_dimensions_from_str, parse_dimensions_to_str, Prompts, inference_conversation, smart_cast


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

FT_MODEL = "detect_misplaced_gemma"

def detect_misplaced(data_row: pd.Series) -> SherpAIInstance:
    """Identify misplaced values in data row."""
    print("\n--- Identifying misplaced Values ---")
    proposal: SherpAIInstance = data_row["SherpAISpace"]
    pure_data = get_pure_data(data_row)
    assistant_response = inference_conversation(
        system_prompt=Prompts.DETECT_MISPLACED_SYSTEM,
        user_prompt=pure_data.to_json(),
        model=FT_MODEL
        )
    print("IDENTIFY MISPLACED ASSISTANT: ", assistant_response)
    ### Todo rework parsing a string / finetuning model
    original_list = smart_cast(assistant_response, return_on_fail=[])
    if not original_list:
        return proposal
    missing_col, overfilled_col = original_list[0].strip("[]'").split(">", 1)
    toolUse = ToolUse(value={missing_col: data_row[missing_col], overfilled_col: data_row[overfilled_col]}, reason=original_list[0], tool_id=ToolID.DETECTION_MISPLACED_TIER1)     # Strucutre 0: missing_col, 1: overfilled_col
    pair = Pair(row_id=data_row.name, problem=toolUse)
    proposal.misplaced.append(pair)
    return proposal

if __name__ == "__main__":
    df = pd.read_json(INPUT, lines=True)
    df = parse_dimensions_from_str(df)
    df["SherpAISpace"] = df.apply(detect_misplaced, axis=1)
    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")
