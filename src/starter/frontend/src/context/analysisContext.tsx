// Globaler App-State: Analyseergebnis, ReviewItems und HITL-Entscheidungen

import * as React from "react";
import type { ReactNode } from "react";
import type { AnalysisResult, ReviewItem, ReviewDecisionState } from "../domain/types";

export type AnalysisMeta = {
  jobName: string;
  datasetType: string;
  useCase: string;
  project: string;
  startedAt: string;
};

type AnalysisState = {
  jobId: string | null;
  analysis: AnalysisResult | null;
  reviewItems: ReviewItem[];
  decisions: Map<string, ReviewDecisionState>;
  meta: AnalysisMeta | null;
  runFolder: string | null;
};

type AnalysisContextValue = {
  state: AnalysisState;
  setResult: (payload: {
    analysis: AnalysisResult;
    reviewItems: ReviewItem[];
    jobId: string;
    meta: AnalysisMeta;
    runFolder: string;
  }) => void;
  updateDecision: (itemId: string, decision: ReviewDecisionState) => void;
};

const AnalysisContext = React.createContext<AnalysisContextValue | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, setState] = React.useState<AnalysisState>({
    jobId: null,
    analysis: null,
    reviewItems: [],
    decisions: new Map(),
    meta: null,
    runFolder: null,
  });

  // Gesamtergebnis nach Analyse-Abschluss setzen
  function setResult(payload: {
    analysis: AnalysisResult;
    reviewItems: ReviewItem[];
    jobId: string;
    meta: AnalysisMeta;
    runFolder: string;
  }) {
    setState({
      jobId: payload.jobId,
      analysis: payload.analysis,
      reviewItems: payload.reviewItems,
      decisions: new Map(),
      meta: payload.meta,
      runFolder: payload.runFolder,
    });
  }

  // Einzelne HITL-Entscheidung im lokalen State aktualisieren
  function updateDecision(itemId: string, decision: ReviewDecisionState) {
    setState((prev) => ({
      ...prev,
      decisions: new Map(prev.decisions).set(itemId, decision),
    }));
  }

  return (
    <AnalysisContext.Provider value={{ state, setResult, updateDecision }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = React.useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis muss innerhalb AnalysisProvider verwendet werden");
  return ctx;
}
