"""Runner for every docker compose of every tool."""

import json
import subprocess
from pathlib import Path
import os

from .utilities import extract_compose_name


def process_job(job_folder: Path, compose_folder: Path) -> int:
    """Process new data quality improvement job.

    Includes parsing of needed data quality tools and following execution of sequential tools.

    :param job_folder: Folder for processing of entire job
    :param compose_folder: Folder of every possible tool execution
    """
    env_file = job_folder / ".job_env"
    tool_order: list[dict] = json.loads((job_folder / "instructions.json").read_text())

    #for order_nr, tool in enumerate(tool_order, start=1):
    tool = tool_order[0]
    compose_name = extract_compose_name(tool, compose_folder)

    host_pwd = os.environ["HOST_PWD"]
    current_input = str(next(job_folder.glob(f"{1 - 1}*.jsonl")))
    output = job_folder / f"{1}_{compose_name[:-4]}.jsonl"
    output.touch()
    output = str(output)
    
    env_file.write_text(f"INPUT={host_pwd+current_input}\nOUTPUT={host_pwd+output}")

    command = ["docker-compose", "--file", str(compose_folder / compose_name), "--env-file", str(env_file), "up"]
    subprocess.run(command, check=True)

    return 0