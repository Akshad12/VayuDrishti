"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { INDIA_CENTER, INDIA_ZOOM, RISK_COLORS } from "@/lib/constants";

declare const mapboxgl: any;

interface ConfidenceMapProps {
  geojson?: unknown;
  regionGeojson?: unknown;
  onCellClick?: (props: Record<string, unknown>) => void;
  height?: number;
}

export default function ConfidenceMap({
  geojson, regionGeojson, onCellClick, height = 500,
}: ConfidenceMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const selectedLeadDay = useStore((s) => s.selectedLeadDay);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Check if mapboxgl is available
    if (typeof window === "undefined" || !(window as any).mapboxgl) {
      // Try loading dynamically
      setMapError("Mapbox GL JS loading...");
      return;
    }

    const mapboxgl = (window as any).mapboxgl;
    mapboxgl.accessToken = token;

    try {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: token.startsWith("pk.eyJ1IjoiZGVtbyIi")
          ? "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          : "mapbox://styles/mapbox/light-v11",
        center: INDIA_CENTER,
        zoom: INDIA_ZOOM,
        minZoom: 3,
        maxZoom: 10,
      });

      map.on("load", () => {
        setMapLoaded(true);
        mapRef.current = map;

        // Add bust probability layer
        if (geojson) {
          map.addSource("bust-probability", { type: "geojson", data: geojson });
          map.addLayer({
            id: "bust-probability-circles",
            type: "circle",
            source: "bust-probability",
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 6, 8, 14],
              "circle-color": [
                "interpolate",
                ["linear"],
                ["get", "bust_probability"],
                0, "#34A853",
                0.3, "#FBBC04",
                0.55, "#FF6D00",
                0.75, "#EA4335",
                1.0, "#B71C1C",
              ],
              "circle-opacity": 0.75,
            },
          });

          // Tooltip on hover
          const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
          map.on("mouseenter", "bust-probability-circles", (e: any) => {
            map.getCanvas().style.cursor = "pointer";
            const props = e.features[0].properties;
            const prob = (props.bust_probability * 100).toFixed(1);
            const conf = (props.confidence_score * 100).toFixed(1);
            popup.setLngLat(e.lngLat)
              .setHTML(`
                <div style="font-family:Roboto Mono,monospace;font-size:12px;color:#fff">
                  <div style="font-weight:700;font-size:14px;margin-bottom:4px">${prob}%</div>
                  <div style="color:#9AA0A6">Bust Prob · Day ${props.lead_day}</div>
                  <div style="color:#9AA0A6">Confidence: ${conf}%</div>
                </div>
              `)
              .addTo(map);
          });
          map.on("mouseleave", "bust-probability-circles", () => {
            map.getCanvas().style.cursor = "";
            popup.remove();
          });
          map.on("click", "bust-probability-circles", (e: any) => {
            if (onCellClick) onCellClick(e.features[0].properties);
          });
        }

        // Add India boundary
        map.addSource("india-boundary", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[
                [65, 5], [100, 5], [100, 38], [65, 38], [65, 5],
              ]],
            },
          },
        });
        map.addLayer({
          id: "india-boundary-line",
          type: "line",
          source: "india-boundary",
          paint: { "line-color": "#DADCE0", "line-width": 1 },
        });
      });

      map.on("error", (e: any) => {
        if (e.error?.status === 401) {
          setMapError("Map token invalid — showing grid overlay only");
        }
      });
    } catch (err) {
      setMapError("Map initialization failed");
    }
  }, [token]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !geojson) return;
    const map = mapRef.current as any;
    if (map.getSource("bust-probability")) {
      map.getSource("bust-probability").setData(geojson);
    }
  }, [geojson, mapLoaded]);

  return (
    <div style={{ position: "relative", height, borderRadius: 8, overflow: "hidden", border: "1px solid #DADCE0" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      {/* Fallback grid overlay when map unavailable */}
      {(mapError || !token.startsWith("pk.")) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#F8F9FA",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <IndiaGridFallback geojson={geojson as any} />
        </div>
      )}

      {/* Color scale legend */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          background: "rgba(255,255,255,0.95)",
          border: "1px solid #DADCE0",
          borderRadius: 6,
          padding: "10px 12px",
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 600, color: "#5F6368", marginBottom: 6 }}>BUST PROBABILITY</div>
        <div style={{ display: "flex", gap: 4 }}>
          {["#34A853", "#FBBC04", "#FF6D00", "#EA4335"].map((color, i) => (
            <div key={i}>
              <div style={{ width: 20, height: 8, background: color, borderRadius: 2 }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#9AA0A6", marginTop: 3 }}>
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </div>

      {/* Lead day badge */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: "rgba(255,255,255,0.95)",
          border: "1px solid #DADCE0",
          borderRadius: 6,
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
          color: "#1A73E8",
        }}
      >
        Day {selectedLeadDay} Forecast
      </div>
    </div>
  );
}

function IndiaGridFallback({ geojson }: { geojson?: { features?: Array<{ geometry?: { coordinates?: number[] }; properties?: Record<string, unknown> }> } | null }) {
  const features = geojson?.features ?? [];

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#F8F9FA" }}>
      <svg viewBox="0 0 400 400" style={{ width: "100%", height: "100%" }}>
        <text x="200" y="20" textAnchor="middle" style={{ fontSize: 11, fill: "#9AA0A6" }}>
          India Domain — Bust Probability Grid (0.25° × 0.25°)
        </text>
        {features.slice(0, 500).map((f, i) => {
          const coords = f.geometry?.coordinates as number[] | undefined;
          if (!coords) return null;
          const lon = coords[0], lat = coords[1];
          const prob = f.properties?.bust_probability as number ?? 0;
          const x = ((lon - 65) / 35) * 370 + 15;
          const y = 380 - ((lat - 5) / 33) * 360;
          const color =
            prob >= 0.75 ? "#EA4335" : prob >= 0.55 ? "#FF6D00" : prob >= 0.3 ? "#FBBC04" : "#34A853";
          return (
            <circle
              key={i}
              cx={x} cy={y} r={4}
              fill={color}
              fillOpacity={0.7}
            >
              <title>Prob: {(prob * 100).toFixed(1)}%</title>
            </circle>
          );
        })}
        {/* Simple India boundary outline */}
        <path
          d="M 15 380 L 15 30 L 385 30 L 385 380 Z"
          fill="none"
          stroke="#DADCE0"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        {features.length === 0 && (
          <text x="200" y="200" textAnchor="middle" style={{ fontSize: 13, fill: "#9AA0A6" }}>
            Loading forecast data...
          </text>
        )}
      </svg>
    </div>
  );
}
