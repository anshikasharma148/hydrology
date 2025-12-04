'use client';
import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Brush, Area
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
          setStationNames(stations.map(s => s.toLowerCase())); // keeps UI same

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

  /* FIXED MERGE FUNCTION (UI UNCHANGED) */
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

    /* FIX: sort by timestamp so Mana appears correctly */
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

  /* Tooltip UI (UNCHANGED) */
  const CustomTooltip = ({ active, payload, label, unit }) => {
    if (active && payload && payload.length) {
      const dataPoint = graphData.find(item => item.time === label);

      return (
        <div className="bg-slate-800 p-2 sm:p-4 rounded-xl border border-slate-600 shadow-2xl max-w-[240px] sm:max-w-none">
          <p className="font-bold text-white mb-1 sm:mb-2 text-xs sm:text-base">
            {dataPoint?.fullDate} • {label}
          </p>

          <div className="space-y-0.5 sm:space-y-1">
            {payload.map((entry, index) => {
              const label = entry.dataKey.split("_")[0];
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-1 sm:mr-2"
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="text-gray-200 text-[10px] sm:text-sm capitalize">
                      {label}
                    </span>
                  </div>
                  <span className="font-semibold text-white ml-2 sm:ml-4 text-[10px] sm:text-sm">
                    {entry.value ? entry.value.toFixed(2) : "--"} {unit}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  /* Legend unchanged */
  const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
      <div className="flex justify-center flex-wrap gap-2 sm:gap-4 mt-2 sm:mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center">
            <div
              className="w-3 h-1 sm:w-4 sm:h-1 rounded-full mr-1 sm:mr-2"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-[10px] sm:text-sm font-medium text-gray-200 capitalize">
              {entry.value.split('_')[0]}
            </span>
          </div>
        ))}
      </div>
    );
  };

  /* Recharts LineChart UI unchanged */
  const renderLineChart = (dataKeySuffix, title, colors, unit) => (
    <div className="mb-10 sm:mb-16 relative w-full lg:w-[90%] mx-auto">

      <div className={`absolute inset-0 rounded-2xl blur-xl -z-10 ${
        isDarkMode ? "bg-gradient-to-br from-slate-800/10 to-blue-900/10"
                    : "bg-gradient-to-br from-blue-100/10 to-blue-200/10"
      }`}></div>

      <div className={`rounded-2xl p-3 sm:p-6 border shadow-2xl w-full ${
        isDarkMode ? "bg-slate-900/70 backdrop-blur-lg border-slate-800"
                    : "bg-white/80 border-blue-200"
      }`}>

        <h2 className={`text-lg sm:text-2xl font-bold text-center mb-0 sm:mb-1 uppercase tracking-wider ${
          isDarkMode ? "text-white" : "text-slate-800"
        }`}>
          {title.split(' (')[0]}
        </h2>

        <h3 className={`text-xs sm:text-md font-medium mb-4 sm:mb-6 text-center ${
          isDarkMode ? "text-gray-300" : "text-slate-600"
        }`}>
          {title}
        </h3>

        <div className="w-full h-[280px] sm:h-[420px]">
          <ResponsiveContainer width="100%" height="100%">

            <LineChart data={graphData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              
              <defs>
                {stationNames.map((station, i) => (
                  <linearGradient key={station} id={`grad_${station}_${dataKeySuffix}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity={0.6}/>
                    <stop offset="90%" stopColor={colors[i % colors.length]} stopOpacity={0.1}/>
                  </linearGradient>
                ))}
              </defs>

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
              <Legend content={renderCustomLegend} />

              {stationNames.map((station, i) => (
                <Area
                  key={`area_${station}`}
                  type="monotone"
                  dataKey={`${station}_${dataKeySuffix}`}
                  stroke="transparent"
                  fill={`url(#grad_${station}_${dataKeySuffix})`}
                  fillOpacity={0.5}
                />
              ))}

              {stationNames.map((station, i) => (
                <Line
                  key={`line_${station}`}
                  type="monotone"
                  dataKey={`${station}_${dataKeySuffix}`}
                  stroke={colors[i % colors.length]}
                  strokeWidth={1.2}
                  dot={false}
                  activeDot={{ r: 3, fill: colors[i % colors.length], stroke: "#fff" }}
                />
              ))}

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
    <div className="min-h-screen py-10 px-10 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">

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

      <div className="space-y-20">
        {renderLineChart('discharge', 'Water Discharge (m³/s)', ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'], 'm³/s')}
        {renderLineChart('level', 'Water Level (m)', ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'], 'm')}
        {renderLineChart('velocity', 'Water Velocity (m/s)', ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'], 'm/s')}
      </div>

    </div>
  );
};

export default WaterTrends;
