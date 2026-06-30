import os, importlib.util


from unsloth import FastVisionModel # FastLanguageModel for LLMs
import torch
from datasets import load_dataset

model, tokenizer = FastVisionModel.from_pretrained(
    "unsloth/Qwen3.5-0.8B", #4B or 9B
    load_in_4bit = False, # Use 4bit to reduce memory use. False for 16bit LoRA.
    use_gradient_checkpointing = "unsloth", # True or "unsloth" for long context
)

model = FastVisionModel.get_peft_model(
    model,
    finetune_vision_layers     = False, # False if not finetuning vision layers
    finetune_language_layers   = True, # False if not finetuning language layers
    finetune_attention_modules = True, # False if not finetuning attention layers
    finetune_mlp_modules       = True, # False if not finetuning MLP layers

    r = 16,           # The larger, the higher the accuracy, but might overfit
    lora_alpha = 16,  # Recommended alpha == r at least
    lora_dropout = 0,
    bias = "none",
    random_state = 3407,
    use_rslora = False,  # We support rank stabilized LoRA
    loftq_config = None, # And LoftQ
    # target_modules = "all-linear", # Optional now! Can specify a list if needed
)

dataset = load_dataset("json", data_files="/opt/sherpai/llm-orchestration/data/detect_misplaced_ft.jsonl", split = "train")

instruction = 'You are a data validation expert. Your task is to find values placed in the wrong columns. The correct schema is: {"hybrid": "PERS_#_######", "typ": #, "nr": ######, "klassifik": "#", "name1": "Company/Person", "zeile1": "Address", "plz": "Postal Code", "ort": "City", "land": "Country", "ustid": "########", "steuernr": "########", "iln": "########"}"}.\n        If you find misplacements, output a JSON object containing the columns needed to be switched!\n'
def convert_to_conversation(sample):
    conversation = [
        { "role": "user",
          "content" : f"{instruction}\n\nInput Data: {sample['input']}"
        },
        { "role" : "assistant",
          "content" : [
            {"type" : "text",  "text"  : sample["output"]} ]
        },
    ]
    return { "messages" : conversation }

converted_dataset = [convert_to_conversation(sample) for sample in dataset]
print(converted_dataset[0])