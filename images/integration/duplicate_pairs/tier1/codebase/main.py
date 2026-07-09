# Execution of correction_missing__tier1

import pandas as pd
from pathlib import Path
import json

from pymilvus import MilvusClient

from sherpai_schemas import parse_dimensions_from_str, query_db


INPUT = Path("/job/input.jsonl")
OUTPUT = Path("/job/output.jsonl")
VECTOR_DB = Path("/job/vector.db")


def get_deduplication_pairs(
        output: Path, proposal_df: pd.DataFrame, output_type: str = "ditto"
    ) -> pd.DataFrame | Path:
        """Blocking step: Create most possible duplicate pairs.

        :param output: Folder path where possible matches deposited
        :type output: pathlib.Path
        :param proposal_df: Unchanged dataframe with incoming data
        :type proposal_df: pd.DataFrame
        :param output_type: Decide whether to output JSONL format for ditto comparison or pd.DataFrame for visuals/analysis
        :type output_type: "df" | "ditto"
        """
        # Filter out all proposals & find matches in vector DB
        search_response_limit = 3
        mask = proposal_df["SolutionSpace"].apply(lambda x: not x.is_empty())
        proposal_df = proposal_df[mask].reset_index(drop=True)
        pure_proposal_df = proposal_df.drop(columns=["SolutionSpace", "ProblemSpace", "MetaDataSpace"], errors="ignore")

        client = MilvusClient(str(VECTOR_DB))
        vector_response = query_db(
            search_df=pure_proposal_df,
            milvus_client=client,
            collection_name="main",
            limit=search_response_limit,
        )

        if len(proposal_df) != len(vector_response):
            msg = f"Proposal-Search length mismatch! {len(proposal_df)} != {len(vector_response)}"
            raise ValueError(msg)

        match output_type:
            case "df":
                # Create comparison DataFrame
                comparison_data = []
                for proposed_id, proposed_row in pure_proposal_df.iterrows():
                    proposed_dict = {f"proposed_{k}": v for k, v in proposed_row.items()}
                    for found_id in range(search_response_limit):
                        found_hit = vector_response[proposed_id][found_id]
                        found_dict = {}
                        for json_key, json_value in found_hit.entity["json_data"].items():
                            found_dict[f"found_{json_key}"] = json_value
                        found_dict["found_distance"] = found_hit.distance
                        comparison_data.append({**proposed_dict, **found_dict})
                pd.DataFrame(comparison_data).to_json(output, lines=True, orient="records")

            case "ditto":
                # Or direct Ditto input
                jsonl_rows = []
                for proposed_id, proposed_row in pure_proposal_df.iterrows():
                    cleaned_row = proposed_row.where(proposed_row.notna(), None)
                    proposed_obj = cleaned_row.to_dict()

                    for found_id in range(search_response_limit):
                        found_hit = vector_response[proposed_id][found_id]
                        found_obj = found_hit.entity["json_data"].copy()
                        # found_obj["distance"] = found_hit.distance # No distance because changes comparisons
                        jsonl_rows.append([proposed_obj, found_obj])

                with output.open("w") as file:
                    file.writelines(json.dumps(row) + "\n" for row in jsonl_rows)

            case _:
                msg = "Wrong input for param 'output_type'! Must be 'ditto' or 'df'."
                raise ValueError(msg)

df = pd.read_json(INPUT, lines=True)
df = parse_dimensions_from_str(df)
get_deduplication_pairs(OUTPUT, df)
