'use client';
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import AddStationForm from "../../components/AddStationForm";
import dynamic from "next/dynamic";
import { ArrowLeft, Thermometer, Battery, BatteryCharging, Zap, Sun, Gauge, Droplets, Wind, Compass, Ruler, TrendingUp, Waves, ScanLine } from "lucide-react";
import {
  FaTemperatureHigh,
  FaWind,
  FaCloudSun,
  FaTachometerAlt,
  FaTint,
  FaCloudRain,
  FaWeightHanging,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { IoWater, IoStatsChart, IoPartlySunny } from "react-icons/io5";
import { IoWaterOutline } from "react-icons/io5";
import {
  FaCompass,
  FaRulerVertical,
  FaAngleDoubleUp,
} from "react-icons/fa";

const SensorMap = dynamic(() => import("../../components/SensorMap"), { ssr: false });

export default function Dashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [navbarHeight, setNavbarHeight] = useState(0);
  const navbarRef = useRef(null);

  // station labels (kept same)
  const stationLabels = [
    { code: "V-1", name: "Vasudhara", icon: <IoWater className="text-blue-500" /> },
  ];

  // AWS (existing) & EWS (new) live states
  const [weatherData, setWeatherData] = useState([]); // AWS live
  // changed to hold multiple EWS stations
  const [ewsLatest, setEwsLatest] = useState({ Vasudhara: null, Mana: null });
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // DEVICE + STATION ID mapping
  const DEVICE_MAP = {
    Barrage: { device: 31928, sid: "ST015" }, // Lambagad -> Barrage
    Mana: { device: 32929, sid: "ST019" },
    Vasudhara: { device: 32930, sid: "ST020" },
  };

  // redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) window.location.replace("/auth/login");
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("dashboardTheme");
    if (storedTheme === "dark") {
      setIsDarkTheme(true);
    }
  }, []);

  const handleThemeToggle = () => {
    setIsDarkTheme((prev) => {
      const next = !prev;
      localStorage.setItem("dashboardTheme", next ? "dark" : "light");
      return next;
    });
  };

  // helper: safe parse numeric values (strings like "1.10" -> number; null/"" -> null)
  const safeParse = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : (typeof v === "string" ? v : v);
  };

  // ---------- AWS (existing) ----------
  const fetchLiveAWSData = async () => {
    try {
      const res = await fetch("http://115.242.156.230:5000/api/aws-live/all");
      const json = await res.json();
      if (!json?.data) {
        setWeatherData([]);
        return;
      }

      const normalize = (name, arr) => {
        if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
        const latest = arr[0];
        return {
          station: name,
          device: DEVICE_MAP[name]?.device ?? null,
          stationID: DEVICE_MAP[name]?.sid ?? null,
          temperature: safeParse(latest.temperature),
          windSpeed: safeParse(latest.windspeed),
          windDirection: safeParse(latest.winddirection),
          pressure: safeParse(latest.pressure),
          humidity: safeParse(latest.relative_humidity),
          rain: safeParse(latest.rain),
          precipitation: safeParse(latest.precipitation),
          bucketWeight: safeParse(latest.bucket_weight),
          PIR: safeParse(latest.PIR),
          avgPIR: safeParse(latest.avg_PIR ?? latest.avg_PIR ?? latest.avg_PIR),
          timestamp: latest.timestamp ?? null,
          raw: latest,
        };
      };

      const dataObj = json.data;
      const formatted = [];

      const lambagad = normalize("Barrage", dataObj.Lambagad);
      const mana = normalize("Mana", dataObj.Mana);
      const vasudharaAWS = normalize("Vasudhara", dataObj.Vasudhara);

      if (lambagad) formatted.push(lambagad);
      if (mana) formatted.push(mana);
      if (vasudharaAWS) formatted.push(vasudharaAWS);

      setWeatherData(formatted);
      setLastUpdated(new Date().toLocaleString());
    } catch (e) {
      console.error("AWS fetch failed", e);
    }
  };

  // ---------- EWS (NEW) ----------
  const fetchLiveEWSData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://115.242.156.230:5000/api/ews-live/all");
      const json = await res.json();
      // Prepare defaults
      let vasudharaNorm = null;
      let manaNorm = null;

      // Vasudhara
      if (json?.data?.Vasudhara && Array.isArray(json.data.Vasudhara) && json.data.Vasudhara.length) {
        const arr = json.data.Vasudhara;
        const candidate = arr.find((r) =>
          [r.water_level, r.avg_surface_velocity, r.surface_velocity, r.water_dist_sensor, r.water_discharge, r.tilt_angle, r.flow_direction]
            .some((x) => x !== null && x !== undefined && x !== "")
        ) || arr[0];

        vasudharaNorm = {
          StationID: candidate.StationID ?? null,
          DeviceID: candidate.DeviceID ?? null,
          surface_velocity: safeParse(candidate.surface_velocity),
          avg_surface_velocity: safeParse(candidate.avg_surface_velocity),
          water_dist_sensor: safeParse(candidate.water_dist_sensor),
          water_level: safeParse(candidate.water_level),
          water_discharge: safeParse(candidate.water_discharge),
          tilt_angle: safeParse(candidate.tilt_angle),
          flow_direction: safeParse(candidate.flow_direction),
          internal_temperature: safeParse(candidate.internal_temperature),
          charge_current: safeParse(candidate.charge_current),
          absorbed_current: safeParse(candidate.observed_current),
          battery_voltage: safeParse(candidate.battery_voltage),
          solar_panel_tracking: safeParse(candidate.solar_panel_tracking),
          timestamp: candidate.timestamp ?? null,
          UID: candidate.UID ?? null,
          raw: candidate,
        };
      }

      // Mana (new)
      if (json?.data?.Mana && Array.isArray(json.data.Mana) && json.data.Mana.length) {
        const arrM = json.data.Mana;
        const candidateM = arrM.find((r) =>
          [r.water_level, r.avg_surface_velocity, r.surface_velocity, r.water_dist_sensor, r.water_discharge, r.tilt_angle, r.flow_direction]
            .some((x) => x !== null && x !== undefined && x !== "")
        ) || arrM[0];

        // Fix Mana timestamp ONLY (MySQL → ISO)
const fixManaTimestamp = (ts) => {
  if (!ts) return null;
  if (ts.includes(" ") && !ts.includes("T")) {
    return ts.replace(" ", "T") + "Z"; // convert to ISO
  }
  return ts;
};

manaNorm = {
  StationID: candidateM.StationID ?? null,
  DeviceID: candidateM.DeviceID ?? null,
  surface_velocity: safeParse(candidateM.surface_velocity),
  avg_surface_velocity: safeParse(candidateM.avg_surface_velocity),
  water_dist_sensor: safeParse(candidateM.water_dist_sensor),
  water_level: safeParse(candidateM.water_level),
  water_discharge: safeParse(candidateM.water_discharge),
  tilt_angle: safeParse(candidateM.tilt_angle),
  flow_direction: safeParse(candidateM.flow_direction),
  SNR: safeParse(candidateM.SNR),
  timestamp: fixManaTimestamp(candidateM.timestamp),
  UID: candidateM.UID ?? null,
  raw: candidateM,
};


      }

      setEwsLatest({ Vasudhara: vasudharaNorm, Mana: manaNorm });
      setLastUpdated(new Date().toLocaleString());
    } catch (e) {
      console.error("EWS fetch failed", e);
      setEwsLatest({ Vasudhara: null, Mana: null });
    } finally {
      setIsLoading(false);
    }
  };

  // initial + interval
  useEffect(() => {
    fetchLiveEWSData();
    fetchLiveAWSData();
    const id = setInterval(() => {
      fetchLiveEWSData();
      fetchLiveAWSData();
    }, 10_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parseUTC = (ts) => {
    if (!ts) return null;
    const parsed = Date.parse(ts);
    return isNaN(parsed) ? null : new Date(parsed);
  };

  // Station live check (30 min)
  const isStationLive = (ts, thresholdMin = 30) => {
    const date = parseUTC(ts);
    if (!date) return false;
    const diffMin = (Date.now() - date.getTime()) / (1000 * 60);
    return diffMin <= thresholdMin;
  };

  // format date/time as "24 Nov 2025, 12:30 PM" (no device id)
  const formatDateTime = (ts) => {
    if (!ts) return null;
    const d = parseUTC(ts);
    if (!d) return null;
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // the unified live badge (blinking style as you asked)
  const LiveBadge = ({ timestamp, isDarkTheme, thresholdMin = 30 }) => {
    if (!timestamp) {
      const cls = isDarkTheme
        ? "flex items-center bg-red-500/10 text-red-200 text-[11px] px-2 py-0.5 rounded-full font-semibold border border-red-400/30"
        : "flex items-center bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-red-200";
      return (
        <div className={cls}>
          <span className="w-2 h-2 bg-red-500 rounded-full mr-1" />
          Offline
        </div>
      );
    }

    const parsed = Date.parse(timestamp);
    if (isNaN(parsed)) {
      const cls = isDarkTheme
        ? "flex items-center bg-red-500/10 text-red-200 text-[11px] px-2 py-0.5 rounded-full font-semibold border border-red-400/30"
        : "flex items-center bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-red-200";
      return (
        <div className={cls}>
          <span className="w-2 h-2 bg-red-500 rounded-full mr-1" />
          Invalid
        </div>
      );
    }

    const diffMin = (Date.now() - parsed) / (1000 * 60);
    const live = diffMin <= thresholdMin;

    if (!live) {
      const cls = isDarkTheme
        ? "flex items-center bg-red-500/10 text-red-200 text-[11px] px-2 py-0.5 rounded-full font-semibold border border-red-400/30"
        : "flex items-center bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-red-200";
      return (
        <div className={cls}>
          <span className="w-2 h-2 bg-red-500 rounded-full mr-1" />
          Offline
        </div>
      );
    }

    const liveCls = isDarkTheme
      ? "flex items-center bg-emerald-500/10 text-emerald-200 text-[11px] px-2 py-0.5 rounded-full font-semibold border border-emerald-400/30"
      : "flex items-center bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-green-200";
    const liveDot = isDarkTheme ? "animate-ping w-2 h-2 bg-emerald-400 rounded-full mr-1" : "animate-pulse w-2 h-2 bg-green-500 rounded-full mr-1";

    return (
      <div className={liveCls}>
        <span className={liveDot} />
        Live
      </div>
    );
  };

  // StationBadge wrapper for WeatherStations (30 min)
  const StationBadge = ({ timestamp }) => {
    return <LiveBadge timestamp={timestamp} isDarkTheme={isDarkTheme} thresholdMin={30} />;
  };

  // BarrageBadge wrapper for Barrage (20 min)
  const BarrageBadge = ({ timestamp }) => {
    return <LiveBadge timestamp={timestamp} isDarkTheme={isDarkTheme} thresholdMin={20} />;
  };

  // timestamp printing (no device)
  const timestampLine = (ts) => {
    const dt = formatDateTime(ts);
    if (!dt) return `No timestamp`;
    return `${dt}`;
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDarkTheme
          ? "bg-gradient-to-b from-[#071c45] via-[#0b2a63] to-[#071c45] text-slate-100"
          : "bg-gray-50 text-gray-800"
      }`}
    >
      <div ref={navbarRef}>
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className={`fixed top-16 sm:top-20 left-3 sm:left-4 md:left-6 p-2 sm:p-2.5 rounded-full shadow-lg z-40 transition-all hover:scale-110 ${
          isDarkTheme
            ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-600"
            : "bg-white hover:bg-gray-50 text-slate-800 border border-gray-200"
        }`}
        title="Go back"
      >
        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <AddStationForm isOpen={formOpen} closeForm={() => setFormOpen(false)} />

      <div
        className="flex-1 flex flex-col px-4 md:px-6"
        style={{ paddingTop: `${navbarHeight + 80}px` }}
      >
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={handleThemeToggle}
            aria-pressed={isDarkTheme}
            className={`flex items-center gap-2 rounded-full px-4 py-2 border transition-colors ${
              isDarkTheme
                ? "bg-[#081c3f] border-slate-700 text-slate-100 hover:bg-[#0d2a57]"
                : "bg-white border-gray-200 text-gray-700 shadow hover:bg-gray-50"
            }`}
          >
            {isDarkTheme ? <FaSun className="text-amber-300" /> : <FaMoon className="text-indigo-500" />}
            <span className="text-sm font-semibold">{isDarkTheme ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
          <div className="md:w-[28%] w-full">
            <BarrageMonitoring
              stationLabels={stationLabels}
              ewsLatest={ewsLatest}
              isDarkTheme={isDarkTheme}
              BarrageBadge={BarrageBadge}
              timestampLine={timestampLine}
            />
          </div>

          <div className="md:flex-1 w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={
                isDarkTheme
                  ? "bg-gradient-to-br from-[#071a3c] via-[#04112a] to-black rounded-2xl shadow-2xl border border-slate-800 overflow-hidden h-[300px] md:h-full"
                  : "bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden h-[300px] md:h-full"
              }
            >
              <SensorMap />
            </motion.div>
          </div>

          <div className="md:w-[28%] w-full">
            <WeatherStationsSection
              weatherData={weatherData}
              StationBadge={StationBadge}
              isDarkTheme={isDarkTheme}
              timestampLine={timestampLine}
            />
          </div>
        </div>
      </div>

      <motion.div
        className={`text-xs text-center pb-4 ${
          isDarkTheme ? "text-slate-400" : "text-gray-500"
        }`}
      >
        Last updated: {lastUpdated || "Never"} {isLoading ? " (updating...)" : ""}
      </motion.div>
    </div>
  );
}

/* ---------------------------
   BarrageMonitoring (Vasudhara + Mana cards)
--------------------------- */
function BarrageMonitoring({ stationLabels, ewsLatest, isDarkTheme, BarrageBadge, timestampLine }) {
  const formatValue = (v, digits = 2) => {
    if (v === null || v === undefined || v === "") return "-";
    if (typeof v === "number") return Number.isInteger(v) ? v : Number(v.toFixed(digits));
    const n = Number(v);
    if (Number.isFinite(n)) return Number.isInteger(n) ? n : Number(n.toFixed(digits));
    return String(v);
  };

  // flow direction rules
  const displayFlowDirection = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    if (Number(val) === 0) return "Incoming";
    const n = Number(val);
    return Number.isFinite(n) ? `${n}°` : "-";
  };

  // count actives across both stations
  const activeCount = ["Vasudhara", "Mana"].reduce((acc, key) => {
    const rec = ewsLatest?.[key];
    if (rec && rec.timestamp) {
      const parsed = Date.parse(rec.timestamp);
      if (!isNaN(parsed)) {
        const diffMin = (Date.now() - parsed) / (1000 * 60);
        if (diffMin <= 20) acc += 1;
      }
    }
    return acc;
  }, 0);

  const stationsToShow = [
    { key: "Vasudhara", label: "Vasudhara" },
    { key: "Mana", label: "Mana" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className={
        isDarkTheme
          ? "bg-gradient-to-br from-[#0d2a57] via-[#163a7a] to-[#0d2a57] rounded-2xl shadow-xl border border-slate-700 h-full p-4 md:p-6"
          : "bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/60 rounded-xl shadow-lg border border-gray-100 h-full p-4 md:p-6"
      }
    >
      {/* HEADER */}
      <div
        className={`flex items-center mb-6 pb-2 ${
          isDarkTheme ? "border-slate-800" : "border-gray-100"
        }`}
      >
        <IoWater className={`text-2xl mr-2 ${isDarkTheme ? "text-cyan-300" : "text-blue-600"}`} />
        <h2 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-gray-700"}`}>
          Barrage Monitoring
        </h2>

        <div
          className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold border ${
            isDarkTheme
              ? "text-amber-200 bg-amber-500/10 border-amber-400/30"
              : "text-amber-600 bg-amber-100 border border-amber-200"
          }`}
        >
          {activeCount} active
        </div>
      </div>

      {/* CARDS */}
      <div className="space-y-4">
        {stationsToShow.map((st) => {
          const data = ewsLatest?.[st.key];

          return (
            <div
              key={st.key}
              className={`rounded-2xl p-4 border ${
                isDarkTheme ? "border-[#1f4fa8]/30 bg-[#0f2a59]/70" : "border-gray-100 bg-white"
              }`}
            >
              {!data ? (
                <div className="p-4 rounded-xl border border-dashed text-center">
                  <p className={isDarkTheme ? "text-slate-300" : "text-gray-500"}>
                    No {st.label} EWS data available
                  </p>
                </div>
              ) : (
                <>
                  {/* TOP INFO */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs ${isDarkTheme ? "text-amber-200" : "text-amber-600"}`}>
                          Station
                        </p>

                        <h3 className={`text-base font-bold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>
                          {st.label}
                        </h3>

                        <p
                          className={`text-[11px] mt-1 ${
                            isDarkTheme ? "text-slate-400" : "text-gray-500"
                          }`}
                        >
                          {timestampLine(data.timestamp)}
                        </p>
                      </div>

                      <BarrageBadge timestamp={data.timestamp} />
                    </div>
                  </div>

                  {/* SURFACE / FLOW SECTION */}
                  <div
                    className={`p-3 rounded-xl border mb-3 ${
                      isDarkTheme
                        ? "bg-[#0f2a59]/70 border-[#1f4fa8]/30 text-slate-100"
                        : "bg-white border-gray-100"
                    }`}
                  >
                    <p className={`text-xs mb-2 ${isDarkTheme ? "text-amber-200" : "text-amber-600"}`}>
                      Surface / Flow
                    </p>

                    <div className="flex justify-between items-center space-x-4">
                      {/* Surface Velocity */}
                      <div className="flex-1">
                        <p className={`text-xs flex items-center gap-1.5 ${isDarkTheme ? "text-slate-300" : "text-gray-500"}`}>
                          <Waves className="w-5 h-5 text-blue-400" />
                          Surface Velocity
                        </p>
                        <p className={`text-xs font-semibold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>
                          {formatValue(data.surface_velocity)} m/s
                        </p>
                      </div>

                      {/* Avg Velocity */}
                      <div className="flex-1">
                        <p className={`text-xs flex items-center gap-1.5 ${isDarkTheme ? "text-slate-300" : "text-gray-500"}`}>
                          <Waves className="w-5 h-5 text-cyan-400" />
                          Avg Velocity
                        </p>
                        <p className={`text-xs font-semibold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>
                          {formatValue(data.avg_surface_velocity, 2)} m/s
                        </p>
                      </div>

                      {/* SNR (only for Mana) */}
                      {st.key === "Mana" && (
                        <div className="flex-1">
                          <p className={`text-xs flex items-center gap-1.5 ${isDarkTheme ? "text-slate-300" : "text-gray-500"}`}>
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                            SNR
                          </p>
                          <p className={`text-xs font-semibold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>
                            {formatValue(data.SNR, 2)} dB
                          </p>
                        </div>
                      )}

                      {/* Discharge */}
                      <div className="flex-1">
                        <p className={`text-xs flex items-center gap-1.5 ${isDarkTheme ? "text-slate-300" : "text-gray-500"}`}>
                          <Gauge className="w-5 h-5 text-green-400" />
                          Discharge
                        </p>
                        <p className={`text-xs font-semibold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>
                          {data.water_discharge === null
                            ? "-"
                            : `${formatValue(data.water_discharge, 2)} m³/s`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* WATER LEVEL / DISTANCE */}
                  <div
                    className={`p-3 rounded-xl border ${
                      isDarkTheme
                        ? "bg-[#0f2a59]/60 border-[#1f4fa8]/30 text-slate-100"
                        : "bg-white border-gray-100"
                    }`}
                  >
                    <p className={`text-xs mb-2 ${isDarkTheme ? "text-amber-200" : "text-amber-600"}`}>
                      Water Level / Distance
                    </p>

                    <div className="flex justify-between items-center">

                      {/* Water Level */}
                      <div>
                        <p className={`text-xs flex items-center gap-1.5 ${isDarkTheme ? "text-slate-300" : "text-gray-500"}`}>
                          <Droplets className="w-5 h-5 text-blue-500" />
                          Water Level
                        </p>
                        <p className={`text-xs font-semibold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>
                          {formatValue(data.water_level, 2)} m
                        </p>
                      </div>

                      {/* Distance Sensor */}
                      <div>
                        <p className={`text-xs flex items-center gap-1.5 ${isDarkTheme ? "text-slate-300" : "text-gray-500"}`}>
                          <ScanLine className="w-5 h-5 text-purple-400" />
                          Distance from Sensor
                        </p>
                        <p className={`text-xs font-semibold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>
                          {formatValue(data.water_dist_sensor, 2)} m
                        </p>
                      </div>

                      {/* Tilt */}
                      <div>
                        <p className={`text-xs flex items-center gap-1.5 ${isDarkTheme ? "text-slate-300" : "text-gray-500"}`}>
                          <TrendingUp className="w-5 h-5 text-orange-400" />
                          Tilt
                        </p>
                        <p className={`text-xs font-semibold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>
                          {formatValue(data.tilt_angle, 1)}°
                        </p>
                      </div>

                      {/* Flow Direction */}
                      <div>
                        <p className={`text-xs flex items-center gap-1.5 ${isDarkTheme ? "text-slate-300" : "text-gray-500"}`}>
                          <Compass className="w-5 h-5 text-amber-400" />
                          Flow Dir
                        </p>
                        <p className={`text-xs font-semibold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>
                          {displayFlowDirection(data.flow_direction)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* NEW PARAMETERS SECTION - Only for Vasudhara */}
                  {st.key === "Vasudhara" && (
                    <div
                      className={`p-3 rounded-xl border mt-3 ${
                        isDarkTheme
                          ? "bg-[#0f2a59]/60 border-[#1f4fa8]/30 text-slate-100"
                          : "bg-white border-gray-100"
                      }`}
                    >
                      <p className={`text-xs mb-2 ${isDarkTheme ? "text-amber-200" : "text-amber-600"}`}>
                        System Parameters
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Internal Temperature */}
                        <div>
                          <p className={`text-xs flex items-center gap-1.5 ${isDarkTheme ? "text-slate-300" : "text-gray-500"}`}>
                            <Thermometer className="w-5 h-5 text-red-400" />
                            Internal Temperature
                          </p>
                          <p className={`text-xs font-semibold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>
                            {formatValue(data.internal_temperature, 1)}°C
                          </p>
                        </div>

                        {/* Charge Current */}
                        <div>
                          <p className={`text-xs flex items-center gap-1.5 ${isDarkTheme ? "text-slate-300" : "text-gray-500"}`}>
                            <BatteryCharging className="w-5 h-5 text-green-400" />
                            Charge Current
                          </p>
                          <p className={`text-xs font-semibold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>
                            {formatValue(data.charge_current, 4)} A
                          </p>
                        </div>

                        {/* Absorbed Current */}
                        <div>
                          <p className={`text-xs flex items-center gap-1.5 ${isDarkTheme ? "text-slate-300" : "text-gray-500"}`}>
                            <Zap className="w-5 h-5 text-yellow-400" />
                            Absorbed Current
                          </p>
                          <p className={`text-xs font-semibold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>
                            {formatValue(data.absorbed_current, 4)} A
                          </p>
                        </div>

                        {/* Battery Voltage */}
                        <div>
                          <p className={`text-xs flex items-center gap-1.5 ${isDarkTheme ? "text-slate-300" : "text-gray-500"}`}>
                            <Battery className="w-5 h-5 text-blue-400" />
                            Battery Voltage
                          </p>
                          <p className={`text-xs font-semibold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>
                            {formatValue(data.battery_voltage, 1)} V
                          </p>
                        </div>

                        {/* Solar Panel Tracking */}
                        <div className="col-span-2">
                          <p className={`text-xs flex items-center gap-1.5 ${isDarkTheme ? "text-slate-300" : "text-gray-500"}`}>
                            <Sun className="w-5 h-5 text-orange-400" />
                            Solar Panel Tracking
                          </p>
                          <p className={`text-xs font-semibold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>
                            {formatValue(data.solar_panel_tracking, 1)} V
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}


/* ---------------------------
   WeatherStationsSection (updated timestamps, removed stationID & device)
   --------------------------- */
function WeatherStationsSection({ weatherData, StationBadge, isDarkTheme, timestampLine }) {
  const formatValue = (value, suffix = "") =>
    value === null || value === undefined || value === "" ? "-" : `${value} ${suffix}`.trim();

  const metricSections = [
    {
      title: "Atmospheric",
      metrics: [
        { key: "temperature", label: "Temperature", suffix: "°C", icon: <FaTemperatureHigh className="text-red-500" /> },
        { key: "pressure", label: "Pressure", suffix: "hPa", icon: <FaTachometerAlt className="text-purple-500" /> },
        { key: "humidity", label: "Humidity", suffix: "%", icon: <FaTint className="text-cyan-500" /> },
      ],
    },
    {
      title: "Wind",
      metrics: [
        { key: "windSpeed", label: "Speed", suffix: "m/s", icon: <FaWind className="text-blue-500" /> },
        { key: "windDirection", label: "Direction", suffix: "°", icon: <FaCloudSun className="text-amber-500" /> },
      ],
    },
    {
      title: "Solar",
      metrics: [
        { key: "PIR", label: "Radiation", suffix: "W/m²", icon: <FaSun className="text-yellow-500" /> },
        { key: "avgPIR", label: "Avg Radiation", suffix: "W/m²", icon: <FaSun className="text-yellow-600" /> },
      ],
    },
    {
      title: "Precipitation",
      metrics: [
        { key: "rain", label: "Rain", suffix: "mm", icon: <FaCloudRain className="text-blue-400" /> },
        { key: "precipitation", label: "Snow", suffix: "mm", icon: <FaCloudRain className="text-indigo-400" /> },
        { key: "bucketWeight", label: "Bucket Weight", suffix: "gm", icon: <FaWeightHanging className="text-gray-600" /> },
      ],
    },
  ];

  // flow direction display utility reused here
  const displayFlowDirection = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    if (Number(val) === 0) return "Incoming";
    const n = Number(val);
    return Number.isFinite(n) ? `${n}°` : "-";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl h-full p-3 md:p-4 flex flex-col shadow-xl border ${
        isDarkTheme
          ? "bg-gradient-to-br from-[#12336a] via-[#173f85] to-[#12336a] border-[#1f4fa8]/60"
          : "bg-gradient-to-br from-amber-50/70 via-white to-orange-50/60 border border-gray-100"
      }`}
    >
      <div
        className={`flex items-center space-x-2 mb-3 pb-2 ${
          isDarkTheme ? "border-b border-slate-800" : "border-b border-gray-100"
        }`}
      >
        <IoPartlySunny className={`text-xl ${isDarkTheme ? "text-amber-300" : "text-amber-600"}`} />
        <h2 className={`text-base font-semibold ${isDarkTheme ? "text-white" : "text-gray-700"}`}>
          Weather Stations
        </h2>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
            isDarkTheme
              ? "text-amber-200 bg-amber-500/10 border-amber-400/30"
              : "text-amber-600 bg-amber-100 border border-amber-200"
          }`}
        >
          {weatherData.length} active
        </span>
      </div>

      {weatherData.length === 0 ? (
        <p className="text-center text-gray-400 mt-10">No weather data available</p>
      ) : (
        <div className="space-y-3">
          {weatherData.map((station) => (
            <div
              key={station.station}
              className={`rounded-2xl p-3 shadow-lg border ${
                isDarkTheme
                  ? "border-[#1f4fa8]/60 bg-[#102d61]/80"
                  : "border-amber-100 bg-white/80"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className={`text-[10px] uppercase tracking-wide ${
                      isDarkTheme ? "text-amber-300" : "text-amber-500"
                    }`}
                  >
                    Station
                  </p>

                  {/* Station name only (no STxxx) */}
                  <h3
                    className={`text-base font-semibold ${
                      isDarkTheme ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {station.station}
                  </h3>

                  {/* single-line timestamp only (no device) */}
                  <p className={`text-[10px] ${isDarkTheme ? "text-slate-300" : "text-gray-400"}`}>
                    {timestampLine(station.timestamp)}
                  </p>
                </div>
                <StationBadge timestamp={station.timestamp} />
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {metricSections.map((section) => (
                  <div
                    key={`${station.station}-${section.title}`}
                    className={`rounded-xl p-2 border ${
                      isDarkTheme ? "border-[#1f4fa8]/30 bg-[#0f2a59]/70" : "border-amber-50 bg-amber-50/40"
                    }`}
                  >
                    <p
                      className={`text-[10px] uppercase tracking-wide mb-1 ${
                        isDarkTheme ? "text-amber-200" : "text-amber-600"
                      }`}
                    >
                      {section.title}
                    </p>
                    <div className="space-y-1.5">
                      {section.metrics.map((metric) => (
                        <div
                          key={`${station.station}-${metric.key}`}
                          className={`flex items-center justify-between font-semibold ${
                            isDarkTheme ? "text-slate-100" : "text-gray-700"
                          }`}
                        >
                          <span
                            className={`flex items-center space-x-1 text-xs font-semibold ${
                              isDarkTheme ? "text-slate-300" : "text-gray-500"
                            }`}
                          >
                            {metric.icon}
                            <span>{metric.label}</span>
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              isDarkTheme ? "text-white" : "text-gray-800"
                            }`}
                          >
                            {metric.key === "windDirection"
                              ? displayFlowDirection(station[metric.key])
                              : formatValue(station[metric.key], metric.suffix)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
