"use client";
import { use } from "react";
import useSWR from "swr";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AlertBanner from "@/components/layout/AlertBanner";
import SHAPWaterfallChart from "@/components/charts/SHAPWaterfallChart";
import ReliabilityDiagram from "@/components/charts/ReliabilityDiagram";
import SynopticTagBadge from "@/components/cards/SynopticTagBadge";
import BustProbabilityGauge from "@/components/cards/BustProbabilityGauge";
import { fetchExplanation } from "@/lib/api";

interface ExplainPageProps {
  params: Promise<{ bustId: string }>;
}

export default function ExplainPage({ params }: ExplainPageProps) {
  const { bustId } = use(params);

  const { data: explanation, error, isLoading } = useSWR(
    bustId ? ["explain", bustId] : null,
    () => fetchExplanation(bustId),
    { revalidateOnFocus: false }
  );

  const bustProb = explanation?.bust_probability ?? 0;
  const probColor = bustProb >= 0.75 ? "#EA4335" : bustProb >= 0.55 ? "#FF6D00" : "#FBBC04";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <AlertBanner />
        <main style={{ flex: 1, overflow: "auto", padding: "20px 24px", background: "#F8F9FA" }}>
          <div style={{ fontSize: 12, color: "#5F6368", marginBottom: 16 }}>
            <a href="/bust-timeline" style={{ color: "#1A73E8", textDecoration: "none" }}>Bust Timeline</a>
            {" / Explainability / "}
            <span style={{ fontFamily: "Roboto Mono" }}>{bustId.slice(0, 12)}…</span>
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#202124", marginBottom: 16 }}>
            Bust Explainability Report
          </h1>

          {isLoading && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton" style={{ height: 200, borderRadius: 8 }} />
              ))}
            </div>
          )}

          {error && (
            <div style={{ padding: 16, background: "#FEE8E7", borderLeft: "3px solid #EA4335", borderRadius: 6, color: "#C5221F", fontSize: 13 }}>
              Failed to load explanation.{" "}
              <button onClick={() => window.location.reload()} style={{ color: "#EA4335", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Retry
              </button>
            </div>
          )}

          {explanation && (
            <>
              <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
                <div className="card" style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF" }}>
                  <BustProbabilityGauge
                    probability={bustProb}
                    confidenceInterval={[
                      explanation.shap_values?.base_value ?? 0.4,
                      Math.min(1, bustProb * 1.1)
                    ]}
                    size={170}
                  />
                </div>
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                  {[
                    { label: "CONFIDENCE SCORE", value: `${((explanation.confidence_score ?? 0) * 100).toFixed(1)}%`, color: "#1A73E8" },
                    { label: "REGION", value: explanation.region_name, color: "#202124", sub: `Lead Day ${explanation.lead_day}` },
                    { label: "MODEL RUN", value: explanation.run_id?.slice(0, 16) ?? "—", color: "#5F6368" },
                  ].map((s) => (
                    <div key={s.label} className="card" style={{ padding: "16px 20px" }}>
                      <div className="label-sm">{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Roboto Mono", color: s.color, marginTop: 4 }}>{s.value}</div>
                      {s.sub && <div style={{ fontSize: 11, color: "#9AA0A6", marginTop: 2 }}>{s.sub}</div>}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 16 }}>
                <div className="card" style={{ padding: "18px 20px" }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "#202124", marginBottom: 4 }}>Feature Attribution (SHAP)</h2>
                  <p style={{ fontSize: 12, color: "#5F6368", marginBottom: 16 }}>
                    DeepSHAP integrated gradients — contribution of each atmospheric feature to bust probability
                  </p>
                  <SHAPWaterfallChart
                    features={explanation.shap_values?.top_drivers ?? []}
                    baseValue={explanation.shap_values?.base_value}
                    predictedValue={explanation.shap_values?.predicted_value}
                    height={300}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="card" style={{ padding: "16px 18px", flex: 1 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: "#202124", marginBottom: 8 }}>Meteorological Narrative</h2>
                    <p style={{ fontSize: 13, color: "#5F6368", lineHeight: 1.7 }}>{explanation.narrative}</p>
                  </div>
                  <div className="card" style={{ padding: "16px 18px" }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: "#202124", marginBottom: 10 }}>Top Drivers</h3>
                    {explanation.shap_values?.top_drivers.slice(0, 4).map((f) => (
                      <div key={f.feature} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F1F3F4" }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: "#202124" }}>{f.feature.replace(/_/g, " ")}</div>
                        <div style={{ fontFamily: "Roboto Mono", fontSize: 13, fontWeight: 700, color: f.direction === "positive" ? "#EA4335" : "#34A853" }}>
                          {f.direction === "positive" ? "+" : "−"}{f.shap_value.toFixed(3)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="card" style={{ padding: "16px 18px" }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "#202124", marginBottom: 4 }}>Why Should I Trust This?</h2>
                  <p style={{ fontSize: 12, color: "#5F6368", marginBottom: 12 }}>{explanation.calibration_note}</p>
                  <ReliabilityDiagram data={explanation.reliability_diagram ?? []} height={200} />
                </div>

                <div className="card" style={{ padding: "16px 18px" }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "#202124", marginBottom: 12 }}>Similar Historical Events</h2>
                  {(explanation.similar_events ?? []).slice(0, 5).map((e: any, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 4 ? "1px solid #F1F3F4" : "none" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#202124" }}>{e.region_name ?? "Historical Event"}</div>
                        <div style={{ fontSize: 11, color: "#5F6368", marginTop: 2 }}>
                          {e.event_date ? new Date(e.event_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "Historical"}
                        </div>
                        {e.synoptic_regime && <SynopticTagBadge regime={e.synoptic_regime} size="sm" />}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontFamily: "Roboto Mono", color: "#EA4335", fontWeight: 700 }}>
                          MAE: {(e.bust_mae ?? e.verification_mae ?? 0).toFixed(1)} mm
                        </div>
                        {e.similarity_score && (
                          <div style={{ fontSize: 10, color: "#9AA0A6" }}>sim. {(e.similarity_score * 100).toFixed(0)}%</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
