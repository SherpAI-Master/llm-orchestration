# Enhancing ERP Data Quality through the Interplay of LLM-based Solutions

This is the related GitHub repository to the master thesis _"Enhancing ERP Data Quality through the Interplay of LLM-based Solutions"_ by Roman Klinghammer.
Through this project, the combination of error detection, data correction, data enrichment and data integration are combined into an holistic architecture.

<img width="2526" height="3603" alt="Image" src="https://github.com/user-attachments/assets/0f47c65a-4814-4597-9a8f-8fe26fa2340a" />

# Authors

Roman Klinghammer (rklinghammer@uni-potsdam.de)


docker run --runtime nvidia --gpus all -v ~/.cache/huggingface:/root/.cache/huggingface --env "HF_TOKEN=$HF_TOKEN" -p 8000:8000 --ipc=host vllm/vllm-openai:latest --model unsloth/gemma-3-27b-it-bnb-4bit --max-model-len 8192 --trust-remote-code 

docker run --runtime nvidia --gpus all -v ~/.cache/huggingface:/root/.cache/huggingface -v ~/code/llm-orchestration/ft_models/adapter:/app/adapters --env "HF_TOKEN=$HF_TOKEN" -p 8000:8000 --ipc=host vllm/vllm-openai:latest --model unsloth/gemma-3-27b-it-bnb-4bit --max-model-len 2048 --gpu-memory-utilization 0.95 --trust-remote-code --enable-lora --lora-modules detect_misplaced_tier1=/app/adapters/detect_misplaced_gemma --enforce-eager

#{"pool": "detection", "tool": "misplaced", "tier": 1},