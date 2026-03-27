FROM homeserver:5000/llm-orchestration/python_scheduler:latest

WORKDIR /app
COPY . .

CMD ["fastapi", "run", "src/main.py", "--port", "8000"]
