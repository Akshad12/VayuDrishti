"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, ResponsiveContainer } from "recharts";
import { FEATURE_DISPLAY_NAMES } from "@/lib/constants";
import type { SHAPFeature } from "@/lib/types";

interface SHAPWaterfallChartProps {
  features: SHAPFeature[];
  baseValue?: number;
  predictedValue?: number;
  height?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="tooltip" style={{ position: "relative" }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.displayName}</div>
      <div style={{ fontSize: 12 }}>
        SHAP: <span style={{ fontFamily: "Roboto Mono", color: d.color }}>{d.direction === "positive" ? "+" : ""}{d.value.toFixed(4)}</span>
      </div>
      <div style={{ fontSize: 11, color: "#9AA0A6", marginTop: 2 }}>{d.description}</div>
    </div>
  );
};

export default function SHAPWaterfallChart({
  features,
  baseValue = 0.5,
  predictedValue,
  height = 280,
}: SHAPWaterfallChartProps) {
  if (!features || features.length === 0) return null;

  const chartData = features.slice(0, 8).map((f) => ({
    feature: f.feature,
    displayName: FEATURE_DISPLAY_NAMES[f.feature] ?? f.feature.replace(/_/g, " "),
    value: f.direction === "positive" ? f.shap_value : -f.shap_value,
    direction: f.direction,
    magnitude: f.magnitude,
    description: f.description ?? "",
    color: f.direction === "positive" ? "#EA4335" : "#34A853",
  }));

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 12, alignItems: "center" }}>
        <div>
          <span style={{ fontSize: 11, color: "#9AA0A6" }}>Base value </span>
          <span style={{ fontFamily: "Roboto Mono", fontWeight: 600, fontSize: 13, color: "#5F6368" }}>
            {(baseValue * 100).toFixed(1)}%
          </span>
        </div>
        {predictedValue && (
          <>
            <span style={{ color: "#DADCE0" }}>→</span>
            <div>
              <span style={{ fontSize: 11, color: "#9AA0A6" }}>Predicted </span>
              <span style={{ fontFamily: "Roboto Mono", fontWeight: 700, fontSize: 15, color: "#EA4335" }}>
                {(predictedValue * 100).toFixed(1)}%
              </span>
            </div>
          </>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 140 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#9AA0A6", fontFamily: "Roboto Mono" }}
            tickFormatter={(v) => v.toFixed(2)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="displayName"
            tick={{ fontSize: 11, fill: "#5F6368" }}
            axisLine={false}
            tickLine={false}
            width={140}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8F9FA" }} />
          <ReferenceLine x={0} stroke="#DADCE0" strokeWidth={1} />
          <Bar dataKey="value" radius={3} maxBarSize={18}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "#EA4335" }} />
          <span style={{ color: "#5F6368" }}>Increases bust risk</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "#34A853" }} />
          <span style={{ color: "#5F6368" }}>Decreases bust risk</span>
        </div>
      </div>
    </div>
  );
}
