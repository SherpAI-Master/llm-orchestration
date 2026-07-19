// src/pages/dashboard.tsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/button";
import MetricCard from "../ui/metricCard";
import { useAnalysis } from "../context/analysisContext";
import { useI18n } from "../context/i18nContext";

type QualityKey = "dup" | "missing" | "format" | "incomplete";

type QualityItem = {
  key: QualityKey;
  label: string;
  value: number;
  description: string;
};

export default function Dashboard() {
  const { state } = useAnalysis();
  const analysis = state.analysis;
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  // KPI-Berechnung
  const { recordsDisplay, anomalousPercent, anomalousRecords } = useMemo(
    () => {
      if (!analysis) {
        return {
          recordsDisplay: "–",
          anomalousPercent: "–",
          anomalousRecords: 0,
        };
      }

      const total = analysis.records.length;
      const issueIds = new Set<string>();

      analysis.missingIssues.forEach((i) => issueIds.add(i.recordId));
      analysis.formatIssues.forEach((i) => issueIds.add(i.recordId));
      analysis.incompleteIssues.forEach((i) => issueIds.add(i.recordId));
      analysis.duplicateClusters.forEach((c) =>
        c.memberIds.forEach((id) => issueIds.add(id))
      );

      const anomalous = issueIds.size;
      const percent =
        total > 0 ? `${Math.round((anomalous / total) * 100)} %` : "0 %";

      return {
        recordsDisplay: total.toString(),
        anomalousPercent: percent,
        anomalousRecords: anomalous,
      };
    },
    [analysis]
  );

  // Übersicht der Problemklassen
  const qualityOverview: QualityItem[] = useMemo(() => {
    if (!analysis) {
      return [
        {
          key: "dup",
          label: t("dashboard.dist.dup.label"),
          value: 0,
          description: t("dashboard.dist.dup.desc"),
        },
        {
          key: "missing",
          label: t("dashboard.dist.missing.label"),
          value: 0,
          description: t("dashboard.dist.missing.desc"),
        },
        {
          key: "format",
          label: t("dashboard.dist.format.label"),
          value: 0,
          description: t("dashboard.dist.format.desc"),
        },
        {
          key: "incomplete",
          label: t("dashboard.dist.incomplete.label"),
          value: 0,
          description: t("dashboard.dist.incomplete.desc"),
        },
      ];
    }

    const dupCount = analysis.duplicateClusters.length;
    const missingCount = analysis.missingIssues.length;
    const formatCount = analysis.formatIssues.length;
    const incompleteCount = analysis.incompleteIssues.length;

    return [
      {
        key: "dup",
        label: t("dashboard.dist.dup.label"),
        value: dupCount,
        description: t("dashboard.dist.dup.desc"),
      },
      {
        key: "missing",
        label: t("dashboard.dist.missing.label"),
        value: missingCount,
        description: t("dashboard.dist.missing.desc"),
      },
      {
        key: "format",
        label: t("dashboard.dist.format.label"),
        value: formatCount,
        description: t("dashboard.dist.format.desc"),
      },
      {
        key: "incomplete",
        label: t("dashboard.dist.incomplete.label"),
        value: incompleteCount,
        description: t("dashboard.dist.incomplete.desc"),
      },
    ];
  }, [analysis, t]);

  const maxValue =
    qualityOverview.length > 0
      ? Math.max(...qualityOverview.map((q) => q.value))
      : 0;

  // Datum des letzten Laufs (MVP: aktuelles Datum, sobald eine Analyse existiert)
  const lastRunDate = analysis
    ? new Date().toLocaleDateString(lang === "de" ? "de-DE" : "en-US")
    : t("dashboard.kpi.lastRun.none");

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 w-full md:w-auto">
          <Button onClick={() => navigate("/start")}>
            {t("dashboard.btn.newVerification")}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              navigate(state.jobId ? `/results?runId=${encodeURIComponent(state.jobId)}` : "/results")
            }
            disabled={!analysis}
          >
            {t("dashboard.btn.showResults")}
          </Button>
        </div>
      </header>

      {/* KPI-Row */}
      <section className="grid gap-4 md:grid-cols-3 mb-6">
        <MetricCard
          title={t("dashboard.kpi.records")}
          value={recordsDisplay}
          change=""
          positive
        />
        <MetricCard
          title={t("dashboard.kpi.anomalousShare")}
          value={anomalousPercent}
          change=""
        />
        <MetricCard
          title={t("dashboard.kpi.lastRun")}
          value={lastRunDate}
          change=""
        />
      </section>

      {/* Problemklassen + Info-Karten */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Problemklassen-Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {t("dashboard.distribution.title")}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {t("dashboard.distribution.subtitle")}
              </p>
            </div>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium"
              style={{
                backgroundColor: "var(--brand)",
                color: "white",
              }}
            >
              {analysis
                ? t("dashboard.distribution.badge.live")
                : t("dashboard.distribution.badge.ready")}
            </span>
          </div>

          <div className="space-y-4 mt-2">
            {qualityOverview.map((item) => (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">
                    {item.label}
                  </span>
                  <span className="text-gray-700 font-semibold">
                    {item.value}
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width:
                        maxValue > 0
                          ? `${(item.value / maxValue) * 100}%`
                          : "0%",
                      backgroundColor: "var(--brand)",
                    }}
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Rechte Spalte: Verifizierungsbereiche + Status */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("dashboard.areas.title")}
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              {t("dashboard.areas.subtitle")}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-gray-600">
              <li>• {t("dashboard.areas.item.dup")}</li>
              <li>• {t("dashboard.areas.item.missing")}</li>
              <li>• {t("dashboard.areas.item.format")}</li>
              <li>• {t("dashboard.areas.item.incomplete")}</li>
              <li>• {t("dashboard.areas.item.enrichment")}</li>
            </ul>
            <Button
              className="mt-4 w-full"
              variant="outline"
              onClick={() =>
                navigate(state.jobId ? `/results?runId=${encodeURIComponent(state.jobId)}` : "/results")
              }
              disabled={!analysis}
            >
              {t("dashboard.areas.btn.showResults")}
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-sm text-gray-700">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("dashboard.status.title")}
            </h3>
            <p className="mt-2 text-[11px] text-gray-500">
              {t("dashboard.status.text")}
            </p>
          </div>
        </div>
      </section>

      {/* Zusammenfassung des letzten Laufs */}
      <section className="mt-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">
          {t("dashboard.summary.title")}
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 text-sm text-gray-700">
          {analysis && state.jobId ? (
            <>
              <p className="font-medium">
                {t("dashboard.summary.withRun.prefix")} {lastRunDate} –{" "}
                {t("dashboard.summary.withRun.jobId")}{" "}
                <code>{state.jobId}</code>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {lang === "de"
                  ? `Geprüfte Datensätze: ${recordsDisplay}, davon ${anomalousRecords} mit mindestens einer Auffälligkeit.`
                  : `Checked records: ${recordsDisplay}, of which ${anomalousRecords} contain at least one anomaly.`}
              </p>
            </>
          ) : (
            <>
              <p className="font-medium">
                {t("dashboard.summary.none.title")}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t("dashboard.summary.none.text")}
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
