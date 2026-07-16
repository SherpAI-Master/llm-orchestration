# Execution of correction_misspelled_tier1

import pandas as pd

from sherpai_schemas import PipelineRunner, PipelineStage, PipelineTool, SherpAIInstance, ToolIdentity


class MisspelledCorrectionTool(PipelineTool):
    """No-op: MisspelledDetectionTool already proposes a correction alongside each
    detection in the same LLM call, so there is nothing left for this stage to do.
    Kept only so the correction_misspelled_tier1 compose target stays valid."""

    identity = ToolIdentity(stage=PipelineStage.CORRECTION, tool="misspelled", tier=1)

    def process_row(self, row: pd.Series, instance: SherpAIInstance) -> SherpAIInstance:
        return instance


if __name__ == "__main__":
    PipelineRunner(MisspelledCorrectionTool()).run()
