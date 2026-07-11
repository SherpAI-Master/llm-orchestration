# bin/bash

docker build --no-cache -t homeserver:5000/llm-orchestration/python_scheduler:latest images/baseImages/scheduler
docker build --no-cache -t homeserver:5000/llm-orchestration/starter:latest src/starter
docker build --no-cache -t homeserver:5000/llm-orchestration/frontend:latest src/frontend
docker build --no-cache -t homeserver:5000/llm-orchestration/scheduler:latest src/scheduler

docker build --no-cache -t homeserver:5000/llm-orchestration/detection_incomplete_tier1_codebase:latest images/detection/incomplete/tier1/codebase/
docker build --no-cache -t homeserver:5000/llm-orchestration/detection_misplaced_tier1_codebase:latest images/detection/misplaced/tier1/codebase/
docker build --no-cache -t homeserver:5000/llm-orchestration/detection_formatting_tier1_codebase:latest images/detection/formatting/tier1/codebase/
docker build --no-cache -t homeserver:5000/llm-orchestration/detection_misspelled_tier1_codebase:latest images/detection/misspelled/tier1/codebase/
docker build --no-cache -t homeserver:5000/llm-orchestration/detection_missing_tier1_codebase:latest images/detection/missing/tier1/codebase/
docker build --no-cache -t homeserver:5000/llm-orchestration/detection_validation_tier1_codebase:latest images/detection/validation/tier1/codebase/

docker build --no-cache -t homeserver:5000/llm-orchestration/correction_incomplete_tier1_codebase:latest images/correction/incomplete/tier1/codebase/
docker build --no-cache -t homeserver:5000/llm-orchestration/correction_misplaced_tier1_codebase:latest images/correction/misplaced/tier1/codebase/
docker build --no-cache -t homeserver:5000/llm-orchestration/correction_formatting_tier1_codebase:latest images/correction/formatting/tier1/codebase/
docker build --no-cache -t homeserver:5000/llm-orchestration/correction_misspelled_tier1_codebase:latest images/correction/misspelled/tier1/codebase/
docker build --no-cache -t homeserver:5000/llm-orchestration/correction_validation_missing_tier1_codebase:latest images/correction/validation_missing/tier1/codebase/

docker build --no-cache -t homeserver:5000/llm-orchestration/integration_duplicate_pairs_tier1_codebase:latest images/integration/duplicate_pairs/tier1/codebase/
docker build --no-cache -t homeserver:5000/llm-orchestration/integration_ditto_tier1_codebase:latest images/integration/ditto/tier1/codebase/

# #docker compose build --no-cache && docker compose up