# Execution of detection_incomplete_tier1

import pandas as pd
from pathlib import Path

from sherpai_schemas import SherpAIInstance, get_pure_data, parse_dimensions_from_str, parse_dimensions_to_str, Prompts, inference_conversation, smart_cast


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
    proposal.misplaced = smart_cast(assistant_response, return_on_fail=[])
    return proposal

if __name__ == "__main__":
    df = pd.read_json(INPUT, lines=True)
    df = parse_dimensions_from_str(df)
    df["SherpAISpace"] = df.apply(detect_misplaced, axis=1)
    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")
