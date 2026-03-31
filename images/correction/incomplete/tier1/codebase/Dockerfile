# Codebasse for detection_incomplete_tier1
FROM python:3.14-slim

# Download SherpAI-Schemas (and Pandas)
RUN apt-get update && apt-get install -y git 
RUN pip install --no-cache-dir --force-reinstall git+https://github.com/SherpAI-Master/SherpAI-Schemas.git@main 

WORKDIR /app

COPY . .

CMD [ "python", "main.py" ]
