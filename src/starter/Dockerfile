FROM curlimages/curl:latest

WORKDIR /app

CMD ["sh", "-c", "sleep 3 && curl -X POST http://orchestration-platform:8090/process \
    -F 'data=@/app/process-data.jsonl' \
    -F 'instructions=@/app/process-plan.json' \
    -F 'env=@/app/process.env'"]