
from pathlib import Path
import pandas as pd

INPUT = Path("/home/roman/code/llm-orchestration/src/starter/process-data.jsonl")

def some_func(row: pd.Series) -> pd.Series:
    """Some func."""
    if row["hybrid"] == "PERS_1_13":
        df.at[row.name, "FOR LATER"] = {"thing1": row["nr"], "thing2": row["ort"]}
    return str(row["hybrid"])+str(row["nr"])+str(row["name1"])


df = pd.read_json(INPUT, lines=True, orient="records")
df["FOR LATER"] = None
df["Combi"] = df.apply(some_func, axis=1)
print(df)
