# BaseImage for Scheduler
FROM python:3.14-slim

WORKDIR /app
COPY ./requirements.txt .

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
       -o /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
    
RUN pip install -r requirements.txt
