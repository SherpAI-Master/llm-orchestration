# Execution of detection_incomplete_tier1

import pandas as pd
from pathlib import Path
import re

from sherpai_schemas import SolutionInstance, Fix, parse_dimensions_from_str, parse_dimensions_to_str, batch_inference_fix_incomplete, Prompts


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def remember_incomplete(data_row: pd.Series) -> SolutionInstance:
    """Write out any abbreviation found in data.

    :param data_row:  Current row of an df
    :type data_row: pd.Series
    :return: A proposal withe fixes in the current row
    :rtype: SolutionInstance
    """
    proposal: SolutionInstance = data_row["SolutionSpace"]
    incomplete: list[str] = data_row["ProblemSpace"].incomplete

    if not incomplete:
        return proposal

    print(f"\n--- Fixing Incomplete Values of {incomplete} ---")
    user_prompts = []
    for incomplete_col in incomplete:
        user_prompts.append((data_row.name, incomplete_col, Prompts.FIX_INCOMPLETE_USER.format(col_value=str(data_row[incomplete_col]), col_name=incomplete_col)))
        """ assistant_response = inference_conversation(
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
            fix.value = useable_response """
    df.at[data_row.name, "BATCH_LATER_incomplete"] = user_prompts
    return proposal

if __name__ == "__main__":
    df = pd.read_json(INPUT, lines=True)
    df = parse_dimensions_from_str(df)
    df["BATCH_LATER_incomplete"] = None
    df["SolutionSpace"] = df.apply(remember_incomplete, axis=1)
    incomplete_mask = df["BATCH_LATER_incomplete"].notna()
    incomplete_input = df[incomplete_mask]["BATCH_LATER_incomplete"]
    print("incomplete_input: ", incomplete_input)

    all_proposals = batch_inference_fix_incomplete(incomplete_input)
    print("All proposals: ", all_proposals)
    df.loc[incomplete_mask, "BATCH_LATER_incomplete"] = all_proposals
    df[incomplete_mask].apply(
        lambda row: row["SolutionSpace"].combine(row["BATCH_LATER_incomplete"]),
        axis=1
    )
    df = df.drop(columns=["BATCH_LATER_incomplete"])
    df = df.apply(lambda row: row["SolutionSpace"].apply_proposal(row), axis=1)
    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")
    
    
    """ 
    df["BATCH_LATER_formatting"] = None
    df["SolutionSpace"] = df.apply(remember_formatting, axis=1)
    formatting_mask = df["BATCH_LATER_formatting"].notna()
    formatting_input = df[formatting_mask]["BATCH_LATER_formatting"]
    all_proposals = batch_inference_fix_formatting(formatting_input)
    df.loc[formatting_mask, "BATCH_LATER_formatting"] = all_proposals
    df[formatting_mask].apply(
        lambda row: row["SolutionSpace"].combine(row["BATCH_LATER_formatting"]),
        axis=1
    )
    df = df.drop(columns=["BATCH_LATER_formatting"])
    df = df.apply(lambda row: row["SolutionSpace"].apply_proposal(row), axis=1)
    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")
    """
