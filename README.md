# Enhancing ERP Data Quality through the Interplay of LLM-based Solutions

This is the related GitHub repository to the master thesis _"Enhancing ERP Data Quality through the Interplay of LLM-based Solutions"_ by Roman Klinghammer.
Through this project, the combination of error detection, data correction, data enrichment and data integration are combined into an holistic architecture.

<img width="2526" height="3603" alt="Image" src="https://github.com/user-attachments/assets/0f47c65a-4814-4597-9a8f-8fe26fa2340a" />

# Authors

Roman Klinghammer (rklinghammer@uni-potsdam.de)


docker run --runtime nvidia --gpus all -v ~/.cache/huggingface:/root/.cache/huggingface --env "HF_TOKEN=$HF_TOKEN" -p 8000:8000 --ipc=host vllm/vllm-openai:latest --model unsloth/gemma-3-27b-it-bnb-4bit --max-model-len 8192 --trust-remote-code 

docker run \
  --gpus all \
  --ipc host \
  -p 8090:8000 \
  -v /opt/sherpai/.cache/huggingface:/root/.cache/huggingface \
  -v /opt/sherpai/llm-orchestration/ft_models/adapter:/app/adapters \
  -e HF_TOKEN=${HF_TOKEN} \
  vllm/vllm-openai:latest \
  --model unsloth/gemma-3-27b-it-bnb-4bit \
  --max-model-len 2048 \
  --gpu-memory-utilization 0.90 \
  --trust-remote-code \
  --enable-lora \
  --lora-modules fix_misplaced_gemma=/app/adapters/fix_misplaced_gemma detect_misplaced_gemma=/app/adapters/detect_misplaced_gemma \
  --enforce-eager

  curl http://localhost:8090/v1/chat/completions   -H "Content-Type: application/json"   -d '{
    "model": "unsloth/gemma-3-27b-it-bnb-4bit",
    "messages": [
      {"role": "user", "content": "Explain quantum entanglement in one sentence."}
    ],
    "max_tokens": 100
  }' > output.json 2>&1 &


curl http://localhost:8090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "detect_misplaced_gemma",
    "messages": [
      {
        "role": "system",
        "content": "You are a data validation expert. Your task is to find values placed in the wrong columns. The correct schema is: {\"hybrid\": \"PERS_#_######\", \"typ\": #, \"nr\": ######, \"klassifik\": \"#\", \"name1\": \"Company/Person\", \"zeile1\": \"Address\", \"plz\": \"Postal Code\", \"ort\": \"City\", \"land\": \"Country\", \"ustid\": \"########\", \"steuernr\": \"########\", \"iln\": \"########\"}\"}."
      },
      {
        "role": "user",
        "content": "{\"hybrid\": \"PERS_4_2\", \"typ\": 4, \"nr\": \"2Deutschland\", \"klassifik\": \"\", \"name1\": \"Weitzmann Software GmbH z Hd Hr Schmid\", \"zeile1\": \"Herbststrasse 5\", \"plz\": \"74072\", \"ort\": \"Heilbronn\", \"land\": \"\", \"ustid\": \"\", \"steuernr\": \"\", \"iln\": \"\"}"
      }
    ],
    "temperature": 0.0,
    "max_tokens": 20
  }'

  curl http://localhost:8090/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "detect_misplaced_gemma",
    "prompt": ["<start_of_turn>system\nYou are a data validation expert. Your task is to find values placed in the wrong columns. The correct schema is: {\"hybrid\": \"PERS_#_######\", \"typ\": #, \"nr\": ######, \"klassifik\": \"#\", \"name1\": \"Company/Person\", \"zeile1\": \"Address\", \"plz\": \"Postal Code\", \"ort\": \"City\", \"land\": \"Country\", \"ustid\": \"########\", \"steuernr\": \"########\", \"iln\": \"########\"}\"}.<end_of_turn>\n<start_of_turn>user\n{\"hybrid\": \"PERS_4_2\", \"typ\": 4, \"nr\": \"2Deutschland\", \"klassifik\": \"\", \"name1\": \"Weitzmann Software GmbH z Hd Hr Schmid\", \"zeile1\": \"Herbststrasse 5\", \"plz\": \"74072\", \"ort\": \"Heilbronn\", \"land\": \"\", \"ustid\": \"\", \"steuernr\": \"\", \"iln\": \"\"}<end_of_turn>\n<start_of_turn>model\n"],
    "temperature": 0.0,
    "max_tokens": 20,
    "stop": ["<end_of_turn>"]
  }'