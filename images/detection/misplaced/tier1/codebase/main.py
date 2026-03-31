# Execution of detection_incomplete_tier1

import pandas as pd
from pathlib import Path

from sherpai_schemas import ProblemInstance, get_pure_data, parse_dimensions_from_str, parse_dimensions_to_str, Prompts, inference_conversation, smart_cast


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def detect_misplaced(data_row: pd.Series) -> ProblemInstance:
    """Identify misplaced values in data row."""
    print("\n--- Identifying misplaced Values ---")
    ident_problems: ProblemInstance = data_row["ProblemSpace"]
    pure_data = get_pure_data(data_row)
    assistant_response = inference_conversation(
        system_prompt=Prompts.DETECT_MISPLACED_SYSTEM,
        user_prompt=pure_data.to_json(),
        model="detect_misplaced_gemma"
        )
    print("IDENTIFY MISPLACED ASSISTANT: ", assistant_response)
    ident_problems.misplaced = smart_cast(assistant_response, return_on_fail=[])
    return ident_problems

df = pd.read_json(INPUT, lines=True)
df = parse_dimensions_from_str(df)
df["ProblemSpace"] = df.apply(detect_misplaced, axis=1)
df = parse_dimensions_to_str(df)
df.to_json(OUTPUT, lines=True, orient="records")
