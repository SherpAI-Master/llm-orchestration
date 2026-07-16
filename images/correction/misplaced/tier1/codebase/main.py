# Execution of correction_misplaced_tier1

import pandas as pd

from sherpai_schemas import (
    ChangeRole,
    Finding,
    PipelineRunner,
    PipelineStage,
    PipelineTool,
    ProblemType,
    Prompts,
    Proposal,
    SherpAIInstance,
    ToolIdentity,
)


class MisplacedCorrectionTool(PipelineTool):
    """Proposes a fix for values detected in the wrong column."""

    identity = ToolIdentity(stage=PipelineStage.CORRECTION, tool="misplaced", tier=1)
    batch_system_prompt = Prompts.FIX_MISPLACED_SYSTEM
    batch_max_tokens = 240

    def process_row(self, row: pd.Series, instance: SherpAIInstance) -> SherpAIInstance:
        # PipelineRunner has already applied any previously-accepted corrections
        # onto `row` before calling this method.
        findings: list[Finding] = [
            f for f in instance.by_type(ProblemType.MISPLACED) if f.correction is None
        ]

        if not findings:
            return instance

        print(f"\n--- Fixing Misplaced Values of {findings} ---")

        for finding in findings:
            missing_col = finding.detection.single(ChangeRole.TARGET).column
            overfilled = finding.detection.single(ChangeRole.SOURCE)

            prompt = Prompts.FIX_MISPLACED_USER.format(
                missing_col=missing_col,
                overfilled_col=overfilled.column,
                overfilled_value=row[overfilled.column],
            )
            finding.correction = Proposal(identity=self.identity)
            finding.correction.mark_batching_ready(prompt)
            print("HERE PROPOSED CORRECTION IN CORRECTION MISPLACED", finding.correction)

        return instance


if __name__ == "__main__":
    PipelineRunner(MisplacedCorrectionTool()).run()
