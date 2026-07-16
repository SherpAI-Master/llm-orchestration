# Execution of detection_formatting_tier1

import pandas as pd

from sherpai_schemas import (
    Finding,
    FieldChange,
    FormattingRules,
    PipelineRunner,
    PipelineStage,
    PipelineTool,
    ProblemType,
    Proposal,
    SherpAIInstance,
    ToolIdentity,
    get_pure_data,
)


class FormattingDetectionTool(PipelineTool):
    """Flags values that don't match their column's expected format."""

    identity = ToolIdentity(stage=PipelineStage.DETECTION, tool="formatting", tier=1)

    def process_row(self, row: pd.Series, instance: SherpAIInstance) -> SherpAIInstance:
        # PipelineRunner has already applied any previously-accepted corrections
        # onto `row` before calling this method.
        for col, value in get_pure_data(row).items():
            # Skip null/None values because other problem type
            if not value or pd.isna(value):
                continue
            if not FormattingRules.is_valid(col, value):
                detection = Proposal(identity=self.identity, changes=[FieldChange(column=col, value=value)])
                detection.mark_review_ready()
                instance.add_finding(Finding(problem_type=ProblemType.FORMATTING, detection=detection))
        return instance


if __name__ == "__main__":
    PipelineRunner(FormattingDetectionTool()).run()
