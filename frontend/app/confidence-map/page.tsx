"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AlertBanner from "@/components/layout/AlertBanner";
import ConfidenceTimeline from "@/components/charts/ConfidenceTimeline";
import SynopticTagBadge from "@/components/cards/SynopticTagBadge";
import { useStore } from "@/lib/store";
import { useConfidenceMap, useRegionRiskMap } from "@/hooks/useConfidenceMap";
import { fetchRunConfidence } from "@/lib/api";

const ConfidenceMap = dynamic(() => import("@/components/map/ConfidenceMap"), { ssr: false });

export default function ConfidenceMapPage() {
  const selectedRunId = useStore((s) => s.selectedRunId);
  const selectedLeadDay = useStore((s) => s.selectedLeadDay);
  const setSelectedLeadDay = useStore((s) => s.setSelectedLeadDay);
  const [gridData, setGridData] = useState<unknown>(null);
  const [selectedCell, setSelectedCell] = useState<Record<string, unknown> | null>(null);
  const [activeLayer, setActiveLayer] = useState("bust_probability");

  const { leadTimes, synopticRegime, isLoading: confLoading } = useConfidenceMap(selectedRunId, selectedLeadDay);
  const { regions } = useRegionRiskMap();

  useEffect(() => {
    if (!selectedRunId) return;
    fetchRunConfidence(selectedRunId, selectedLeadDay)
      .then((data) => setGridData(data.grid))
      .catch(() => {});
  }, [selectedRunId, selectedLeadDay]);

  const layers = [
    { id: "bust_probability", label: "Bust Probability" },
    { id: "confidence_score", label: "Confidence Score" },
    { id: "historical_bias", label: "Historical Bias" },
    { id: "risk_zones", label: "Risk Zones" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <AlertBanner />
        <main style={{ flex: 1, display: "flex", overflow: "hidden", background: "#F8F9FA" }}>
          {/* Map area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px", gap: 12 }}>
            {/* Layer toggles */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#5F6368", fontWeight: 500 }}>Layer:</span>
              {layers.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setActiveLayer(l.id)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    border: `1px solid ${activeLayer === l.id ? "#1A73E8" : "#DADCE0"}`,
                    background: activeLayer === l.id ? "#E8F0FE" : "#fff",
                    color: activeLayer === l.id ? "#1A73E8" : "#5F6368",
                    fontSize: 12,
                    fontWeight: activeLayer === l.id ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {l.label}
                </button>
              ))}
              {synopticRegime && (
                <div style={{ marginLeft: "auto" }}>
                  <SynopticTagBadge regime={synopticRegime} size="sm" />
                </div>
              )}
            </div>

            {/* Lead-day scrubber */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "#5F6368", fontWeight: 500, whiteSpace: "nowrap" }}>Lead Day:</span>
              <input
                type="range"
                min={1} max={10} step={1}
                value={selectedLeadDay}
                onChange={(e) => setSelectedLeadDay(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: "#1A73E8" }}
              />
              <span
                style={{
                  fontFamily: "Roboto Mono",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#1A73E8",
                  width: 32,
                  textAlign: "right",
                }}
              >
                D{selectedLeadDay}
              </span>
            </div>

            {/* Map */}
            <div style={{ flex: 1, minHeight: 400 }}>
              <ConfidenceMap
                geojson={gridData as any}
                onCellClick={(props) => setSelectedCell(props)}
                height={undefined}
              />
            </div>

            {/* Confidence timeline */}
            <div className="card" style={{ padding: "14px 16px" }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "#202124", marginBottom: 8 }}>
                Confidence Degradation Curve
              </h3>
              <ConfidenceTimeline data={leadTimes} height={160} />
            </div>
          </div>

          {/* Right panel — cell details */}
          <div
            style={{
              width: 280,
              background: "#fff",
              borderLeft: "1px solid #DADCE0",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px", borderBottom: "1px solid #DADCE0" }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "#202124" }}>Grid Cell Details</h2>
            </div>
            <div style={{ padding: 16, overflow: "auto", flex: 1 }}>
              {selectedCell ? (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <div className="label-sm">BUST PROBABILITY</div>
                    <div
                      className="value-xl"
                      style={{
                        color:
                          (selectedCell.bust_probability as number) > 0.75
                            ? "#EA4335"
                            : (selectedCell.bust_probability as number) > 0.55
                            ? "#FF6D00"
                            : "#202124",
                      }}
                    >
                      {((selectedCell.bust_probability as number) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div className="label-sm">CONFIDENCE SCORE</div>
                    <div className="value-lg" style={{ color: "#1A73E8" }}>
                      {((selectedCell.confidence_score as number) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div className="label-sm">UNCERTAINTY BAND</div>
                    <div style={{ fontSize: 13, fontFamily: "Roboto Mono", color: "#5F6368" }}>
                      {((selectedCell.uncertainty_low as number) * 100).toFixed(1)}% –{" "}
                      {((selectedCell.uncertainty_high as number) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="label-sm">LEAD DAY</div>
                    <div style={{ fontSize: 13, color: "#202124" }}>
                      Day {selectedCell.lead_day as number}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 12, color: "#9AA0A6" }}>
                    Click any grid cell on the map to view bust probability details and top SHAP feature drivers.
                  </p>
                  <div style={{ marginTop: 16 }}>
                    <div className="label-sm" style={{ marginBottom: 8 }}>ALL REGION RISKS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {regions.slice(0, 8).map((r) => (
                        <div
                          key={r.region_id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "6px 0",
                            borderBottom: "1px solid #F1F3F4",
                          }}
                        >
                          <span style={{ fontSize: 12, color: "#202124" }}>{r.region_name}</span>
                          <span
                            style={{
                              fontSize: 11,
                              fontFamily: "Roboto Mono",
                              fontWeight: 700,
                              color:
                                r.risk_level === "CRITICAL"
                                  ? "#EA4335"
                                  : r.risk_level === "HIGH"
                                  ? "#FF6D00"
                                  : r.risk_level === "MODERATE"
                                  ? "#8A6914"
                                  : "#1E6C3B",
                            }}
                          >
                            {(r.bust_probability * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
