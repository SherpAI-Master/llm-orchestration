FROM curlimages/curl:latest

WORKDIR /app
COPY . .

CMD ["sh", "-c", "sleep 2 && curl -X POST http://orchestration-platform:8000/process \
    -F 'data=@/app/process-data.jsonl' \
    -F 'instructions=@/app/process-plan.json'"]