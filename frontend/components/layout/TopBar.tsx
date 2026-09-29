"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { fetchForecastRuns } from "@/lib/api";
import type { ForecastRun } from "@/lib/types";

export default function TopBar() {
  const [runs, setRuns] = useState<ForecastRun[]>([]);
  const selectedRunId = useStore((s) => s.selectedRunId);
  const setSelectedRunId = useStore((s) => s.setSelectedRunId);
  const setForecastRuns = useStore((s) => s.setForecastRuns);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const systemStatus = useStore((s) => s.systemStatus);

  useEffect(() => {
    fetchForecastRuns(1, 10).then((data) => {
      setRuns(data.runs);
      setForecastRuns(data.runs);
      if (!selectedRunId && data.runs.length > 0) {
        setSelectedRunId(data.runs[0].run_id);
      }
    }).catch(() => {});
  }, [setSelectedRunId, setForecastRuns, selectedRunId]);

  const statusColor = systemStatus === "live" ? "#34A853" : systemStatus === "degraded" ? "#FBBC04" : "#EA4335";
  const statusLabel = systemStatus === "live" ? "Live" : systemStatus === "degraded" ? "Degraded" : "Offline";

  const selectedRun = runs.find((r) => r.run_id === selectedRunId);

  return (
    <header
      style={{
        height: 56,
        background: "#fff",
        borderBottom: "1px solid #DADCE0",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 16,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 5,
      }}
    >
      {/* Toggle sidebar */}
      <button
        onClick={toggleSidebar}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px",
          color: "#5F6368",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
        }}
        title="Toggle sidebar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Run selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: "#5F6368", fontWeight: 500 }}>Forecast Run:</span>
        <select
          value={selectedRunId ?? ""}
          onChange={(e) => setSelectedRunId(e.target.value)}
          style={{
            border: "1px solid #DADCE0",
            borderRadius: 6,
            padding: "5px 28px 5px 10px",
            fontSize: 13,
            fontFamily: "Roboto Mono, monospace",
            background: "#fff",
            color: "#202124",
            cursor: "pointer",
            outline: "none",
          }}
        >
          {runs.map((r) => (
            <option key={r.run_id} value={r.run_id}>
              {r.model_name} · {new Date(r.init_time).toUTCString().slice(5, 22)} UTC
            </option>
          ))}
        </select>
      </div>

      {/* Model badge */}
      {selectedRun && (
        <div
          style={{
            padding: "3px 10px",
            background: "#E8F0FE",
            borderRadius: 4,
            fontSize: 12,
            color: "#1A73E8",
            fontWeight: 600,
          }}
        >
          {selectedRun.model_name} · 0.25°
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* System status */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: statusColor,
            animation: systemStatus === "live" ? "pulse-dot 2s ease-in-out infinite" : "none",
          }}
        />
        <span style={{ fontSize: 12, color: statusColor, fontWeight: 600 }}>
          {statusLabel}
        </span>
      </div>

      {/* VayuDrishti wordmark */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1A73E8", letterSpacing: -0.3 }}>
        SIH 2026 · Problem 26079
      </div>
    </header>
  );
}
