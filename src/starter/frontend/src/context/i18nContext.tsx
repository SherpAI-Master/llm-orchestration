// src/context/i18nContext.tsx

import * as React from "react";
import type { ReactNode } from "react";

export type Language = "de" | "en";

type I18nDictionary = {
  [key: string]: string | I18nDictionary;
};

type I18nContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (
    key: string,
    params?: Record<string, string | number | boolean | null | undefined>
  ) => string;
};

const translations: Record<Language, I18nDictionary> = {
  de: {
    // Navbar
    "nav.searchPlaceholder": "Suchen...",
    "nav.language.de": "DE",
    "nav.language.en": "EN",

    // Sidebar
    "sidebar.dashboard": "Dashboard",
    "sidebar.results": "Ergebnisse",
    "sidebar.history": "Historie",
    "sidebar.erpSimulator": "ERP-Simulator",
    "sidebar.profile": "Profil",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.subtitle":
      "Überblick über den aktuellen Zustand der Stammdatenqualität und die Ergebnisse des letzten Verifikationslaufs.",

    "dashboard.btn.newVerification": "Neue Verifikation starten",
    "dashboard.btn.showResults": "Ergebnisse anzeigen",

    "dashboard.kpi.records": "Geprüfte Datensätze (aktuelle Session)",
    "dashboard.kpi.anomalousShare": "Anteil auffälliger Stammdaten",
    "dashboard.kpi.lastRun": "Letzter Verifikationslauf",
    "dashboard.kpi.lastRun.none": "Noch keiner gestartet",

    "dashboard.distribution.title":
      "Verteilung der erkannten Datenqualitätsprobleme",
    "dashboard.distribution.subtitle":
      "Übersicht über die im letzten Verifikationslaufs identifizierten Problemklassen.",
    "dashboard.distribution.badge.live": "Live",
    "dashboard.distribution.badge.ready": "Bereit",

    "dashboard.dist.dup.label": "Dubletten",
    "dashboard.dist.dup.desc":
      "Clustern von Datensätzen mit hoher Ähnlichkeit in Name und Adresse.",
    "dashboard.dist.missing.label": "Fehlende Pflichtfelder",
    "dashboard.dist.missing.desc":
      "Fehlende Pflichtfelder (z. B. PLZ, Ort, USt-ID, Steuernummer).",
    "dashboard.dist.format.label": "Format- & Strukturfehler",
    "dashboard.dist.format.desc":
      "Ungültige Formate oder Strukturverletzungen (PLZ, USt-ID, Ländercodes).",
    "dashboard.dist.incomplete.label": "Unvollständige Adressen",
    "dashboard.dist.incomplete.desc":
      "Adressen ohne Hausnummer oder mit unklaren Angaben.",

    "dashboard.areas.title": "Verifizierungsbereiche in SherpAI",
    "dashboard.areas.subtitle":
      "Die Plattform bündelt mehrere Klassen von Datenqualitätsproblemen in einem Lauf:",
    "dashboard.areas.item.dup":
      "Dubletten und semantisch ähnliche Einträge",
    "dashboard.areas.item.missing":
      "Fehlende Pflichtfelder, insbesondere Straße, PLZ, Ort und Land",
    "dashboard.areas.item.format":
      "Format- und Normalisierungsfehler, z. B. bei PLZ, USt-ID oder Zeichenkodierung",
    "dashboard.areas.item.incomplete":
      "Unvollständige Adressen, z. B. fehlende Hausnummer, PLZ, Ort oder Land",
    "dashboard.areas.item.enrichment":
      "Datenbasierte Anreicherungsvorschläge durch Mini-Dorothe auf Basis des vorhandenen Bestands",
    "dashboard.areas.btn.showResults":
      "Ergebnisse der aktuellen Prüfung ansehen",

    "dashboard.status.title": "Systemstatus & Ausblick",
    "dashboard.status.text":
      "Das System wurde so entwickelt, dass später trainierte KI-Modelle, spezialisierte Matching-Komponenten und LLM-basierte Hinweislogiken modular angebunden werden können. In einer produktiven Ausbaustufe können hier zusätzlich Laufzeiten, Vergleiche mehrerer Verifikationsläufe und Trends der Datenqualität über die Zeit angezeigt werden.",

    "dashboard.summary.title": "Zusammenfassung des letzten Verifikationslaufs",
    "dashboard.summary.none.title":
      "Noch kein Verifikationslauf durchgeführt",
    "dashboard.summary.none.text":
      "Starte einen ersten Verifikationslauf, um hier eine zusammenfassende Auswertung zu erhalten. Die Plattform zeigt anschließend erkannte Problemklassen, betroffene Datensätze und mögliche Maßnahmen.",
    "dashboard.summary.withRun.prefix": "Verifikationslauf vom",
    "dashboard.summary.withRun.jobId": "Job-ID",

    // StartCheck / Neue Verifikation
    "start.title": "Neue Datenverifikation",
    "start.subtitle":
      "Lade einen ERP-Stammdatenauszug als CSV hoch und starte einen neuen Verifikationslauf. Die Plattform prüft die Daten anschließend auf Dubletten, fehlende Felder, Formatfehler und unvollständige Adressen.",
    "start.lastRun.label": "Letzter Verifikationslauf",
    "start.lastRun.unnamed": "Ohne Namen",

    "start.step1": "Upload & Konfiguration",
    "start.step2": "Analyse & Ergebnisse",
    "start.step3": "Freigabe & Export",

    "start.config.title": "Verifikationslauf konfigurieren",
    "start.config.jobName.label": "Name des Verifikationslaufs",
    "start.config.jobName.placeholder":
      "z. B. Adress-Check Q2 Lieferanten",
    "start.config.datasetType.label": "Datensatz-Typ",
    "start.config.datasetType.suppliers": "Lieferantenstammdaten",
    "start.config.datasetType.customers": "Kundenstammdaten",
    "start.config.datasetType.addresses": "Adressbestände",

    "start.config.useCase.label": "Fokus-Use-Case",
    "start.config.useCase.all": "Gesamter Qualitätscheck",
    "start.config.useCase.duplicates": "Dublettenerkennung",
    "start.config.useCase.address_cleaning": "Adressbereinigung",
    "start.config.useCase.enrichment": "Externe Anreicherung",

    "start.config.project.label": "Projekt / Mandant",
    "start.config.project.default": "Hauptmandant",
    "start.config.project.mandant_a": "Mandant A",
    "start.config.project.mandant_b": "Mandant B",

    "start.config.hint":
      "Die gewählten Einstellungen können in einer späteren Ausbaustufe zur Auswertung nach Mandant, Use Case und Zeitraum verwendet werden.",

    "start.upload.title": "Datei hierher ziehen oder auswählen",
    "start.upload.subtitle":
      "Unterstützt werden CSV-Exporte aus ERP-Systemen (z. B. Kunden-, Lieferanten- oder Adressstammdaten).",
    "start.upload.button": "Datei auswählen",
    "start.upload.selectedFile.prefix": "Ausgewählt:",
    "start.upload.noFile": "Noch keine Datei ausgewählt",

    "start.preview.title": "Vorschau des Imports (erste Zeilen)",
    "start.preview.hint":
      "Die eigentliche Verarbeitung erfolgt nach „Verifikation starten“.",

    "start.error.noFile":
      "Bitte lade einen CSV-Export deiner ERP-Stammdaten hoch.",
    "start.error.noJobName":
      "Bitte gib diesem Verifikationslauf einen Namen.",

    "start.actions.start": "Verifikation starten",
    "start.actions.cancel": "Zurück zur Übersicht",

    "mqttSimulator.title": "ERP- und MQTT-Simulator",
    "mqttSimulator.subtitle":
      "Diese Ansicht simuliert ein externes ERP-System. Eine CSV-Datei wird zunächst als Eingangsdokument bereitgestellt und anschließend per MQTT-Nachricht an SherpAI übergeben. Dadurch wird der Verifikationslauf so ausgelöst, wie es in einer gekoppelten Integrationssituation geschehen würde.",
    "mqttSimulator.form.title": "Nachricht aus Quellsystem vorbereiten",
    "mqttSimulator.form.subtitle":
      "Die Datei wird zunächst im Eingangsbereich bereitgestellt. Erst das anschließende MQTT-Publish löst die weitere Verarbeitung aus.",
    "mqttSimulator.form.runName": "Name des Verifikationslaufs",
    "mqttSimulator.form.sourceSystem": "ERP-/Quellsystem",
    "mqttSimulator.form.tenant": "Tenant",
    "mqttSimulator.form.project": "Projekt / Mandant",
    "mqttSimulator.form.datasetType": "Datensatz-Typ",
    "mqttSimulator.form.useCase": "Fokus-Use-Case",
    "mqttSimulator.form.file": "CSV-Datei",
    "mqttSimulator.form.noFile": "Noch keine CSV-Datei ausgewählt",
    "mqttSimulator.form.fileRestoreHint":
      "Der Dateiname wurde wiederhergestellt. Für einen neuen Upload muss die Datei erneut ausgewählt werden.",
    "mqttSimulator.form.stageButton": "Datei bereitstellen",
    "mqttSimulator.form.staging": "Bereitstellung läuft…",
    "mqttSimulator.form.secondaryAction": "Zur Standard-Uploadmaske",
    "mqttSimulator.connection.title": "Broker-Verbindung",
    "mqttSimulator.connection.subtitle":
      "Der Simulator publiziert direkt per MQTT über WebSockets an den Broker.",
    "mqttSimulator.connection.state.connecting": "Verbinde…",
    "mqttSimulator.connection.state.connected": "Verbunden",
    "mqttSimulator.connection.state.reconnecting": "Verbinde erneut…",
    "mqttSimulator.connection.state.error": "Verbindungsfehler",
    "mqttSimulator.connection.state.offline": "Offline",
    "mqttSimulator.payload.title": "MQTT-Nachricht",
    "mqttSimulator.payload.subtitle":
      "Die hier gezeigte Payload entspricht der Nachricht, die ein ERP-nahes System an SherpAI senden würde.",
    "mqttSimulator.payload.topic": "Topic",
    "mqttSimulator.payload.publishButton": "MQTT-Nachricht senden",
    "mqttSimulator.payload.publishing": "Sende Nachricht…",
    "mqttSimulator.payload.readyState": "Nachricht bereit zur Auslösung des Runs",
    "mqttSimulator.payload.sentState": "Nachricht erfolgreich an den Broker publiziert",
    "mqttSimulator.payload.empty":
      "Noch keine Nachricht vorbereitet. Stelle zuerst eine CSV-Datei bereit.",
    "mqttSimulator.payload.platformLinkedState":
      "Dieser Run wurde direkt über SherpAI hochgeladen. Für die ERP-Simulator-Sicht wird deshalb keine separate MQTT-Nachricht angezeigt.",
    "mqttSimulator.activity.title": "Simulator-Aktivität",
    "mqttSimulator.activity.subtitle":
      "Lokale Schritte des simulierten ERP-Clients.",
    "mqttSimulator.activity.empty":
      "Noch keine Aktivität vorhanden. Bereite eine Nachricht vor, um den Ablauf zu starten.",
    "mqttSimulator.activity.stagedTitle": "Datei bereitgestellt",
    "mqttSimulator.activity.publishedTitle": "MQTT-Nachricht gesendet",
    "mqttSimulator.activity.publishFailedTitle": "MQTT-Publish fehlgeschlagen",
    "mqttSimulator.activity.platformUploadTitle": "Datei direkt in SherpAI hochgeladen",
    "mqttSimulator.activity.platformUploadLinkedTitle": "Automatisch in den ERP-Simulator übernommen",
    "mqttSimulator.activity.platformUploadLinkedDetail":
      "Der direkte Plattform-Upload wurde mit der ERP-Simulator-Sicht verknüpft und erscheint dort nun als rückführbarer Run.",
    "mqttSimulator.activity.uploadedAt": "Im ERP-System hochgeladen",
    "mqttSimulator.activity.arrivedAt": "Im Simulator angekommen",
    "mqttSimulator.activity.exportAcceptedTitle": "Selektiven Export bereitgestellt",
    "mqttSimulator.activity.exportAllTitle": "Vollständigen Export bereitgestellt",
    "mqttSimulator.activity.exportFailedTitle": "Export aus SherpAI fehlgeschlagen",
    "mqttSimulator.actions.reset": "Simulator zurücksetzen",
    "mqttSimulator.actions.clearActivity": "Aktivitäten leeren",
    "mqttSimulator.actions.refreshHistory": "Ereignisse aktualisieren",
    "mqttSimulator.actions.clearHistory": "Ereignisse leeren",
    "mqttSimulator.run.title": "SherpAI-Run",
    "mqttSimulator.run.subtitle":
      "Status, Metadaten und Navigation zum ausgelösten Verifikationslauf.",
    "mqttSimulator.run.empty":
      "Noch kein Run angelegt. Sobald die Datei bereitgestellt wurde, erscheint der zugehörige Lauf hier.",
    "mqttSimulator.run.runId": "Run-ID",
    "mqttSimulator.run.filename": "Datei",
    "mqttSimulator.run.createdAt": "Erstellt",
    "mqttSimulator.run.metrics": "Metriken (Datensätze / Issues / Cluster)",
    "mqttSimulator.run.openHistory": "Run-Historie öffnen",
    "mqttSimulator.run.openResults": "Ergebnisse öffnen",
    "mqttSimulator.run.openHistoryLoading":
      "SherpAI öffnet die Run-Historie und lädt die protokollierten Ereignisse.",
    "mqttSimulator.run.openResultsLoading":
      "SherpAI öffnet die Ergebnisse und baut die Review-Sicht für diesen Lauf auf.",
    "mqttSimulator.run.openResultsLoadingShort": "Ergebnisse werden geöffnet…",
    "mqttSimulator.return.title": "SherpAI-Rückführung in den ERP-Simulator",
    "mqttSimulator.return.subtitle":
      "Diese Sicht spiegelt zurück, was SherpAI aus dem ausgelösten Lauf erzeugt hat und welche Exportpfade für die ERP-nahe Weiterverarbeitung bereitstehen.",
    "mqttSimulator.return.empty":
      "Noch kein SherpAI-Lauf vorhanden. Stelle zunächst eine Datei bereit und löse den Run aus.",
    "mqttSimulator.return.findingsTitle": "Von SherpAI zurückgelieferte Ergebnisübersicht",
    "mqttSimulator.return.duplicates": "Dublettencluster",
    "mqttSimulator.return.missing": "Missing Issues",
    "mqttSimulator.return.format": "Format Issues",
    "mqttSimulator.return.incomplete": "Incomplete Issues",
    "mqttSimulator.return.reviewItems": "Review-Objekte",
    "mqttSimulator.return.enrichments": "Deterministische Vorschläge",
    "mqttSimulator.return.llmStatus": "LLM-Status",
    "mqttSimulator.return.pending":
      "Der Run ist analysiert, die Ergebnisübersicht wird noch geladen.",
    "mqttSimulator.return.awaiting":
      "Sobald SherpAI Ergebnisse bereitstellt, erscheinen sie hier im ERP-Simulator.",
    "mqttSimulator.return.exportTitle": "Rückführung und Export",
    "mqttSimulator.return.exportSubtitle":
      "Die ERP-nahe Gegenseite kann SherpAI-Ergebnisse direkt aus dem Simulator abrufen.",
    "mqttSimulator.return.exportAccepted": "Akzeptierte Änderungen exportieren",
    "mqttSimulator.return.exportAll": "Vollständigen Datensatz exportieren",
    "mqttSimulator.return.exportingAccepted": "Export accepted läuft…",
    "mqttSimulator.return.exportingAll": "Export all läuft…",
    "mqttSimulator.history.title": "Vom System protokollierte Ereignisse",
    "mqttSimulator.history.subtitle":
      "Diese Ereignisse stammen aus SherpAI und dokumentieren den Ablauf nach Eingang der MQTT-Nachricht.",
    "mqttSimulator.history.empty":
      "Noch keine Systemereignisse vorhanden. Nach dem Publish erscheinen hier die protokollierten Statusübergänge.",
    "mqttSimulator.history.showDetails": "Details anzeigen",
    "mqttSimulator.error.noFile":
      "Bitte wähle eine CSV-Datei für den Simulator aus.",
    "mqttSimulator.error.notConnected":
      "Der Browser ist aktuell nicht mit dem MQTT-Broker verbunden.",

    "common.pending": "Ausstehend",
    "common.loading": "Speichert…",
    "common.loadingRoute": "Seite wird geöffnet…",
    "common.loadingRouteHint":
      "SherpAI bereitet die nächste Ansicht vor und synchronisiert den aktuellen Zustand.",
    "common.loadingData": "Daten werden geladen…",
    "common.edit": "Bearbeiten",
    "common.export": "Export",
    "common.delete": "Löschen",
    "common.rename": "Umbenennen",
    "common.details": "Details",
    "common.results": "Ergebnisse",
    "common.datasetType": "Kategorie",
    "common.useCase": "Use Case",
    "common.project": "Projekt",
    "history.createdAt": "Erstellt",
    "history.ingestedAt": "Eingelesen",
    "history.analyzedAt": "Analysiert",
    "history.fileSize": "Dateigröße",
    "history.deleteConfirm.title": "Lauf löschen",
    "history.deleteConfirm.message":
      "Möchtest du diesen Lauf wirklich löschen? Dieser Vorgang blendet den Lauf aus der Historie aus.",
    "history.deleteConfirm.cancel": "Abbrechen",
    "history.deleteConfirm.confirm": "Löschen",

    // Results
    "results.title": "Verifikationsergebnisse",
    "results.subtitle":
      "Überblick über Dubletten, fehlende Pflichtangaben, Formatfehler und unvollständige Adressen des letzten Verifikationslaufs.",

    "results.noAnalysis.title": "Keine Ergebnisse vorhanden",
    "results.noAnalysis.text":
      "Es wurden noch keine Daten geprüft. Starte eine neue Verifikation, um von der Mini-KI analysierte Ergebnisse zu sehen.",
    "results.noAnalysis.button": "Verifikation starten",
    "results.loading.title": "Verifikation wird vorbereitet",
    "results.loading.fetching":
      "SherpAI lädt die Ergebnisse und setzt die Review-Sicht für diesen Lauf zusammen.",
    "results.loading.processing":
      'Der Verifikationslauf befindet sich aktuell im Status "{status}". Die Ergebnisse werden automatisch nachgeladen.',

    "results.btn.prepareExport": "Export vorbereiten",
    "results.btn.backToDashboard": "Zurück zum Dashboard",
    "results.runStatus": "Status",
    "results.metrics.durationMs": "Analysezeit (ms)",
    "results.metrics.recordCount": "Datensätze",
    "results.metrics.clusterCount": "Dubletten-Cluster",
    "results.metrics.issueCount": "Probleme gesamt",

    // Kategorien
    "results.categories.dup.label": "Dubletten",
    "results.categories.dup.short": "Dubletten",
    "results.categories.dup.desc":
      "SherpAI hat potenzielle Dubletten in den Stammdaten erkannt. Prüfe die Vorschläge und entscheide, welche Datensätze zusammengeführt werden sollen.",

    "results.categories.missing.label": "Fehlende Pflichtangaben",
    "results.categories.missing.short": "Fehlende Felder",
    "results.categories.missing.desc":
      "SherpAI hat Datensätze mit fehlenden Pflichtfeldern (z. B. PLZ, Ort, Straße, Land) identifiziert.",

    "results.categories.format.label": "Format- & Strukturfehler",
    "results.categories.format.short": "Formatfehler",
    "results.categories.format.desc":
      "SherpAI hat Felder mit ungültigem Format, Encoding-Problemen oder uneinheitlichen Bezeichnungen erkannt.",

    "results.categories.incomplete.label":
      "Unklare / unvollständige Adressen",
    "results.categories.incomplete.short": "Unvollständige Adressen",
    "results.categories.incomplete.desc":
      "SherpAI hat Adressen markiert, bei denen Informationen fehlen oder mehrdeutig sind (z. B. keine plausible Hausnummer).",

    // Dubletten
    "results.dup.noData":
      "Für den aktuellen Verifikationslauf wurden keine potenziellen Dubletten erkannt.",
    "results.dup.table.id": "ID",
    "results.dup.table.reference": "Referenz-Datensatz",
    "results.dup.table.count": "Anzahl",
    "results.dup.table.similarity": "Ø Ähnlichkeit (Name)",
    "results.dup.table.action": "Aktion",
    "results.dup.table.recordNotFound": "Datensatz nicht gefunden",
    "results.dup.table.link": "Prüfen",
    "results.dup.notePrefix": "Hinweis: Pro Dubletten-Cluster werden maximal",
    "results.dup.noteMiddle":
      "Datensätze angezeigt (Demo-Konfiguration).",

    // Fehlende Felder
    "results.missing.noData":
      "Es wurden keine fehlenden Pflichtfelder erkannt.",
    "results.missing.table.recordId": "Datensatz-ID",
    "results.missing.table.name": "Name",
    "results.missing.table.snapshot": "Stammdatensatz (Ausschnitt)",
    "results.missing.table.missingFields": "Fehlende Felder",
    "results.table.aiSuggestion": "KI-Vorschlag",
    "results.missing.table.suggestions": "KI-Vorschläge",
    "results.missing.table.action": "Aktion",
    "results.missing.snapshot.streetMissing": "Straße fehlt",
    "results.missing.snapshot.recordNotFound": "Datensatz nicht gefunden",
    "results.missing.noSuggestion": "Kein Vorschlag verfügbar",
    "results.ai.basedOnRules": "deterministischer Regelvorschlag",
    "results.ai.basedOnDonorRecords": "abgeleitet aus ähnlichen Datensätzen",
    "results.ai.basedOnLlm": "KI-Hinweis aus LLM-Logik",
    "results.ai.additionalLlmHint": "Zusätzlicher KI-Hinweis",
    "results.ai.basedOnReviewHint": "Review-Hinweis",
    "results.llm.title": "KI-Hinweise",
    "results.llm.status.label": "Status",
    "results.llm.status.idle": "Nicht gestartet",
    "results.llm.status.running": "Wird ermittelt",
    "results.llm.status.done": "Fertig",
    "results.llm.availableCount": "Verfügbare KI-Hinweise",
    "results.llm.byCategory": "Hinweise nach Kategorie",
    "results.llm.none": "Für diesen Lauf wurden keine KI-Hinweise erzeugt.",
    "results.llm.notVisibleInActiveCategory":
      "KI-Hinweise sind vorhanden, aber im aktuell geöffneten Tab nicht sichtbar. Wechsle in die markierte Kategorie.",
    "results.missing.similarRecordsHint": "aus ähnlichen Datensätzen",
    "results.demoHint.street": "Bitte Straße und Hausnummer im ERP prüfen und nachziehen.",
    "results.demoHint.plz": "Bitte die PLZ im ERP oder anhand der Originalquelle prüfen und nachziehen.",
    "results.demoHint.city": "Bitte den Ort im ERP oder anhand der Originalquelle prüfen und nachziehen.",
    "results.demoHint.country": "Bitte das Land im ERP oder anhand der Originalquelle prüfen und nachziehen.",
    "results.demoHint.houseNumber": "Bitte die Hausnummer im ERP prüfen; es wird keine Hausnummer automatisch vorgeschlagen.",
    "results.demoHint.generic": "Bitte den Wert im ERP oder anhand der Originalquelle prüfen und nachziehen.",
    "results.problem.groupedMissing": "Fehlende Pflichtfelder: {fields}.",
    "results.problem.groupedFormat": "Formatprobleme in: {fields}.",
    "results.problem.groupedIncomplete": "Unvollständige Adressfelder: {fields}.",
    "results.confidence.low": "LOW",
    "field.name1": "Name",
    "field.zeile1": "Straße",
    "field.plz": "PLZ",
    "field.ort": "Ort",
    "field.land": "Land",
    "field.ustid": "USt-ID",
    "field.steuernr": "Steuernummer",
    "results.missing.notePrefix": "Es werden",
    "results.missing.noteMiddle": "von",
    "results.missing.noteSuffix":
      "Datensätzen mit fehlenden Feldern angezeigt (MVP-Ansicht, exemplarisch).",

    // Formatfehler
    "results.format.noData":
      "Es wurden keine Format- oder Strukturfehler erkannt.",
    "results.format.table.recordId": "Datensatz-ID",
    "results.format.table.name": "Name",
    "results.format.table.field": "Feld",
    "results.format.table.original": "Originalwert",
    "results.format.table.problem": "Problem / Schweregrad",
    "results.format.table.suggestion": "KI-Vorschlag",
    "results.format.table.action": "Aktion",
    "results.format.noSuggestion": "Kein Vorschlag verfügbar",
    "results.format.notePrefix": "Es werden",
    "results.format.noteMiddle": "von",
    "results.format.noteSuffix":
      "Format- und Strukturfehlern angezeigt (MVP-Ansicht).",

    // Unvollständige Adressen
    "results.incomplete.noData":
      "Es wurden keine unvollständigen Adressen erkannt.",
    "results.incomplete.table.recordId": "Datensatz-ID",
    "results.incomplete.table.name": "Name",
    "results.incomplete.table.problem": "Problem / Schweregrad",
    "results.incomplete.table.address": "Straße / Adresse",
    "results.incomplete.table.suggestions": "KI-Vorschlag",
    "results.incomplete.table.action": "Aktion",
    "results.incomplete.addressEmpty": "leer",
    "results.incomplete.recordNotFound": "Datensatz nicht gefunden",
    "results.incomplete.generating": "Wird generiert…",
    "results.incomplete.noSuggestion": "Kein Vorschlag verfügbar",
    "results.incomplete.generateAiSuggestions": "KI-Vorschläge generieren",
    "results.incomplete.generateAiSuggestionsLoading": "KI-Vorschläge werden generiert...",
    "results.incomplete.notePrefix": "Es werden",
    "results.incomplete.noteMiddle": "von",
    "results.incomplete.noteSuffix":
      "unvollständigen Adressen angezeigt (MVP-Ansicht).",

    // Allgemeine Aktionen / Footer
    "results.actions.accept": "Übernehmen",
    "results.actions.reject": "Ignorieren",
    "results.actions.reset": "Zurücksetzen",
    "results.footer.note":
      "Hinweis: Entscheidungen werden pro Verifikationsobjekt gespeichert. In den Export fließen nur übernommene deterministische Änderungen ein.",

    // Analyzer / Regel-Meldungen (aus src/services/analyzer.ts)
    "analyzer.missingField": 'Fehlender Wert im Feld "{field}"',
    "analyzer.format.plzInvalid": "PLZ entspricht nicht dem erwarteten länderspezifischen Format",
    "analyzer.format.ustidInvalid":
      "USt-ID entspricht nicht dem erwarteten länderspezifischen Muster",
    "analyzer.format.encodingName":
      "Möglicher Encoding-Fehler im Namen (nicht korrekt dargestellte Umlaute).",
    "analyzer.format.encodingCity":
      "Möglicher Encoding-Fehler im Ortsnamen (nicht korrekt dargestellte Umlaute).",
    "analyzer.format.encodingAddress":
      "Möglicher Encoding-Fehler in der Adresse (nicht korrekt dargestellte Umlaute).",
    "analyzer.format.streetAbbrevStr":
      "Straßenabkürzung „Str.“ erkannt (uneinheitliches Adressformat gegenüber „Straße“).",
    "analyzer.format.streetStrasse":
      "Straßenname „Strasse“ ohne „ß“ – mögliche Inkonsistenz gegenüber „Straße“.",
    "analyzer.incomplete.noHouseNumber":
      "Zeile1 enthält keine erkennbare Hausnummer (unvollständige Adresse).",

    "severity.HIGH": "Hoch",
    "severity.MED": "Mittel",
    "severity.LOW": "Niedrig",

    "analysis.issue.MISSING_REQUIRED_FIELD":
      'Fehlendes Pflichtfeld: "{field}".',
    "analysis.issue.FORMAT_PLZ_INVALID":
      'Formatfehler in "{field}": "{value}" (erwartet: {expected}).',
    "analysis.issue.FORMAT_PLZ_STANDARDIZED":
      'PLZ in "{field}" wurde normalisiert: "{value}" -> "{suggestedValue}".',
    "analysis.issue.FORMAT_USTID_INVALID":
      'Formatfehler in "{field}": "{value}" (erwartet: {expected}).',
    "analysis.issue.FORMAT_ENCODING_ARTIFACT":
      'Möglicher Format- oder Encodingfehler in "{field}": "{value}".',
    "analysis.issue.FORMAT_STREET_VARIANT_MIXED":
      "Uneinheitliche Straßenschreibweisen erkannt ({examples}).",
    "analysis.issue.INCOMPLETE_ADDRESS_NO_HOUSENUMBER":
      'Adressproblem: In "{field}" fehlt eine Hausnummer.',
    "analysis.issue.INCOMPLETE_ADDRESS_MISSING_STREET":
      'Adressproblem: Das Feld "{field}" ist leer.',
    "analysis.issue.INCOMPLETE_ADDRESS_MISSING_PLZ":
      'Adressproblem: Die PLZ im Feld "{field}" fehlt.',
    "analysis.issue.INCOMPLETE_ADDRESS_INVALID_PLZ":
      'Adressproblem: Ungültige PLZ in "{field}" ("{value}", erwartet: {expected}).',
    "analysis.issue.INCOMPLETE_ADDRESS_MISSING_CITY":
      'Adressproblem: Der Ort im Feld "{field}" fehlt.',
    "analysis.issue.INCOMPLETE_ADDRESS_MISSING_COUNTRY":
      'Adressproblem: Das Land im Feld "{field}" fehlt.',

    "analysis.suggestion.SUGGEST_PLZ_FROM_CITY":
      'PLZ-Vorschlag für Ort "{city}": "{suggestedValue}" (Treffer: {supportCount}).',
    "analysis.suggestion.SUGGEST_CITY_FROM_PLZ":
      'Ortsvorschlag für PLZ "{postalCode}": "{suggestedValue}" (Treffer: {supportCount}).',
    "analysis.suggestion.SUGGEST_COUNTRY_FROM_LOCATION":
      'Ländervorschlag für PLZ/Ort: "{suggestedValue}" (Treffer: {supportCount}).',
    "analysis.suggestion.SUGGEST_PLZ_FROM_DONORS":
      'PLZ-Vorschlag aus ähnlichen Datensätzen: "{suggestedValue}" (Datensätze: {donorCount}, Sicherheit: {confidence}).',
    "analysis.suggestion.SUGGEST_CITY_FROM_DONORS":
      'Ortsvorschlag aus ähnlichen Datensätzen: "{suggestedValue}" (Datensätze: {donorCount}, Sicherheit: {confidence}).',
    "analysis.suggestion.SUGGEST_COUNTRY_FROM_DONORS":
      'Ländervorschlag aus ähnlichen Datensätzen: "{suggestedValue}" (Datensätze: {donorCount}, Sicherheit: {confidence}).',
    "analysis.suggestion.SUGGEST_STREET_FROM_PLZ_CITY":
      'Straßenvorschlag für "{postalCode} {city}": "{suggestedValue}" (Treffer: {supportCount}).',

    "analyzer.enrichment.plzFromCity":
      "Vorschlag basierend auf häufigster PLZ für diesen Ort in vorhandenen Referenzdaten.",
    "analyzer.enrichment.cityFromPlz":
      "Vorschlag basierend auf häufigstem Ort zu dieser PLZ in vorhandenen Referenzdaten.",
    "analyzer.enrichment.streetFromPlzCity":
      "Adressvorschlag basierend auf häufigster Straße für diese PLZ/Ort-Kombination in vorhandenen Referenzdaten.",
    "analyzer.enrichment.webSource":
      "Externe Referenzquelle",
    "analyzer.enrichment.ragSource":
      "Aggregierte Referenzdaten",

    // Export
    "export.title": "Datenexport vorbereiten",
    "export.subtitle":
      "Im nächsten Schritt können die geprüften Daten für den Rückfluss ins ERP-System vorbereitet und exportiert werden. Im MVP stehen dafür die grundlegenden Exportpfade bereit.",
    "export.card.title": "Export-Konfiguration (MVP)",
    "export.card.text":
      "In der Zielarchitektur können hier z. B. Zielformat, Zielsystem (ERP-Mandant) und Exportumfang festgelegt werden. Im MVP stehen die wesentlichen Exportoptionen bereits in einer vereinfachten Form zur Verfügung.",
    "export.list.format": "Exportformat: CSV",
    "export.list.scope":
      "Scope: geprüfte Stammdaten mit markierten Korrekturen",
    "export.list.feedback":
      "Feedback-Ereignisse: werden perspektivisch zurück in die KI gespielt",
    "export.btn.startDemo": "Export starten",
    "export.btn.accepted": "Übernommene exportieren",
    "export.btn.all": "Alle exportieren",
    "export.btn.backToResults": "Zurück zu den Ergebnissen",
    "export.alert.demoMessage":
      "Demo: Export würde hier gestartet werden.",
    "export.alert.lastError": "Letzter Exportfehler",
    "export.mode.accepted": "Nur übernommene Änderungen",
    "export.mode.all": "Gesamtdatensatz",
    "export.summary.reviewTitle": "Alle gespeicherten Review-Entscheidungen",
    "export.summary.exportableTitle": "Exportwirksame Änderungen",
    "export.summary.decisionNote":
      "Nicht alle Entscheidungen wirken sich direkt auf den Export aus. Dubletten- oder reine Hinweisentscheidungen werden gespeichert, aber nicht als Feldänderung in die Exportdatei geschrieben.",

    // History
    "history.title": "Historie der Verifikationen",
    "history.subtitle":
      "Im MVP wird exemplarisch der zuletzt ausgeführte Prüfjob angezeigt. In der Zielarchitektur kann diese Ansicht um mehrere Jobs, Filter und Exportfunktionen erweitert werden.",
    "history.empty":
      "Noch keine Historie im Demo. Starte eine Verifikation, um erste Prüfjobs zu sehen.",
    "history.defaultJobName": "Verifikationslauf",
    "history.datasetType.suppliers": "Lieferantenstammdaten",
    "history.datasetType.customers": "Kundenstammdaten",
    "history.datasetType.addresses": "Adressbestände",
    "history.meta.startedAt": "Gestartet am",
    "history.meta.recordsLabel": "Datensätze geprüft",
    "history.meta.issuesLabel":
      "Probleme erkannt (über alle Problemklassen hinweg).",
    "history.status.completedMvp": "Status: abgeschlossen (MVP)",
    "history.exportStatus": "Exportstatus",
    "history.lastExportedAt": "Zuletzt exportiert",
    "history.lastExportMode": "Exportmodus",
    "history.exportCount": "Anzahl Exporte",
    "history.loading":
      "Verifikationsläufe, Exportstände und Metadaten werden geladen.",
    "history.detailsLoading":
      "Laufdetails, Ereignisse und Statusinformationen werden geladen.",
    "history.openDetails": "Details",
    "history.timeline.title": "Historie / Ereignisse",
    "history.timeline.empty":
      "Für diesen Lauf sind noch keine Historieneinträge vorhanden.",
    "history.event.RUN_UPLOADED": "Run angelegt und Upload gespeichert",
    "history.event.ERP_MESSAGE_STAGED": "ERP-Nachricht im Simulator vorbereitet",
    "history.event.MQTT_TRIGGER_RECEIVED": "MQTT-Trigger von SherpAI empfangen",
    "history.event.RUN_INGESTED": "Datei eingelesen",
    "history.event.RUN_ANALYZING": "Analyse gestartet",
    "history.event.RUN_ANALYZED": "Analyse abgeschlossen",
    "history.event.RUN_FAILED": "Analyse fehlgeschlagen",
    "history.event.DECISION_UPDATED": "Review-Entscheidung aktualisiert",
    "history.event.EXPORT_COMPLETED": "Export erstellt",
    "history.event.EXPORT_FAILED": "Export fehlgeschlagen",

    // Run status labels
    "status.UPLOADED": "Hochgeladen",
    "status.INGESTED": "Eingelesen",
    "status.ANALYZING": "Analyse läuft",
    "status.ANALYZED": "Analysiert",
    "status.FAILED": "Fehlgeschlagen",
    "exportStatus.NOT_EXPORTED": "Noch nicht exportiert",
    "exportStatus.EXPORTED": "Exportiert",
    "exportStatus.FAILED": "Export fehlgeschlagen",
    "decision.PENDING": "Ausstehend",
    "decision.ACCEPTED": "Übernommen",
    "decision.REJECTED": "Abgelehnt",
    "datasetType.CUSTOMER": "Kundenstammdaten",
    "datasetType.SUPPLIER": "Lieferantenstammdaten",
    "datasetType.ADDRESS": "Adressbestände",
    "datasetType.customers": "Kundenstammdaten",
    "datasetType.suppliers": "Lieferantenstammdaten",
    "datasetType.addresses": "Adressbestände",
    "useCase.MASTERDATA_VERIFY": "ERP-Stammdatenverifikation",
    "useCase.all": "Gesamter Qualitätscheck",
    "useCase.duplicates": "Dublettenerkennung",
    "useCase.address_cleaning": "Adressbereinigung",
    "useCase.enrichment": "Externe Anreicherung",

    // Profile / Branding
    "profile.title": "Profil & Branding (White-Label)",
    "profile.subtitle":
      "Hier kannst du simulieren, wie sich die SherpAI-Plattform als White-Label-Komponente in verschiedene ERP-Systeme einbettet. Die Auswahl steuert Logo und Akzentfarbe für die gesamte Oberfläche.",
    "profile.section.brandingTitle": "Branding-Theme auswählen",

    "profile.theme.verifai.label": "SherpAI (Standard)",
    "profile.theme.verifai.description":
      "Standard-Branding der SherpAI-Plattform mit SherpAI-Logo und orangem Akzent.",
    "profile.theme.timeline.label": "Timeline-ERP",
    "profile.theme.timeline.description":
      "White-Label-Branding für eine Integration in die Timeline-ERP-Oberfläche mit grünem Akzent.",
    "profile.theme.sap.label": "SAP-Integration",
    "profile.theme.sap.description":
      "Demo-Branding für eine SAP-nahe Umgebung mit blauem Akzentton.",

    "profile.techHint.prefix":
      "Technischer Hinweis: Die Sidebar reagiert auf das Event",
    "profile.techHint.middle":
      "und setzt anhand des Theme-Keys sowohl die Brandfarbe",
    "profile.techHint.suffix":
      "Komponenten wie Upload-Maske, Stepper und Buttons verwenden var(--brand), um sich automatisch anzupassen.",
    "profile.brandCard.activate": "Theme aktivieren",

    // ClusterDetails (verschachtelt)
    clusterDetails: {
      noAnalysisTitle: "Keine Analyse vorhanden",
      noAnalysisText:
        "Es liegt noch keine Verifikation vor. Bitte starte zunächst einen Verifikationslauf und wähle anschließend einen Dubletten-Cluster aus.",
      startCheckButton: "Verifikation starten",

      backToResults: "Zurück zu den Ergebnissen",

      notFoundTitle: "Cluster nicht gefunden",
      notFoundText:
        "Der angeforderte Dubletten-Cluster konnte nicht gefunden werden. Bitte kehre zu den Ergebnissen zurück und wähle einen anderen Cluster aus.",

      titlePrefix: "Verdachtsfall",
      intro:
        "Diese Datensätze wurden von der Mini-KI als potenzielle Dubletten erkannt. Vergleiche die Einträge mit dem Referenzdatensatz und entscheide, ob eine Zusammenführung sinnvoll ist.",

      summaryTitle: "Cluster-Zusammenfassung",
      summaryRecordsLabel: "Datensätze",
      summaryAvgSimilarityLabel: "Ø Namensähnlichkeit",

      refMissingWarningText:
        "Referenzdatensatz konnte nicht geladen werden. Die Darstellung der Unterschiede ist ggf. unvollständig.",

      recordIdLabel: "Datensatz-ID",
      referenceBadge: "Referenzeintrag (von der KI gewählt)",
      similarityBadgeLabel: "Namensähnlichkeit",

      cityLabel: "Ort",
      streetLabel: "Straße",
      countryLabel: "Land",
      emptyValue: "leer",

      diffTitle: "Unterschiede zum Referenzdatensatz",
      diffEqual: "entspricht Referenz",
      diffReferencePrefix: "Referenz",

      actionsHint:
        "Triff eine Entscheidung für diesen Dubletten-Cluster. Die Auswahl wird für den aktuellen Verifikationslauf gespeichert.",
      actionMerge: "Zusammenführen",
      actionNoDuplicate: "Kein Duplikat",
    },
  },

  en: {
    // Navbar
    "nav.searchPlaceholder": "Search...",
    "nav.language.de": "DE",
    "nav.language.en": "EN",

    // Sidebar
    "sidebar.dashboard": "Dashboard",
    "sidebar.results": "Results",
    "sidebar.history": "History",
    "sidebar.erpSimulator": "ERP simulator",
    "sidebar.profile": "Profile",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.subtitle":
      "Overview of current master data quality and the results of the last verification run.",

    "dashboard.btn.newVerification": "Start new verification",
    "dashboard.btn.showResults": "Show results",

    "dashboard.kpi.records": "Checked records (current session)",
    "dashboard.kpi.anomalousShare": "Share of anomalous records",
    "dashboard.kpi.lastRun": "Last verification run",
    "dashboard.kpi.lastRun.none": "None started yet",

    "dashboard.distribution.title":
      "Distribution of detected data quality issues",
    "dashboard.distribution.subtitle":
      "Overview of the problem classes identified in the most recent verification run.",
    "dashboard.distribution.badge.live": "Live",
    "dashboard.distribution.badge.ready": "Ready",

    "dashboard.dist.dup.label": "Duplicates",
    "dashboard.dist.dup.desc":
      "Clustering of records with high similarity in name and address.",
    "dashboard.dist.missing.label": "Missing required fields",
    "dashboard.dist.missing.desc":
      "Missing required fields (e.g. postal code, city, VAT ID, tax number).",
    "dashboard.dist.format.label": "Format & structural issues",
    "dashboard.dist.format.desc":
      "Invalid formats or structural violations (postal code, VAT ID, country codes).",
    "dashboard.dist.incomplete.label": "Incomplete addresses",
    "dashboard.dist.incomplete.desc":
      "Addresses without house number or with unclear information.",

    "dashboard.areas.title": "Verification areas in SherpAI",
    "dashboard.areas.subtitle":
      "The platform bundles several classes of data quality issues in a single run:",
    "dashboard.areas.item.dup":
      "Duplicates and semantically similar entries",
    "dashboard.areas.item.missing":
      "Missing required fields, especially street, postal code, city, and country",
    "dashboard.areas.item.format":
      "Format and normalization issues, e.g. in postal codes, VAT IDs, or character encoding",
    "dashboard.areas.item.incomplete":
      "Incomplete addresses, e.g. missing house number, postal code, city, or country",
    "dashboard.areas.item.enrichment":
      "Data-based enrichment suggestions via Mini-Dorothe using the existing record base",
    "dashboard.areas.btn.showResults":
      "View results of the current verification",

    "dashboard.status.title": "System status & outlook",
    "dashboard.status.text":
      "The system has been designed so that trained AI models, specialized matching components and LLM-based guidance services can be integrated later in a modular way. In a production-ready extension, this area could also show runtimes, run comparisons and data quality trends over time.",

    "dashboard.summary.title": "Summary of the last verification run",
    "dashboard.summary.none.title": "No verification run executed yet",
    "dashboard.summary.none.text":
      "Start your first verification run to see a summary here. The platform will then show detected problem classes, affected records and potential measures.",
    "dashboard.summary.withRun.prefix": "Verification run from",
    "dashboard.summary.withRun.jobId": "Job ID",

    // StartCheck / New verification
    "start.title": "New data verification",
    "start.subtitle":
      "Upload a CSV export of your ERP master data and start a new verification run. The platform will then scan the data for duplicates, missing fields, format errors and incomplete addresses.",
    "start.lastRun.label": "Last verification run",
    "start.lastRun.unnamed": "No name",

    "start.step1": "Upload & configuration",
    "start.step2": "Analysis & results",
    "start.step3": "Release & export",

    "start.config.title": "Configure verification run",
    "start.config.jobName.label": "Name of the verification run",
    "start.config.jobName.placeholder":
      "e.g. Address check Q2 suppliers",
    "start.config.datasetType.label": "Dataset type",
    "start.config.datasetType.suppliers": "Supplier master data",
    "start.config.datasetType.customers": "Customer master data",
    "start.config.datasetType.addresses": "Address data sets",

    "start.config.useCase.label": "Focus use case",
    "start.config.useCase.all": "Full quality check",
    "start.config.useCase.duplicates": "Duplicate detection",
    "start.config.useCase.address_cleaning": "Address cleansing",
    "start.config.useCase.enrichment": "External enrichment",

    "start.config.project.label": "Project / client",
    "start.config.project.default": "Main client",
    "start.config.project.mandant_a": "Client A",
    "start.config.project.mandant_b": "Client B",

    "start.config.hint":
      "These settings can later be used for evaluations by client, use case and time period.",

    "start.upload.title": "Drag & drop file here or select",
    "start.upload.subtitle":
      "Supported: CSV exports from ERP systems (e.g. customer, supplier or address master data).",
    "start.upload.button": "Select file",
    "start.upload.selectedFile.prefix": "Selected:",
    "start.upload.noFile": "No file selected yet",

    "start.preview.title": "Import preview (first lines)",
    "start.preview.hint":
      "The actual processing is triggered after “Start verification”.",

    "start.error.noFile":
      "Please upload a CSV export of your ERP master data.",
    "start.error.noJobName":
      "Please provide a name for this verification run.",

    "start.actions.start": "Start verification",
    "start.actions.cancel": "Back to overview",

    "mqttSimulator.title": "ERP and MQTT simulator",
    "mqttSimulator.subtitle":
      "This view simulates an external ERP system. A CSV file is first staged as inbound input and then handed over to SherpAI via an MQTT message. This triggers the verification run as it would in an integrated scenario.",
    "mqttSimulator.form.title": "Prepare message from source system",
    "mqttSimulator.form.subtitle":
      "The file is staged first. Only the subsequent MQTT publish triggers the downstream processing.",
    "mqttSimulator.form.runName": "Verification run name",
    "mqttSimulator.form.sourceSystem": "ERP / source system",
    "mqttSimulator.form.tenant": "Tenant",
    "mqttSimulator.form.project": "Project / client",
    "mqttSimulator.form.datasetType": "Dataset type",
    "mqttSimulator.form.useCase": "Focus use case",
    "mqttSimulator.form.file": "CSV file",
    "mqttSimulator.form.noFile": "No CSV file selected yet",
    "mqttSimulator.form.fileRestoreHint":
      "The file name was restored. To upload again, please reselect the file.",
    "mqttSimulator.form.stageButton": "Stage file",
    "mqttSimulator.form.staging": "Staging file…",
    "mqttSimulator.form.secondaryAction": "Open standard upload",
    "mqttSimulator.connection.title": "Broker connection",
    "mqttSimulator.connection.subtitle":
      "The simulator publishes directly to the broker via MQTT over WebSockets.",
    "mqttSimulator.connection.state.connecting": "Connecting…",
    "mqttSimulator.connection.state.connected": "Connected",
    "mqttSimulator.connection.state.reconnecting": "Reconnecting…",
    "mqttSimulator.connection.state.error": "Connection error",
    "mqttSimulator.connection.state.offline": "Offline",
    "mqttSimulator.payload.title": "MQTT message",
    "mqttSimulator.payload.subtitle":
      "The payload shown here mirrors the message an ERP-near system would send to SherpAI.",
    "mqttSimulator.payload.topic": "Topic",
    "mqttSimulator.payload.publishButton": "Send MQTT message",
    "mqttSimulator.payload.publishing": "Sending message…",
    "mqttSimulator.payload.readyState": "Message ready to trigger the run",
    "mqttSimulator.payload.sentState": "Message published to broker successfully",
    "mqttSimulator.payload.empty":
      "No message prepared yet. Stage a CSV file first.",
    "mqttSimulator.payload.platformLinkedState":
      "This run was uploaded directly via SherpAI. No separate simulator MQTT message is shown for that ERP simulator return view.",
    "mqttSimulator.activity.title": "Simulator activity",
    "mqttSimulator.activity.subtitle":
      "Local steps of the simulated ERP client.",
    "mqttSimulator.activity.empty":
      "No activity yet. Prepare a message to start the flow.",
    "mqttSimulator.activity.stagedTitle": "File staged",
    "mqttSimulator.activity.publishedTitle": "MQTT message sent",
    "mqttSimulator.activity.publishFailedTitle": "MQTT publish failed",
    "mqttSimulator.activity.platformUploadTitle": "File uploaded directly into SherpAI",
    "mqttSimulator.activity.platformUploadLinkedTitle": "Automatically linked to the ERP simulator",
    "mqttSimulator.activity.platformUploadLinkedDetail":
      "The direct platform upload has been linked to the ERP simulator view and will now appear there as a returned run.",
    "mqttSimulator.activity.uploadedAt": "Uploaded in the ERP system",
    "mqttSimulator.activity.arrivedAt": "Arrived in the simulator",
    "mqttSimulator.activity.exportAcceptedTitle": "Selective export prepared",
    "mqttSimulator.activity.exportAllTitle": "Full export prepared",
    "mqttSimulator.activity.exportFailedTitle": "Export from SherpAI failed",
    "mqttSimulator.actions.reset": "Reset simulator",
    "mqttSimulator.actions.clearActivity": "Clear activities",
    "mqttSimulator.actions.refreshHistory": "Refresh events",
    "mqttSimulator.actions.clearHistory": "Clear events",
    "mqttSimulator.run.title": "SherpAI run",
    "mqttSimulator.run.subtitle":
      "Status, metadata and navigation for the triggered verification run.",
    "mqttSimulator.run.empty":
      "No run created yet. The corresponding run will appear here once the file has been staged.",
    "mqttSimulator.run.runId": "Run ID",
    "mqttSimulator.run.filename": "File",
    "mqttSimulator.run.createdAt": "Created",
    "mqttSimulator.run.metrics": "Metrics (records / issues / clusters)",
    "mqttSimulator.run.openHistory": "Open run history",
    "mqttSimulator.run.openResults": "Open results",
    "mqttSimulator.run.openHistoryLoading":
      "SherpAI is opening the run history and loading the recorded events.",
    "mqttSimulator.run.openResultsLoading":
      "SherpAI is opening the results and assembling the review view for this run.",
    "mqttSimulator.run.openResultsLoadingShort": "Opening results…",
    "mqttSimulator.return.title": "SherpAI return flow inside the ERP simulator",
    "mqttSimulator.return.subtitle":
      "This view reflects what SherpAI has produced for the triggered run and which export paths are available for ERP-near downstream processing.",
    "mqttSimulator.return.empty":
      "No SherpAI run yet. Stage a file and trigger the run first.",
    "mqttSimulator.return.findingsTitle": "Result summary returned by SherpAI",
    "mqttSimulator.return.duplicates": "Duplicate clusters",
    "mqttSimulator.return.missing": "Missing issues",
    "mqttSimulator.return.format": "Format issues",
    "mqttSimulator.return.incomplete": "Incomplete issues",
    "mqttSimulator.return.reviewItems": "Review items",
    "mqttSimulator.return.enrichments": "Deterministic suggestions",
    "mqttSimulator.return.llmStatus": "LLM status",
    "mqttSimulator.return.pending":
      "The run has been analyzed and the result summary is still loading.",
    "mqttSimulator.return.awaiting":
      "As soon as SherpAI provides results, they will appear here inside the ERP simulator.",
    "mqttSimulator.return.exportTitle": "Return flow and export",
    "mqttSimulator.return.exportSubtitle":
      "The ERP-near counterpart can retrieve SherpAI outputs directly from the simulator.",
    "mqttSimulator.return.exportAccepted": "Export accepted changes",
    "mqttSimulator.return.exportAll": "Export full dataset",
    "mqttSimulator.return.exportingAccepted": "Export accepted running…",
    "mqttSimulator.return.exportingAll": "Export all running…",
    "mqttSimulator.history.title": "System events recorded by SherpAI",
    "mqttSimulator.history.subtitle":
      "These events come from SherpAI and document the processing after the MQTT message has been received.",
    "mqttSimulator.history.empty":
      "No system events yet. After publishing, the recorded status transitions will appear here.",
    "mqttSimulator.history.showDetails": "Show details",
    "mqttSimulator.error.noFile":
      "Please select a CSV file for the simulator.",
    "mqttSimulator.error.notConnected":
      "The browser is currently not connected to the MQTT broker.",

    "common.pending": "Pending",
    "common.loading": "Saving…",
    "common.loadingRoute": "Opening page…",
    "common.loadingRouteHint":
      "SherpAI is preparing the next view and synchronizing the current state.",
    "common.loadingData": "Loading data…",
    "common.edit": "Edit",
    "common.export": "Export",
    "common.delete": "Delete",
    "common.rename": "Rename",
    "common.details": "Details",
    "common.results": "Results",
    "common.datasetType": "Category",
    "common.useCase": "Use case",
    "common.project": "Project",
    "history.createdAt": "Created",
    "history.ingestedAt": "Ingested",
    "history.analyzedAt": "Analyzed",
    "history.fileSize": "File size",
    "history.deleteConfirm.title": "Delete run",
    "history.deleteConfirm.message":
      "Do you really want to delete this run? It will be hidden from history.",
    "history.deleteConfirm.cancel": "Cancel",
    "history.deleteConfirm.confirm": "Delete",

    // Results
    "results.title": "Verification results",
    "results.subtitle":
      "Overview of duplicates, missing required fields, format issues and incomplete addresses from the last verification run.",

    "results.noAnalysis.title": "No results available",
    "results.noAnalysis.text":
      "No data has been checked yet. Start a new verification run to see analysis results from the mini AI components.",
    "results.noAnalysis.button": "Start verification",
    "results.loading.title": "Preparing verification results",
    "results.loading.fetching":
      "SherpAI is loading the results and assembling the review view for this run.",
    "results.loading.processing":
      'The verification run is currently in status "{status}". Results will refresh automatically.',

    "results.btn.prepareExport": "Prepare export",
    "results.btn.backToDashboard": "Back to dashboard",
    "results.runStatus": "Status",
    "results.metrics.durationMs": "Analysis duration (ms)",
    "results.metrics.recordCount": "Records",
    "results.metrics.clusterCount": "Duplicate clusters",
    "results.metrics.issueCount": "Total issues",

    // Categories
    "results.categories.dup.label": "Duplicates",
    "results.categories.dup.short": "Duplicates",
    "results.categories.dup.desc":
      "SherpAI has detected potential duplicates in the master data. Review the suggestions and decide which records should be merged.",

    "results.categories.missing.label": "Missing required fields",
    "results.categories.missing.short": "Missing fields",
    "results.categories.missing.desc":
      "SherpAI has identified records with missing required fields (e.g. postal code, city, street, country).",

    "results.categories.format.label": "Format & structural issues",
    "results.categories.format.short": "Format issues",
    "results.categories.format.desc":
      "SherpAI has detected fields with invalid formats, encoding issues or inconsistent labels.",

    "results.categories.incomplete.label":
      "Ambiguous / incomplete addresses",
    "results.categories.incomplete.short": "Incomplete addresses",
    "results.categories.incomplete.desc":
      "SherpAI has flagged addresses where information is missing or ambiguous (e.g. no plausible house number).",

    // Duplicates
    "results.dup.noData":
      "No potential duplicates were detected for the current verification run.",
    "results.dup.table.id": "ID",
    "results.dup.table.reference": "Reference record",
    "results.dup.table.count": "Count",
    "results.dup.table.similarity": "Ø similarity (name)",
    "results.dup.table.action": "Action",
    "results.dup.table.recordNotFound": "Record not found",
    "results.dup.table.link": "Review",
    "results.dup.notePrefix": "Note: A maximum of",
    "results.dup.noteMiddle":
      "records are shown per duplicate cluster (demo configuration).",

    // Missing fields
    "results.missing.noData":
      "No missing required fields were detected.",
    "results.missing.table.recordId": "Record ID",
    "results.missing.table.name": "Name",
    "results.missing.table.snapshot": "Master data snapshot",
    "results.missing.table.missingFields": "Missing fields",
    "results.table.aiSuggestion": "AI suggestion",
    "results.missing.table.suggestions": "AI suggestions",
    "results.missing.table.action": "Action",
    "results.missing.snapshot.streetMissing": "Street missing",
    "results.missing.snapshot.recordNotFound": "Record not found",
    "results.missing.noSuggestion": "No suggestion available",
    "results.ai.basedOnRules": "deterministic rule-based suggestion",
    "results.ai.basedOnDonorRecords": "derived from similar records",
    "results.ai.basedOnLlm": "AI hint from LLM logic",
    "results.ai.additionalLlmHint": "Additional AI hint",
    "results.ai.basedOnReviewHint": "review hint",
    "results.llm.title": "AI hints",
    "results.llm.status.label": "Status",
    "results.llm.status.idle": "Not started",
    "results.llm.status.running": "Generating",
    "results.llm.status.done": "Done",
    "results.llm.availableCount": "Available AI hints",
    "results.llm.byCategory": "Hints by category",
    "results.llm.none": "No AI hints were generated for this run.",
    "results.llm.notVisibleInActiveCategory":
      "AI hints exist, but are not visible in the currently selected tab. Switch to the highlighted category.",
    "results.missing.similarRecordsHint": "from similar records",
    "results.demoHint.street": "Please check and complete street and house number in the ERP.",
    "results.demoHint.plz": "Please verify and complete the postal code in the ERP or from the source record.",
    "results.demoHint.city": "Please verify and complete the city in the ERP or from the source record.",
    "results.demoHint.country": "Please verify and complete the country in the ERP or from the source record.",
    "results.demoHint.houseNumber": "Please verify the house number in the ERP; no house number is suggested automatically.",
    "results.demoHint.generic": "Please verify and complete the value in the ERP or from the source record.",
    "results.problem.groupedMissing": "Missing required fields: {fields}.",
    "results.problem.groupedFormat": "Format issues in: {fields}.",
    "results.problem.groupedIncomplete": "Incomplete address fields: {fields}.",
    "results.confidence.low": "LOW",
    "field.name1": "Name",
    "field.zeile1": "Street",
    "field.plz": "Postal code",
    "field.ort": "City",
    "field.land": "Country",
    "field.ustid": "VAT ID",
    "field.steuernr": "Tax number",
    "results.missing.notePrefix": "Showing",
    "results.missing.noteMiddle": "of",
    "results.missing.noteSuffix":
      "records with missing fields (MVP view, exemplary).",

    // Format issues
    "results.format.noData":
      "No format or structural issues were detected.",
    "results.format.table.recordId": "Record ID",
    "results.format.table.name": "Name",
    "results.format.table.field": "Field",
    "results.format.table.original": "Original value",
    "results.format.table.problem": "Problem / Severity",
    "results.format.table.suggestion": "AI suggestion",
    "results.format.table.action": "Action",
    "results.format.noSuggestion": "No suggestion available",
    "results.format.notePrefix": "Showing",
    "results.format.noteMiddle": "of",
    "results.format.noteSuffix":
      "format and structural issues (MVP view).",

    // Incomplete addresses
    "results.incomplete.noData":
      "No incomplete addresses were detected.",
    "results.incomplete.table.recordId": "Record ID",
    "results.incomplete.table.name": "Name",
    "results.incomplete.table.problem": "Problem / Severity",
    "results.incomplete.table.address": "Street / address",
    "results.incomplete.table.suggestions": "AI suggestion",
    "results.incomplete.table.action": "Action",
    "results.incomplete.addressEmpty": "empty",
    "results.incomplete.recordNotFound": "Record not found",
    "results.incomplete.generating": "Generating…",
    "results.incomplete.noSuggestion": "No suggestion available",
    "results.incomplete.generateAiSuggestions": "Generate AI suggestions",
    "results.incomplete.generateAiSuggestionsLoading": "Generating AI suggestions...",
    "results.incomplete.notePrefix": "Showing",
    "results.incomplete.noteMiddle": "of",
    "results.incomplete.noteSuffix":
      "incomplete addresses (MVP view).",

    // General actions / footer
    "results.actions.accept": "Apply",
    "results.actions.reject": "Ignore",
    "results.actions.reset": "Reset",
    "results.footer.note":
      "Note: Decisions are stored per verification object. Only accepted deterministic changes are included in the export.",

    // Analyzer / rule messages (from src/services/analyzer.ts)
    "analyzer.missingField": 'Missing value in field "{field}"',
    "analyzer.format.plzInvalid":
      "Postal code does not match the expected country-specific format",
    "analyzer.format.ustidInvalid":
      "VAT ID does not match the expected country-specific pattern",
    "analyzer.format.encodingName":
      "Possible encoding issue in name (umlauts not displayed correctly).",
    "analyzer.format.encodingCity":
      "Possible encoding issue in city name (umlauts not displayed correctly).",
    "analyzer.format.encodingAddress":
      "Possible encoding issue in address (umlauts not displayed correctly).",
    "analyzer.format.streetAbbrevStr":
      'Street abbreviation "Str." detected (inconsistent address format compared to "Straße").',
    "analyzer.format.streetStrasse":
      'Street name "Strasse" without "ß" – possible inconsistency compared to "Straße".',
    "analyzer.incomplete.noHouseNumber":
      "Line1 does not contain a recognisable house number (incomplete address).",

    "severity.HIGH": "High",
    "severity.MED": "Medium",
    "severity.LOW": "Low",

    "analysis.issue.MISSING_REQUIRED_FIELD":
      'Missing required field: "{field}".',
    "analysis.issue.FORMAT_PLZ_INVALID":
      'Format error in "{field}": "{value}" (expected: {expected}).',
    "analysis.issue.FORMAT_PLZ_STANDARDIZED":
      'Postal code in "{field}" was normalized: "{value}" -> "{suggestedValue}".',
    "analysis.issue.FORMAT_USTID_INVALID":
      'Format error in "{field}": "{value}" (expected: {expected}).',
    "analysis.issue.FORMAT_ENCODING_ARTIFACT":
      'Possible format or encoding issue in "{field}": "{value}".',
    "analysis.issue.FORMAT_STREET_VARIANT_MIXED":
      "Inconsistent street variants detected ({examples}).",
    "analysis.issue.INCOMPLETE_ADDRESS_NO_HOUSENUMBER":
      'Address issue: missing house number in "{field}".',
    "analysis.issue.INCOMPLETE_ADDRESS_MISSING_STREET":
      'Address issue: field "{field}" is empty.',
    "analysis.issue.INCOMPLETE_ADDRESS_MISSING_PLZ":
      'Address issue: postal code in "{field}" is missing.',
    "analysis.issue.INCOMPLETE_ADDRESS_INVALID_PLZ":
      'Address issue: invalid postal code in "{field}" ("{value}", expected: {expected}).',
    "analysis.issue.INCOMPLETE_ADDRESS_MISSING_CITY":
      'Address issue: city in "{field}" is missing.',
    "analysis.issue.INCOMPLETE_ADDRESS_MISSING_COUNTRY":
      'Address issue: country in "{field}" is missing.',

    "analysis.suggestion.SUGGEST_PLZ_FROM_CITY":
      'Postal-code suggestion for city "{city}": "{suggestedValue}" (support: {supportCount}).',
    "analysis.suggestion.SUGGEST_CITY_FROM_PLZ":
      'City suggestion for postal code "{postalCode}": "{suggestedValue}" (support: {supportCount}).',
    "analysis.suggestion.SUGGEST_COUNTRY_FROM_LOCATION":
      'Country suggestion for postal code/city: "{suggestedValue}" (support: {supportCount}).',
    "analysis.suggestion.SUGGEST_PLZ_FROM_DONORS":
      'Postal-code suggestion from similar records: "{suggestedValue}" (records: {donorCount}, confidence: {confidence}).',
    "analysis.suggestion.SUGGEST_CITY_FROM_DONORS":
      'City suggestion from similar records: "{suggestedValue}" (records: {donorCount}, confidence: {confidence}).',
    "analysis.suggestion.SUGGEST_COUNTRY_FROM_DONORS":
      'Country suggestion from similar records: "{suggestedValue}" (records: {donorCount}, confidence: {confidence}).',
    "analysis.suggestion.SUGGEST_STREET_FROM_PLZ_CITY":
      'Street suggestion for "{postalCode} {city}": "{suggestedValue}" (support: {supportCount}).',

    "analyzer.enrichment.plzFromCity":
      "Suggestion based on the most frequent postal code for this city in available reference data.",
    "analyzer.enrichment.cityFromPlz":
      "Suggestion based on the most frequent city for this postal code in available reference data.",
    "analyzer.enrichment.streetFromPlzCity":
      "Address suggestion based on the most frequent street for this postal-code/city combination in available reference data.",
    "analyzer.enrichment.webSource":
      "External reference source",
    "analyzer.enrichment.ragSource":
      "Aggregated reference data",

    // Export
    "export.title": "Prepare data export",
    "export.subtitle":
      "In the next step, the validated data can be prepared and exported for being written back into the ERP system. In the MVP, the core export paths are already available.",
    "export.card.title": "Export configuration (MVP)",
    "export.card.text":
      "In the target architecture, you could configure target format, target system (ERP client) and export scope here. In the MVP, the core export options are already available in a simplified form.",
    "export.list.format": "Export format: CSV",
    "export.list.scope":
      "Scope: validated master data with marked corrections",
    "export.list.feedback":
      "Feedback events: will be fed back into the AI models in the future",
    "export.btn.startDemo": "Start export",
    "export.btn.accepted": "Export accepted",
    "export.btn.all": "Export all",
    "export.btn.backToResults": "Back to results",
    "export.alert.demoMessage":
      "Demo: This is where the export would be started.",
    "export.alert.lastError": "Last export error",
    "export.mode.accepted": "Accepted changes only",
    "export.mode.all": "Full dataset",
    "export.summary.reviewTitle": "All stored review decisions",
    "export.summary.exportableTitle": "Export-effective changes",
    "export.summary.decisionNote":
      "Not every decision changes the export directly. Duplicate decisions or pure hint decisions are stored, but they are not written into the export file as field updates.",

    // History
    "history.title": "Verification history",
    "history.subtitle":
      "In the MVP, only the most recent verification run is shown. In the target architecture, this view can be extended with multiple jobs, filters and export options.",
    "history.empty":
      "No history available in this demo yet. Start a verification to see the first jobs.",
    "history.defaultJobName": "Verification run",
    "history.datasetType.suppliers": "Supplier master data",
    "history.datasetType.customers": "Customer master data",
    "history.datasetType.addresses": "Address records",
    "history.meta.startedAt": "Started on",
    "history.meta.recordsLabel": "records checked",
    "history.meta.issuesLabel":
      "issues detected (across all problem classes).",
    "history.status.completedMvp": "Status: completed (MVP)",
    "history.exportStatus": "Export status",
    "history.lastExportedAt": "Last exported",
    "history.lastExportMode": "Export mode",
    "history.exportCount": "Export count",
    "history.loading":
      "Loading verification runs, export states and metadata.",
    "history.detailsLoading":
      "Loading run details, events and status information.",
    "history.openDetails": "Details",
    "history.timeline.title": "History / events",
    "history.timeline.empty":
      "No history entries are available for this run yet.",
    "history.event.RUN_UPLOADED": "Run created and upload stored",
    "history.event.ERP_MESSAGE_STAGED": "ERP message prepared in simulator",
    "history.event.MQTT_TRIGGER_RECEIVED": "MQTT trigger received by SherpAI",
    "history.event.RUN_INGESTED": "File ingested",
    "history.event.RUN_ANALYZING": "Analysis started",
    "history.event.RUN_ANALYZED": "Analysis completed",
    "history.event.RUN_FAILED": "Analysis failed",
    "history.event.DECISION_UPDATED": "Review decision updated",
    "history.event.EXPORT_COMPLETED": "Export created",
    "history.event.EXPORT_FAILED": "Export failed",

    // Run status labels
    "status.UPLOADED": "Uploaded",
    "status.INGESTED": "Ingested",
    "status.ANALYZING": "Analyzing",
    "status.ANALYZED": "Analyzed",
    "status.FAILED": "Failed",
    "exportStatus.NOT_EXPORTED": "Not exported yet",
    "exportStatus.EXPORTED": "Exported",
    "exportStatus.FAILED": "Export failed",
    "decision.PENDING": "Pending",
    "decision.ACCEPTED": "Accepted",
    "decision.REJECTED": "Rejected",
    "datasetType.CUSTOMER": "Customer master data",
    "datasetType.SUPPLIER": "Supplier master data",
    "datasetType.ADDRESS": "Address data",
    "datasetType.customers": "Customer master data",
    "datasetType.suppliers": "Supplier master data",
    "datasetType.addresses": "Address data",
    "useCase.MASTERDATA_VERIFY": "ERP master data verification",
    "useCase.all": "Full quality check",
    "useCase.duplicates": "Duplicate detection",
    "useCase.address_cleaning": "Address cleansing",
    "useCase.enrichment": "External enrichment",

    // Profile / Branding
    "profile.title": "Profile & branding (white-label)",
    "profile.subtitle":
      "Here you can simulate how the SherpAI platform is embedded as a white-label component into different ERP systems. The selection controls logo and accent colour for the entire UI.",
    "profile.section.brandingTitle": "Select branding theme",

    "profile.theme.verifai.label": "SherpAI (default)",
    "profile.theme.verifai.description":
      "Default branding of the SherpAI platform with SherpAI logo and an orange accent.",
    "profile.theme.timeline.label": "Timeline ERP",
    "profile.theme.timeline.description":
      "White-label branding for an integration into the Timeline ERP interface with a green accent.",
    "profile.theme.sap.label": "SAP integration",
    "profile.theme.sap.description":
      "Demo branding for an SAP-like environment with a blue accent colour.",

    "profile.techHint.prefix":
      "Technical note: The sidebar listens to the",
    "profile.techHint.middle":
      "event and uses the theme key to set both the brand colour",
    "profile.techHint.suffix":
      "Components like upload screen, stepper and buttons use var(--brand) to adapt automatically.",
    "profile.brandCard.activate": "Activate theme",

    // ClusterDetails (nested)
    clusterDetails: {
      noAnalysisTitle: "No analysis available",
      noAnalysisText:
        "No verification has been executed yet. Please start a verification run first and then select a duplicate cluster.",
      startCheckButton: "Start verification",

      backToResults: "Back to results",

      notFoundTitle: "Cluster not found",
      notFoundText:
        "The requested duplicate cluster could not be found. Please go back to the results and select another cluster.",

      titlePrefix: "Potential duplicate",
      intro:
        "These records have been flagged by the mini AI as potential duplicates. Compare the entries with the reference record and decide whether they should be merged.",

      summaryTitle: "Cluster summary",
      summaryRecordsLabel: "records",
      summaryAvgSimilarityLabel: "Ø name similarity",

      refMissingWarningText:
        "Reference record could not be loaded. The display of differences may be incomplete.",

      recordIdLabel: "Record ID",
      referenceBadge: "Reference entry (chosen by AI)",
      similarityBadgeLabel: "Name similarity",

      cityLabel: "City",
      streetLabel: "Street",
      countryLabel: "Country",
      emptyValue: "empty",

      diffTitle: "Differences compared to reference record",
      diffEqual: "matches reference",
      diffReferencePrefix: "Reference",

      actionsHint:
        "Make a decision for this duplicate cluster. The selection is stored for the current verification run.",
      actionMerge: "Merge",
      actionNoDuplicate: "Not a duplicate",
    },
  },
};

// Hilfsfunktion für verschachtelte Keys ("clusterDetails.noAnalysisTitle" usw.)
function resolveTranslation(
  dict: I18nDictionary,
  key: string
): string | undefined {
  if (key in dict && typeof dict[key] === "string") {
    return dict[key] as string;
  }
  if (key.includes(".")) {
    const [head, ...rest] = key.split(".");
    const next = dict[head];
    if (next && typeof next === "object") {
      return resolveTranslation(next as I18nDictionary, rest.join("."));
    }
  }
  return undefined;
}

const I18nContext = React.createContext<I18nContextValue | undefined>(
  undefined
);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = React.useState<Language>("de");

  const interpolate = React.useCallback(
    (
      template: string,
      params?: Record<string, string | number | boolean | null | undefined>
    ): string => {
      if (!params) return template;
      return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, token: string) => {
        const value = params[token];
        return value === undefined || value === null ? `{${token}}` : String(value);
      });
    },
    []
  );

  const t = React.useCallback(
    (
      key: string,
      params?: Record<string, string | number | boolean | null | undefined>
    ): string => {
      const dict = translations[lang] ?? translations.de;
      const value =
        resolveTranslation(dict, key) ??
        resolveTranslation(translations.de, key);
      if (typeof value !== "string") {
        return key;
      }
      return interpolate(value, params);
    },
    [interpolate, lang]
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({ lang, setLang, t }),
    [lang, t]
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
