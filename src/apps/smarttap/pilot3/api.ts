import { secrets } from "../../../secrets.js";
import type { ConfigResponse, HealthResponse, Job, JobOptions, ReadyResponse, ResultsResponse } from "./types";

const apiBaseUrl = (
  // import.meta.env.VITE_SMARTTAP_PILOT3_API_BASE ?? "http://127.0.0.1:8001"   // Local development
  import.meta.env.VITE_SMARTTAP_PILOT3_API_BASE ?? "https://agwater.org:5556/smarttap/pilot3"   // Production API route for SmartTap Pilot 3
)
  .trim()
  .replace(/\/+$/, "");

function resolveRequestPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}/api${normalizedPath}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(resolveRequestPath(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": secrets.agwater_api_key,
      ...(init?.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null ? (body as { detail?: string }).detail : (body as string);
    throw new Error(message || `Request failed with HTTP ${response.status}`);
  }

  return body as T;
}

export const pilot3Api = {
  health: () => request<HealthResponse>("/health"),
  ready: () => request<ReadyResponse>("/ready"),
  config: () => request<ConfigResponse>("/config"),
  latestJob: () => request<Job>("/jobs/latest"),
  startJob: (options: JobOptions) =>
    request<Job>("/jobs", {
      method: "POST",
      body: JSON.stringify(options),
    }),
  digest: (jobId: string) =>
    request<string>(`/jobs/${jobId}/digest`, { headers: { Accept: "text/plain" } }),
  results: (jobId: string) => request<ResultsResponse>(`/jobs/${jobId}/results`),
};
