// Routing-Konfiguration: ERP-Simulator, History und Export entfernt

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./layout/appShell";
import Dashboard from "./pages/dashboard";
import StartCheck from "./pages/startCheck";
import Results from "./pages/results";
import ClusterDetail from "./pages/clusterDetails";
import RunDetails from "./pages/runDetails";
import Profile from "./pages/profile";
import { AnalysisProvider } from "./context/analysisContext";
import { I18nProvider } from "./context/i18nContext";

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AnalysisProvider>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="start" element={<StartCheck />} />
              <Route path="results" element={<Results />} />
              <Route path="results/:clusterId" element={<ClusterDetail />} />
              <Route path="run/:folder" element={<RunDetails />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Route>
          </Routes>
        </AnalysisProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}
