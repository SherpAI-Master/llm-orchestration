# Run Ditto

import pandas as pd
import subprocess
from pathlib import Path

INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")
MODEL = Path("/job/model")

# Remove data spaces for matching
df = pd.read_json(INPUT, lines=True)
df = df.drop(columns=["ProblemSpace", "SolutionSpace", "MetaDataSpace"])
df.to_json("removed_dimensions.jsonl", orient="records", lines=True)

with open("removed_dimensions.jsonl", "r", encoding="utf-8") as f_in, \
     open(INPUT, "w", encoding="utf-8") as f_out:

    for line in f_in:
        new_line = line.replace(r'{"0":', "[")
        new_line = new_line.replace(r'"1":', ' ')
        new_line = new_line.replace(r'}}', '}]')
        f_out.write(new_line)


cmd = f"""
CUDA_VISIBLE_DEVICES=0 python3 /app/matcher.py \
  --task sherpai \
  --input_path {str(INPUT)} \
  --output_path {str(OUTPUT)} \
  --lm distilbert \
  --max_len 64 \
  --use_gpu \
  --fp16 \
  --checkpoint_path {str(MODEL)}
"""
print(cmd)
subprocess.run(cmd, shell=True, executable="/bin/bash", check=True)
