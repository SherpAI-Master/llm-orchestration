# Execution of detection_incomplete_tier1

import pandas as pd
from pathlib import Path

from sherpai_schemas import SherpAIInstance, ToolID, ToolUse, Pair, Prompts, Phase, parse_dimensions_from_str, parse_dimensions_to_str, batch_inference_fix_incomplete


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")

def remember_incomplete(data_row: pd.Series) -> SherpAIInstance:
    """Write out any abbreviation found in data."""
    proposal: SherpAIInstance = data_row["SherpAISpace"]
    incomplete: list[Pair] = proposal.incomplete

    if not incomplete:
        return proposal

    print(f"\n--- Fixing Incomplete Values of {incomplete} ---")
    user_prompts = []
    for incomplete_pair in incomplete:
        # ID, Col, Prompt
        incomplete_pair.solution = ToolUse(value=[Prompts.FIX_INCOMPLETE_USER.format(col_value=str(data_row[incomplete_pair]), col_name=incomplete_pair)], phase=Phase.BATCHING_READY)
    df.at[data_row.name, "BATCH_LATER_incomplete"] = user_prompts
    return proposal

if __name__ == "__main__":
    df = pd.read_json(INPUT, lines=True)
    df = parse_dimensions_from_str(df)
    df["SherpAISpace"] = df.apply(remember_incomplete, axis=1)
    incomplete_mask = df["BATCH_LATER_incomplete"].notna()
    incomplete_input = df[incomplete_mask]["BATCH_LATER_incomplete"]
    print("incomplete_input: ", incomplete_input)
    # Todo: Get list of pairs where Phase== batching.ready
    # Then: prepare all data compleytley here and then send to common SherpAI-Schemas endpoint

    all_proposals = batch_inference_fix_incomplete(incomplete_input)
    print("All proposals: ", all_proposals)
    df.loc[incomplete_mask, "BATCH_LATER_incomplete"] = all_proposals
    df[incomplete_mask].apply(
        lambda row: row["SolutionSpace"].combine(row["BATCH_LATER_incomplete"]),
        axis=1
    )
    df = df.drop(columns=["BATCH_LATER_incomplete"])
    df = df.apply(lambda row: row["SolutionSpace"].apply_proposal(row), axis=1)
    df["MetaDataSpace"].apply(lambda instance: instance.now(tool_name="correct_incomplete", trainable=False, model_name="unsloth/gemma-3-27b-it-bnb-4bit"))
    df = parse_dimensions_to_str(df)
    df.to_json(OUTPUT, lines=True, orient="records")



def batch_inference_fix_incomplete(remembered_incomplete: pd.Series) -> pd.Series:
    '''Führt Inferenz für alle Zeilen und Felder in einem einzigen Batch aus.'''
    
    all_prompts = []
    structure_map = []

    for row_idx, row_list in remembered_incomplete.items():
        for incomplete_item in row_list:
            prompt = _format_gemma_prompt(Prompts.FIX_INCOMPLETE_SYSTEM, str(incomplete_item[2]))
            all_prompts.append(prompt)
            structure_map.append((row_idx, incomplete_item[1]))

    print("All prompts", all_prompts)
    if not all_prompts:
        return pd.Series([SolutionInstance() for _ in range(len(remembered_incomplete))], 
                         index=remembered_incomplete.index)

    results = inference_completion(
        model="unsloth/gemma-3-27b-it-bnb-4bit", 
        prompt=all_prompts, 
        max_tokens=120
    )
    
    choices = sorted(results["choices"], key=lambda x: x.get("index", 0))
    all_texts = [choice["text"] for choice in choices]
    print("All incomplte correciton texts: ", all_texts)

    proposals_dict = {idx: SolutionInstance() for idx in remembered_incomplete.index}

    for text, (row_idx, field_name) in zip(all_texts, structure_map):
        if not text:
            continue
            
        match = re.search(r'"([^"]*)"', text, re.DOTALL)
        if match:
            useable_response = smart_cast(match.group(0), return_on_fail=None)
            
            if useable_response:
                proposal = proposals_dict[row_idx]
                fix: Fix = getattr(proposal, field_name)
                fix.value = useable_response

    return pd.Series(proposals_dict.values(), index=remembered_incomplete.index)
