import { create } from "zustand";
import type { ForecastRun, BustDetection, RegionRisk, LiveAlert } from "./types";

interface VayuDrishtiState {
  // Current forecast run
  selectedRunId: string | null;
  setSelectedRunId: (id: string | null) => void;

  // Forecast runs list
  forecastRuns: ForecastRun[];
  setForecastRuns: (runs: ForecastRun[]) => void;

  // Bust detections
  bustDetections: BustDetection[];
  setBustDetections: (busts: BustDetection[]) => void;

  // Region risks
  regionRisks: RegionRisk[];
  setRegionRisks: (risks: RegionRisk[]) => void;

  // Live alerts
  liveAlerts: LiveAlert[];
  addLiveAlert: (alert: LiveAlert) => void;
  clearAlerts: () => void;

  // UI state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Selected lead day for map
  selectedLeadDay: number;
  setSelectedLeadDay: (day: number) => void;

  // System status
  systemStatus: "live" | "degraded" | "offline";
  setSystemStatus: (status: "live" | "degraded" | "offline") => void;
}

export const useStore = create<VayuDrishtiState>((set) => ({
  selectedRunId: null,
  setSelectedRunId: (id) => set({ selectedRunId: id }),

  forecastRuns: [],
  setForecastRuns: (runs) => set({ forecastRuns: runs }),

  bustDetections: [],
  setBustDetections: (busts) => set({ bustDetections: busts }),

  regionRisks: [],
  setRegionRisks: (risks) => set({ regionRisks: risks }),

  liveAlerts: [],
  addLiveAlert: (alert) =>
    set((state) => ({
      liveAlerts: [alert, ...state.liveAlerts].slice(0, 50), // keep last 50
    })),
  clearAlerts: () => set({ liveAlerts: [] }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  selectedLeadDay: 1,
  setSelectedLeadDay: (day) => set({ selectedLeadDay: day }),

  systemStatus: "live",
  setSystemStatus: (status) => set({ systemStatus: status }),
}));
