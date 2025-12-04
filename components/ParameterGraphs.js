'use client';
import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Brush,
  ReferenceLine,
} from 'recharts';
import {
  Thermometer,
  Gauge,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  Snowflake,
  Weight,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

// Parameters with icons and colors
const parameters = [
  { name: 'Temperature', icon: Thermometer, gradient: 'from-red-500 to-orange-500', bgGradient: 'from-red-50 to-orange-50' },
  { name: 'Pressure', icon: Gauge, gradient: 'from-blue-500 to-indigo-500', bgGradient: 'from-blue-50 to-indigo-50' },
  { name: 'Humidity', icon: Droplets, gradient: 'from-cyan-500 to-blue-500', bgGradient: 'from-cyan-50 to-blue-50' },
  { name: 'Wind Speed', icon: Wind, gradient: 'from-green-500 to-emerald-500', bgGradient: 'from-green-50 to-emerald-50' },
  { name: 'Rain', icon: CloudRain, gradient: 'from-blue-500 to-cyan-500', bgGradient: 'from-blue-50 to-cyan-50' },
  { name: 'PIR', icon: Sun, gradient: 'from-yellow-500 to-amber-500', bgGradient: 'from-yellow-50 to-amber-50' },
  { name: 'Avg PIR', icon: Sun, gradient: 'from-yellow-500 to-amber-500', bgGradient: 'from-yellow-50 to-amber-50' },
  { name: 'Precipitation', icon: Snowflake, gradient: 'from-slate-500 to-gray-500', bgGradient: 'from-slate-50 to-gray-50' },
  { name: 'Bucket Weight', icon: Weight, gradient: 'from-purple-500 to-pink-500', bgGradient: 'from-purple-50 to-pink-50' },
];

const units = {
  Temperature: '°C',
  Pressure: 'hPa',
  Humidity: '%',
  'Wind Speed': 'm/s',
  Rain: 'mm',
  PIR: 'W/m²',
  'Avg PIR': 'W/m²',
  Precipitation: 'mm',
  'Bucket Weight': 'gm',
};

// Wind direction labels
const windDirectionLabels = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

// Convert degrees to direction label
const degreesToDirection = (degrees) => {
  if (degrees === null || degrees === undefined || isNaN(degrees)) return null;
  const index = Math.round(degrees / 22.5) % 16;
  return windDirectionLabels[index];
};

// Colors
const colors = {
  Mana: '#3b82f6',
  Lambagad: '#f59e0b',
  Vasudhara: '#8b5cf6',
};

// IST Conversion
const toISTDateString = (ts) => {
  const d = new Date(ts).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
    dt.getDate()
  ).padStart(2, '0')}`;
};
const toISTDateTime = (ts) =>
  new Date(new Date(ts).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

const formatDate = (ts) =>
  new Date(ts).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

const formatDateTime = (ts) => {
  const date = formatDate(ts);
  const time = formatTime(ts);
  return { date, time };
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const { date, time } = formatDateTime(label);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border-2 border-blue-500/50 p-4 min-w-[280px] backdrop-blur-sm">
      <div className="mb-3 pb-2 border-b border-white/20">
        <div className="text-white/90 text-sm font-bold mb-1">{date}</div>
        <div className="text-white/70 text-xs font-semibold">{time}</div>
      </div>
      <div className="space-y-2">
        {payload.map((entry, idx) => {
          const value = entry.value;
          const station = entry.dataKey.split('-')[0];
          const param = entry.dataKey.split('-').slice(1).join('-');
          
          return (
            <div
              key={idx}
              className="flex items-center justify-between gap-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-white font-semibold text-sm">{station}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-base">
                  {value !== null && value !== undefined ? value.toFixed(2) : 'N/A'}
                </span>
                <span className="text-white/60 text-xs">{units[param]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Calculate Stats
const calculateStats = (data, param, station) => {
  const key = `${station}-${param}`;
  const values = data
    .map((d) => d[key])
    .filter((v) => v !== null && v !== undefined && !isNaN(v));

  if (values.length === 0) {
    return { min: null, max: null, avg: null, current: null };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const current = values[values.length - 1];

  return { min, max, avg, current };
};

export default function ParameterGraphs() {
  const [days, setDays] = useState(1);
  const [data, setData] = useState([]);
  const [latestTimestamp, setLatestTimestamp] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [windDirections, setWindDirections] = useState({ Mana: null, Lambagad: null, Vasudhara: null });

  const findStationKey = (obj, arr) => {
    for (const k of arr) if (obj[k] !== undefined) return k;
    const lower = Object.keys(obj).find((x) =>
      arr.map((y) => y.toLowerCase()).includes(x.toLowerCase())
    );
    return lower;
  };

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://115.242.156.230:5000/api/aws-live/all');
        const raw = await res.json();
        if (!raw?.data) return;

        const obj = raw.data;
        const manaKey = findStationKey(obj, ['Mana', 'mana']);
        const lambKey = findStationKey(obj, ['Lambagad', 'lambagad']);
        const vasuKey = findStationKey(obj, ['Vasudhara', 'vasudhara']);

        const stations = [
          { name: 'Mana', key: manaKey },
          { name: 'Lambagad', key: lambKey },
          { name: 'Vasudhara', key: vasuKey },
        ];

        // date filter
        const now = toISTDateTime(new Date().toISOString());
        const allowed = new Set();
        for (let i = 0; i < days; i++) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          allowed.add(
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
              d.getDate()
            ).padStart(2, '0')}`
          );
        }

        const merged = {};
        const map = {
          Temperature: 'temperature',
          Pressure: 'pressure',
          Humidity: 'relative_humidity',
          Rain: 'rain',
          Precipitation: 'precipitation',
          'Bucket Weight': 'bucket_weight',
          'Wind Speed': 'windspeed',
          PIR: 'PIR',
          'Avg PIR': 'avg_PIR',
        };

        // Store latest wind directions
        const latestWindDirs = { Mana: null, Lambagad: null, Vasudhara: null };

        stations.forEach((st) => {
          if (!st.key) return;
          obj[st.key].forEach((row) => {
            const ds = toISTDateString(row.timestamp);
            if (!allowed.has(ds)) return;

            const t = toISTDateTime(row.timestamp).getTime();
            if (!merged[t]) merged[t] = { time: t };

            Object.entries(map).forEach(([param, key]) => {
              const n = Number(row[key]);
              merged[t][`${st.name}-${param}`] = isNaN(n) ? null : n;
            });

            // Store wind direction
            const windDir = Number(row.winddirection);
            if (!isNaN(windDir) && windDir !== null) {
              latestWindDirs[st.name] = windDir;
            }
          });
        });

        const sorted = Object.values(merged).sort((a, b) => a.time - b.time);
        setData(sorted);
        setWindDirections(latestWindDirs);
        if (sorted.length) setLatestTimestamp(sorted[sorted.length - 1].time);
      } catch (e) {
        console.error(e);
      }
    };

    fetchData();
  }, [days]);

  const stationNames = Object.keys(colors);

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8">
        {['Today', 'Yesterday', '3 days', '7 days', '30 days'].map((label) => {
          const v =
            label === 'Today'
              ? 1
              : label === 'Yesterday'
              ? 2
              : label === '3 days'
              ? 3
              : label === '7 days'
              ? 7
              : 30;
          return (
            <button
              key={label}
              onClick={() => setDays(v)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 ${
                days === v
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md hover:shadow-lg border border-gray-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Charts */}
      {data.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {parameters.map((param) => {
            const ParamIcon = param.icon;
            const stats = stationNames.map((station) => ({
              station,
              ...calculateStats(data, param.name, station),
            }));

            return (
              <div
                key={param.name}
                className={`bg-gradient-to-br ${param.bgGradient} rounded-2xl shadow-xl border-2 border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300`}
              >
                {/* Card Header */}
                <div className={`bg-gradient-to-r ${param.gradient} p-4 sm:p-6`}>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <ParamIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-white">
                        {param.name}
                      </h2>
                      <p className="text-white/80 text-sm sm:text-base font-medium">
                        {units[param.name]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {stats.map((stat) => {
                    const prevValue = data.length > 1 
                      ? data[data.length - 2][`${stat.station}-${param.name}`]
                      : null;
                    const change = stat.current !== null && prevValue !== null && !isNaN(prevValue)
                      ? stat.current - prevValue
                      : null;
                    const changePercent = change !== null && prevValue !== null && prevValue !== 0
                      ? ((change / prevValue) * 100).toFixed(1)
                      : null;

                    return (
                      <div
                        key={stat.station}
                        className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: colors[stat.station] }}
                            />
                            <span className="font-bold text-gray-800 text-sm sm:text-base">
                              {stat.station}
                            </span>
                          </div>
                          {change !== null && (
                            <div className={`flex items-center gap-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {change > 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : change < 0 ? (
                                <TrendingDown className="w-4 h-4" />
                              ) : (
                                <Minus className="w-4 h-4" />
                              )}
                              {changePercent && (
                                <span className="text-xs font-semibold">
                                  {Math.abs(changePercent)}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div>
                            <div className="text-gray-500 text-xs font-medium mb-1">Current</div>
                            <div className="text-2xl sm:text-3xl font-black text-gray-900">
                              {stat.current !== null ? stat.current.toFixed(1) : 'N/A'}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200">
                            <div>
                              <div className="text-gray-400 text-[10px] font-medium mb-1">Min</div>
                              <div className="text-sm font-bold text-gray-700">
                                {stat.min !== null ? stat.min.toFixed(1) : '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-[10px] font-medium mb-1">Avg</div>
                              <div className="text-sm font-bold text-gray-700">
                                {stat.avg !== null ? stat.avg.toFixed(1) : '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-[10px] font-medium mb-1">Max</div>
                              <div className="text-sm font-bold text-gray-700">
                                {stat.max !== null ? stat.max.toFixed(1) : '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Chart */}
                <div className="p-4 sm:p-6 pt-0">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-inner border border-white/50">
                    <ResponsiveContainer width="100%" height={isMobile ? 250 : 380}>
                      <LineChart 
                        data={data} 
                        margin={{ top: 10, right: 25, left: 10, bottom: 10 }}
                      >
                        <defs>
                          {stationNames.map((station) => (
                            <linearGradient key={station} id={`gradient-${station}-${param.name}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={colors[station]} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={colors[station]} stopOpacity={0}/>
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="#e5e7eb" 
                          opacity={0.4}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="time"
                          tickFormatter={(t) => formatTime(t)}
                          tick={{ fontSize: isMobile ? 10 : 12, fill: '#6b7280', fontWeight: 500 }}
                          stroke="#9ca3af"
                          strokeWidth={1.5}
                          axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
                        />
                        <YAxis
                          unit={units[param.name]}
                          tick={{ fontSize: isMobile ? 10 : 12, fill: '#6b7280', fontWeight: 500 }}
                          stroke="#9ca3af"
                          strokeWidth={1.5}
                          axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          wrapperStyle={{ paddingTop: '15px', paddingBottom: '10px' }}
                          iconType="line"
                          iconSize={20}
                          formatter={(value) => <span style={{ fontWeight: 600, fontSize: '13px' }}>{value}</span>}
                        />
                        <Brush
                          dataKey="time"
                          tickFormatter={formatTime}
                          height={35}
                          stroke="#3b82f6"
                          fill="#e0e7ff"
                          travellerStyle={{ fill: '#3b82f6', width: 8 }}
                        />

                        {stationNames.map((station) => (
                          <Line
                            key={station}
                            type="monotone"
                            dataKey={`${station}-${param.name}`}
                            stroke={colors[station]}
                            strokeWidth={3.5}
                            dot={false}
                            activeDot={{ 
                              r: 7, 
                              fill: colors[station], 
                              strokeWidth: 3, 
                              stroke: '#fff',
                              style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }
                            }}
                            name={station}
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                          />
                        ))}

                        {latestTimestamp && (
                          <ReferenceLine
                            x={latestTimestamp}
                            stroke="#ef4444"
                            strokeWidth={2.5}
                            strokeDasharray="6 4"
                            label={{ 
                              value: 'Latest', 
                              position: 'top', 
                              fill: '#ef4444', 
                              fontSize: 11,
                              fontWeight: 600,
                              offset: 5
                            }}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Wind Direction Compass (only for Wind Speed) */}
                {param.name === 'Wind Speed' && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50">
                      <div className="text-sm font-bold text-gray-700 mb-4 text-center">
                        Wind Direction - Station Readings
                      </div>
                      <div className="relative w-full max-w-md mx-auto aspect-square">
                        {/* Compass Circle */}
                        <div className="absolute inset-0 rounded-full border-4 border-gray-300 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 shadow-inner"></div>
                        
                        {/* Center Point */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 rounded-full z-20 border-3 border-white shadow-xl"></div>
                        
                        {/* Direction Labels */}
                        {windDirectionLabels.map((dir, idx) => {
                          const angle = (idx * 22.5 - 90) * (Math.PI / 180);
                          const radius = 42; // percentage from center
                          const x = 50 + radius * Math.cos(angle);
                          const y = 50 + radius * Math.sin(angle);
                          
                          // Main directions (N, E, S, W) get larger styling
                          const isMain = ['N', 'E', 'S', 'W'].includes(dir);
                          
                          return (
                            <div
                              key={dir}
                              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                              style={{
                                left: `${x}%`,
                                top: `${y}%`,
                              }}
                            >
                              <div
                                className={`px-2 py-1 rounded-md font-bold text-white shadow-lg ${
                                  isMain
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-sm'
                                    : 'bg-gray-700/90 text-xs'
                                }`}
                              >
                                {dir}
                              </div>
                            </div>
                          );
                        })}

                        {/* Station Wind Direction Arrows */}
                        {stationNames.map((station, stationIdx) => {
                          const windDir = windDirections[station];
                          if (windDir === null || windDir === undefined || isNaN(windDir)) return null;
                          
                          // Convert degrees to radians (0° = North, clockwise)
                          // Wind direction: 0° = North, 90° = East, 180° = South, 270° = West
                          const angleRad = ((windDir - 90) * Math.PI) / 180;
                          const arrowLength = 30; // percentage from center
                          const arrowX = 50 + arrowLength * Math.cos(angleRad);
                          const arrowY = 50 + arrowLength * Math.sin(angleRad);
                          
                          // Arrow tail position (closer to center)
                          const tailLength = 8;
                          const tailX = 50 + tailLength * Math.cos(angleRad);
                          const tailY = 50 + tailLength * Math.sin(angleRad);
                          
                          const directionLabel = degreesToDirection(windDir);
                          
                          return (
                            <React.Fragment key={station}>
                              {/* Wind Direction Arrow */}
                              <svg
                                className="absolute inset-0 w-full h-full z-5"
                                style={{ pointerEvents: 'none', overflow: 'visible' }}
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                              >
                                <defs>
                                  <marker
                                    id={`arrowhead-${stationIdx}-${param.name}`}
                                    markerWidth="8"
                                    markerHeight="8"
                                    refX="7"
                                    refY="2.5"
                                    orient="auto"
                                  >
                                    <polygon
                                      points="0 0, 8 2.5, 0 5"
                                      fill={colors[station]}
                                      stroke={colors[station]}
                                      strokeWidth="0.5"
                                    />
                                  </marker>
                                </defs>
                                <line
                                  x1={tailX}
                                  y1={tailY}
                                  x2={arrowX}
                                  y2={arrowY}
                                  stroke={colors[station]}
                                  strokeWidth="1.2"
                                  markerEnd={`url(#arrowhead-${stationIdx}-${param.name})`}
                                  opacity="0.9"
                                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
                                />
                              </svg>
                              
                              {/* Station Label with Direction */}
                              <div
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-15"
                                style={{
                                  left: `${arrowX + (arrowX - 50) * 0.25}%`,
                                  top: `${arrowY + (arrowY - 50) * 0.25}%`,
                                }}
                              >
                                <div
                                  className="px-2.5 py-1.5 rounded-lg shadow-xl border-2 border-white"
                                  style={{
                                    backgroundColor: colors[station],
                                  }}
                                >
                                  <div className="text-white font-bold text-xs sm:text-sm text-center whitespace-nowrap">
                                    {station}
                                  </div>
                                  <div className="text-white/90 text-[10px] text-center mt-0.5 whitespace-nowrap">
                                    {windDir.toFixed(0)}° {directionLabel}
                                  </div>
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>
                      
                      {/* Station Legend */}
                      <div className="mt-4 flex flex-wrap justify-center gap-3">
                        {stationNames.map((station) => {
                          const windDir = windDirections[station];
                          const directionLabel = windDir !== null && !isNaN(windDir) ? degreesToDirection(windDir) : 'N/A';
                          return (
                            <div
                              key={station}
                              className="flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-lg shadow-md border border-gray-200"
                            >
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: colors[station] }}
                              />
                              <span className="text-xs font-semibold text-gray-700">
                                {station}: {windDir !== null && !isNaN(windDir) ? `${windDir.toFixed(0)}° (${directionLabel})` : 'N/A'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
