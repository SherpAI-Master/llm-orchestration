// Pipeline-Timeline fuer einen llm-orchestration Run-Ordner anzeigen

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useAnalysis } from "../context/analysisContext";
import { useI18n } from "../context/i18nContext";

type Schritt = {
  schritt: number;
  toolKey: string;
  name: string;
  datensaetze: number;
  timestamp: string | null;
  datei: string;
};

export default function RunDetails() {
  const { folder } = useParams<{ folder: string }>();
  const { state } = useAnalysis();
  const navigate = useNavigate();
  const { lang } = useI18n();
  const [schritte, setSchritte] = useState<Schritt[]>([]);
  const [laden, setLaden] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);

  // Schritte aus dem Dateisystem ueber die Bridge API laden
  useEffect(() => {
    if (!folder) return;
    setLaden(true);
    fetch(`/api/run/${folder}/steps`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Schritt[]>;
      })
      .then(setSchritte)
      .catch((e) => setFehler(String(e)))
      .finally(() => setLaden(false));
  }, [folder]);

  function formatZeit(ts: string | null): string {
    if (!ts) return "–";
    return new Date(ts).toLocaleTimeString(lang === "de" ? "de-DE" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  // Pool-Farbe fuer visuelle Unterscheidung der Tool-Gruppen
  function schrittFarbe(toolKey: string): string {
    if (toolKey.startsWith("detection")) return "bg-blue-50 border-blue-200 text-blue-700";
    if (toolKey.startsWith("correction")) return "bg-amber-50 border-amber-200 text-amber-700";
    if (toolKey.startsWith("integration")) return "bg-emerald-50 border-emerald-200 text-emerald-700";
    return "bg-gray-50 border-gray-200 text-gray-700";
  }

  const meta = state.meta;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6 space-y-4 max-w-3xl">
      <button
        onClick={() => navigate("/results")}
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zu Ergebnissen
      </button>

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Pipeline-Protokoll</h1>
        <p className="text-xs text-gray-500 font-mono mt-1">{folder}</p>
        {meta && (
          <p className="text-sm text-gray-600 mt-1">
            Job: <span className="font-medium">{meta.jobName}</span>
          </p>
        )}
      </div>

      {laden && <p className="text-sm text-gray-500">Lade Pipeline-Schritte...</p>}
      {fehler && <p className="text-sm text-red-600">{fehler}</p>}

      {!laden && schritte.length === 0 && !fehler && (
        <p className="text-sm text-gray-500">Keine Schritte gefunden.</p>
      )}

      <div className="space-y-2">
        {schritte.map((s) => (
          <div
            key={s.schritt}
            className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-900">{s.name}</div>
                <div className="mt-0.5">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${schrittFarbe(s.toolKey)}`}>
                    {s.schritt < 10 ? `0${s.schritt}` : s.schritt}
                    {" "}
                    {s.toolKey.split("_")[0].toUpperCase()}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono mt-0.5">{s.datei}</div>
              </div>
            </div>
            <div className="text-right shrink-0 space-y-0.5">
              <div className="text-xs font-mono text-gray-500">{formatZeit(s.timestamp)}</div>
              <div className="text-[11px] text-gray-400">{s.datensaetze} Datensätze</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
