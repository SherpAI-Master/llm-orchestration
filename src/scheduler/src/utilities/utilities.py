"""Helper functions for process handling."""

import secrets
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from sherpai_schemas import PipelineStage, ToolIdentity


def create_job_folder(base_path: Path) -> Path:
    """Create a new job folder.

    :param base_path: Root path of folder, defaults to "/hostData"
    :type base_path: str, optional
    :return: Path to new folder
    :rtype: pathlib.Path
    """
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M")
    short_uid = secrets.token_hex(2)
    folder_name = f"run_{timestamp}_{short_uid}"
    folder_path = base_path / folder_name
    folder_path.mkdir(parents=True, exist_ok=True)
    print(f"New Job folder: {folder_path}")

    return folder_path

def add_data_dimensions(data: Path) -> Path:
    """Addition of SherpAISpace to incoming data.

    :param data: Raw data from job intialization
    :return: Path with original data with added data dimensions
    """
    df = pd.read_json(data, lines=True)
    if {"SherpAISpace"}.issubset(df.columns):
        return data
    df["SherpAISpace"] = ""
   

    df.to_json(data, lines=True, orient="records")
    return data

def extract_compose_name(tool_dict: dict, compose_folder: Path) -> str:
    """Combine and verify instruction segments into compose names.

    :param tool_dict: Data quality tool
    :param compose_folder: Folder of every tools docker compose
    :return: Name of the docker compose of the tool
    """
    required_keys = {"tool", "pool", "tier"}
    if missing := required_keys - tool_dict.keys():
        raise KeyError(f"Missing keys in tool_dict: {missing}")

    identity = ToolIdentity(
        stage=PipelineStage(tool_dict["pool"]), tool=tool_dict["tool"], tier=tool_dict["tier"]
    )
    compose_name = identity.compose_name()

    if not (compose_folder / compose_name).exists():
        raise FileNotFoundError(f"Compose '{compose_name}' not found in {compose_folder}")

    return compose_name

