# Execution of detection_misspelled_tier1

import re

import pandas as pd

from sherpai_schemas import (
    Finding,
    FieldChange,
    PipelineRunner,
    PipelineStage,
    PipelineTool,
    ProblemType,
    Prompts,
    Proposal,
    SherpAIInstance,
    ToolIdentity,
    get_pure_data,
    inference_conversation,
    smart_cast,
)

MODEL = "unsloth/gemma-3-27b-it-bnb-4bit"


class MisspelledDetectionTool(PipelineTool):
    """Identifies and immediately proposes fixes for misspelled values, in one LLM call."""

    identity = ToolIdentity(stage=PipelineStage.DETECTION, tool="misspelled", tier=1)

    def process_row(self, row: pd.Series, instance: SherpAIInstance) -> SherpAIInstance:
        # PipelineRunner has already applied any previously-accepted corrections
        # onto `row` before calling this method.
        pure_data = get_pure_data(row)
        assistant_response = inference_conversation(
            system_prompt=Prompts.DETECT_MISSPELLED_SYSTEM,
            user_prompt=pure_data.to_json(),
            model=MODEL,
        )
        matches = re.search(r"\{.*\}", assistant_response)
        if not matches:
            return instance

        casted_response = smart_cast(matches.group(0), return_on_fail={})
        print("IDENTIFY MISSPELLED ASSISTANT: ", casted_response)
        for col, fix in casted_response.items():
            detection = Proposal(identity=self.identity, changes=[FieldChange(column=col, value=row[col])])
            detection.mark_review_ready()
            correction = Proposal(identity=self.identity, changes=[FieldChange(column=col, value=fix)])
            correction.mark_review_ready()
            instance.add_finding(
                Finding(problem_type=ProblemType.MISSPELLED, detection=detection, correction=correction)
            )

        return instance


if __name__ == "__main__":
    PipelineRunner(MisspelledDetectionTool()).run()
