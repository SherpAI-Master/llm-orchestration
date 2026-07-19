// Alle Typen inline (kein @verifai/shared Workspace noetig)

export type GebauerRecord = {
  id: string;
  hybrid: string;
  typ: string;
  nr: string;
  klassifik: string;
  name1: string;
  zeile1: string;
  plz: string;
  ort: string;
  land: string;
  ustid: string;
  steuernr: string;
  iln: string;
};

export type IssueType = "MISSING" | "FORMAT" | "INCOMPLETE" | "MISPLACED";
export type IssueSeverity = "HIGH" | "MED" | "LOW";
export type IssueSuggestionStatus = "NOT_AVAILABLE" | "AVAILABLE";

export type IssueSuggestion = {
  status: IssueSuggestionStatus;
  field: keyof GebauerRecord;
  confidence: number;
  text?: string;
};

export type Issue = {
  recordId: string;
  type: IssueType;
  field: keyof GebauerRecord;
  code: string;
  params?: Record<string, string | number | boolean | null>;
  message?: string;
  severity?: IssueSeverity;
  itemId?: string;
  currentValue?: string;
  suggestion?: IssueSuggestion;
};

export type DuplicateCandidate = { recordId: string; referenceId: string; similarity: number };

export type DuplicateCluster = {
  clusterId: string;
  referenceId: string;
  memberIds: string[];
  similarityAvg: number;
  itemId?: string;
  reasonCodes?: string[];
  memberReasonCodes?: Record<string, string[]>;
};

export type EnrichmentSuggestion = {
  itemId?: string;
  reviewItemIds?: string[];
  recordId: string;
  field: keyof GebauerRecord;
  suggestedValue: string;
  code: string;
  params?: Record<string, string | number | boolean | null>;
  reason?: string;
  source?: string;
};

export type ReviewDecisionState = "PENDING" | "ACCEPTED" | "REJECTED";
export type ReviewItemCategory = "MISSING" | "FORMAT" | "INCOMPLETE" | "DUPLICATE";
export type ReviewSuggestionKind = "VALUE" | "HINT" | "NONE";
export type ReviewSuggestionSource = "DATA" | "DONOR" | "LLM" | "DEMO" | "NONE";

export type ReviewSuggestion = {
  kind: ReviewSuggestionKind;
  text: string | null;
  confidence?: number;
  source: ReviewSuggestionSource;
  enrichmentItemIds?: string[];
};

export type ReviewItem = {
  itemId: string;
  category: ReviewItemCategory;
  kind: "ISSUE" | "DUPLICATE_CLUSTER";
  code: string;
  decision: ReviewDecisionState;
  canApply: boolean;
  recordId?: string;
  clusterId?: string;
  field?: keyof GebauerRecord;
  severity?: IssueSeverity;
  currentValue?: string;
  suggestion: ReviewSuggestion;
};

export type AnalysisResult = {
  records: GebauerRecord[];
  missingIssues: Issue[];
  formatIssues: Issue[];
  incompleteIssues: Issue[];
  duplicateClusters: DuplicateCluster[];
  enrichments: EnrichmentSuggestion[];
};
