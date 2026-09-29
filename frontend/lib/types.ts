// ── Core Domain Types ────────────────────────────────────────────────────

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type Severity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type SynopticRegime =
  | "active_monsoon"
  | "break_monsoon"
  | "monsoon_depression"
  | "western_disturbance"
  | "heat_wave"
  | "cyclone_bob"
  | "cyclone_as"
  | "normal";

export interface ForecastRun {
  id?: string;
  run_id: string;
  model_name: string;
  init_time: string;
  domain: string;
  resolution: number;
  lead_days: number;
  status: string;
  created_at?: string;
}

export interface BustDetection {
  id: string;
  run_id: string;
  region_id: string;
  region_name: string;
  lat: number;
  lon: number;
  lead_day: number;
  bust_probability: number;
  confidence_score: number;
  uncertainty_low: number;
  uncertainty_high: number;
  severity: Severity;
  synoptic_regime: SynopticRegime | string;
  is_verified: boolean;
  actual_bust?: boolean;
  verification_mae?: number;
  created_at?: string;
  event_date?: string;
  narrative?: string;
}

export interface BustStats {
  total_detections: number;
  critical_count: number;
  high_count: number;
  moderate_count: number;
  low_count: number;
  avg_confidence: number;
  top_affected_regions: Array<{ region_id: string; region_name: string; count: number; avg_prob: number }>;
}

export interface RegionRisk {
  region_id: string;
  region_name: string;
  state: string;
  lat: number;
  lon: number;
  risk_level: RiskLevel;
  bust_probability: number;
  confidence_score: number;
  historical_hit_rate: number;
  dominant_synoptic?: string;
  affected_lead_days: number[];
}

export interface LeadTimeConfidence {
  lead_day: number;
  mean_confidence: number;
  uncertainty_low: number;
  uncertainty_high: number;
  bust_probability: number;
  high_risk_cells: number;
}

export interface GridCell {
  lat: number;
  lon: number;
  bust_probability: number;
  confidence_score: number;
  uncertainty_low: number;
  uncertainty_high: number;
  severity: string;
}

export interface SHAPFeature {
  feature: string;
  shap_value: number;
  direction: "positive" | "negative";
  magnitude: number;
  description: string;
}

export interface SHAPResult {
  top_drivers: SHAPFeature[];
  base_value: number;
  predicted_value: number;
  feature_values: Record<string, number>;
  all_attributions: Record<string, number>;
}

export interface SimilarEvent {
  id?: string;
  event_date?: string;
  region_name?: string;
  synoptic_regime?: string;
  bust_probability?: number;
  bust_mae?: number;
  similarity_score?: number;
}

export interface ExplainResponse {
  bust_id: string;
  run_id: string;
  region_name: string;
  lead_day: number;
  bust_probability: number;
  confidence_score: number;
  shap_values: SHAPResult;
  narrative: string;
  similar_events: SimilarEvent[];
  reliability_diagram: ReliabilityPoint[];
  calibration_note: string;
  generated_at: string;
}

export interface ReliabilityPoint {
  bin_center: number;
  mean_predicted: number;
  mean_observed: number;
  count: number;
}

export interface SynopticEvent {
  id: string;
  event_type: string;
  name?: string;
  onset_time: string;
  center_lat?: number;
  center_lon?: number;
  intensity?: string;
  bust_mae_avg?: number;
}

export interface AlertSubscription {
  id: string;
  region_id: string;
  threshold: number;
  email?: string;
  is_active: boolean;
  trigger_count: number;
  created_at: string;
}

export interface LiveAlert {
  type: "bust_alert" | "confidence_update" | "connection_established";
  alert_id?: string;
  region_name?: string;
  region_id?: string;
  bust_probability?: number;
  severity?: Severity;
  lead_day?: number;
  synoptic_regime?: string;
  triggered_at?: string;
  payload?: Record<string, unknown>;
}

export interface TaskStatus {
  task_id: string;
  status: "pending" | "running" | "complete" | "failed";
  result?: Record<string, unknown>;
  error?: string;
  progress?: number;
}

// ── API Response Wrappers ─────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: { type: string; coordinates: number[] };
  properties: Record<string, unknown>;
}
