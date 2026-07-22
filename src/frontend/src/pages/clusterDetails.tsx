// Dubletten-Detail: Entscheidungen aus Context, kein Server-Aufruf

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../ui/button";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { GebauerRecord, ReviewItem } from "../domain/types";
import { useI18n } from "../context/i18nContext";
import { useAnalysis } from "../context/analysisContext";

type DecisionState = "PENDING" | "ACCEPTED" | "REJECTED";

function similarity(a: string, b: string): number {
  const s1 = a.toLowerCase(), s2 = b.toLowerCase();
  if (!s1 && !s2) return 100;
  if (!s1 || !s2) return 0;
  let matches = 0;
  const len = Math.max(s1.length, s2.length);
  for (let i = 0; i < len; i++) if (s1[i] && s2.includes(s1[i])) matches++;
  return Math.round((matches / len) * 100);
}

type DiffInfo = { label: string; field: keyof GebauerRecord; refValue: string; value: string };

function buildDiffs(ref: GebauerRecord, cand: GebauerRecord, t: (k: string) => string): DiffInfo[] {
    [
    { label: "Name",                         field: "name1"  },
    { label: t("clusterDetails.streetLabel"), field: "zeile1" },
    { label: "PLZ",                           field: "plz"    },
    { label: t("clusterDetails.cityLabel"),   field: "ort"    },
    { label: t("clusterDetails.countryLabel"),field: "land"   },
  ].map(({ label, field }) => ({
    label, field,
    refValue: String(ref[field] ?? ""),
    value: String(cand[field] ?? ""),
  }));
}

export default function ClusterDetails() {
  const { clusterId } = useParams<{ clusterId: string }>();
  const navigate = useNavigate();
  const { state, updateDecision } = useAnalysis();
  const { t } = useI18n();
  const [savingDecision, setSavingDecision] = useState<DecisionState | null>(null);

  const analysis = state.analysis;

  // ReviewItems mit aktuellen Entscheidungen aus Context zusammenfuehren
  const reviewItemsByItemId = useMemo(
    () => new Map(
      state.reviewItems
        .map((item) => [item.itemId, { ...item, decision: state.decisions.get(item.itemId) ?? item.decision }] as const)
    ),
    [state.reviewItems, state.decisions]
  );

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t("clusterDetails.noAnalysisTitle")}</h1>
        <p className="text-sm text-gray-600 mb-4">{t("clusterDetails.noAnalysisText")}</p>
        <Button onClick={() => navigate("/start")}>{t("clusterDetails.startCheckButton")}</Button>
      </div>
    );
  }

  const clusterIndex = analysis.duplicateClusters.findIndex((c) => c.clusterId === clusterId);
  const cluster = clusterIndex >= 0 ? analysis.duplicateClusters[clusterIndex] : undefined;

  if (!cluster) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-6">
        <Button variant="outline" onClick={() => navigate("/results")} className="mb-4" startIcon={<ArrowLeft className="w-4 h-4" />}>
          {t("clusterDetails.backToResults")}
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t("clusterDetails.notFoundTitle")}</h1>
      </div>
    );
  }

  const recordMap = new Map(analysis.records.map((r) => [r.id, r]));
  const reviewItemId = String(cluster.itemId ?? `dup:${cluster.clusterId}`);
  const reviewItem = reviewItemsByItemId.get(reviewItemId) as ReviewItem & { decision: DecisionState } | undefined;
  const decision = reviewItem?.decision ?? "PENDING";

  function persistDecision(next: DecisionState) {
    setSavingDecision(next);
    updateDecision(reviewItemId, next);
    setSavingDecision(null);
  }

  function decisionLabel(d: DecisionState): string {
    const key = `decision.${d}`;
    const translated = t(key);
    return translated === key ? d : translated;
  }

  function decisionTone(d: DecisionState): string {
    if (d === "ACCEPTED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (d === "REJECTED") return "border-gray-300 bg-gray-100 text-gray-700";
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  const label = `D-${clusterIndex + 1}`;
  const reference = recordMap.get(cluster.referenceId);
  const members = cluster.memberIds.map((id) => recordMap.get(id)).filter((r): r is GebauerRecord => !!r);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate("/results")} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" />{t("clusterDetails.backToResults")}
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">{t("clusterDetails.titlePrefix")} {label}</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">{t("clusterDetails.intro")}</p>
        </div>

        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm px-4 py-3 text-xs text-gray-600">
          <div className="font-semibold text-gray-800 mb-1">{t("clusterDetails.summaryTitle")}</div>
          <div>{members.length} {t("clusterDetails.summaryRecordsLabel")}</div>
          <div>{t("clusterDetails.summaryAvgSimilarityLabel")}: {cluster.similarityAvg}%</div>
          <div className="mt-2">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${decisionTone(decision)}`}>
              {savingDecision ? t("common.loading") : decisionLabel(decision)}
            </span>
          </div>
        </div>
      </header>

      {reviewItem?.suggestion.text && (
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
          <span className="font-medium text-gray-900">{t("results.table.aiSuggestion")}:</span> {reviewItem.suggestion.text}
        </div>
      )}

      {/* Mitglieder-Karten */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {members.map((rec) => {
          const isRef = rec.id === cluster.referenceId;
          const diffs = reference ? buildDiffs(reference, rec, t) : [];
          const nameSim = reference ? similarity(reference.name1, rec.name1) : cluster.similarityAvg;

          return (
            <article key={rec.id} className={`rounded-2xl border shadow-sm px-4 py-3 bg-white flex flex-col gap-2 ${isRef ? "border-emerald-300 ring-1 ring-emerald-100" : "border-gray-200"}`}>
              <header className="flex items-start justify-between gap-2">
                <div>
                  <span className={`text-sm font-semibold ${isRef ? "text-emerald-700" : "text-gray-900"}`}>{rec.name1 || "–"}</span>
                  <span className="text-[11px] text-gray-500 block">{t("clusterDetails.recordIdLabel")}: {rec.id}</span>
                </div>
                {isRef
                  ? <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-medium text-emerald-700 border border-emerald-100">{t("clusterDetails.referenceBadge")}</span>
                  : <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-medium text-blue-700 border border-blue-100">{t("clusterDetails.similarityBadgeLabel")}: {nameSim}%</span>
                }
              </header>

              <div className="text-xs text-gray-700 space-y-1">
                <div><span className="font-medium">{t("clusterDetails.cityLabel")}:</span> {rec.plz} {rec.ort || "–"}</div>
                <div><span className="font-medium">{t("clusterDetails.streetLabel")}:</span> {rec.zeile1 || <span className="italic text-gray-400">{t("clusterDetails.emptyValue")}</span>}</div>
                <div className="text-gray-500"><span className="font-medium">{t("clusterDetails.countryLabel")}:</span> {rec.land || "–"}</div>
              </div>

              {!isRef && reference && (
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <div className="text-[11px] font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />{t("clusterDetails.diffTitle")}
                  </div>
                  <ul className="space-y-1 text-[11px] text-gray-700">
                    {diffs.map((d) => {
                      const equal = d.value.trim().toLowerCase() === d.refValue.trim().toLowerCase();
                      return (
                        <li key={d.field} className="flex gap-2">
                          <span className={`mt-[1px] inline-flex w-3 h-3 rounded-full ${equal ? "bg-emerald-400" : "bg-red-400"}`} />
                          <div>
                            <span className="font-medium">{d.label}: </span>
                            {equal
                              ? <span className="text-gray-500">{t("clusterDetails.diffEqual")}</span>
                              : <><span className="text-gray-900">{d.value || <span className="italic text-gray-400">{t("clusterDetails.emptyValue")}</span>}</span><span className="text-gray-500"> ({t("clusterDetails.diffReferencePrefix")}: <span className="italic">{d.refValue || "–"}</span>)</span></>
                            }
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* Aktions-Buttons */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-[11px] text-gray-500 max-w-xl">{t("clusterDetails.actionsHint")}</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => persistDecision("ACCEPTED")} startIcon={<CheckCircle className="w-4 h-4" />} disabled={savingDecision !== null}>
            {t("clusterDetails.actionMerge")}
          </Button>
          <Button variant="outline" onClick={() => persistDecision("REJECTED")} startIcon={<XCircle className="w-4 h-4" />} disabled={savingDecision !== null}>
            {t("clusterDetails.actionNoDuplicate")}
          </Button>
          {decision !== "PENDING" && (
            <Button variant="outline" onClick={() => persistDecision("PENDING")} disabled={savingDecision !== null}>
              {t("results.actions.reset")}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
