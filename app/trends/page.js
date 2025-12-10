"use client";

import React, { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import {
  Check,
  Gauge,
  Waves,
  CloudRain,
  Wind,
  MapPin,
  Activity,
  ArrowUp,
  Droplet,
  ArrowLeft,
  Thermometer,
  Battery,
  BatteryCharging,
  Zap,
  Sun
} from "lucide-react";
import Navbar from "components/Navbar";
import { useRouter } from "next/navigation";

// KEEP ONLY 2 EWS STATIONS
const ewsStations = [
  { name: "Vasudhara", slug: "vasudhara" },
  { name: "Mana", slug: "mana" },
];

// AWS stations unchanged
const awsStations = [
  { name: "Vasudhara", slug: "vasudhara" },
  { name: "Mana", slug: "mana" },
  { name: "Barrage (Lambagad)", slug: "vishnu_prayag" },
];

// Background
const GridPattern = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.02]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
);

const MinimalOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-20 -right-20 w-64 md:w-96 h-64 md:h-96 bg-black rounded-full opacity-[0.02]"></div>
    <div className="absolute -bottom-20 -left-20 w-72 md:w-[28rem] h-72 md:h-[28rem] bg-black rounded-full opacity-[0.01]"></div>
  </div>
);

export default function TrendsPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState("AWS");
  const [selectedStation, setSelectedStation] = useState(awsStations[0].slug);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState("today");
  const [customMode, setCustomMode] = useState("single");
  const [customDate, setCustomDate] = useState(undefined);

  // Protect route
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/auth/login");
    }
  }, []);

  // MAIN FETCH
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let url = "";

      if (selectedType === "AWS") {
        url = "http://115.242.156.230:5000/api/aws-live/all";
      } else {
        // NEW EWS API
        url = "http://115.242.156.230:5000/api/ews-live/all";
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("API Fetch Failed");

      const raw = await res.json();
      let formattedData = [];

      if (selectedType === "AWS") {
        // As-Is
        const key =
          selectedStation.includes("mana") ? "Mana" : "Lambagad";

        const arr = raw?.data?.[key] || [];

        formattedData = arr.map((item) => ({
          timestamp: item.timestamp,
          temperature: parseFloat(item.temperature),
          pressure: parseFloat(item.pressure),
          relative_humidity: parseFloat(item.relative_humidity),
          windspeed: parseFloat(item.windspeed),
          winddirection: parseFloat(item.winddirection),
          rain: parseFloat(item.rain),
          precipitation: parseFloat(item.precipitation),
          bucket_weight: parseFloat(item.bucket_weight),
          PIR: parseFloat(item.PIR),
          avg_PIR: parseFloat(item.avg_PIR),
        }));
      } else {
        // NEW EWS API
        const key = selectedStation === "mana" ? "Mana" : "Vasudhara";
        const isVasudhara = key === "Vasudhara";

        const arr = raw?.data?.[key] || [];

        formattedData = arr.map((item) => {
          const baseData = {
          timestamp: item.timestamp,
          water_level: Number(item.water_level),
          water_discharge: Number(item.water_discharge),
          surface_velocity: Number(item.surface_velocity),
          avg_surface_velocity: Number(item.avg_surface_velocity),
          water_dist_sensor: Number(item.water_dist_sensor),
          tilt_angle: Number(item.tilt_angle),
          flow_direction: Number(item.flow_direction),
          SNR: item.SNR ? Number(item.SNR) : null,
          };

          // Add Vasudhara-specific fields
          if (isVasudhara) {
            baseData.internal_temperature = item.internal_temperature ? Number(item.internal_temperature) : null;
            baseData.charge_current = item.charge_current ? Number(item.charge_current) : null;
            baseData.absorbed_current = item.observed_current ? Number(item.observed_current) : null;
            baseData.battery_voltage = item.battery_voltage ? Number(item.battery_voltage) : null;
            baseData.solar_panel_tracking = item.solar_panel_tracking ? Number(item.solar_panel_tracking) : null;
          }

          return baseData;
        });
      }

      // DATE FILTERS
      let start, end;

      if (filter === "today") {
        start = new Date();
        start.setHours(0, 0, 0, 0);
        end = new Date();
      } else if (filter === "yesterday") {
        start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);

        end = new Date(start);
        end.setHours(23, 59, 59, 999);
      } else if (filter === "7d") {
        start = new Date();
        start.setDate(start.getDate() - 7);
        end = new Date();
      } else if (filter === "15d") {
        start = new Date();
        start.setDate(start.getDate() - 15);
        end = new Date();
      } else if (filter === "30d") {
        start = new Date();
        start.setDate(start.getDate() - 30);
        end = new Date();
      } else if (filter === "custom") {
        if (customMode === "single" && customDate) {
          start = new Date(customDate);
          start.setHours(0, 0, 0, 0);

          end = new Date(customDate);
          end.setHours(23, 59, 59, 999);
        } else if (customMode === "range" && customDate?.from && customDate?.to) {
          start = new Date(customDate.from);
          start.setHours(0, 0, 0, 0);

          end = new Date(customDate.to);
          end.setHours(23, 59, 59, 999);
        }
      }

      if (start && end) {
        formattedData = formattedData.filter((d) => {
          const ts = new Date(d.timestamp);
          return ts >= start && ts <= end;
        });
      }

      // Reverse data so latest appears on RIGHT (ECharts does this with inverse)
      setData(formattedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh on dependencies
  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, [selectedType, selectedStation, filter, customDate, customMode]);

  // FIELDS
  const awsFields = [
    { key: "temperature", label: "Temperature", unit: "°C", icon: <Gauge /> },
    { key: "pressure", label: "Pressure", unit: "hPa", icon: <Gauge /> },
    { key: "relative_humidity", label: "Humidity", unit: "%", icon: <CloudRain /> },
    { key: "windspeed", label: "Wind Speed", unit: "m/s", icon: <Wind /> },
    { key: "winddirection", label: "Wind Dir", unit: "°", icon: <Wind /> },
    { key: "rain", label: "Rain", unit: "mm", icon: <CloudRain /> },
    { key: "precipitation", label: "Precipitation", unit: "mm", icon: <CloudRain /> },
    { key: "bucket_weight", label: "Bucket Weight", unit: "g", icon: <Gauge /> },
    { key: "PIR", label: "PIR", unit: "", icon: <Activity /> },
    { key: "avg_PIR", label: "Avg PIR", unit: "", icon: <Activity /> },
  ];

  // EWS FIELDS
  const baseEwsFields = [
    { key: "water_level", label: "Water Level", unit: "m", icon: <Waves /> },
    { key: "water_discharge", label: "Water Discharge", unit: "m³/s", icon: <Droplet /> },
    { key: "surface_velocity", label: "Surface Velocity", unit: "m/s", icon: <Wind /> },
    { key: "avg_surface_velocity", label: "Avg Surface Velocity", unit: "m/s", icon: <Wind /> },
    { key: "water_dist_sensor", label: "Distance from Sensor", unit: "m", icon: <Gauge /> },
    { key: "tilt_angle", label: "Tilt Angle", unit: "°", icon: <ArrowUp /> },
    { key: "flow_direction", label: "Flow Direction", unit: "°", icon: <ArrowUp /> },
  ];

  // Vasudhara-specific fields
  const vasudharaFields = [
    { key: "internal_temperature", label: "Internal Temperature", unit: "°C", icon: <Thermometer /> },
    { key: "charge_current", label: "Charge Current", unit: "A", icon: <BatteryCharging /> },
    { key: "absorbed_current", label: "Absorbed Current", unit: "A", icon: <Zap /> },
    { key: "battery_voltage", label: "Battery Voltage", unit: "V", icon: <Battery /> },
    { key: "solar_panel_tracking", label: "Solar Panel Tracking", unit: "V", icon: <Sun /> },
  ];

  // Mana-specific fields
  const manaFields = [
    { key: "SNR", label: "SNR", unit: "dB", icon: <Gauge /> },
  ];

  // Determine which EWS fields to show based on selected station
  const getEwsFields = () => {
    if (selectedType !== "EWS") return [];
    
    if (selectedStation === "vasudhara") {
      return [...baseEwsFields, ...vasudharaFields];
    } else if (selectedStation === "mana") {
      return [...baseEwsFields, ...manaFields];
    }
    return baseEwsFields;
  };

  const fields = selectedType === "AWS" ? awsFields : getEwsFields();

  // Stock Market Style Colors - Vibrant and Professional
  const pastelColors = [
    "#3b82f6", // Blue
    "#10b981", // Green
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#ec4899", // Pink
    "#14b8a6", // Teal
    "#6366f1", // Indigo
  ];

  // Calculate statistics for a field
  const getStats = (key) => {
    const validValues = data.map((d) => d[key]).filter((v) => v !== null && v !== undefined && !isNaN(v));
    if (validValues.length === 0) return { min: null, max: null, avg: null, current: null };
    
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    const avg = validValues.reduce((a, b) => a + b, 0) / validValues.length;
    const current = data.length > 0 ? data[data.length - 1][key] : null;
    
    return { min, max, avg, current };
  };

  // CHART OPTIONS - Stock Market Style
  const getChartOption = (key, label, unit, colorIndex) => {
    const times = data.map((d) =>
      new Date(d.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    const values = data.map((d) => d[key]);
    const stats = getStats(key);
    const color = pastelColors[colorIndex % pastelColors.length];

    // Calculate moving average (simple 5-point)
    const movingAvg = [];
    if (values.length >= 5) {
      for (let i = 0; i < values.length; i++) {
        if (i < 4) {
          movingAvg.push(null);
        } else {
          const slice = values.slice(i - 4, i + 1).filter(v => v !== null && !isNaN(v));
          movingAvg.push(slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : null);
        }
      }
    }

    return {
      animation: true,
      backgroundColor: 'transparent',
      legend: {
        show: true,
        top: 10,
        right: 10,
        textStyle: {
          fontSize: 11,
          color: "#666"
        },
        itemGap: 10,
        icon: "line"
      },
      
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          crossStyle: {
            color: "#999"
          },
          label: {
            backgroundColor: "#6a7985"
          }
        },
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: color,
        borderWidth: 2,
        textStyle: {
          color: "#fff",
          fontSize: 12
        },
        formatter: function(params) {
          if (!params || params.length === 0) return '';
          const param = params[0];
          const dataIndex = param.dataIndex;
          const date = data[dataIndex]?.timestamp ? new Date(data[dataIndex].timestamp).toLocaleString() : '';
          let result = `<div style="margin-bottom: 5px; font-weight: bold; border-bottom: 1px solid ${color}; padding-bottom: 5px;">${date}</div>`;
          params.forEach(p => {
            const value = p.value !== null && p.value !== undefined ? p.value.toFixed(2) : 'N/A';
            result += `<div style="margin: 3px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background: ${p.color}; border-radius: 50%; margin-right: 5px;"></span>
              <span style="font-weight: bold;">${p.seriesName}:</span> 
              <span style="color: ${p.color}; font-weight: bold;">${value} ${unit}</span>
            </div>`;
          });
          if (stats.min !== null && stats.max !== null) {
            result += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444; font-size: 11px; color: #aaa;">
              Min: ${stats.min.toFixed(2)} | Max: ${stats.max.toFixed(2)} | Avg: ${stats.avg.toFixed(2)}
            </div>`;
          }
          return result;
        }
      },
      
      grid: { 
        left: "8%", 
        right: "8%", 
        top: "25%", 
        bottom: "15%",
        containLabel: true
      },

      dataZoom: [
        {
          type: "inside",
          start: 0,
          end: 100,
        },
        {
          type: "slider",
          start: 0,
          end: 100,
          height: 20,
          bottom: 5,
          handleStyle: {
            color: color,
          },
          textStyle: {
            color: "#666",
            fontSize: 10
          }
        }
      ],

      xAxis: {
        type: "category",
        data: times,
        inverse: true,
        axisLine: {
          lineStyle: {
            color: "#666"
          }
        },
        axisLabel: { 
          fontSize: 10,
          color: "#666",
          rotate: 45
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
            color: "#e0e0e0"
          }
        }
      },

      yAxis: {
        type: "value",
        scale: true,
        axisLine: {
          lineStyle: {
            color: "#666"
          }
        },
        axisLabel: { 
          fontSize: 10,
          color: "#666",
          formatter: function(value) {
            return value.toFixed(1) + unit;
          }
        },
        splitLine: { 
          lineStyle: { 
            type: "dashed",
            color: "#e0e0e0"
          } 
        },
        splitNumber: 5
      },

      series: [
        {
          name: label,
          data: values,
          type: "line",
          smooth: false,
          lineStyle: { 
            width: 2.5, 
            color,
            shadowBlur: 3,
            shadowColor: color,
            shadowOffsetY: 2
          },
          symbol: "circle",
          symbolSize: 4,
          itemStyle: {
            color: color,
            borderColor: "#fff",
            borderWidth: 1
          },
          emphasis: {
            focus: "series",
            itemStyle: {
              color: color,
              borderColor: "#fff",
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: color
            }
          },
          markLine: stats.min !== null && stats.max !== null ? {
            silent: true,
            symbol: "none",
            label: {
              show: false
            },
            lineStyle: {
              type: "dashed",
              width: 1,
              opacity: 0.3
            },
            data: [
              {
                yAxis: stats.avg,
                name: "Avg",
                lineStyle: {
                  color: "#999",
                  type: "dashed"
                }
              }
            ]
          } : undefined
        },
        // Moving average line
        ...(movingAvg.some(v => v !== null) ? [{
          name: "Moving Avg (5)",
          data: movingAvg,
          type: "line",
          smooth: true,
          lineStyle: {
            width: 1.5,
            color: "#999",
            type: "dashed",
            opacity: 0.7
          },
          symbol: "none",
          z: 1
        }] : [])
      ],
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-gray-200 p-6 relative">
      <Navbar />
      
      {/* Back Button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="fixed top-16 sm:top-20 left-3 sm:left-4 md:left-6 p-2 sm:p-2.5 rounded-full shadow-lg z-40 transition-all hover:scale-110 bg-white hover:bg-gray-50 text-slate-800 border border-gray-200"
        title="Go back to Dashboard"
      >
        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <GridPattern />
      <MinimalOrbs />

      <div className="max-w-[1800px] mx-auto relative z-10">

        {/* Page Title */}
        <div className="flex items-center justify-center pt-28 mb-6">
          <h1 className="text-5xl font-extrabold text-black">
            <span className="text-yellow-500 text-6xl">T</span>rends
          </h1>
        </div>

        {/* Controls */}
        <div className="bg-white shadow-md border p-6 rounded-xl mb-8">

          {/* Station Selector */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {["AWS", "EWS"].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setSelectedStation(
                      type === "AWS" ? awsStations[0].slug : "vasudhara"
                    );
                  }}
                  className={`px-6 py-2 rounded-md font-medium ${
                    selectedType === type ? "bg-white shadow" : ""
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MapPin className="w-4 h-4 mr-2" />
                  {(
                    selectedType === "AWS" ? awsStations : ewsStations
                  ).find((x) => x.slug === selectedStation)?.name || "Station"}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                <DropdownMenuLabel>Stations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(selectedType === "AWS" ? awsStations : ewsStations).map((st) => (
                  <DropdownMenuItem
                    key={st.slug}
                    onClick={() => setSelectedStation(st.slug)}
                  >
                    {st.name}
                    {selectedStation === st.slug && <Check className="w-4 h-4 ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            {[
              ["today", "Today"],
              ["yesterday", "Yesterday"],
              ["7d", "7D"],
              ["15d", "15D"],
              ["30d", "30D"],
              ["custom", "Custom"],
            ].map(([key, lbl]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg border ${
                  filter === key
                    ? "bg-black text-white"
                    : "bg-white border-gray-300"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          {/* Custom Calendar */}
          {filter === "custom" && (
            <div className="mt-4 border-t pt-4">
              <Calendar
                mode={customMode}
                selected={customDate}
                onSelect={setCustomDate}
              />
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-10 h-10 border-b-2 border-black rounded-full"></div>
          </div>
        )}

        {/* Charts */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {fields.map((f, i) => {
              const stats = getStats(f.key);
              const current = data.length > 0 ? data[data.length - 1]?.[f.key] : null;
              const previous = data.length > 1 ? data[data.length - 2]?.[f.key] : null;
              const change = current !== null && previous !== null && !isNaN(current) && !isNaN(previous) 
                ? current - previous 
                : null;
              const changePercent = change !== null && previous !== 0 
                ? ((change / previous) * 100).toFixed(2) 
                : null;
              const isPositive = change !== null && change >= 0;
              const color = pastelColors[i % pastelColors.length];

              return (
              <div
                key={f.key}
                  className="bg-gradient-to-br from-white to-gray-50 shadow-lg rounded-xl p-6 border border-gray-200 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                  {/* Header with Icon and Title */}
                  <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                      <div 
                        className="p-2.5 rounded-lg"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <div style={{ color: color }}>
                          {f.icon}
                        </div>
                      </div>
                    <div>
                        <h4 className="text-lg font-bold text-gray-800">{f.label}</h4>
                        <p className="text-gray-500 text-xs font-medium">{f.unit}</p>
                      </div>
                    </div>
                  </div>

                  {/* Current Value and Change Indicator */}
                  {current !== null && !isNaN(current) && (
                    <div className="mb-4">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-3xl font-bold text-gray-900">
                          {typeof current === 'number' ? current.toFixed(2) : current}
                        </span>
                        {change !== null && changePercent !== null && (
                          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-semibold ${
                            isPositive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            <span>{isPositive ? '↑' : '↓'}</span>
                            <span>{Math.abs(change).toFixed(2)}</span>
                            <span>({Math.abs(parseFloat(changePercent))}%)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Statistics Row */}
                  {stats.min !== null && stats.max !== null && (
                    <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-100">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 font-medium mb-1">Min</p>
                        <p className="text-sm font-bold text-gray-700">{stats.min.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 font-medium mb-1">Avg</p>
                        <p className="text-sm font-bold text-gray-700">{stats.avg.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 font-medium mb-1">Max</p>
                        <p className="text-sm font-bold text-gray-700">{stats.max.toFixed(2)}</p>
                      </div>
                </div>
                  )}

                {/* Chart */}
                  <div className="relative">
                <ReactECharts
                  option={getChartOption(f.key, f.label, f.unit, i)}
                      style={{ height: "280px" }}
                />
              </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
