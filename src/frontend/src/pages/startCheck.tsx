// Upload-Seite: CSV hochladen, Pipeline starten, auf Ergebnis warten

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/button";
import LoadingState from "../ui/loadingState";
import { useAnalysis } from "../context/analysisContext";
import { useI18n } from "../context/i18nContext";
import type { AnalysisResult, ReviewItem } from "../domain/types";

type DatasetType = "suppliers" | "customers" | "addresses";
type UseCaseType = "duplicates" | "address_cleaning" | "enrichment" | "all";
type BackendStatus = "checking" | "online" | "offline";

type ApiResponse = {
  result: AnalysisResult;
  reviewItems: ReviewItem[];
  runFolder: string;
};

export default function StartCheck() {
  const { setResult } = useAnalysis();
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [isDragging, setIsDragging] = useState(false);

  const [jobName, setJobName] = useState("");
  const [datasetType, setDatasetType] = useState<DatasetType>("suppliers");
  const [useCase, setUseCase] = useState<UseCaseType>("all");
  const [project, setProject] = useState("default");

  // Verbindungsstatus zur Bridge API pruefen
  useEffect(() => {
    const controller = new AbortController();
    setBackendStatus("checking");
    fetch("/api/health", { signal: controller.signal })
      .then(async (r) => {
        const body = (await r.json().catch(() => ({}))) as { status?: string };
        setBackendStatus(body.status === "ok" ? "online" : "offline");
      })
      .catch(() => setBackendStatus("offline"));
    return () => controller.abort();
  }, []);

  function readFile(file: File) {
    setFileName(file.name);
    setSelectedFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText((ev.target?.result as string) || "");
    reader.readAsText(file, "utf-8");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  }

  async function handleStart() {
    if (!selectedFile || !csvText.trim()) { setError(t("start.error.noFile")); return; }
    if (!jobName.trim()) { setError(t("start.error.noJobName")); return; }

    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Analyse-Pipeline starten (kann mehrere Minuten dauern)
      const response = await fetch("/api/process", { method: "POST", body: formData });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail || `Fehler ${response.status}`);
      }

      const body = (await response.json()) as ApiResponse;

      // Ergebnis im globalen Context speichern
      setResult({
        analysis: body.result,
        reviewItems: body.reviewItems,
        jobId: `job_${body.runFolder}`,
        meta: {
          jobName,
          datasetType,
          useCase,
          project,
          startedAt: new Date().toISOString(),
        },
        runFolder: body.runFolder,
      });

      navigate("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Ladeansicht waehrend Pipeline laeuft
  if (isSubmitting) {
    return (
      <LoadingState
        title="Analyse läuft..."
        message="Die KI-Pipeline verarbeitet die Daten. Dies kann einige Minuten dauern."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-6 py-8">
      <div className="w-full max-w-6xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">{t("start.title")}</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">{t("start.subtitle")}</p>
        </header>

        {/* Schritt-Indikator */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-[11px] font-semibold">1</div>
            <span>{t("start.step1")}</span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="flex items-center gap-2 opacity-60">
            <div className="h-6 w-6 rounded-full border border-gray-300 flex items-center justify-center text-[11px]">2</div>
            <span>{t("start.step2")}</span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="flex items-center gap-2 opacity-40">
            <div className="h-6 w-6 rounded-full border border-gray-200 flex items-center justify-center text-[11px]">3</div>
            <span>{t("start.step3")}</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 items-start">
          {/* Konfiguration */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">{t("start.config.title")}</h2>

            {[
              { label: t("start.config.jobName.label"), el: (
                <input
                  type="text"
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/40"
                  placeholder={t("start.config.jobName.placeholder")}
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                />
              )},
              { label: t("start.config.datasetType.label"), el: (
                <select className="w-full border rounded-xl px-3 py-2 text-sm bg-white" value={datasetType} onChange={(e) => setDatasetType(e.target.value as DatasetType)}>
                  <option value="suppliers">{t("start.config.datasetType.suppliers")}</option>
                  <option value="customers">{t("start.config.datasetType.customers")}</option>
                  <option value="addresses">{t("start.config.datasetType.addresses")}</option>
                </select>
              )},
              { label: t("start.config.useCase.label"), el: (
                <select className="w-full border rounded-xl px-3 py-2 text-sm bg-white" value={useCase} onChange={(e) => setUseCase(e.target.value as UseCaseType)}>
                  <option value="all">{t("start.config.useCase.all")}</option>
                  <option value="duplicates">{t("start.config.useCase.duplicates")}</option>
                  <option value="address_cleaning">{t("start.config.useCase.address_cleaning")}</option>
                  <option value="enrichment">{t("start.config.useCase.enrichment")}</option>
                </select>
              )},
              { label: t("start.config.project.label"), el: (
                <select className="w-full border rounded-xl px-3 py-2 text-sm bg-white" value={project} onChange={(e) => setProject(e.target.value)}>
                  <option value="default">{t("start.config.project.default")}</option>
                  <option value="mandant_a">{t("start.config.project.mandant_a")}</option>
                  <option value="mandant_b">{t("start.config.project.mandant_b")}</option>
                </select>
              )},
            ].map(({ label, el }) => (
              <div key={label} className="space-y-1">
                <label className="text-xs font-medium text-gray-700">{label}</label>
                {el}
              </div>
            ))}
          </div>

          {/* Upload-Zone */}
          <div className="lg:col-span-2 space-y-4">
            <div
              className={`bg-white rounded-2xl border shadow-sm p-6 flex flex-col items-center text-center transition ${
                isDragging ? "border-[var(--brand)] bg-[var(--brand)]/5 border-dashed" : "border-dashed border-gray-300"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}
              onDrop={handleDrop}
            >
              <div className="w-12 h-12 rounded-full bg-[var(--brand)]/5 flex items-center justify-center mb-3">
                <span className="text-[var(--brand)] text-xl">↑</span>
              </div>
              <h2 className="text-sm font-semibold text-gray-900">{t("start.upload.title")}</h2>
              <p className="text-xs text-gray-500 mt-1">{t("start.upload.subtitle")}</p>
              <div className={`mt-2 text-[11px] ${backendStatus === "online" ? "text-emerald-700" : backendStatus === "checking" ? "text-amber-700" : "text-red-700"}`}>
                Bridge API: {backendStatus === "online" ? "online" : backendStatus === "checking" ? "prüfen..." : "offline"}
              </div>
              <label className="mt-4 relative inline-flex items-center px-4 py-2 rounded-full bg-[var(--brand)] text-white text-xs font-medium cursor-pointer">
                <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                {t("start.upload.button")}
              </label>
              {fileName
                ? <span className="mt-2 text-[11px] text-gray-500">Datei: <span className="font-mono">{fileName}</span></span>
                : <span className="mt-2 text-[11px] text-gray-400">{t("start.upload.noFile")}</span>
              }
              {error && <p className="mt-3 text-[11px] text-red-600">{error}</p>}
            </div>

            {/* CSV-Vorschau */}
            {csvText && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <span className="text-xs font-medium text-gray-700">{t("start.preview.title")}</span>
                <textarea
                  className="mt-2 w-full h-32 border rounded-xl p-3 font-mono text-[11px] bg-gray-50"
                  value={csvText.split("\n").slice(0, 8).join("\n")}
                  readOnly
                />
              </div>
            )}

            <div className="flex gap-2 sm:justify-end">
              <Button onClick={() => void handleStart()} disabled={!csvText || !jobName}>
                {t("start.actions.start")}
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                {t("start.actions.cancel")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
