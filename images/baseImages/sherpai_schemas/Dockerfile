# BaseImage for python_sherpai_schemas
FROM python:3.14-slim

RUN apt-get update && apt-get install -y git 
RUN pip install --no-cache-dir --force-reinstall git+https://github.com/SherpAI-Master/SherpAI-Schemas.git@main 

WORKDIR /app