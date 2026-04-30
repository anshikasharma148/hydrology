'use client';

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import ReactECharts from "echarts-for-react";
import {
  Thermometer,
  CloudRain,
  Snowflake,
  Waves,
  Gauge,
  TrendingUp,
  TrendingDown,
  Camera,
  Activity,
  AlertTriangle,
  RefreshCw,
  Clock,
  Droplets,
  Wind,
  Sun,
  Cloud,
  MapPin,
  Expand,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { getApiBase } from "../../lib/api";

// Zoomable image with zoom in/out and pan (reset focus)
function ZoomableImage({ imageUrl, alt, onExpand, loading, error }) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((s) => Math.min(3, Math.max(0.5, s + delta)));
  };

  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const zoomIn = () => setScale((s) => Math.min(3, s + 0.25));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.25));
  const reset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-slate-500 h-full min-h-[170px]">
        <Activity className="w-8 h-8 animate-pulse" />
        <span className="text-xs">Loading image...</span>
      </div>
    );
  }
  if (error) {
    return <p className="text-sm text-red-600 px-4 text-center py-8">{error}</p>;
  }
  if (!imageUrl) return null;

  return (
    <div className="relative w-full h-full min-h-[170px] flex flex-col">
      <div className="absolute top-0 right-0 flex items-center gap-1 p-1 bg-black/40 rounded-lg z-10">
        <button type="button" onClick={zoomIn} className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white" title="Zoom in"><ZoomIn className="w-4 h-4" /></button>
        <button type="button" onClick={zoomOut} className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white" title="Zoom out"><ZoomOut className="w-4 h-4" /></button>
        <button type="button" onClick={reset} className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white" title="Reset zoom"><RotateCcw className="w-4 h-4" /></button>
      </div>
      <div
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-slate-100"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ touchAction: "none" }}
      >
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)` }}
          onClick={() => scale === 1 && onExpand?.()}
        >
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-full w-auto h-full object-contain select-none pointer-events-none"
            draggable={false}
            style={{ pointerEvents: scale > 1 ? "none" : "auto" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function SCADAPage() {
  const router = useRouter();
  const [awsData, setAwsData] = useState({});
  const [ewsData, setEwsData] = useState({});
  const [inflowReferenceData, setInflowReferenceData] = useState({
    designByMonth: {},
    averageByMonth: {},
    loading: true,
    error: null,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [activeStation, setActiveStation] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredStation, setHoveredStation] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef(null);
  const awsDataSnapshotRef = useRef("");
  const ewsDataSnapshotRef = useRef("");
  const [hydrocamMana, setHydrocamMana] = useState({ imageUrl: null, loading: true, error: null });
  const [hydrocamVasudhara, setHydrocamVasudhara] = useState({ imageUrl: null, loading: true, error: null });
  const [viewImage, setViewImage] = useState(null); // 'mana' | 'vasudhara' | null
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const lightboxDragRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  useEffect(() => {
    if (viewImage) {
      setLightboxZoom(1);
      setLightboxPan({ x: 0, y: 0 });
    }
  }, [viewImage]);

  // Protect route
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/auth/login");
    }
  }, []);

  // Get time range: 8 AM today to 8 AM next day
  const getTimeRange = () => {
    const now = new Date();
    // Get today's 8 AM using explicit date constructor to avoid timezone issues
    const today8AM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0, 0);

    const nextDay8AM = new Date(today8AM);
    nextDay8AM.setDate(nextDay8AM.getDate() + 1);

    // If current time is before 8 AM, use yesterday 8 AM to today 8 AM
    if (now < today8AM) {
      const yesterday8AM = new Date(today8AM);
      yesterday8AM.setDate(yesterday8AM.getDate() - 1);
      return { start: yesterday8AM, end: today8AM };
    }

    return { start: today8AM, end: nextDay8AM };
  };

  // Get previous day time range: 8 AM to 8 AM cycle for yesterday
  // The previous cycle should always be the completed 8AM-8AM cycle before the current one
  const getPreviousDayTimeRange = () => {
    const now = new Date();
    // Get today's 8 AM using explicit date constructor to avoid timezone issues
    const today8AM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0, 0);

    // If current time is before 8 AM today, the current cycle is yesterday 8AM to today 8AM
    // So previous cycle is day-before-yesterday 8AM to yesterday 8AM
    if (now < today8AM) {
      const yesterday8AM = new Date(today8AM);
      yesterday8AM.setDate(yesterday8AM.getDate() - 1);
      
      const dayBeforeYesterday8AM = new Date(yesterday8AM);
      dayBeforeYesterday8AM.setDate(dayBeforeYesterday8AM.getDate() - 1);
      
      return { start: dayBeforeYesterday8AM, end: yesterday8AM };
    }

    // If current time is after 8 AM today, the current cycle is today 8AM to tomorrow 8AM
    // So previous cycle is yesterday 8AM to today 8AM
    const yesterday8AM = new Date(today8AM);
    yesterday8AM.setDate(yesterday8AM.getDate() - 1);

    return { start: yesterday8AM, end: today8AM };
  };

  // Get formatted previous date
  const getPreviousDate = () => {
    const { start } = getPreviousDayTimeRange();
    return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Parse CSV line handling quoted values
  const parseCsvLine = (line) => {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const next = line[i + 1];

      if (ch === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }

    values.push(current.trim());
    return values;
  };

  const getCurrentTenDaySet = (date) => {
    const day = date.getDate();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    if (day <= 10) {
      return { index: 0, roman: "I", label: "1-10" };
    }
    if (day <= 20) {
      return { index: 1, roman: "II", label: "11-20" };
    }
    return { index: 2, roman: "III", label: `21-${daysInMonth}` };
  };

  const parseDesignDischargeCsv = (csvText) => {
    const byMonth = {};
    const rows = csvText.split(/\r?\n/);

    rows.forEach((line) => {
      if (!line.trim()) return;
      const [monthRaw, , inflowRaw] = parseCsvLine(line);
      const month = (monthRaw || "").replace(/^"|"$/g, "").trim().toUpperCase();
      const inflow = Number((inflowRaw || "").replace(/^"|"$/g, "").trim());

      if (!month || month === "MONTH" || Number.isNaN(inflow)) return;

      if (!byMonth[month]) byMonth[month] = [];
      byMonth[month].push(inflow);
    });

    return byMonth;
  };

  const parseAverageDischargeCsv = (csvText) => {
    const byMonth = {};
    let currentMonth = "";
    const rows = csvText.split(/\r?\n/);

    rows.forEach((line) => {
      if (!line.trim()) return;
      const [monthRaw, setRaw, avgRaw] = parseCsvLine(line);
      const monthCell = (monthRaw || "").replace(/^"|"$/g, "").trim();
      const set = (setRaw || "").replace(/^"|"$/g, "").trim().toUpperCase();
      const avg = Number((avgRaw || "").replace(/^"|"$/g, "").trim());

      if (monthCell && /^[A-Za-z]{3,10}$/.test(monthCell)) {
        const normalized = monthCell.toUpperCase();
        if (normalized !== "MONTH" && normalized !== "NOTE") {
          currentMonth = normalized.slice(0, 3);
        }
      }

      if (!currentMonth || !["I", "II", "III"].includes(set) || Number.isNaN(avg)) return;

      if (!byMonth[currentMonth]) byMonth[currentMonth] = {};
      byMonth[currentMonth][set] = avg;
    });

    return byMonth;
  };

  /**
   * Incremental precipitation from cumulative bucket data (weighing bucket / snow gauge).
   * - Precipitation value = cumulative water in bucket; increases when snow/rain falls; can reset when bucket is emptied.
   * - Snowfall/rain for an interval = increase from previous reading only if current > previous and increment >= MIN_MM.
   * - If current < previous: treat as bucket reset, do not count negative as snowfall.
   * - MIN_MM filters sensor noise.
   * @param {Array<{ timestamp: string, rain?: number|null, precipitation?: number|null }>} data - readings sorted or to be sorted by timestamp
   * @returns {{ rainIncrements: number[], precipIncrements: number[], sortedReadings: typeof data }}
   */
  const computeIncrementalPrecipitation = (data) => {
    const MIN_MM = 0.1;
    if (!data || data.length === 0) {
      return { rainIncrements: [], precipIncrements: [], sortedReadings: [] };
    }
    const sorted = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const rainIncrements = [];
    const precipIncrements = [];
    for (let i = 0; i < sorted.length; i++) {
      const curr = sorted[i];
      const prev = sorted[i - 1];
      const rCurr = curr.rain != null && !isNaN(curr.rain) ? Number(curr.rain) : null;
      const pCurr = curr.precipitation != null && !isNaN(curr.precipitation) ? Number(curr.precipitation) : null;
      if (i === 0) {
        rainIncrements.push(0);
        precipIncrements.push(0);
        continue;
      }
      const rPrev = prev.rain != null && !isNaN(prev.rain) ? Number(prev.rain) : null;
      const pPrev = prev.precipitation != null && !isNaN(prev.precipitation) ? Number(prev.precipitation) : null;
      let rInc = 0;
      if (rCurr != null && rPrev != null && rCurr > rPrev) {
        const diff = rCurr - rPrev;
        if (diff >= MIN_MM) rInc = diff;
      }
      let pInc = 0;
      if (pCurr != null && pPrev != null && pCurr > pPrev) {
        const diff = pCurr - pPrev;
        if (diff >= MIN_MM) pInc = diff;
      }
      rainIncrements.push(rInc);
      precipIncrements.push(pInc);
    }
    return { rainIncrements, precipIncrements, sortedReadings: sorted };
  };

  /**
   * Sum of increments within a time range (by reading timestamp).
   * Use for cumulative monthly / previous day from incremental logic.
   */
  const sumIncrementsInRange = (sortedReadings, increments, rangeStart, rangeEnd) => {
    let sum = 0;
    for (let i = 0; i < sortedReadings.length; i++) {
      const ts = new Date(sortedReadings[i].timestamp);
      if (ts >= rangeStart && ts <= rangeEnd) sum += increments[i] || 0;
    }
    return sum;
  };

  // Half-open interval [start, end) to avoid overlap at exact boundaries (for 8AM cycle windows)
  const sumIncrementsInHalfOpenRange = (sortedReadings, increments, rangeStart, rangeEnd) => {
    let sum = 0;
    for (let i = 0; i < sortedReadings.length; i++) {
      const ts = new Date(sortedReadings[i].timestamp);
      if (ts >= rangeStart && ts < rangeEnd) sum += increments[i] || 0;
    }
    return sum;
  };

  /**
   * Returns per-reading series for a month: timestamp, precipitation, snowfall_increment, cumulative_monthly_snowfall.
   * Same logic for rain if needed (use rainIncrements + sortedReadings).
   */
  const getMonthlyPrecipitationSeries = (data, year, month, type = 'snow') => {
    const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const { rainIncrements, precipIncrements, sortedReadings } = computeIncrementalPrecipitation(data);
    const increments = type === 'snow' ? precipIncrements : rainIncrements;
    const key = type === 'snow' ? 'precipitation' : 'rain';
    let running = 0;
    return sortedReadings
      .map((r, i) => {
        const ts = new Date(r.timestamp);
        if (ts < monthStart || ts > monthEnd) return null;
        const inc = increments[i] || 0;
        running += inc;
        return {
          timestamp: r.timestamp,
          [key]: r[key],
          snowfall_increment: type === 'snow' ? inc : undefined,
          rain_increment: type === 'rain' ? inc : undefined,
          cumulative_monthly_snowfall: type === 'snow' ? running : undefined,
          cumulative_monthly_rain: type === 'rain' ? running : undefined,
        };
      })
      .filter(Boolean);
  };

  // Calculate min/max for AWS
  const calculateAWSStats = (data, stationName) => {
    if (!data || data.length === 0) {
      return {
        temperature: { current: null, min: null, max: null, prevMin: null, prevMax: null },
        rain: { current: null, min: null, max: null },
        precipitation: { current: null, min: null, max: null },
        timestamp: null,
      };
    }

    // Sort by timestamp ascending for bucket-level and incremental logic
    const sorted = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const latest = sorted[sorted.length - 1] || {};

    // Current temp = latest reading; rain/snow cycle values are set from increments below
    const current = {
      temperature: latest.temperature !== null && latest.temperature !== undefined ? Number(latest.temperature) : null,
      rain: null,
      precipitation: null, // set below from increment sums (do not use raw bucket value)
    };

    const { start, end } = getTimeRange();
    const filtered = sorted.filter((item) => {
      const ts = new Date(item.timestamp);
      // 8AM-cycle current window: [start, end)
      return ts >= start && ts < end;
    });

    const temps = filtered.map((d) => d.temperature).filter((v) => v !== null && !isNaN(v));
    const rains = filtered.map((d) => d.rain).filter((v) => v !== null && !isNaN(v));

    // Previous day temperature and rain: 8AM-8AM cycle
    const { start: prevStart, end: prevEnd } = getPreviousDayTimeRange();
    const prevFiltered = sorted.filter((item) => {
      const ts = new Date(item.timestamp);
      // 8AM-cycle previous window: [prevStart, prevEnd)
      return ts >= prevStart && ts < prevEnd;
    });
    const prevTemps = prevFiltered.map((d) => d.temperature).filter((v) => v !== null && !isNaN(v));
    // Rain/Snow from increments only (diff >= 0.1 → increment = diff; diff < 0.1 or diff < 0 → 0)
    // Current/previous-day follow 8AM-8AM cycle windows.
    const { rainIncrements, precipIncrements, sortedReadings } = computeIncrementalPrecipitation(data);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const currentRain = sumIncrementsInHalfOpenRange(sortedReadings, rainIncrements, start, end);
    const prevDayRain = sumIncrementsInHalfOpenRange(sortedReadings, rainIncrements, prevStart, prevEnd);
    const currentSnow = sumIncrementsInHalfOpenRange(sortedReadings, precipIncrements, start, end);
    const prevDaySnow = sumIncrementsInHalfOpenRange(sortedReadings, precipIncrements, prevStart, prevEnd);
    const monthlySnow = sumIncrementsInRange(sortedReadings, precipIncrements, monthStart, monthEnd);

    current.rain = currentRain;
    current.precipitation = currentSnow;
    const prevPrecipLast = prevDaySnow;
    const precipMonthlyTotal = monthlySnow;
    const rainMonthlyTotal = sumIncrementsInRange(sortedReadings, rainIncrements, monthStart, monthEnd);

    return {
      temperature: {
        current: current.temperature,
        min: temps.length > 0 ? Math.min(...temps) : null,
        max: temps.length > 0 ? Math.max(...temps) : null,
        prevMin: prevTemps.length > 0 ? Math.min(...prevTemps) : null,
        prevMax: prevTemps.length > 0 ? Math.max(...prevTemps) : null,
      },
      rain: {
        current: current.rain,
        previousDay: prevDayRain,
        cumulativeMonthly: rainMonthlyTotal,
      },
      precipitation: {
        current: current.precipitation,
        previousDay: prevPrecipLast,
        cumulativeMonthly: precipMonthlyTotal,
      },
      timestamp: latest.timestamp || null,
    };
  };

  // Calculate min/max for EWS
  const calculateEWSStats = (data, stationName) => {
    if (!data || data.length === 0) {
      return {
        water_level: { current: null, min: null, max: null },
        surface_velocity: { current: null, min: null, max: null },
        water_discharge: { current: null, min: null, max: null },
        timestamp: null,
      };
    }

    // Get current reading (latest)
    const latest = data[0] || {};
    const current = {
      water_level: latest.water_level !== null && latest.water_level !== undefined ? Number(latest.water_level) : null,
      surface_velocity: latest.surface_velocity !== null && latest.surface_velocity !== undefined ? Number(latest.surface_velocity) : null,
      water_discharge: latest.water_discharge !== null && latest.water_discharge !== undefined ? Number(latest.water_discharge) : null,
    };

    const { start, end } = getTimeRange();
    const filtered = data.filter((item) => {
      const ts = new Date(item.timestamp);
      return ts >= start && ts <= end;
    });

    const levels = filtered.map((d) => Number(d.water_level)).filter((v) => !isNaN(v) && v !== null);
    const velocities = filtered.map((d) => Number(d.surface_velocity)).filter((v) => !isNaN(v) && v !== null);
    const discharges = filtered.map((d) => Number(d.water_discharge)).filter((v) => !isNaN(v) && v !== null);

    return {
      water_level: {
        current: current.water_level,
        min: levels.length > 0 ? Math.min(...levels) : null,
        max: levels.length > 0 ? Math.max(...levels) : null,
      },
      surface_velocity: {
        current: current.surface_velocity,
        min: velocities.length > 0 ? Math.min(...velocities) : null,
        max: velocities.length > 0 ? Math.max(...velocities) : null,
      },
      water_discharge: {
        current: current.water_discharge,
        min: discharges.length > 0 ? Math.min(...discharges) : null,
        max: discharges.length > 0 ? Math.max(...discharges) : null,
      },
      timestamp: latest.timestamp || null,
    };
  };

  // Check if station is offline based on timestamp (20 minutes threshold)
  const isStationOffline = (timestamp, thresholdMinutes = 20) => {
    if (!timestamp) return true;
    
    try {
      const parsed = Date.parse(timestamp);
      if (isNaN(parsed)) return true;
      
      const now = Date.now();
      const diffMinutes = (now - parsed) / (1000 * 60);
      
      return diffMinutes > thresholdMinutes;
    } catch (error) {
      return true;
    }
  };

  // Get risk level based on discharge for EWS stations
  const getRiskLevel = (stationName, discharge) => {
    if (discharge === null || discharge === undefined || isNaN(discharge)) {
      return null;
    }

    const dischargeValue = Number(discharge);

    if (stationName === "Mana") {
      if (dischargeValue >= 250) return "high"; // High Risk (Emergency)
      if (dischargeValue >= 150) return "moderate"; // Moderate Risk
      if (dischargeValue <= 15) return "low_discharge"; // Low Discharge
      return "no_risk"; // No Risk >15 and <150
    } else if (stationName === "Vasudhara") {
      if (dischargeValue >= 100) return "high"; // High Risk
      if (dischargeValue >= 60) return "moderate"; // Moderate Risk
      if (dischargeValue <= 12) return "low_discharge"; // Low Discharge
      return "no_risk"; // No Risk >12 and <60
    } else if (stationName === "Benakuli") {
      if (dischargeValue >= 350) return "high"; // High Risk
      if (dischargeValue >= 250) return "moderate"; // Moderate Risk
      if (dischargeValue <= 16) return "low_discharge"; // Low Discharge
      return "no_risk"; // No Risk >16 and <250
    }

    return null;
  };

  // Risk Marker Component with blinking animation
  const RiskMarker = ({ riskLevel }) => {
    if (!riskLevel) return null;

    const markerStyles = {
      high: "bg-red-500 border-red-500", // Red full circle
      moderate: "bg-amber-500 border-amber-500", // Amber/Orange full circle
      low_discharge: "bg-transparent border-2 border-red-500", // Red border only
      no_risk: "bg-transparent border-2 border-green-500", // Green border only
    };

    const isFullCircle = riskLevel === "high" || riskLevel === "moderate";
    const size = isFullCircle ? "w-3 h-3" : "w-3 h-3";

    return (
      <div
        className={`${size} rounded-full ${markerStyles[riskLevel]} animate-pulse`}
        style={{
          animation: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        }}
      />
    );
  };

  // Fetch AWS data
  const fetchAWSData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getApiBase()}/api/aws-live/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const json = await res.json();
      if (!json?.data) return {};

      const stations = ["Vasudhara", "Mana", "Lambagad"];
      const data = {};
      
      stations.forEach((station) => {
        const stationData = json.data[station] || [];
        data[station] = stationData.map((item) => ({
          timestamp: item.timestamp,
          temperature: item.temperature ? Number(item.temperature) : null,
          rain: item.rain ? Number(item.rain) : null,
          precipitation: item.precipitation ? Number(item.precipitation) : null,
        }));
      });

      const snapshot = JSON.stringify(data);
      if (snapshot !== awsDataSnapshotRef.current) {
        awsDataSnapshotRef.current = snapshot;
        setAwsData(data);
      }
    } catch (error) {
      console.error("AWS fetch failed", error);
    }
  };

  // Fetch EWS data
  const fetchEWSData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getApiBase()}/api/ews-live/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const json = await res.json();
      if (!json?.data) return {};

      const stations = ["Vasudhara", "Mana", "Benakuli"];
      const data = {};
      
      stations.forEach((station) => {
        const stationData = json.data[station] || [];
        data[station] = stationData.map((item) => ({
          timestamp: item.timestamp,
          water_level: item.water_level,
          surface_velocity: item.surface_velocity,
          water_discharge: item.water_discharge,
        }));
      });

      const snapshot = JSON.stringify(data);
      if (snapshot !== ewsDataSnapshotRef.current) {
        ewsDataSnapshotRef.current = snapshot;
        setEwsData(data);
      }
    } catch (error) {
      console.error("EWS fetch failed", error);
    }
  };

  const fetchAllData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    await Promise.all([fetchAWSData(), fetchEWSData()]);
    setLastUpdated(new Date().toLocaleString());
    if (!silent) setIsRefreshing(false);
  };

  const fetchHydrocamLatest = async (station, setState, silent = false) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getApiBase()}/api/hydrocam-latest/${station}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load ${station} image`);
      const data = await res.json();
      const imageUrl = data?.imageUrl || null;
      setState((prev) => {
        if (silent && prev.imageUrl === imageUrl && !prev.error) return prev;
        return { imageUrl, loading: false, error: null };
      });
    } catch (err) {
      setState((s) =>
        silent
          ? { ...s }
          : { ...s, loading: false, error: err.message, imageUrl: null }
      );
    }
  };

  const loadInflowReferenceData = async () => {
    try {
      const [designResponse, averageResponse] = await Promise.all([
        fetch("/design_csv/design_energy_calculation.csv", { cache: "no-store" }),
        fetch("/design_csv/Average%20Discharge%20Data%205%20Years.csv", { cache: "no-store" }),
      ]);

      if (!designResponse.ok || !averageResponse.ok) {
        throw new Error("Could not load inflow reference files");
      }

      const [designText, averageText] = await Promise.all([
        designResponse.text(),
        averageResponse.text(),
      ]);

      setInflowReferenceData({
        designByMonth: parseDesignDischargeCsv(designText),
        averageByMonth: parseAverageDischargeCsv(averageText),
        loading: false,
        error: null,
      });
    } catch (error) {
      setInflowReferenceData({
        designByMonth: {},
        averageByMonth: {},
        loading: false,
        error: "Failed to load inflow reference data",
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchAllData(true), loadInflowReferenceData()]);
      setLoading(false);
    };
    init();
    const interval = setInterval(() => fetchAllData(true), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isFirstRun = true;
    const fetchHydrocam = () => {
      const silent = !isFirstRun;
      isFirstRun = false;
      fetchHydrocamLatest("mana", setHydrocamMana, silent);
      fetchHydrocamLatest("vasudhara", setHydrocamVasudhara, silent);
    };
    fetchHydrocam();
    const interval = setInterval(fetchHydrocam, 10000);
    return () => clearInterval(interval);
  }, []);

  const awsStations = [
    { name: "Vasudhara", key: "Vasudhara", color: "from-cyan-500/10 to-blue-500/5" },
    { name: "Mana", key: "Mana", color: "from-emerald-500/10 to-green-500/5" },
    { name: "Barrage", key: "Lambagad", color: "from-violet-500/10 to-purple-500/5" },
  ];

  const ewsStations = [
    { name: "Vasudhara", key: "Vasudhara", color: "from-amber-500/10 to-orange-500/5" },
    { name: "Mana", key: "Mana", color: "from-rose-500/10 to-pink-500/5" },
    { name: "Benakuli", key: "Benakuli", color: "from-indigo-500/10 to-blue-500/5" },
  ];

  const formatValue = (val, decimals = 2) => {
    if (val === null || val === undefined || isNaN(val)) return "-";
    return Number(val).toFixed(decimals);
  };

  const now = new Date();
  const currentMonthLong = now.toLocaleString("en-US", { month: "long" }).toUpperCase();
  const currentMonthShort = now.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const currentTenDaySet = getCurrentTenDaySet(now);

  const designDischarge = inflowReferenceData.designByMonth[currentMonthLong]?.[currentTenDaySet.index] ?? null;
  const fiveYearsData = inflowReferenceData.averageByMonth[currentMonthShort]?.[currentTenDaySet.roman] ?? null;
  const manaDischargeRaw = ewsData?.Mana?.[0]?.water_discharge;
  const manaEwsTimestamp = ewsData?.Mana?.[0]?.timestamp ?? null;
  const isManaEwsOffline = isStationOffline(manaEwsTimestamp, 20);
  const manaDischarge = manaDischargeRaw === null || manaDischargeRaw === undefined || isNaN(Number(manaDischargeRaw))
    ? null
    : Number(manaDischargeRaw);
  const forecastedBarrageDischarge = (isManaEwsOffline || manaDischarge === null)
    ? null
    : (1.360095069 * manaDischarge) + 3.888353985;

  // Minimalist Stat Card Component
  const StatCard = ({ icon, label, current, min, max, unit, color = "slate", index }) => {
    const colorClasses = {
      slate: {
        bg: "bg-white",
        text: "text-slate-800",
        value: "text-slate-900",
        border: "border-slate-200",
        icon: "text-slate-600",
      },
      blue: {
        bg: "bg-white",
        text: "text-blue-800",
        value: "text-blue-900",
        border: "border-blue-200",
        icon: "text-blue-600",
      },
      emerald: {
        bg: "bg-white",
        text: "text-emerald-800",
        value: "text-emerald-900",
        border: "border-emerald-200",
        icon: "text-emerald-600",
      },
      amber: {
        bg: "bg-white",
        text: "text-amber-800",
        value: "text-amber-900",
        border: "border-amber-200",
        icon: "text-amber-600",
      },
    };

    const currentColor = colorClasses[color];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{ 
          scale: 1.02,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
        }}
        className={`${currentColor.bg} ${currentColor.border} border rounded-xl p-4 transition-all duration-300 hover:border-slate-300`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${currentColor.bg} border ${currentColor.border}`}>
              <div className={`w-4 h-4 ${currentColor.icon}`}>{icon}</div>
            </div>
            <span className={`text-sm font-semibold ${currentColor.text}`}>{label}</span>
          </div>
          <div className="text-xs font-medium text-slate-500 px-2 py-1 rounded-full bg-slate-100">
            {unit}
          </div>
        </div>

        {/* Current Value - Highlighted */}
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="mb-4"
        >
          <div className={`text-3xl font-bold ${currentColor.value} tracking-tight`}>
            {formatValue(current)}
            <span className="text-lg font-medium text-slate-500 ml-1">{unit}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Current Reading</div>
        </motion.div>

        {/* Min/Max Values */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-600">Min</span>
            </div>
            <div className="text-base font-bold text-slate-800">
              {formatValue(min)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-600">Max</span>
            </div>
            <div className="text-base font-bold text-slate-800">
              {formatValue(max)}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Station Card Component
  const StationCard = ({ station, type, stats, isActive, onClick }) => {
    const getStationIcon = (name) => {
      switch(name) {
        case "Vasudhara": return <Waves className="w-5 h-5" />;
        case "Mana": return <Wind className="w-5 h-5" />;
        case "Barrage": return <Sun className="w-5 h-5" />;
        case "Benakuli": return <Cloud className="w-5 h-5" />;
        default: return <MapPin className="w-5 h-5" />;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => onClick(station.name)}
        className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 ${
          isActive 
            ? "border-slate-800 bg-gradient-to-br from-white to-slate-50 shadow-lg" 
            : "border-slate-200 bg-white hover:border-slate-300"
        } overflow-hidden`}
      >
        {/* Station Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${station.color} bg-opacity-20`}>
              {getStationIcon(station.name)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{station.name}</h3>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${
                  type === "AWS" ? "bg-blue-500" : "bg-amber-500"
                }`}></div>
                <span className="text-xs font-medium text-slate-600">
                  {type} Station
                </span>
              </div>
            </div>
          </div>
          <div className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-700">
            Live
          </div>
        </div>

        {/* Parameter Stats with Min/Max/Current */}
        <div className="p-4 space-y-3">
          {type === "AWS" ? (
            <>
              {/* Temperature */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-slate-700">Temperature</span>
                  </div>
                  <span className="text-xs text-amber-600 font-medium">°C</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Current</div>
                    <div className="text-base font-bold text-amber-700">{formatValue(stats.temperature?.current, 1)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Min</div>
                    <div className="text-sm font-semibold text-slate-700">{formatValue(stats.temperature?.min, 1)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Max</div>
                    <div className="text-sm font-semibold text-slate-700">{formatValue(stats.temperature?.max, 1)}</div>
                  </div>
                </div>
              </div>
              {/* Rain */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-700">Rain</span>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">mm</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Current</div>
                    <div className="text-base font-bold text-blue-700">{formatValue(stats.rain?.current)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Min</div>
                    <div className="text-sm font-semibold text-slate-700">{formatValue(stats.rain?.min)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Max</div>
                    <div className="text-sm font-semibold text-slate-700">{formatValue(stats.rain?.max)}</div>
                  </div>
                </div>
              </div>
              {/* Snow */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Snowflake className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-semibold text-slate-700">Snow</span>
                  </div>
                  <span className="text-xs text-slate-600 font-medium">mm</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Current</div>
                    <div className="text-base font-bold text-slate-700">{formatValue(stats.precipitation?.current)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Min</div>
                    <div className="text-sm font-semibold text-slate-700">{formatValue(stats.precipitation?.min)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Max</div>
                    <div className="text-sm font-semibold text-slate-700">{formatValue(stats.precipitation?.max)}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Water Level */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-700">Water Level</span>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">m</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Current</div>
                    <div className="text-base font-bold text-blue-700">{formatValue(stats.water_level?.current, 2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Min</div>
                    <div className="text-sm font-semibold text-slate-700">{formatValue(stats.water_level?.min, 2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Max</div>
                    <div className="text-sm font-semibold text-slate-700">{formatValue(stats.water_level?.max, 2)}</div>
                  </div>
                </div>
              </div>
              {/* Velocity */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-700">Velocity</span>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">m/s</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Current</div>
                    <div className="text-base font-bold text-emerald-700">{formatValue(stats.surface_velocity?.current, 2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Min</div>
                    <div className="text-sm font-semibold text-slate-700">{formatValue(stats.surface_velocity?.min, 2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Max</div>
                    <div className="text-sm font-semibold text-slate-700">{formatValue(stats.surface_velocity?.max, 2)}</div>
                  </div>
                </div>
              </div>
              {/* Discharge */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 border border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-slate-700">Discharge</span>
                  </div>
                  <span className="text-xs text-amber-600 font-medium">cumec</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Current</div>
                    <div className="text-base font-bold text-amber-700">{formatValue(stats.water_discharge?.current, 1)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Min</div>
                    <div className="text-sm font-semibold text-slate-700">{formatValue(stats.water_discharge?.min, 1)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Max</div>
                    <div className="text-sm font-semibold text-slate-700">{formatValue(stats.water_discharge?.max, 1)}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  // Get station image path
  const getStationImage = (stationName, type) => {
    const imageMap = {
      "Vasudhara": type === "AWS" ? "/dash_station_img/vasudhara.png" : "/ews_images/vasudharaimg.png",
      "Mana": type === "AWS" ? "/dash_station_img/mana.jpg" : "/ews_images/manaimg.png",
      "Benakuli": "/ews_images/binakuliimg.jpg",
      "Barrage": "/dash_station_img/barrage.jpg",
    };
    return imageMap[stationName] || null;
  };

  // Generate chart option for hover tooltip
  const getHoverChartOption = (stats, parameters) => {
    const categories = parameters.map(p => p.label);
    const minValues = parameters.map(p => stats[p.key]?.min ?? 0);
    const maxValues = parameters.map(p => stats[p.key]?.max ?? 0);
    const currentValues = parameters.map(p => stats[p.key]?.current ?? 0);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['Min', 'Max', 'Current'],
        textStyle: { fontSize: 10 },
        top: 5
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '20%',
        bottom: '10%'
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { fontSize: 9, rotate: 0 }
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 9 }
      },
      series: [
        {
          name: 'Min',
          type: 'bar',
          data: minValues,
          itemStyle: { color: '#94a3b8' },
          barWidth: '20%'
        },
        {
          name: 'Max',
          type: 'bar',
          data: maxValues,
          itemStyle: { color: '#64748b' },
          barWidth: '20%'
        },
        {
          name: 'Current',
          type: 'bar',
          data: currentValues,
          itemStyle: { color: '#10b981' },
          barWidth: '20%'
        }
      ]
    };
  };

  // Handle mouse enter for hover tooltip
  const handleMouseEnter = (e, stationKey, stationType) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setHoveredStation({ key: stationKey, type: stationType });
  };

  // Handle mouse leave for hover tooltip
  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredStation(null);
    }, 200);
  };

  // Main Dashboard Component - Table Structure
  const DashboardSection = ({ title, icon, stations, type, data }) => {
    const parameters = type === "AWS" 
      ? [
          { key: "temperature", label: "Temp.", unit: "°C", icon: <Thermometer className="w-4 h-4" />, color: "amber" },
          { key: "rain", label: "Rain", unit: "mm", icon: <CloudRain className="w-4 h-4" />, color: "blue" },
          { key: "precipitation", label: "Snow", unit: "mm", icon: <Snowflake className="w-4 h-4" />, color: "slate" },
        ]
      : [
          { key: "water_level", label: "Level", unit: "m", icon: <Waves className="w-4 h-4" />, color: "blue" },
          { key: "surface_velocity", label: "Velocity", unit: "m/s", icon: <Gauge className="w-4 h-4" />, color: "emerald" },
          { key: "water_discharge", label: "Discharge", unit: "cumec", icon: <Droplets className="w-4 h-4" />, color: "amber" },
        ];

    const bgColor = type === "AWS" ? "bg-blue-50/30" : "bg-orange-50/30";

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${bgColor} rounded-xl border border-slate-200 overflow-hidden`}
      >
        {/* Section Header */}
        <div className={`p-2 border-b border-slate-200 flex items-center justify-between ${type === "AWS" ? "bg-blue-100/50" : "bg-orange-100/50"}`}>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800">
              {icon}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{title}</h2>
              {type === "AWS" && <p className="text-xs text-slate-600">8AM - 8AM cycle</p>}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className={`${type === "AWS" ? "bg-blue-100/40" : "bg-orange-100/40"} border-b-2 border-slate-200`}>
                <th className="px-1.5 py-1 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200 w-[180px]">
                  Station
                </th>
                {parameters.map((param) => {
                  const colSpan = type === "EWS" ? 1 : (param.key === "temperature" ? 5 : (param.key === "rain" || param.key === "precipitation" ? 3 : 1));
                  return (
                    <th key={param.key} colSpan={colSpan} className="px-0.5 py-1 text-center text-xs font-bold text-slate-700 tracking-wider border-r border-slate-200" style={{ minWidth: type === "AWS" ? "100px" : "80px" }}>
                      <div className="flex items-center justify-center gap-0.5">
                        <div className={`${param.color === "amber" ? "text-amber-600" : param.color === "blue" ? "text-blue-600" : param.color === "emerald" ? "text-emerald-600" : "text-slate-600"}`}>
                          {param.icon}
                        </div>
                        <span className="uppercase text-[10px]">{param.label === "Temperature" ? "Temp." : param.label}</span>
                        {type === "AWS" && <span className="text-[9px] font-normal text-slate-500 normal-case">({param.unit})</span>}
                      </div>
                    </th>
                  );
                })}
              </tr>
              {type === "EWS" && (
                <tr className={`${type === "AWS" ? "bg-blue-100/40" : "bg-orange-100/40"} border-b border-slate-200`}>
                  <th className="px-1.5 py-1 border-r border-slate-200"></th>
                  {parameters.map((param) => (
                    <th key={param.key} className="px-0.5 py-1 text-center text-[9px] font-normal text-slate-500 border-r border-slate-200">
                      {param.unit}
                    </th>
                  ))}
                </tr>
              )}
              {type === "AWS" && (
                <tr className={`${type === "AWS" ? "bg-blue-100/40" : "bg-orange-100/40"} border-b border-slate-200`}>
                  <th className="px-1.5 py-1 border-r border-slate-200"></th>
                  {parameters.map((param) => {
                      if (param.key === "temperature") {
                        return (
                          <React.Fragment key={param.key}>
                            <th className="px-0.5 py-1 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-200">Min</th>
                            <th className="px-0.5 py-1 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-200">Max</th>
                            <th className="px-0.5 py-1 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-200">Curr.</th>
                            <th className="px-0.5 py-1 text-center text-[9px] font-semibold text-slate-700 border-r border-slate-200 bg-amber-100/50">Prev. Min</th>
                            <th className="px-0.5 py-1 text-center text-[9px] font-semibold text-slate-700 border-r border-slate-200 bg-amber-100/50">Prev. Max</th>
                          </React.Fragment>
                        );
                      }
                      if (param.key === "rain" || param.key === "precipitation") {
                        return (
                          <React.Fragment key={param.key}>
                            <th className="px-0.5 py-1 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-200">Current</th>
                            <th className="px-0.5 py-1 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-200">Prev. day</th>
                            <th className="px-0.5 py-1 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-200">Cumulative (Monthly)</th>
                          </React.Fragment>
                        );
                      }
                      return null;
                  })}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stations.map((station) => {
                const stats = type === "AWS" 
                  ? calculateAWSStats(data[station.key], station.name)
                  : calculateEWSStats(data[station.key], station.name);
                
                // Check if station is offline (timestamp is more than 20 minutes old)
                const isOffline = isStationOffline(stats.timestamp, 20);
                
                return (
                  <motion.tr
                    key={station.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-white/50 transition-colors ${
                      isOffline ? "bg-red-50/50" : ""
                    }`}
                  >
                    <td 
                      className={`px-1.5 py-1 border-r border-slate-200 relative w-[180px] ${
                        isOffline ? "bg-red-100/30" : ""
                      }`}
                      onMouseEnter={(e) => handleMouseEnter(e, station.key, type)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="flex items-center gap-1">
                        {getStationImage(station.name, type) && (
                          <div className="flex-shrink-0">
                            <img 
                              src={getStationImage(station.name, type)} 
                              alt={station.name}
                              className={`w-8 h-8 rounded-lg object-cover border-2 shadow-sm cursor-pointer ${
                                isOffline ? "border-red-300 opacity-75" : "border-slate-200"
                              }`}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-1 flex-1">
                          <span className={`text-xs font-bold cursor-pointer ${
                            isOffline ? "text-red-700" : "text-slate-900"
                          }`}>
                            {station.name}
                          </span>
                          {/* Risk Marker for EWS stations */}
                          {type === "EWS" && !isOffline && (
                            <RiskMarker riskLevel={getRiskLevel(station.name, stats.water_discharge?.current)} />
                          )}
                          {/* Live/Offline Badge */}
                          {isOffline ? (
                            <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-1 py-0.5 rounded-full">
                              Offline
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-green-600 bg-green-100 px-1 py-0.5 rounded-full">
                              Live
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {parameters.map((param) => {
                      const paramStats = stats[param.key];
                      const colorClass = param.color === "amber" 
                        ? "text-amber-700" 
                        : param.color === "blue" 
                        ? "text-blue-700" 
                        : param.color === "emerald"
                        ? "text-emerald-700"
                        : "text-slate-700";
                      
                      // Check if current value exists (including 0)
                      const hasCurrentValue = paramStats?.current !== null && paramStats?.current !== undefined && !isNaN(paramStats.current);
                      
                      if (type === "EWS") {
                        // For EWS, only show current value with unit
                        // Only highlight discharge with green background
                        const shouldHighlight = param.key === "water_discharge" && hasCurrentValue && !isOffline;
                        const formattedValue = formatValue(paramStats?.current, param.key === "water_discharge" || param.key === "precipitation" ? 1 : param.key === "water_level" || param.key === "surface_velocity" ? 2 : 1);
                        const displayValue = isOffline
                          ? "-"
                          : (formattedValue !== "-" && formattedValue !== null ? `${formattedValue} ${param.unit}` : formattedValue);
                        return (
                          <td key={param.key} className={`px-0.5 py-1 text-center text-xs font-bold ${colorClass} border-r border-slate-200 w-[80px] ${
                            shouldHighlight ? "bg-green-100" : ""
                          }`}>
                            {displayValue}
                          </td>
                        );
                      } else {
                        // For AWS, show Min, Max, Current
                        // For Temperature, show Previous Day Min/Max below current values
                        if (param.key === "temperature") {
                          return (
                            <React.Fragment key={param.key}>
                              <td className={`px-0.5 py-1 text-center text-[10px] font-semibold ${colorClass} border-r border-slate-100`} style={{ minWidth: "33px" }}>
                                {isOffline ? "-" : formatValue(paramStats?.min, 1)}
                              </td>
                              <td className={`px-0.5 py-1 text-center text-[10px] font-semibold ${colorClass} border-r border-slate-100`} style={{ minWidth: "33px" }}>
                                {isOffline ? "-" : formatValue(paramStats?.max, 1)}
                              </td>
                              <td className={`px-0.5 py-1 text-center text-xs font-bold ${colorClass} border-r border-slate-200`} style={{ minWidth: "33px" }}>
                                <div className={`${hasCurrentValue && !isOffline ? "bg-green-100 rounded px-1 py-0.5" : ""}`}>
                                  {isOffline ? "-" : formatValue(paramStats?.current, 1)}
                                </div>
                              </td>
                              <td className={`px-0.5 py-1 text-center text-[10px] font-semibold text-amber-700 border-r border-slate-100 bg-amber-100/50`} style={{ minWidth: "33px" }}>
                                {isOffline ? "-" : formatValue(paramStats?.prevMin, 1)}
                              </td>
                              <td className={`px-0.5 py-1 text-center text-[10px] font-semibold text-amber-700 border-r border-slate-100 bg-amber-100/50`} style={{ minWidth: "33px" }}>
                                {isOffline ? "-" : formatValue(paramStats?.prevMax, 1)}
                              </td>
                            </React.Fragment>
                          );
                        }
                        if (param.key === "rain" || param.key === "precipitation") {
                          const hasCurrent = (paramStats?.current !== null && paramStats?.current !== undefined && !isNaN(paramStats.current));
                          return (
                            <React.Fragment key={param.key}>
                              <td className={`px-0.5 py-1 text-center text-[10px] font-semibold ${colorClass} border-r border-slate-100`} style={{ minWidth: "32px" }}>
                                <div className={`${hasCurrent && !isOffline ? "bg-green-100 rounded px-1 py-0.5" : ""}`}>
                                  {isOffline ? "-" : formatValue(paramStats?.current, 1)}
                                </div>
                              </td>
                              <td className={`px-0.5 py-1 text-center text-[10px] font-semibold ${colorClass} border-r border-slate-100`} style={{ minWidth: "32px" }}>
                                {isOffline ? "-" : formatValue(paramStats?.previousDay, 1)}
                              </td>
                              <td className={`px-0.5 py-1 text-center text-[10px] font-semibold ${colorClass} border-r border-slate-100`} style={{ minWidth: "32px" }}>
                                {isOffline ? "-" : formatValue(paramStats?.cumulativeMonthly, 1)}
                              </td>
                            </React.Fragment>
                          );
                        }
                        return (
                          <React.Fragment key={param.key}>
                            <td className={`px-0.5 py-1 text-center text-[10px] font-semibold ${colorClass} border-r border-slate-100`} style={{ minWidth: "33px" }}>
                              {isOffline ? "-" : formatValue(paramStats?.min, param.key === "water_level" || param.key === "surface_velocity" ? 2 : 1)}
                            </td>
                            <td className={`px-0.5 py-1 text-center text-[10px] font-semibold ${colorClass} border-r border-slate-100`} style={{ minWidth: "33px" }}>
                              {isOffline ? "-" : formatValue(paramStats?.max, param.key === "water_level" || param.key === "surface_velocity" ? 2 : 1)}
                            </td>
                            <td className={`px-0.5 py-1 text-center text-xs font-bold ${colorClass} border-r border-slate-200`} style={{ minWidth: "33px" }}>
                              <div className={`${hasCurrentValue && !isOffline ? "bg-green-100 rounded px-1 py-0.5" : ""}`}>
                                {isOffline ? "-" : formatValue(paramStats?.current, param.key === "water_level" || param.key === "surface_velocity" ? 2 : 1)}
                              </div>
                            </td>
                          </React.Fragment>
                        );
                      }
                    })}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  };

  // Detailed Stats Panel
  const DetailPanel = ({ station, type, stats }) => {
    if (!station) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="bg-white rounded-2xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{station.name}</h3>
              <p className="text-sm text-slate-600">
                Detailed {type} Statistics • {type === "AWS" ? "Weather" : "Hydrological"} Data
              </p>
            </div>
            <button
              onClick={() => setActiveStation(null)}
              className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ×
            </button>
          </div>

          {/* Detailed Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {type === "AWS" ? (
              <>
                <StatCard
                  icon={<Thermometer className="w-4 h-4" />}
                  label="Temp."
                  current={stats.temperature?.current}
                  min={stats.temperature?.min}
                  max={stats.temperature?.max}
                  unit="°C"
                  color="amber"
                  index={0}
                />
                <StatCard
                  icon={<CloudRain className="w-4 h-4" />}
                  label="Rainfall"
                  current={stats.rain?.current}
                  min={stats.rain?.min}
                  max={stats.rain?.max}
                  unit="mm"
                  color="blue"
                  index={1}
                />
                <StatCard
                  icon={<Snowflake className="w-4 h-4" />}
                  label="Snow Accumulation"
                  current={stats.precipitation?.current}
                  min={stats.precipitation?.min}
                  max={stats.precipitation?.max}
                  unit="mm"
                  color="slate"
                  index={2}
                />
              </>
            ) : (
              <>
                <StatCard
                  icon={<Waves className="w-4 h-4" />}
                  label="Water Level"
                  current={stats.water_level?.current}
                  min={stats.water_level?.min}
                  max={stats.water_level?.max}
                  unit="m"
                  color="blue"
                  index={0}
                />
                <StatCard
                  icon={<Gauge className="w-4 h-4" />}
                  label="Surface Velocity"
                  current={stats.surface_velocity?.current}
                  min={stats.surface_velocity?.min}
                  max={stats.surface_velocity?.max}
                  unit="m/s"
                  color="emerald"
                  index={1}
                />
                <StatCard
                  icon={<Droplets className="w-4 h-4" />}
                  label="Water Discharge"
                  current={stats.water_discharge?.current}
                  min={stats.water_discharge?.min}
                  max={stats.water_discharge?.max}
                  unit="cumec"
                  color="amber"
                  index={2}
                />
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Navbar />
      
      <div className="pt-16 px-3 sm:px-4 lg:px-6 pb-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="text-left">
              <div className="text-sm font-medium text-slate-600">Last Updated</div>
              <div className="text-base font-semibold text-slate-900">{lastUpdated}</div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchAllData}
            disabled={isRefreshing}
            className="p-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-slate-800 hover:to-slate-700 disabled:opacity-50 transition-all duration-300"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </motion.button>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full mx-auto"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-slate-800" />
                </div>
              </div>
              <p className="mt-4 text-slate-600 font-medium">Loading station data...</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex gap-4 flex-col lg:flex-row w-full max-w-[1400px]">
              {/* Left: Tables and markers */}
              <div className="flex-1 min-w-0 space-y-4">
              <div className="flex flex-col gap-4">
                {/* EWS Section */}
                <div className="w-full">
                  {/* Risk Markers Legend */}
                  <div className="mb-3 grid grid-cols-1 xl:grid-cols-[2.15fr_1fr] gap-3 items-stretch">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl bg-orange-50/50 border border-orange-200 px-4 py-3 min-h-[178px] flex items-center"
                    >
                      <div className="w-full">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          <span className="text-xs font-bold text-slate-700 text-center">Risk Level Markers (Discharge in cumec)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 text-[10px]">
                          <div className="h-full rounded-lg border border-red-200 bg-white/70 px-2 py-2 flex items-start gap-2">
                            <div className="w-3 h-3 mt-0.5 rounded-full bg-red-500 flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-slate-700 font-semibold">High Risk</span>
                              <span className="text-slate-500 text-[9px]">Mana: ≥250 | Vasudhara: ≥100 | Benakuli: ≥350</span>
                            </div>
                          </div>
                          <div className="h-full rounded-lg border border-amber-200 bg-white/70 px-2 py-2 flex items-start gap-2">
                            <div className="w-3 h-3 mt-0.5 rounded-full bg-amber-500 flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-slate-700 font-semibold">Moderate Risk</span>
                              <span className="text-slate-500 text-[9px]">Mana: ≥150 | Vasudhara: ≥60 | Benakuli: ≥250</span>
                            </div>
                          </div>
                          <div className="h-full rounded-lg border border-green-200 bg-white/70 px-2 py-2 flex items-start gap-2">
                            <div className="w-3 h-3 mt-0.5 rounded-full border-2 border-green-500 bg-transparent flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-slate-700 font-semibold">No Risk</span>
                              <span className="text-slate-500 text-[9px]">Mana: &gt;15 and &lt;150 | Vasudhara: &gt;12 and &lt;60 | Benakuli: &gt;16 and &lt;250</span>
                            </div>
                          </div>
                          <div className="h-full rounded-lg border border-red-200 bg-white/70 px-2 py-2 flex items-start gap-2">
                            <div className="w-3 h-3 mt-0.5 rounded-full border-2 border-red-500 bg-transparent flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-slate-700 font-semibold">Low Discharge</span>
                              <span className="text-slate-500 text-[9px]">Mana: &lt;=15 | Vasudhara: &lt;=12 | Benakuli: &lt;=16</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl bg-gradient-to-br from-cyan-50 to-sky-100 border-2 border-cyan-300 shadow-md ring-2 ring-cyan-200/60 p-4 min-h-[178px] flex flex-col"
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Waves className="w-5 h-5 text-cyan-700" />
                          <span className="text-sm font-extrabold text-cyan-900 tracking-wide">Inflow Forecasting</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold shadow-sm ${
                            isManaEwsOffline
                              ? "bg-red-100 border-red-300 text-red-700"
                              : "bg-green-100 border-green-300 text-green-700"
                          }`}>
                            {isManaEwsOffline ? "Offline" : "Live"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-[13px] leading-tight flex-1">
                        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white border border-cyan-200">
                          <span className="font-semibold text-slate-700">Design Discharge</span>
                          <span className="font-extrabold text-cyan-900 whitespace-nowrap">{formatValue(designDischarge, 2)} cumec</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white border border-cyan-200">
                          <span className="font-semibold text-slate-700">5 Years Data</span>
                          <span className="font-extrabold text-cyan-900 whitespace-nowrap">{formatValue(fiveYearsData, 2)} cumec</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-cyan-100 border border-cyan-400 shadow-sm">
                          <span className="font-semibold text-cyan-900">Forecasted Barrage Discharge</span>
                          <span className="font-extrabold text-cyan-900 whitespace-nowrap">{formatValue(forecastedBarrageDischarge, 2)} cumec</span>
                        </div>
                      </div>

                      {(inflowReferenceData.loading || inflowReferenceData.error) && (
                        <div className="mt-2 text-[10px] text-slate-600 space-y-0.5">
                          {inflowReferenceData.loading && <div className="text-cyan-700">Loading reference CSV data...</div>}
                          {inflowReferenceData.error && <div className="text-red-600">{inflowReferenceData.error}</div>}
                        </div>
                      )}
                    </motion.div>
                  </div>
                  <DashboardSection
                    title="Early Warning Stations"
                    icon={<AlertTriangle className="w-4 h-4 text-white" />}
                    stations={ewsStations}
                    type="EWS"
                    data={ewsData}
                  />
                </div>

                {/* AWS Section */}
                <div className="w-full">
                  <DashboardSection
                    title="Automatic Weather Stations"
                    icon={<CloudRain className="w-4 h-4 text-white" />}
                    stations={awsStations}
                    type="AWS"
                    data={awsData}
                  />
                </div>
              </div>

              {/* Detail Panel for Selected Station */}
              {activeStation && (
                <div className="mt-4">
                  {(() => {
                    const awsStation = awsStations.find(s => s.name === activeStation);
                    const ewsStation = ewsStations.find(s => s.name === activeStation);
                    
                    if (awsStation) {
                      const stats = calculateAWSStats(awsData[awsStation.key], awsStation.name);
                      return <DetailPanel station={awsStation} type="AWS" stats={stats} />;
                    } else if (ewsStation) {
                      const stats = calculateEWSStats(ewsData[ewsStation.key], ewsStation.name);
                      return <DetailPanel station={ewsStation} type="EWS" stats={stats} />;
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Footer Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-sm text-slate-500 pt-4 border-t border-slate-200"
              >
                <p>Data updates automatically every 1 minute • Monitoring period: 8:00 AM to 8:00 AM (24-hour cycle)</p>
              </motion.div>
            </div>

            {/* Right: EWS camera images */}
            <div className="w-full lg:w-[340px] flex-shrink-0 space-y-3">
              {/* Mana Image Card */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl overflow-hidden bg-white shadow-lg border border-slate-200/80 ring-1 ring-slate-200/50"
              >
                <div className="px-4 py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white tracking-wide">Mana</h3>
                  {hydrocamMana.imageUrl && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setViewImage("mana")}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                        title="View image"
                      >
                        <Expand className="w-4 h-4" />
                      </button>
                      <a
                        href={hydrocamMana.imageUrl}
                        download={`mana-ews-${Date.now()}.jpg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                        title="Download image"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
                <div className="aspect-video bg-slate-100 min-h-[170px]">
                  <ZoomableImage
                    imageUrl={hydrocamMana.imageUrl}
                    alt="Mana latest"
                    loading={hydrocamMana.loading}
                    error={hydrocamMana.error}
                    onExpand={() => setViewImage("mana")}
                  />
                </div>
              </motion.div>

              {/* Vasudhara Image Card */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl overflow-hidden bg-white shadow-lg border border-slate-200/80 ring-1 ring-slate-200/50"
              >
                <div className="px-4 py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white tracking-wide">Vasudhara</h3>
                  {hydrocamVasudhara.imageUrl && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setViewImage("vasudhara")}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                        title="View image"
                      >
                        <Expand className="w-4 h-4" />
                      </button>
                      <a
                        href={hydrocamVasudhara.imageUrl}
                        download={`vasudhara-ews-${Date.now()}.jpg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                        title="Download image"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
                <div className="aspect-video bg-slate-100 min-h-[170px]">
                  <ZoomableImage
                    imageUrl={hydrocamVasudhara.imageUrl}
                    alt="Vasudhara latest"
                    loading={hydrocamVasudhara.loading}
                    error={hydrocamVasudhara.error}
                    onExpand={() => setViewImage("vasudhara")}
                  />
                </div>
              </motion.div>
            </div>
            </div>
          </div>
        )}

        {/* Hover Tooltip with Graph */}
        {hoveredStation && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed z-50 pointer-events-none"
              style={{
                left: `${hoverPosition.x}px`,
                top: `${hoverPosition.y + 20}px`,
                transform: 'translateX(-50%)'
              }}
              onMouseEnter={() => {
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                }

              }}
              onMouseLeave={handleMouseLeave}
            >
              <div className="bg-white rounded-xl shadow-2xl border-2 border-slate-200 p-4 w-80 pointer-events-auto">
                <div className="mb-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    {(hoveredStation.type === "AWS" ? awsStations : ewsStations).find(s => s.key === hoveredStation.key)?.name || ''}
                  </h4>
                  <p className="text-xs text-slate-600">
                    {hoveredStation.type} Station • Quick Overview
                  </p>
                </div>
                {(() => {
                  const stationData = hoveredStation.type === "AWS" 
                    ? awsData[hoveredStation.key] 
                    : ewsData[hoveredStation.key];
                  
                  const stationName = (hoveredStation.type === "AWS" ? awsStations : ewsStations).find(s => s.key === hoveredStation.key)?.name || '';
                  
                  const stationStats = hoveredStation.type === "AWS" 
                    ? calculateAWSStats(stationData, stationName)
                    : calculateEWSStats(stationData, stationName);
                  
                  const sectionParams = hoveredStation.type === "AWS" 
                    ? [
                        { key: "temperature", label: "Temp.", unit: "°C", icon: <Thermometer className="w-4 h-4" />, color: "amber" },
                        { key: "rain", label: "Rain", unit: "mm", icon: <CloudRain className="w-4 h-4" />, color: "blue" },
                        { key: "precipitation", label: "Snow", unit: "mm", icon: <Snowflake className="w-4 h-4" />, color: "slate" },
                      ]
                    : [
                        { key: "water_level", label: "Level", unit: "m", icon: <Waves className="w-4 h-4" />, color: "blue" },
                        { key: "surface_velocity", label: "Velocity", unit: "m/s", icon: <Gauge className="w-4 h-4" />, color: "emerald" },
                        { key: "water_discharge", label: "Discharge", unit: "cumec", icon: <Droplets className="w-4 h-4" />, color: "amber" },
                      ];
                  
                  return (
                    <ReactECharts
                      option={getHoverChartOption(stationStats, sectionParams)}
                      style={{ height: '200px', width: '100%' }}
                    />
                  );
                })()}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Image lightbox with zoom */}
        <AnimatePresence>
          {viewImage && (() => {
            const imageUrl = viewImage === "mana" ? hydrocamMana.imageUrl : hydrocamVasudhara.imageUrl;
            const title = viewImage === "mana" ? "Mana" : "Vasudhara";
            if (!imageUrl) return null;

            const lightboxZoomIn = () => setLightboxZoom((z) => Math.min(4, z + 0.5));
            const lightboxZoomOut = () => setLightboxZoom((z) => Math.max(0.5, z - 0.5));
            const lightboxZoomReset = () => {
              setLightboxZoom(1);
              setLightboxPan({ x: 0, y: 0 });
            };
            const onLightboxMouseDown = (e) => {
              if (lightboxZoom <= 1) return;
              lightboxDragRef.current = { x: e.clientX, y: e.clientY, panX: lightboxPan.x, panY: lightboxPan.y };
              const onMove = (e2) => {
                setLightboxPan({
                  x: lightboxDragRef.current.panX + (e2.clientX - lightboxDragRef.current.x),
                  y: lightboxDragRef.current.panY + (e2.clientY - lightboxDragRef.current.y),
                });
              };
              const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            };

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
                onClick={() => setViewImage(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: "tween", duration: 0.2 }}
                  className="relative flex flex-col items-center w-full max-w-[95vw] h-[95vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="flex-1 min-h-0 w-full overflow-auto flex items-center justify-center rounded-lg bg-black/30 cursor-grab active:cursor-grabbing relative"
                    onMouseDown={onLightboxMouseDown}
                    style={{ touchAction: "none" }}
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{
                        transform: `scale(${lightboxZoom}) translate(${lightboxPan.x}px, ${lightboxPan.y}px)`,
                        transformOrigin: "center center",
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={`${title} full size`}
                        className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl select-none pointer-events-none"
                        draggable={false}
                      />
                    </div>
                    {/* Title over image - top left */}
                    <div className="absolute top-3 left-3 px-3 py-2 rounded-lg bg-black/60 text-white font-semibold text-sm backdrop-blur-sm">
                      {title}
                    </div>
                    {/* Controls over image - bottom center, high visibility */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-xl bg-white shadow-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); lightboxZoomOut(); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors"
                        title="Zoom out"
                      >
                        <ZoomOut className="w-5 h-5" />
                        <span className="text-sm">Zoom out</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); lightboxZoomIn(); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-5 h-5" />
                        <span className="text-sm">Zoom in</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); lightboxZoomReset(); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors"
                        title="Reset zoom"
                      >
                        <RotateCcw className="w-5 h-5" />
                        <span className="text-sm">Reset</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setViewImage(null); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-medium transition-colors"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5" />
                        <span className="text-sm">Close</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}
