# Execution of correction_formatting_tier1

import pandas as pd

from sherpai_schemas import (
    Finding,
    FormattingRules,
    PipelineRunner,
    PipelineStage,
    PipelineTool,
    ProblemType,
    Prompts,
    Proposal,
    SherpAIInstance,
    ToolIdentity,
)


class FormattingCorrectionTool(PipelineTool):
    """Proposes a reformatted value for columns that failed their format check."""

    identity = ToolIdentity(stage=PipelineStage.CORRECTION, tool="formatting", tier=1)
    batch_system_prompt = Prompts.FIX_FORMATTING_SYSTEM
    batch_max_tokens = 240

    def process_row(self, row: pd.Series, instance: SherpAIInstance) -> SherpAIInstance:
        # PipelineRunner has already applied any previously-accepted corrections
        # onto `row` before calling this method.
        findings: list[Finding] = [
            f for f in instance.by_type(ProblemType.FORMATTING) if f.correction is None
        ]

        if not findings:
            return instance

        print("\n--- Fixing Formatting Values ---")
        for finding in findings:
            col = finding.detection.single().column
            col_rule = FormattingRules.get_pattern(col)
            prompt = Prompts.FIX_FORMATTING_USER.format(col_name=col, col_value=row[col], col_rule=col_rule)
            finding.correction = Proposal(identity=self.identity)
            finding.correction.mark_batching_ready(prompt)

        return instance


if __name__ == "__main__":
    PipelineRunner(FormattingCorrectionTool()).run()
