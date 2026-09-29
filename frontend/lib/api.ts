import { API_BASE_URL } from "./constants";
import type {
  ForecastRun, BustDetection, BustStats, RegionRisk,
  LeadTimeConfidence, ExplainResponse, AlertSubscription,
  TaskStatus,
} from "./types";

const BASE = API_BASE_URL;

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Forecast ──────────────────────────────────────────────────────────────

export async function fetchForecastRuns(
  page = 1, pageSize = 20, model?: string
): Promise<{ runs: ForecastRun[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (model) params.set("model", model);
  return fetchJSON(`/api/v1/forecast/runs?${params}`);
}

export async function fetchRunConfidence(
  runId: string, leadDay = 1
): Promise<{ run_id: string; lead_times: LeadTimeConfidence[]; grid: unknown; synoptic_regime?: string }> {
  return fetchJSON(`/api/v1/forecast/${encodeURIComponent(runId)}/confidence?lead_day=${leadDay}`);
}

// ── Busts ─────────────────────────────────────────────────────────────────

export async function fetchBusts(params?: {
  region?: string; severity?: string; days?: number; page?: number; page_size?: number;
}): Promise<{ busts: BustDetection[]; stats: BustStats; total: number }> {
  const q = new URLSearchParams();
  if (params?.region) q.set("region", params.region);
  if (params?.severity) q.set("severity", params.severity);
  if (params?.days) q.set("days", String(params.days));
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  return fetchJSON(`/api/v1/busts/?${q}`);
}

export async function fetchRecentBusts(limit = 10): Promise<{ busts: BustDetection[] }> {
  return fetchJSON(`/api/v1/busts/recent?limit=${limit}`);
}

export async function triggerBustDetection(
  runId: string, forceRecompute = false
): Promise<{ task_id: string; status: string }> {
  return fetchJSON("/api/v1/busts/detect", {
    method: "POST",
    body: JSON.stringify({ run_id: runId, force_recompute: forceRecompute }),
  });
}

export async function fetchTaskStatus(taskId: string): Promise<TaskStatus> {
  return fetchJSON(`/api/v1/busts/detect/${taskId}`);
}

// ── Explain ───────────────────────────────────────────────────────────────

export async function fetchExplanation(bustId: string): Promise<ExplainResponse> {
  return fetchJSON(`/api/v1/explain/${bustId}`);
}

// ── Regions ───────────────────────────────────────────────────────────────

export async function fetchRegionRiskMap(runId?: string): Promise<{
  regions: RegionRisk[]; geojson: unknown; generated_at: string;
}> {
  const q = runId ? `?run_id=${encodeURIComponent(runId)}` : "";
  return fetchJSON(`/api/v1/regions/risk-map${q}`);
}

export async function fetchRegionHistory(regionId: string): Promise<{
  region_name: string; bust_rate: number; hit_rate: number; events: unknown[];
  monthly_climatology: unknown[];
}> {
  return fetchJSON(`/api/v1/regions/${regionId}/history`);
}

// ── Alerts ────────────────────────────────────────────────────────────────

export async function fetchLiveAlerts(): Promise<{ alerts: unknown[] }> {
  return fetchJSON("/api/v1/alerts/live");
}

export async function createAlertSubscription(
  params: { region_id: string; threshold: number; email?: string }
): Promise<{ subscription: AlertSubscription }> {
  return fetchJSON("/api/v1/alerts/", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ── Health ────────────────────────────────────────────────────────────────

export async function fetchHealth(): Promise<{ status: string; version: string }> {
  return fetchJSON("/health");
}
