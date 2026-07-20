// Alle API-Anfragen gehen ueber /api (Vite-Proxy leitet an Python Bridge weiter)
export function resolveApiBaseUrl(): string {
  return "/api";
}
