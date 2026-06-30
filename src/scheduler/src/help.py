import pandas as pd
import json

# Load your data
df = pd.read_json("/opt/sherpai/llm-orchestration/data/detect_misplaced.jsonl", lines=True)

def clean_row(row):
    # Keep input as a clean, readable dictionary (Unsloth handles the rest)
    # 1. Clean the string (remove extra quotes or brackets if they exist)
    label_str = str(row["label"])
    clean_label = label_str.replace('"', '').replace("'", "").replace("[", "").replace("]", "")

    input =  row.drop("label").to_dict()
    
    # 2. Split by the '>' character
    if '>' in clean_label:
        parts = clean_label.split('>')
        # "plz>zeile1" -> value_of: "plz", is_in_col: "zeile1"
        output=  {"value_of": parts[0].strip(), "is_in_col": parts[1].strip()}
    else:
        output = {"value_of": "", "is_in_col": ""}
    
    return {
        "input":input,
        "output": output
    }


df = df.apply(clean_row, axis=1)
print(df.head())
df.to_json("/opt/sherpai/llm-orchestration/data/detect_misplaced_ft.jsonl", lines=True, orient="records")
