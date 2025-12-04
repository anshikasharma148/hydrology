"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import ParameterGraphs from "../../components/ParameterGraphs";
import { 
  MapPin, 
  RefreshCw, 
  AlertCircle, 
  Wind, 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow,
  Thermometer,
  Gauge,
  Droplets,
  Umbrella,
  Scale,
  Zap,
  Moon,
  Sunrise,
  Sunset,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const displayNames = {
  mana: "Mana",
  lambagad: "Barrage",
  vasudhara: "Vasudhara",
};

// Loading skeleton component
const StationCardSkeleton = () => (
  <div className="group relative overflow-hidden border shadow-md rounded-3xl md:rounded-[40px] w-full max-w-[350px] sm:max-w-[400px] bg-gradient-to-br from-white/95 via-blue-50/95 to-blue-100/95 flex flex-col min-h-[550px] sm:min-h-[600px] md:min-h-[650px] animate-pulse">
    <div className="relative z-10 flex flex-col h-full justify-between text-slate-700 p-4 sm:p-6">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <div className="flex items-center font-bold">
          <div className="mr-2 w-5 h-5 sm:w-6 sm:h-6 bg-blue-200 rounded-full"></div>
          <div className="h-6 w-24 sm:h-7 sm:w-32 bg-blue-200 rounded-lg"></div>
        </div>
        <div className="flex items-center bg-blue-50 rounded-full px-2 sm:px-3 py-1 border border-blue-100">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-200 rounded-full"></div>
          <div className="h-6 w-12 sm:h-7 sm:w-16 bg-blue-200 rounded-lg ml-1 sm:ml-2"></div>
        </div>
      </div>
      
      <div className="rounded-2xl sm:rounded-[30px] py-2 sm:py-3 px-3 sm:px-4 grid grid-cols-1 gap-1.5 sm:gap-2 mb-3 sm:mb-4 bg-blue-50/50 border border-blue-100/50 flex-grow">
        {Array(8).fill(0).map((_, idx) => (
          <div key={idx} className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm w-8 h-8 sm:w-10 sm:h-10 bg-blue-200"></div>
            <div className="h-4 sm:h-5 bg-blue-200 rounded-lg flex-1"></div>
          </div>
        ))}
      </div>
      
      <div className="flex flex-col items-center mt-auto p-2 sm:p-3 bg-blue-50/80 rounded-lg sm:rounded-xl border border-blue-100/50">
        <div className="h-5 sm:h-6 w-20 sm:w-24 bg-blue-200 rounded-lg mb-1.5 sm:mb-2"></div>
        <div className="w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] bg-blue-200 rounded-full"></div>
      </div>
    </div>
  </div>
);

// Dynamic icon functions
const getTemperatureIcon = (temp) => {
  if (temp >= 30) return <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />;
  if (temp >= 20) return <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />;
  if (temp >= 10) return <Cloud className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />;
  return <CloudSnow className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />;
};

const getPressureIcon = () => <Gauge className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />;

const getHumidityIcon = (humidity) =>
  humidity >= 80 ? (
    <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
  ) : humidity >= 60 ? (
    <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
  ) : (
    <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
  );

const getRainIcon = (rain) =>
  rain > 5 ? (
    <CloudRain className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
  ) : rain > 0 ? (
    <CloudRain className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
  ) : (
    <Cloud className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
  );

const getPrecipitationIcon = () => <Umbrella className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />;
const getWeightIcon = () => <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />;
const getPIRIcon = () => <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />;

const getWindIcon = (speed) =>
  speed > 8 ? (
    <Wind className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
  ) : speed > 4 ? (
    <Wind className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
  ) : (
    <Wind className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
  );

// Time-based theme function
const getTimeBasedTheme = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 8) {
    return {
      cardGradient: "from-amber-100/95 via-orange-100/95 to-yellow-100/95",
      headerIcon: <Sunrise className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />,
      temperatureBg: "from-amber-100 to-yellow-100",
      temperatureBorder: "border-amber-200",
      accentColor: "text-orange-700",
      cardBorder: "border-amber-200/50",
      paramBg: "from-white/80 to-amber-50/80",
    };
  } else if (hour >= 8 && hour < 12) {
    return {
      cardGradient: "from-yellow-100/95 via-amber-100/95 to-orange-100/95",
      headerIcon: <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />,
      temperatureBg: "from-yellow-100 to-amber-100",
      temperatureBorder: "border-yellow-200",
      accentColor: "text-amber-700",
      cardBorder: "border-yellow-200/50",
      paramBg: "from-white/80 to-yellow-50/80",
    };
  } else if (hour >= 12 && hour < 16) {
    return {
      cardGradient: "from-orange-100/95 via-red-100/95 to-amber-100/95",
      headerIcon: <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />,
      temperatureBg: "from-orange-100 to-red-100",
      temperatureBorder: "border-orange-200",
      accentColor: "text-red-700",
      cardBorder: "border-orange-200/50",
      paramBg: "from-white/80 to-orange-50/80",
    };
  } else if (hour >= 16 && hour < 19) {
    return {
      cardGradient: "from-purple-100/95 via-pink-100/95 to-red-100/95",
      headerIcon: <Sunset className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />,
      temperatureBg: "from-purple-100 to-pink-100",
      temperatureBorder: "border-purple-200",
      accentColor: "text-purple-700",
      cardBorder: "border-purple-200/50",
      paramBg: "from-white/80 to-purple-50/80",
    };
  } else {
    return {
      cardGradient: "from-blue-100/95 via-indigo-100/95 to-purple-100/95",
      headerIcon: <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />,
      temperatureBg: "from-blue-100 to-indigo-100",
      temperatureBorder: "border-blue-200",
      accentColor: "text-indigo-700",
      cardBorder: "border-blue-200/50",
      paramBg: "from-white/80 to-blue-50/80",
    };
  }
};

export default function AwsPage() {
  const router = useRouter();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(getTimeBasedTheme());

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) window.location.replace("/auth/login");

    const themeInterval = setInterval(() => {
      setCurrentTheme(getTimeBasedTheme());
    }, 60000);

    return () => clearInterval(themeInterval);
  }, []);

  const fetchAWSData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      setError(null);

      const res = await fetch("http://115.242.156.230:5000/api/aws-live/all");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const json = await res.json();
      if (!json?.data) throw new Error("No data received from server");

      const { Mana, Lambagad, Vasudhara } = json.data;

      const s = [];

      // MANA
      if (Mana?.length > 0) {
        const d = Mana[0];
        s.push({
          name: "mana",
          temperature: Number(d.temperature || 0).toFixed(1),
          pressure: Number(d.pressure || 0).toFixed(1),
          humidity: Number(d.relative_humidity || 0).toFixed(1),
          rain: Number(d.rain || 0).toFixed(1),
          precipitation: Number(d.precipitation || 0).toFixed(1),
          bucket_weight: Number(d.bucket_weight || 0).toFixed(1),
          PIR: Number(d.PIR || 0).toFixed(1),
          avg_PIR: Number(d.avg_PIR || 0).toFixed(1),
          wind_speed: Number(d.windspeed || 0).toFixed(1),
          wind_direction: Number(d.winddirection || 0).toFixed(1),
          lastUpdate: d.timestamp || new Date().toISOString(),
        });
      }

      // LAMBAGAD
      if (Lambagad?.length > 0) {
        const d = Lambagad[0];
        s.push({
          name: "lambagad",
          temperature: Number(d.temperature || 0).toFixed(1),
          pressure: Number(d.pressure || 0).toFixed(1),
          humidity: Number(d.relative_humidity || 0).toFixed(1),
          rain: Number(d.rain || 0).toFixed(1),
          precipitation: Number(d.precipitation || 0).toFixed(1),
          bucket_weight: Number(d.bucket_weight || 0).toFixed(1),
          PIR: Number(d.PIR || 0).toFixed(1),
          avg_PIR: Number(d.avg_PIR || 0).toFixed(1),
          wind_speed: Number(d.windspeed || 0).toFixed(1),
          wind_direction: Number(d.winddirection || 0).toFixed(1),
          lastUpdate: d.timestamp || new Date().toISOString(),
        });
      }

      // ⭐ VASUDHARA (NEW)
      if (Vasudhara?.length > 0) {
        const d = Vasudhara[0];
        s.push({
          name: "vasudhara",
          temperature: Number(d.temperature || 0).toFixed(1),
          pressure: Number(d.pressure || 0).toFixed(1),
          humidity: Number(d.relative_humidity || 0).toFixed(1),
          rain: Number(d.rain || 0).toFixed(1),
          precipitation: Number(d.precipitation || 0).toFixed(1),
          bucket_weight: Number(d.bucket_weight || 0).toFixed(1),
          PIR: Number(d.PIR || 0).toFixed(1),
          avg_PIR: Number(d.avg_PIR || 0).toFixed(1),
          wind_speed: Number(d.windspeed || 0).toFixed(1),
          wind_direction: Number(d.winddirection || 0).toFixed(1),
          lastUpdate: d.timestamp || new Date().toISOString(),
        });
      }

      setStations(s);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching AWS data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAWSData();
    const i = setInterval(() => fetchAWSData(), 10000);
    return () => clearInterval(i);
  }, []);

  const handleRefresh = () => fetchAWSData(true);

  const getWindDirectionText = (degrees) => {
    const directions = [
      "N","NNE","NE","ENE","E","ESE","SE","SSE",
      "S","SSW","SW","WSW","W","WNW","NW","NNW"
    ];
    return directions[Math.round(degrees / 22.5) % 16];
  };

  const formatTime = (date) => (date ? date.toLocaleTimeString() : "");

  return (
    <div className="min-h-screen relative overflow-hidden pb-20">
      {/* Video Background */}
      <>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed top-0 left-0 w-full h-full object-cover z-[-20]"
        >
          <source src="/videos/dashvideo.mp4" type="video/mp4" />
        </video>
        <div className="absolute z-[-10] w-full h-full overflow-hidden">
          {["0s", "10s", "20s", "5s", "15s", "25s"].map((delay, i) => (
            <div
              key={i}
              className={`cloud ${i % 2 === 0 ? "cloud-small" : "cloud-large"}`}
              style={{
                top: `${5 + i * 5}%`,
                left: `${-100 - i * 50}px`,
                animationDelay: delay,
              }}
            />
          ))}
        </div>
      </>

      <Navbar />

      {/* Back Button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="fixed top-16 sm:top-20 left-3 sm:left-4 md:left-6 p-2 sm:p-2.5 rounded-full shadow-lg z-40 transition-all hover:scale-110 bg-white/90 hover:bg-white text-slate-800 border border-white/20 backdrop-blur-sm"
        title="Go back to Dashboard"
      >
        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Header */}
      <div className="flex flex-col items-center text-center pt-16 sm:pt-20 md:pt-16 lg:pt-28 px-4">
        <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4 md:gap-8 mb-3 sm:mb-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-wide text-white drop-shadow-sm animate-fade-slide">
            <span className="text-yellow-400 font-extrabold text-4xl sm:text-5xl md:text-6xl">A</span>utomated{" "}
            <span className="text-yellow-400 font-extrabold text-4xl sm:text-5xl md:text-6xl">W</span>eather{" "}
            <span className="text-yellow-400 font-extrabold text-4xl sm:text-5xl md:text-6xl">S</span>ystem
          </h1>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-white/30 transition-all duration-300 border-2 border-white/30 disabled:opacity-50 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? "animate-spin" : ""} transition-transform`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Status */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-white/90">
          {lastUpdated && (
            <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 border-white/30 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
              <span className="font-semibold">Last updated:</span> {formatTime(lastUpdated)}
            </div>
          )}

          {stations.length > 0 && (
            <div className="bg-green-500/30 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 border-green-500/40 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="relative">
                <div className="absolute inset-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full animate-ping opacity-75"></div>
                <div className="relative w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full"></div>
              </div>
              <span className="font-semibold">Live data</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Box */}
      {error && (
        <div className="flex justify-center mt-4 sm:mt-6 px-4">
          <div className="bg-red-500/30 backdrop-blur-sm text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-red-500/40 max-w-md flex items-center gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-300 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm sm:text-base">Connection Error</p>
              <p className="text-xs sm:text-sm opacity-90">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Station Cards */}
      <div className="flex justify-center gap-4 sm:gap-6 md:gap-8 flex-wrap mt-6 sm:mt-8 px-4 sm:px-6 md:px-10">
        {loading ? (
          Array(3).fill(0).map((_, i) => <StationCardSkeleton key={i} />)
        ) : stations.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-white/80 px-4">
            <Wind className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50" />
            <p className="text-lg sm:text-xl">No station data available</p>
            <p className="text-xs sm:text-sm mt-2">Try refreshing</p>
          </div>
        ) : (
          stations.map((station, i) => {
            const displayName = displayNames[station.name] || station.name;
            const windDirectionText = getWindDirectionText(station.wind_direction);

            const now = new Date();
            const lastUpdateTime = new Date(station.lastUpdate);
            const diffMinutes = (now - lastUpdateTime) / (1000 * 60);
            const isLive = diffMinutes <= 20;

            return (
              <div
                key={i}
                className={`group relative overflow-hidden border-2 shadow-xl rounded-3xl md:rounded-[40px] w-full max-w-[350px] sm:max-w-[400px] bg-gradient-to-br ${currentTheme.cardGradient} hover:scale-[1.03] transition-all duration-500 ease-out flex flex-col hover:shadow-2xl ${currentTheme.cardBorder} backdrop-blur-sm`}
              >
                {/* Animated background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>

                {/* Live/Offline Badge with pulse ring */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
                  <div className="relative">
                    {isLive && (
                      <div className="absolute inset-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 animate-ping opacity-75"></div>
                    )}
                  <div
                      className={`relative w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-lg ${
                      isLive
                          ? "bg-green-500 shadow-green-500/50"
                        : "bg-red-500 shadow-red-500/50"
                    }`}
                  />
                  </div>
                </div>

                <div className="relative z-10 flex flex-col h-full justify-between text-slate-800 p-3 sm:p-4">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-2 sm:mb-3 gap-2">
                    <div className="flex items-center font-bold flex-1 min-w-0">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-white/60 backdrop-blur-sm shadow-md group-hover:shadow-lg transition-shadow duration-300 mr-2">
                        <MapPin className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${currentTheme.accentColor} group-hover:scale-110 transition-transform duration-300`} />
                      </div>
                      <Link
                        href={`/aws/${station.name.toLowerCase().replace(/\s+/g, "-")}`}
                        className="font-bold hover:text-blue-700 text-base sm:text-lg md:text-xl flex items-center gap-1.5 sm:gap-2 group/link truncate transition-colors duration-300"
                      >
                        {displayName}
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover/link:opacity-100 transform group-hover/link:translate-x-1 transition-all duration-300 flex-shrink-0" />
                      </Link>
                      <div className="ml-1 sm:ml-2 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">{currentTheme.headerIcon}</div>
                    </div>

                    <div
                      className={`flex items-center bg-gradient-to-r ${currentTheme.temperatureBg} rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 border-2 ${currentTheme.temperatureBorder} shadow-lg group-hover:shadow-xl transition-all duration-300 flex-shrink-0 group-hover:scale-105`}
                    >
                      <div className="group-hover:rotate-12 transition-transform duration-300">
                      {getTemperatureIcon(parseFloat(station.temperature))}
                      </div>
                      <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-800 ml-1 sm:ml-1.5">
                        {station.temperature}°C
                      </span>
                    </div>
                  </div>

                  {/* Parameters - Categorized */}
                  <div
                    className={`rounded-2xl sm:rounded-[30px] py-1.5 sm:py-2 px-2 sm:px-3 mb-2 sm:mb-3 bg-gradient-to-br ${currentTheme.paramBg} border-2 border-blue-200/60 backdrop-blur-sm flex-grow shadow-inner space-y-1.5 sm:space-y-2`}
                  >
                    {/* Atmospheric Conditions */}
                    <div className="space-y-0.5 sm:space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-blue-600 uppercase tracking-wide mb-0.5 px-1 text-center">Atmospheric</h4>
                    {[
                      { label: "Pressure", value: station.pressure, unit: "hPa", icon: getPressureIcon() },
                      { label: "Humidity", value: station.humidity, unit: "%", icon: getHumidityIcon(station.humidity) },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-2 sm:space-x-2.5 group/item hover:bg-white/95 rounded-md p-0.5 sm:p-1 transition-all duration-300 hover:shadow-sm hover:scale-[1.01] cursor-pointer"
                        >
                          <div className="bg-white p-1 sm:p-1.5 rounded-md shadow-sm group-hover/item:shadow-md group-hover/item:scale-110 transition-all duration-300 min-w-[32px] sm:min-w-[36px] flex justify-center border border-gray-200 group-hover/item:border-blue-300">
                            <div className="group-hover/item:rotate-12 transition-transform duration-300">
                              {item.icon}
                            </div>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 flex-1 truncate group-hover/item:text-slate-900 transition-colors">
                            {item.label}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 min-w-[50px] sm:min-w-[60px] text-right group-hover/item:text-blue-700 transition-colors">
                            {item.value} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Precipitation */}
                    <div className="space-y-0.5 sm:space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-cyan-600 uppercase tracking-wide mb-0.5 px-1 text-center">Precipitation</h4>
                      {[
                      { label: "Rain", value: station.rain, unit: "mm", icon: getRainIcon(station.rain) },
                        { label: "Snow", value: station.precipitation, unit: "mm", icon: getPrecipitationIcon() },
                      { label: "Bucket Weight", value: station.bucket_weight, unit: "gm", icon: getWeightIcon() },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-2 sm:space-x-2.5 group/item hover:bg-white/95 rounded-md p-0.5 sm:p-1 transition-all duration-300 hover:shadow-sm hover:scale-[1.01] cursor-pointer"
                        >
                          <div className="bg-white p-1 sm:p-1.5 rounded-md shadow-sm group-hover/item:shadow-md group-hover/item:scale-110 transition-all duration-300 min-w-[32px] sm:min-w-[36px] flex justify-center border border-gray-200 group-hover/item:border-blue-300">
                            <div className="group-hover/item:rotate-12 transition-transform duration-300">
                              {item.icon}
                            </div>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 flex-1 truncate group-hover/item:text-slate-900 transition-colors">
                            {item.label}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 min-w-[50px] sm:min-w-[60px] text-right group-hover/item:text-blue-700 transition-colors">
                            {item.value} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Solar Energy */}
                    <div className="space-y-0.5 sm:space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-amber-600 uppercase tracking-wide mb-0.5 px-1 text-center">Solar Energy</h4>
                      {[
                      { label: "Solar Radiation", value: station.PIR, unit: "W/m²", icon: getPIRIcon() },
                      { label: "Avg Solar Radiation", value: station.avg_PIR, unit: "W/m²", icon: getPIRIcon() },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                          className="flex items-center space-x-2 sm:space-x-2.5 group/item hover:bg-white/95 rounded-md p-0.5 sm:p-1 transition-all duration-300 hover:shadow-sm hover:scale-[1.01] cursor-pointer"
                      >
                          <div className="bg-white p-1 sm:p-1.5 rounded-md shadow-sm group-hover/item:shadow-md group-hover/item:scale-110 transition-all duration-300 min-w-[32px] sm:min-w-[36px] flex justify-center border border-gray-200 group-hover/item:border-blue-300">
                            <div className="group-hover/item:rotate-12 transition-transform duration-300">
                          {item.icon}
                        </div>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 flex-1 truncate group-hover/item:text-slate-900 transition-colors">
                          {item.label}
                        </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 min-w-[50px] sm:min-w-[60px] text-right group-hover/item:text-blue-700 transition-colors">
                          {item.value} {item.unit}
                        </span>
                      </div>
                    ))}
                    </div>

                    {/* Wind */}
                    <div className="space-y-0.5 sm:space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-indigo-600 uppercase tracking-wide mb-0.5 px-1 text-center">Wind</h4>
                      {[
                        { label: "Wind Speed", value: station.wind_speed, unit: "m/s", icon: getWindIcon(station.wind_speed) },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-2 sm:space-x-2.5 group/item hover:bg-white/95 rounded-md p-0.5 sm:p-1 transition-all duration-300 hover:shadow-sm hover:scale-[1.01] cursor-pointer"
                        >
                          <div className="bg-white p-1 sm:p-1.5 rounded-md shadow-sm group-hover/item:shadow-md group-hover/item:scale-110 transition-all duration-300 min-w-[32px] sm:min-w-[36px] flex justify-center border border-gray-200 group-hover/item:border-blue-300">
                            <div className="group-hover/item:rotate-12 transition-transform duration-300">
                              {item.icon}
                            </div>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 flex-1 truncate group-hover/item:text-slate-900 transition-colors">
                            {item.label}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 min-w-[50px] sm:min-w-[60px] text-right group-hover/item:text-blue-700 transition-colors">
                            {item.value} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Wind Direction Compass */}
                  <div className="flex flex-col items-center p-2 sm:p-3 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-xl sm:rounded-2xl border-2 border-blue-300/60 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <div className="p-1.5 sm:p-2 bg-white/80 rounded-lg shadow-sm">
                      {getWindIcon(station.wind_speed)}
                      </div>
                      <span className="text-base sm:text-lg font-bold text-slate-800">
                        Wind Direction
                      </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 w-full">
                      <div className="relative w-[65px] h-[65px] sm:w-[75px] sm:h-[75px] flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <div className="absolute inset-0 rounded-full border-[3px] border-blue-400/60 bg-white/95 shadow-inner group-hover:shadow-lg transition-shadow duration-300"></div>
                        
                        {/* Inner circle */}
                        <div className="absolute inset-2 rounded-full border border-blue-300/40"></div>

                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-600 shadow-lg ring-2 ring-blue-300"></div>
                        </div>

                        {["N", "E", "S", "W"].map((dir) => (
                          <div
                            key={dir}
                            className={`absolute text-[11px] sm:text-xs font-bold text-blue-800 ${
                              dir === "N"
                                ? "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                : dir === "E"
                                ? "right-0 top-1/2 translate-x-1/2 -translate-y-1/2"
                                : dir === "S"
                                ? "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
                                : "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2"
                            }`}
                          >
                            {dir}
                          </div>
                        ))}

                        <div
                          className="absolute top-1/2 left-1/2 w-1 sm:w-1.5 h-[38%] sm:h-[42%] bg-gradient-to-t from-red-600 via-red-500 to-red-400 origin-bottom z-20 rounded-t-full shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                          style={{
                            transform: `translate(-50%, -100%) rotate(${station.wind_direction}deg)`,
                            transition: "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                          }}
                        />
                      </div>

                      <div className="flex-1 text-center min-w-0">
                        <div className="text-lg sm:text-xl font-bold text-slate-800 mb-0.5 sm:mb-1 group-hover:text-blue-700 transition-colors">
                          {station.wind_direction}°
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-blue-700 mb-0.5 sm:mb-1 bg-white/60 rounded-lg py-0.5 px-1.5 sm:px-2 inline-block">
                          {windDirectionText}
                        </div>
                        <div className="text-xs text-slate-700 bg-white/80 rounded-full py-0.5 px-1.5 sm:px-2 border-2 border-blue-300/50 shadow-sm font-semibold">
                          {station.wind_speed} m/s
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-transparent rounded-br-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-yellow-400/20 to-transparent rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            );
          })
        )}
      </div>

      {/* Weather Trends Section */}
      <div className="flex flex-col items-center mt-6 sm:mt-12 md:mt-20 px-4 sm:px-6 mb-4 sm:mb-6 md:mb-12">
        <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg animate-fade-slide">
          <span className="text-2xl sm:text-3xl md:text-6xl lg:text-7xl text-yellow-400 font-extrabold">
            W
          </span>
          eather{" "}
          <span className="text-2xl sm:text-3xl md:text-6xl lg:text-7xl text-yellow-400 font-extrabold">
            T
          </span>
          rends
        </h2>
      </div>

      <div className="w-full mb-4 sm:mb-6 px-2 sm:px-4 md:px-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-3xl p-3 sm:p-4 md:p-6 shadow-lg border border-white/20">
          <ParameterGraphs stations={stations} />
        </div>
      </div>

      <style jsx>{`
        .cloud {
          position: absolute;
          background: url("/images/cloud.png") no-repeat center / contain;
          opacity: 0.5;
          animation: floatCloud 80s linear infinite;
        }
        .cloud-small {
          width: 80px;
          height: 48px;
        }
        .cloud-large {
          width: 160px;
          height: 96px;
        }
        @keyframes floatCloud {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(160vw);
          }
        }
      `}</style>
    </div>
  );
}
