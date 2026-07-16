# Execution of detection_misplaced_tier1

import pandas as pd

from sherpai_schemas import (
    ChangeRole,
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

FT_MODEL = "detect_misplaced_gemma"


class MisplacedDetectionTool(PipelineTool):
    """Identifies values placed in the wrong column of a data row."""

    identity = ToolIdentity(stage=PipelineStage.DETECTION, tool="misplaced", tier=1)

    def process_row(self, row: pd.Series, instance: SherpAIInstance) -> SherpAIInstance:
        # PipelineRunner has already applied any previously-accepted corrections
        # onto `row` before calling this method.
        print("\n--- Identifying misplaced Values ---")
        pure_data = get_pure_data(row)
        assistant_response = inference_conversation(
            system_prompt=Prompts.DETECT_MISPLACED_SYSTEM,
            user_prompt=pure_data.to_json(),
            model=FT_MODEL,
        )
        print("IDENTIFY MISPLACED ASSISTANT: ", assistant_response)
        ### Todo rework parsing a string / finetuning model
        original_list = smart_cast(assistant_response, return_on_fail=[])
        if not original_list:
            return instance

        missing_col, overfilled_col = original_list[0].strip("[]'").split(">", 1)
        detection = Proposal(
            identity=self.identity,
            reason=original_list[0],
            changes=[
                FieldChange(column=missing_col, value=row[missing_col], role=ChangeRole.TARGET),
                FieldChange(column=overfilled_col, value=row[overfilled_col], role=ChangeRole.SOURCE),
            ],
        )
        detection.mark_review_ready()
        instance.add_finding(Finding(problem_type=ProblemType.MISPLACED, detection=detection))
        return instance


if __name__ == "__main__":
    PipelineRunner(MisplacedDetectionTool()).run()
