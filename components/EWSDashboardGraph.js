'use client';
import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Brush
} from 'recharts';

/* We will detect station names from API */
const filterOptions = [
  { label: 'Today', days: 1 },
  { label: 'Yesterday', days: 2 },
  { label: '3 days', days: 3 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 }
];

const WaterTrends = () => {
  const [graphData, setGraphData] = useState(null);
  const [selectedDays, setSelectedDays] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [stationNames, setStationNames] = useState([]);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setIsLoading(true);

        const res = await fetch(`http://115.242.156.230:5000/api/ews-live/all`);
        const json = await res.json();

        if (json?.data) {
          const stations = Object.keys(json.data);
          setStationNames(stations.map(s => s.toLowerCase()));

          const merged = mergeStationData(json.data, selectedDays);
          setGraphData(merged);
        }

      } catch (err) {
        console.error("Error fetching graph data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraphData();
  }, [selectedDays]);

  /* FORMAT TIME AS INDIAN (12-HOUR + AM/PM) */
  const formatISTTime = (date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    return `${hours}:${minutes} ${ampm}`;
  };

  /* MERGE FUNCTION - Keep all station data */
  const mergeStationData = (data, days) => {
    const merged = {};

    const now = new Date();
    const nowIST = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

    const cutoffDateIST = new Date(nowIST);
    cutoffDateIST.setHours(0, 0, 0, 0);
    cutoffDateIST.setDate(cutoffDateIST.getDate() - (days - 1));

    Object.keys(data).forEach(station => {
      data[station]?.forEach(item => {

        const tsUTC = new Date(item.timestamp);
        const tsIST = new Date(tsUTC.getTime() + 5.5 * 60 * 60 * 1000);

        if (tsIST < cutoffDateIST) return;

        const timeString = formatISTTime(tsIST);

        const day = String(tsIST.getDate()).padStart(2, '0');
        const month = String(tsIST.getMonth() + 1).padStart(2, '0');
        const year = tsIST.getFullYear();
        const dateString = `${day}/${month}/${year}`;

        if (!merged[timeString]) {
          merged[timeString] = {
            time: timeString,
            fullDate: dateString,
            timestamp: tsIST.toISOString()
          };
        }

        const key = station.toLowerCase();

        merged[timeString][`${key}_discharge`] = safeNum(item.water_discharge);
        merged[timeString][`${key}_level`] = safeNum(item.water_level);
        merged[timeString][`${key}_velocity`] = safeNum(item.avg_surface_velocity);

      });
    });

    /* Sort by timestamp */
    return Object.values(merged).sort((a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
    );
  };

  /* Convert string → float safely */
  const safeNum = (val) => {
    if (val === null || val === undefined) return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  /* Get data for a specific station and parameter */
  const getStationData = (stationName, paramSuffix) => {
    if (!graphData) return [];
    
    return graphData.map(item => ({
      time: item.time,
      fullDate: item.fullDate,
      timestamp: item.timestamp,
      value: item[`${stationName}_${paramSuffix}`]
    })).filter(item => item.value !== null && item.value !== undefined);
  };

  /* Tooltip UI */
  const CustomTooltip = ({ active, payload, label, unit }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;

      return (
        <div className="bg-slate-800 p-2 sm:p-4 rounded-xl border border-slate-600 shadow-2xl max-w-[240px] sm:max-w-none">
          <p className="font-bold text-white mb-1 sm:mb-2 text-xs sm:text-base">
            {dataPoint?.fullDate} • {label}
          </p>

          <div className="space-y-0.5 sm:space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-1 sm:mr-2"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-gray-200 text-[10px] sm:text-sm capitalize">
                    {entry.name || 'Value'}
                  </span>
                </div>
                <span className="font-semibold text-white ml-2 sm:ml-4 text-[10px] sm:text-sm">
                  {entry.value ? entry.value.toFixed(2) : "--"} {unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  /* Render single station chart */
  const renderStationChart = (stationName, dataKeySuffix, title, color, unit) => {
    const stationData = getStationData(stationName, dataKeySuffix);
    const displayName = stationName.charAt(0).toUpperCase() + stationName.slice(1);

    return (
      <div className="w-full md:w-[48%] mb-6 relative">
        <div className={`absolute inset-0 rounded-2xl blur-xl -z-10 ${
          isDarkMode ? "bg-gradient-to-br from-slate-800/10 to-blue-900/10"
                      : "bg-gradient-to-br from-blue-100/10 to-blue-200/10"
        }`}></div>

        <div className={`rounded-2xl p-3 sm:p-6 border shadow-2xl w-full ${
          isDarkMode ? "bg-slate-900/70 backdrop-blur-lg border-slate-800"
                      : "bg-white/80 border-blue-200"
        }`}>

          <h2 className={`text-lg sm:text-xl font-bold text-center mb-2 uppercase tracking-wider ${
            isDarkMode ? "text-white" : "text-slate-800"
          }`}>
            {displayName}
          </h2>

          <h3 className={`text-xs sm:text-sm font-medium mb-4 sm:mb-6 text-center ${
            isDarkMode ? "text-gray-300" : "text-slate-600"
          }`}>
            {title}
          </h3>

          <div className="w-full h-[280px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stationData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.2} />

                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  interval="preserveStartEnd"
                  height={40}
                />

                <YAxis
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickFormatter={(v) => v ? `${v} ${unit}` : "--"}
                />

                <Tooltip content={<CustomTooltip unit={unit} />} />
                
                <Line
                  type="monotone"
                  dataKey="value"
                  name={displayName}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: color, stroke: "#fff", strokeWidth: 2 }}
                  connectNulls={false}
                />

                <Brush
                  dataKey="time"
                  height={16}
                  stroke="rgba(255,255,255,0.2)"
                  fill="rgba(15,23,42,0.7)"
                  tick={{ fontSize: 9, fill: "#9ca3af" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  /* Render parameter charts side by side */
  const renderParameterCharts = (dataKeySuffix, title, colors, unit) => {
    // Filter to only show Mana and Vasudhara
    const targetStations = ['mana', 'vasudhara'].filter(s => 
      stationNames.includes(s.toLowerCase())
    );

    if (targetStations.length === 0) {
      return null;
    }

    return (
      <div className="mb-10 sm:mb-16 w-full">
        <h2 className={`text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 uppercase tracking-wider ${
          isDarkMode ? "text-white" : "text-slate-800"
        }`}>
          {title}
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center items-start">
          {targetStations.map((station, index) => 
            renderStationChart(
              station.toLowerCase(),
              dataKeySuffix,
              title,
              colors[index % colors.length],
              unit
            )
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 border-yellow-400"></div>
          <p className="text-xl font-light text-white">Loading water trends data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-10 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">

      <div className="flex flex-col items-center text-center mt-10 mb-16">
        <h1 className="text-4xl font-extrabold tracking-wide text-white mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-500">
            Water Trends Analysis
          </span>
        </h1>
        <p className="max-w-2xl text-sm text-gray-300">
          Visualizing real-time water discharge, level, and velocity data across monitoring stations
        </p>
      </div>

      <div className="flex justify-center gap-3 mb-10 flex-wrap">
        {filterOptions.map(({ label, days }) => (
          <button
            key={label}
            onClick={() => setSelectedDays(days)}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              selectedDays === days
                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg'
                : 'bg-slate-800/70 text-gray-200 hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-12 max-w-7xl mx-auto">
        {renderParameterCharts('discharge', 'Water Discharge (m³/s)', ['#3b82f6', '#ef4444'], 'm³/s')}
        {renderParameterCharts('level', 'Water Level (m)', ['#10b981', '#f59e0b'], 'm')}
        {renderParameterCharts('velocity', 'Water Velocity (m/s)', ['#8b5cf6', '#ec4899'], 'm/s')}
      </div>

    </div>
  );
};

export default WaterTrends;
