// Ergebnisseite: ReviewItems aus Context, Entscheidungen lokal (kein Backend)

import { JSX, ReactNode, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../ui/button";
import { AlertTriangle, CheckCircle, LayoutDashboard, XCircle } from "lucide-react";
import { useAnalysis } from "../context/analysisContext";
import { useI18n } from "../context/i18nContext";
import LoadingState from "../ui/loadingState";
import type { DuplicateCluster, GebauerRecord, Issue, ReviewItem } from "../domain/types";

type CategoryKey = "dup" | "missing" | "format" | "incomplete";
type DecisionState = "PENDING" | "ACCEPTED" | "REJECTED";
type ReviewItemRecord = ReviewItem;
type ReviewableIssue = Issue;

const categoryMeta: Record<CategoryKey, { labelKey: string; shortKey: string; descKey: string }> = {
  dup:        { labelKey: "results.categories.dup.label",        shortKey: "results.categories.dup.short",        descKey: "results.categories.dup.desc" },
  missing:    { labelKey: "results.categories.missing.label",    shortKey: "results.categories.missing.short",    descKey: "results.categories.missing.desc" },
  format:     { labelKey: "results.categories.format.label",     shortKey: "results.categories.format.short",     descKey: "results.categories.format.desc" },
  incomplete: { labelKey: "results.categories.incomplete.label", shortKey: "results.categories.incomplete.short", descKey: "results.categories.incomplete.desc" },
};

function buildRecordMap(records: GebauerRecord[]) {
  const map = new Map<string, GebauerRecord>();
  for (const r of records) map.set(r.id, r);
  return map;
}

// Zeichenweise Diff-Hervorhebung zwischen Original und Vorschlag
function highlightDiff(original: string, suggestion: string) {
  if (!suggestion) return <span>{original}</span>;
  const maxLen = Math.max(original.length, suggestion.length);
  const parts: JSX.Element[] = [];
  for (let i = 0; i < maxLen; i++) {
    const o = original[i] ?? "";
    const s = suggestion[i] ?? "";
    if (!o) continue;
    if (o !== s) parts.push(<span key={i} className="bg-red-50 text-red-600">{o}</span>);
    else parts.push(<span key={i}>{o}</span>);
  }
  return <>{parts}</>;
}

export default function Results() {
  const { state, updateDecision } = useAnalysis();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("dup");
  const [savingDecisionItemId, setSavingDecisionItemId] = useState<string | null>(null);

  const analysis = state.analysis;

  // Synthetisches serverResult aus Context (kein Server-Polling noetig)
  const serverResult = useMemo(() => {
    if (!analysis) return null;
    return {
      runId: state.jobId ?? "",
      status: "ANALYZED" as const,
      metrics: null,
      result: analysis,
      llmSuggestionsStatus: "IDLE" as const,
      llmSuggestions: [] as ReviewItem[],
      // Entscheidungen aus dem lokalen Decision-State einpflegen
      reviewItems: state.reviewItems.map((item) => ({
        ...item,
        decision: (state.decisions.get(item.itemId) ?? item.decision) as DecisionState,
      })),
      errorCode: null,
      errorMessage: null,
    };
  }, [analysis, state.reviewItems, state.decisions, state.jobId]);

  // Entscheidung lokal im Context speichern (kein PATCH-Aufruf)
  function persistReviewDecision(itemId: string | undefined, decision: DecisionState) {
    if (!itemId) return;
    setSavingDecisionItemId(itemId);
    updateDecision(itemId, decision);
    setSavingDecisionItemId(null);
  }

  const current = serverResult?.result ?? null;
  const records = current?.records ?? [];
  const recordMap = useMemo(() => buildRecordMap(records), [records]);

  const reviewItemsByItemId = useMemo(
    () => new Map((serverResult?.reviewItems ?? []).map((item) => [item.itemId, item] as const)),
    [serverResult?.reviewItems]
  );

  function getIssueReviewItemId(issue: ReviewableIssue): string {
    return String(issue.itemId ?? `${issue.type}:${issue.recordId}:${String(issue.field)}:${issue.code}`);
  }

  function getDuplicateReviewItemId(cluster: DuplicateCluster): string {
    return String(cluster.itemId ?? `dup:${cluster.clusterId}`);
  }

  function getIssueReviewItem(issue: ReviewableIssue): ReviewItemRecord | undefined {
    return reviewItemsByItemId.get(getIssueReviewItemId(issue));
  }

  function getDuplicateReviewItem(cluster: DuplicateCluster): ReviewItemRecord | undefined {
    return reviewItemsByItemId.get(getDuplicateReviewItemId(cluster));
  }

  function fieldLabel(field?: string): string {
    if (!field) return "–";
    const key = `field.${field}`;
    const translated = t(key);
    return translated === key ? field : translated;
  }

  function decisionLabel(decision: DecisionState): string {
    const key = `decision.${decision}`;
    const translated = t(key);
    return translated === key ? decision : translated;
  }

  function decisionTone(decision: DecisionState): string {
    if (decision === "ACCEPTED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (decision === "REJECTED") return "border-gray-300 bg-gray-100 text-gray-700";
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  function sourceBadge(source: string): JSX.Element {
    const farbe = source === "LLM" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600";
    return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${farbe}`}>{source}</span>;
  }

  // Kategorie-Zaehler fuer Tab-Badges
  const counts = useMemo(() => ({
    dup:        current?.duplicateClusters.length ?? 0,
    missing:    current?.missingIssues.length ?? 0,
    format:     current?.formatIssues.length ?? 0,
    incomplete: current?.incompleteIssues.length ?? 0,
  }), [current]);

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{t("results.noData.title")}</h1>
        <p className="text-sm text-gray-600 mb-4">{t("results.noData.text")}</p>
        <Button onClick={() => navigate("/start")}>{t("results.noData.startBtn")}</Button>
      </div>
    );
  }

  // Zeile fuer ein Issue-ReviewItem
  function IssueRow({ issue, issues }: { issue: ReviewableIssue; issues: ReviewableIssue[] }) {
    const reviewItem = getIssueReviewItem(issue);
    const itemId = getIssueReviewItemId(issue);
    const decision = (reviewItem?.decision ?? "PENDING") as DecisionState;
    const isSaving = savingDecisionItemId === itemId;
    const record = recordMap.get(issue.recordId);
    const suggestion = reviewItem?.suggestion;

    return (
      <tr className="border-b last:border-0 hover:bg-gray-50">
        <td className="px-4 py-3 text-xs text-gray-500 font-mono">{issue.recordId}</td>
        <td className="px-4 py-3 text-sm">{record?.name1 || "–"}</td>
        <td className="px-4 py-3 text-xs">{fieldLabel(String(issue.field))}</td>
        <td className="px-4 py-3 text-xs font-mono">{issue.currentValue || "–"}</td>
        <td className="px-4 py-3 text-xs">
          {suggestion?.text ? (
            <div className="space-y-1">
              <span className="text-emerald-700 font-medium">{suggestion.text}</span>
              <div className="flex items-center gap-1">{sourceBadge(suggestion.source ?? "DATA")}</div>
            </div>
          ) : (
            <span className="text-gray-400">{t("results.missing.noSuggestion")}</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${decisionTone(decision)}`}>
            {isSaving ? "..." : decisionLabel(decision)}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-1">
            <button
              onClick={() => persistReviewDecision(itemId, "ACCEPTED")}
              disabled={decision === "ACCEPTED" || isSaving}
              className="p-1 rounded hover:bg-emerald-50 text-emerald-600 disabled:opacity-30"
              title={t("decision.ACCEPTED")}
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => persistReviewDecision(itemId, "REJECTED")}
              disabled={decision === "REJECTED" || isSaving}
              className="p-1 rounded hover:bg-red-50 text-red-500 disabled:opacity-30"
              title={t("decision.REJECTED")}
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  // Zeile fuer einen Duplikate-Cluster
  function DupRow({ cluster }: { cluster: DuplicateCluster }) {
    const reviewItem = getDuplicateReviewItem(cluster);
    const itemId = getDuplicateReviewItemId(cluster);
    const decision = (reviewItem?.decision ?? "PENDING") as DecisionState;
    const ref = recordMap.get(cluster.referenceId);
    const members = cluster.memberIds.map((id) => recordMap.get(id)).filter(Boolean) as GebauerRecord[];

    return (
      <tr className="border-b last:border-0 hover:bg-gray-50">
        <td className="px-4 py-3 text-xs text-gray-500 font-mono">{cluster.clusterId}</td>
        <td className="px-4 py-3 text-sm">{ref?.name1 || cluster.referenceId}</td>
        <td className="px-4 py-3 text-xs">
          <div className="space-y-0.5">
            {members.map((m) => (
              <div key={m.id} className="text-gray-700">{m.name1}</div>
            ))}
          </div>
        </td>
        <td className="px-4 py-3 text-xs">{Math.round(cluster.similarityAvg * 100)}%</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${decisionTone(decision)}`}>
            {decisionLabel(decision)}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-1 items-center">
            <button
              onClick={() => persistReviewDecision(itemId, "ACCEPTED")}
              disabled={decision === "ACCEPTED"}
              className="p-1 rounded hover:bg-emerald-50 text-emerald-600 disabled:opacity-30"
              title="Duplikat bestätigen"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => persistReviewDecision(itemId, "REJECTED")}
              disabled={decision === "REJECTED"}
              className="p-1 rounded hover:bg-red-50 text-red-500 disabled:opacity-30"
              title="Kein Duplikat"
            >
              <XCircle className="w-4 h-4" />
            </button>
            <Link
              to={`/results/${cluster.clusterId}${state.jobId ? `?runId=${encodeURIComponent(state.jobId)}` : ""}`}
              className="p-1 rounded text-gray-500 hover:text-gray-700 text-[11px] border border-gray-200 px-2"
            >
              Detail
            </Link>
          </div>
        </td>
      </tr>
    );
  }

  // Metriken-Uebersicht oben
  const totalIssues = counts.dup + counts.missing + counts.format + counts.incomplete;
  const acceptedCount = [...state.decisions.values()].filter((d) => d === "ACCEPTED").length;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6 space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t("results.title")}</h1>
          <p className="text-sm text-gray-600 mt-1">{t("results.subtitle")}</p>
          {state.runFolder && (
            <button
              onClick={() => navigate(`/run/${state.runFolder}`)}
              className="mt-1 text-xs text-[var(--brand)] hover:underline"
            >
              Pipeline-Protokoll anzeigen
            </button>
          )}
        </div>
        <Button variant="outline" onClick={() => navigate("/")} startIcon={<LayoutDashboard className="w-4 h-4" />}>
          Dashboard
        </Button>
      </header>

      {/* Metriken */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Datensätze", value: records.length },
          { label: "Probleme gesamt", value: totalIssues },
          { label: "Akzeptiert", value: acceptedCount },
          { label: "Ausstehend", value: totalIssues - acceptedCount - [...state.decisions.values()].filter((d) => d === "REJECTED").length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-2xl font-semibold text-gray-800 mt-1">{value}</div>
          </div>
        ))}
      </div>

      {/* Kategorie-Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(Object.entries(categoryMeta) as [CategoryKey, typeof categoryMeta[CategoryKey]][]).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeCategory === key
                ? "border-[var(--brand)] text-[var(--brand)]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t(meta.shortKey)}
            <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Tabellen je Kategorie */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {activeCategory === "dup" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-600 border-b">
                <tr>
                  {["Cluster", "Referenz", "Mitglieder", "Ähnlichkeit", "Status", "Aktion"].map((h) => (
                    <th key={h} className="px-4 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current?.duplicateClusters.length === 0
                  ? <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-sm">{t("results.empty")}</td></tr>
                  : current?.duplicateClusters.map((c) => <DupRow key={c.clusterId} cluster={c} />)
                }
              </tbody>
            </table>
          </div>
        )}

        {activeCategory !== "dup" && (() => {
          const issueMap: Record<Exclude<CategoryKey, "dup">, Issue[]> = {
            missing:    current?.missingIssues ?? [],
            format:     current?.formatIssues ?? [],
            incomplete: current?.incompleteIssues ?? [],
          };
          const issues = issueMap[activeCategory as Exclude<CategoryKey, "dup">] ?? [];
          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs text-gray-600 border-b">
                  <tr>
                    {["ID", "Name", "Feld", "Aktuell", "Vorschlag", "Status", "Aktion"].map((h) => (
                      <th key={h} className="px-4 py-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {issues.length === 0
                    ? <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">{t("results.empty")}</td></tr>
                    : issues.map((issue, i) => <IssueRow key={`${issue.recordId}-${String(issue.field)}-${i}`} issue={issue} issues={issues} />)
                  }
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
