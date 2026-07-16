# Execution of detection_missing_tier1

import pandas as pd

from sherpai_schemas import (
    Finding,
    FieldChange,
    PipelineRunner,
    PipelineStage,
    PipelineTool,
    ProblemType,
    Proposal,
    SherpAIInstance,
    ToolIdentity,
    get_pure_data,
)


class MissingValueDetectionTool(PipelineTool):
    """Flags columns whose value is missing or empty."""

    identity = ToolIdentity(stage=PipelineStage.DETECTION, tool="missing", tier=1)

    def process_row(self, row: pd.Series, instance: SherpAIInstance) -> SherpAIInstance:
        # PipelineRunner has already applied any previously-accepted corrections
        # onto `row` before calling this method.
        for key, value in get_pure_data(row).items():
            if not value or pd.isna(value):
                detection = Proposal(identity=self.identity, changes=[FieldChange(column=key, value=value)])
                detection.mark_review_ready()
                instance.add_finding(Finding(problem_type=ProblemType.MISSING_VALUE, detection=detection))
        return instance


if __name__ == "__main__":
    PipelineRunner(MissingValueDetectionTool()).run()
