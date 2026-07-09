# Execution of detection_incomplete_tier1

import pandas as pd
from pathlib import Path
import re

from sherpai_schemas import SherpAIInstance, get_pure_data, parse_dimensions_from_str, parse_dimensions_to_str, Prompts, inference_conversation, smart_cast


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
        proposal.misspelled = []
        return proposal

    casted_response = smart_cast(matches.group(0), return_on_fail={})
    print("IDENTIFY MISSPELLED ASSISTANT: ", casted_response)
    if casted_response:
        proposal.misspelled = [f"({col}|{fix})" for col, fix in casted_response.items()]
        return proposal
    proposal.misspelled = []
    return proposal

if __name__ == "__main__":
    df = pd.read_json(INPUT, lines=True)
    df = parse_dimensions_from_str(df)
    df["ProblemSpace"] = df.apply(detect_misspelled, axis=1)
    df["MetaDataSpace"].apply(lambda instance: instance.now(tool_name=detect_misspelled.__name__, trainable=False, model_name=MODEL))
    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")
