# bin/bash
docker build --no-cache -t homeserver:5000/llm-orchestration/detection_incomplete_tier1_codebase:latest images/detection/incomplete/tier1/codebase/
docker build --no-cache -t homeserver:5000/llm-orchestration/detection_misplaced_tier1_codebase:latest images/detection/misplaced/tier1/codebase/
docker build --no-cache -t homeserver:5000/llm-orchestration/detection_formatting_tier1_codebase:latest images/detection/formatting/tier1/codebase/