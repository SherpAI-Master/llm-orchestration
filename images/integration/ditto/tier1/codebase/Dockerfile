# Codebase for integration_ditto_tier1
FROM python:3.12-slim

WORKDIR /app


RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY . .
RUN pip install --no-cache-dir -r requirements.txt
RUN python3 -m nltk.downloader stopwords

CMD ["python", "main.py"]
