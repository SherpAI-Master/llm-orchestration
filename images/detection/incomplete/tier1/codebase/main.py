# Execution of detection_incomplete_tier1

import re

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


def has_abbreviation(value: str) -> bool:
    """Heuristic: value contains a dot or two consecutive capitals (acronym)."""
    return "." in value or re.search(r"[A-Z]{2}", value) is not None


class IncompleteDetectionTool(PipelineTool):
    """Flags values that look like unexpanded abbreviations."""

    identity = ToolIdentity(stage=PipelineStage.DETECTION, tool="incomplete", tier=1)

    def process_row(self, row: pd.Series, instance: SherpAIInstance) -> SherpAIInstance:
        # PipelineRunner has already applied any previously-accepted corrections
        # onto `row` before calling this method.
        for col_name, value in get_pure_data(row).items():
            if pd.notna(value) and isinstance(value, str) and has_abbreviation(value):
                detection = Proposal(identity=self.identity, changes=[FieldChange(column=col_name, value=value)])
                detection.mark_review_ready()
                instance.add_finding(Finding(problem_type=ProblemType.INCOMPLETE, detection=detection))
        return instance


if __name__ == "__main__":
    PipelineRunner(IncompleteDetectionTool()).run()
