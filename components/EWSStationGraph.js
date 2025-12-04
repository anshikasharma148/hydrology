"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from "recharts";

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const colorMap = {
    level: "#EC4899",
    surfaceVelocity: "#3B82F6",
    avgSurfaceVelocity: "#F59E0B",
    discharge: "#1E40AF",
  };

  const unitMap = {
    level: "m",
    surfaceVelocity: "m/s",
    avgSurfaceVelocity: "m/s",
    discharge: "m³/s",
  };

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    const day = d.getDate().toString().padStart(2, "0");
    const mon = (d.getMonth() + 1).toString().padStart(2, "0");
    const yr = d.getFullYear().toString().slice(-2);

    let hr = d.getHours();
    const min = d.getMinutes().toString().padStart(2, "0");
    const ampm = hr >= 12 ? "PM" : "AM";
    hr = hr % 12 || 12;

    return `${day}/${mon}/${yr} ${hr}:${min} ${ampm}`;
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-lg md:rounded-xl shadow-2xl p-3 md:p-4 text-xs md:text-sm font-medium">
      <div className="text-gray-900 font-bold mb-2 md:mb-3 border-b border-gray-100 pb-1.5 md:pb-2 text-xs md:text-sm">
        {formatTimestamp(label)}
      </div>
      <div className="space-y-1.5 md:space-y-2">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full mr-2 md:mr-3 shadow-sm"
                style={{ backgroundColor: colorMap[entry.dataKey] }}
              ></div>
              <span className="text-gray-700 text-xs md:text-sm">{entry.name.split(' (')[0]}</span>
            </div>
            <span className="font-bold text-gray-900 text-xs md:text-sm">
              {Number(entry.value).toFixed(2)}
              <span className="text-gray-500 text-[10px] md:text-xs ml-1">{unitMap[entry.dataKey]}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Custom Legend
const CustomLegend = ({ payload }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 mt-3 md:mt-4 px-2 sm:px-3 md:px-4">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-center">
          <div
            className="w-2.5 h-0.5 md:w-3 md:h-1 rounded-full mr-1.5 md:mr-2"
            style={{ backgroundColor: entry.color }}
          ></div>
          <span className="text-[10px] sm:text-xs font-medium text-gray-600">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function StationGraph({ station }) {
  const [graphData, setGraphData] = useState([]);
  const [days, setDays] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredLine, setHoveredLine] = useState(null);

  const scrollRef = useRef(null);

  // Color scheme
  const colorMap = {
    level: {
      main: "#EC4899",
      light: "#FBCFE8",
      gradient: "url(#levelGradient)",
    },
    surfaceVelocity: {
      main: "#3B82F6",
      light: "#DBEAFE",
      gradient: "url(#velocityGradient)",
    },
    avgSurfaceVelocity: {
      main: "#F59E0B",
      light: "#FEF3C7",
      gradient: "url(#avgVelocityGradient)",
    },
    discharge: {
      main: "#1E40AF",
      light: "#DBEAFE",
      gradient: "url(#dischargeGradient)",
    },
  };

  // Fetch Data From NEW API
  const fetchGraphData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://115.242.156.230:5000/api/ews-live/all",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Failed to fetch data");

      const json = await res.json();

      const stationKey =
        station === "mana"
          ? "Mana"
          : station === "vasudhara"
          ? "Vasudhara"
          : null;

      if (!stationKey) throw new Error("Unknown station");

      const raw = json?.data?.[stationKey] || [];

      // FILTERING
      let now = new Date();
      let cutoff = new Date();

      if (days === 1) {
        cutoff.setHours(0, 0, 0, 0);
      } else if (days === 2) {
        cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 1);
        cutoff.setHours(0, 0, 0, 0);
      } else {
        cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
      }

      let filtered = raw.filter((e) => {
        const t = new Date(e.timestamp);

        if (days === 2) {
          let start = new Date();
          start.setDate(start.getDate() - 1);
          start.setHours(0, 0, 0, 0);

          let end = new Date(start);
          end.setDate(end.getDate() + 1);

          return t >= start && t < end;
        }

        return t >= cutoff;
      });

      // Format graph data
      const formatted = filtered
        .map((e) => ({
          timestamp: e.timestamp,
          level: Number(e.water_level),
          surfaceVelocity: Number(e.surface_velocity),
          avgSurfaceVelocity: Number(e.avg_surface_velocity),
          discharge: Number(e.water_discharge),
        }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      setGraphData(formatted);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
    const interval = setInterval(fetchGraphData, 15000);
    return () => clearInterval(interval);
  }, [station, days]);

  const formatXAxisTick = (ts) => {
    const d = new Date(ts);

    if (days <= 2) {
      let hr = d.getHours();
      const min = d.getMinutes().toString().padStart(2, "0");
      const ampm = hr >= 12 ? "PM" : "AM";
      hr = hr % 12 || 12;

      return `${hr}:${min} ${ampm}`;
    }

    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" });

    return `${day} ${month}`;
  };

  const timeFilterButtons = [
    { label: "Today", value: 1 },
    { label: "Yesterday", value: 2 },
    { label: "3 days", value: 3 },
    { label: "7 days", value: 7 },
    { label: "30 days", value: 30 },
  ];

  return (
    <div className="w-full flex flex-col">

      {/* ENHANCED FILTER BUTTONS */}
      <div className="flex flex-wrap justify-center mb-4 md:mb-6 gap-2 px-2">
        {timeFilterButtons.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => setDays(value)}
            className={`
              px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300
              ${
                days === value
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-md"
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ENHANCED GRAPH CONTAINER */}
      <div className="relative w-full h-[280px] sm:h-[320px] md:h-[400px] bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl md:rounded-2xl border border-gray-200/50 shadow-xl p-3 sm:p-4 md:p-6">

        {/* LOADING STATE */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl z-10">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-[3px] sm:border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2 sm:mb-3"></div>
              <p className="text-gray-600 font-medium text-xs sm:text-sm">Loading data...</p>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl z-10">
            <div className="text-center px-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <span className="text-red-600 text-lg sm:text-xl">⚠️</span>
              </div>
              <p className="text-red-600 font-medium mb-1 sm:mb-2 text-xs sm:text-sm">Data load failed</p>
              <p className="text-gray-500 text-xs sm:text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && graphData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl z-10">
            <div className="text-center px-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <span className="text-gray-400 text-lg sm:text-xl">📊</span>
              </div>
              <p className="text-gray-600 font-medium text-xs sm:text-sm">No data available</p>
              <p className="text-gray-500 text-xs sm:text-sm">Try selecting a different time range</p>
            </div>
          </div>
        )}

        {/* GRAPH CONTENT */}
        {!loading && !error && graphData.length > 0 && (
          <div ref={scrollRef} className="absolute inset-3 sm:inset-4 md:inset-6 overflow-x-auto">
            <div
              style={{
                minWidth: `${Math.max(graphData.length * 40, 1000)}px`,
                height: "100%",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData}>
                  {/* GRADIENT DEFINITIONS */}
                  <defs>
                    <linearGradient id="levelGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="avgVelocityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="dischargeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1E40AF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#E5E7EB" 
                    vertical={false}
                  />

                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatXAxisTick}
                    tick={{ fontSize: 9, fill: "#6B7280", fontWeight: 500 }}
                    axisLine={{ stroke: "#E5E7EB" }}
                    tickLine={{ stroke: "#E5E7EB" }}
                  />
                  
                  <YAxis 
                    tick={{ fontSize: 9, fill: "#6B7280", fontWeight: 500 }}
                    axisLine={{ stroke: "#E5E7EB" }}
                    tickLine={{ stroke: "#E5E7EB" }}
                    width={35}
                  />

                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ 
                      stroke: "#E5E7EB", 
                      strokeWidth: 1,
                      strokeDasharray: "5 5"
                    }}
                  />
                  
                  <Legend 
                    content={<CustomLegend />}
                    wrapperStyle={{ paddingTop: '10px' }}
                  />

                  {/* WATER LEVEL with Area */}
                  <Area
                    type="monotone"
                    dataKey="level"
                    stroke="transparent"
                    fill={colorMap.level.gradient}
                    fillOpacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="level"
                    name="Water Level (m)"
                    stroke={colorMap.level.main}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ 
                      r: 5, 
                      fill: colorMap.level.main,
                      stroke: "#fff",
                      strokeWidth: 2
                    }}
                    onMouseEnter={() => setHoveredLine('level')}
                    onMouseLeave={() => setHoveredLine(null)}
                    strokeOpacity={hoveredLine && hoveredLine !== 'level' ? 0.3 : 1}
                  />

                  {/* SURFACE VELOCITY with Area */}
                  <Area
                    type="monotone"
                    dataKey="surfaceVelocity"
                    stroke="transparent"
                    fill={colorMap.surfaceVelocity.gradient}
                    fillOpacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="surfaceVelocity"
                    name="Surface Velocity (m/s)"
                    stroke={colorMap.surfaceVelocity.main}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ 
                      r: 5, 
                      fill: colorMap.surfaceVelocity.main,
                      stroke: "#fff",
                      strokeWidth: 2
                    }}
                    onMouseEnter={() => setHoveredLine('surfaceVelocity')}
                    onMouseLeave={() => setHoveredLine(null)}
                    strokeOpacity={hoveredLine && hoveredLine !== 'surfaceVelocity' ? 0.3 : 1}
                  />

                  {/* AVG SURFACE VELOCITY (HIGHLIGHTED) */}
                  <Area
                    type="monotone"
                    dataKey="avgSurfaceVelocity"
                    stroke="transparent"
                    fill={colorMap.avgSurfaceVelocity.gradient}
                    fillOpacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgSurfaceVelocity"
                    name="Avg Surface Velocity (m/s)"
                    stroke={colorMap.avgSurfaceVelocity.main}
                    strokeWidth={3}
                    strokeDasharray="8 4"
                    dot={false}
                    activeDot={{ 
                      r: 6, 
                      fill: colorMap.avgSurfaceVelocity.main,
                      stroke: "#fff",
                      strokeWidth: 2
                    }}
                    onMouseEnter={() => setHoveredLine('avgSurfaceVelocity')}
                    onMouseLeave={() => setHoveredLine(null)}
                    strokeOpacity={hoveredLine && hoveredLine !== 'avgSurfaceVelocity' ? 0.3 : 1}
                  />

                  {/* DISCHARGE with Area */}
                  <Area
                    type="monotone"
                    dataKey="discharge"
                    stroke="transparent"
                    fill={colorMap.discharge.gradient}
                    fillOpacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="discharge"
                    name="Discharge (m³/s)"
                    stroke={colorMap.discharge.main}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ 
                      r: 5, 
                      fill: colorMap.discharge.main,
                      stroke: "#fff",
                      strokeWidth: 2
                    }}
                    onMouseEnter={() => setHoveredLine('discharge')}
                    onMouseLeave={() => setHoveredLine(null)}
                    strokeOpacity={hoveredLine && hoveredLine !== 'discharge' ? 0.3 : 1}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* DATA POINTS COUNTER */}
        {!loading && !error && graphData.length > 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 md:top-4 md:left-4 bg-white/80 backdrop-blur-sm rounded-md md:rounded-lg px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs text-gray-600 font-medium">
            {graphData.length} points
          </div>
        )}

        {/* TIME RANGE INFO */}
        {!loading && !error && graphData.length > 0 && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 bg-white/80 backdrop-blur-sm rounded-md md:rounded-lg px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs text-gray-600 font-medium">
            <span className="hidden sm:inline">Auto-refresh: </span>15s
          </div>
        )}
      </div>
    </div>
  );
}