"""General entrypoint of input and process order via FastAPI."""

import shutil
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, UploadFile

from .utilities.docker_runner import process_job
from .utilities.utilities import add_data_dimensions, create_job_folder

HOST_DATA = Path("/hostData")
COMPOSE_COLLECTION = HOST_DATA / "compose_collection"
JOB_RUN_FOLDER = HOST_DATA / "process_runs"

app = FastAPI()

INSTRUCTION_FILE = HOST_DATA / "starter_files" / "process-plan.json"
ENV_FILE =  HOST_DATA / "starter_files" / "process.env"


@app.post("/process")
async def process_files(data: UploadFile) -> str:
    """Start data quality process with given order and input data.

    :param data: Uploaded JSONL file
    :param instructions: Process order with pool, tool and tier
    """
    # Create new folder as job environment
    job_folder = create_job_folder(JOB_RUN_FOLDER)

    # Safe input data to inputs folder
    input_data_path = job_folder / "0_input_records.jsonl"
    input_data_path.write_bytes(await data.read())

    # Safe tool order to inputs folder
    shutil.copy(INSTRUCTION_FILE, job_folder / "instructions.json")

    # Add .job_env
    shutil.copy(ENV_FILE, job_folder / ".job_env")

    # Add data dimensions (Problem-, Solution- and MetaDataSpace)
    input_data_path = add_data_dimensions(input_data_path)

    process_job(job_folder, COMPOSE_COLLECTION)

    return "Finished!"

@app.get("/health")
def health() -> dict:
    """Liveness-Pruefung fuer das Frontend."""
    return {"status": "ok"}
