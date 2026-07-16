# Execution of correction_incomplete_tier1

import pandas as pd

from sherpai_schemas import (
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


class IncompleteCorrectionTool(PipelineTool):
    """Proposes a written-out form for detected abbreviations."""

    identity = ToolIdentity(stage=PipelineStage.CORRECTION, tool="incomplete", tier=1)
    batch_system_prompt = Prompts.FIX_INCOMPLETE_SYSTEM

    def process_row(self, row: pd.Series, instance: SherpAIInstance) -> SherpAIInstance:
        # PipelineRunner has already applied any previously-accepted corrections
        # onto `row` before calling this method.
        findings: list[Finding] = [
            f for f in instance.by_type(ProblemType.INCOMPLETE) if f.correction is None
        ]

        if not findings:
            return instance

        print(f"\n--- Fixing Incomplete Values of {findings} ---")
        for finding in findings:
            col = finding.detection.single().column
            prompt = Prompts.FIX_INCOMPLETE_USER.format(col_value=str(row[col]), col_name=col)
            finding.correction = Proposal(identity=self.identity)
            finding.correction.mark_batching_ready(prompt)

        return instance


if __name__ == "__main__":
    PipelineRunner(IncompleteCorrectionTool()).run()
