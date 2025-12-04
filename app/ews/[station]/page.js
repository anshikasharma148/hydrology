"use client";

import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowLeft, Thermometer, Battery, BatteryCharging, Zap, Sun, Activity, Ruler } from "lucide-react";

import {
  FaWater,
  FaTachometerAlt,
  FaRulerVertical,
  FaWaveSquare,
  FaChartLine,
  FaArrowUp,
} from "react-icons/fa";

import StationGraph from "../../../components/EWSStationGraph";

const stationData = {
  mana: { name: "Mana", image: "/ews_images/manaimg.png" },
  vasudhara: { name: "Vasudhara", image: "/ews_images/vasudharaimg.png" },
};

export default function StationPage() {
  const { station } = useParams();
  const router = useRouter();
  const currentStation = stationData[station];

  const [showHeading, setShowHeading] = useState(false);
  const [latestData, setLatestData] = useState(null);
  const [loading, setLoading] = useState(true);

  // AUTH GUARD
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      window.location.replace("/auth/login");
    }
  }, []);

  // Animate heading
  useEffect(() => {
    const t = setTimeout(() => setShowHeading(true), 150);
    return () => clearTimeout(t);
  }, []);

  // Fetch REAL EWS data
  useEffect(() => {
    const fetchLive = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://115.242.156.230:5000/api/ews-live/all", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();
        const key = station === "mana" ? "Mana" : "Vasudhara";
        const arr = json?.data?.[key] || [];

        if (arr.length > 0) {
          const latest = arr.reduce((a, b) =>
            new Date(b.timestamp) > new Date(a.timestamp) ? b : a
          );
          setLatestData(latest);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLive();
    const id = setInterval(fetchLive, 15000);
    return () => clearInterval(id);
  }, [station]);

  if (!currentStation) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <button
          onClick={() => router.push("/ews")}
          className="fixed top-16 sm:top-20 left-3 sm:left-4 md:left-6 p-2 sm:p-2.5 rounded-full shadow-lg z-40 transition-all hover:scale-110 bg-white hover:bg-gray-50 text-slate-800 border border-gray-200"
          title="Go back to EWS"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <p className="mt-20 px-4 text-center text-lg sm:text-xl text-red-600 font-semibold">
          Station not found.
        </p>
      </div>
    );
  }

  if (loading || !latestData) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <button
          onClick={() => router.push("/ews")}
          className="fixed top-16 sm:top-20 left-3 sm:left-4 md:left-6 p-2 sm:p-2.5 rounded-full shadow-lg z-40 transition-all hover:scale-110 bg-white hover:bg-gray-50 text-slate-800 border border-gray-200"
          title="Go back to EWS"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <p className="mt-20 px-4 text-center text-lg sm:text-xl text-blue-700 font-semibold">
          Loading station data...
        </p>
      </div>
    );
  }

  // Helper function to format values
  const formatValue = (v, fixed = 2) => {
    if (v === null || v === undefined || v === "") return "--";
    const n = parseFloat(v);
    return isNaN(n) ? "--" : n.toFixed(fixed);
  };

  // **************** PREMIUM CARD COMPONENT ****************
  const Card = ({ title, value, unit, icon, highlight, fixed = 2, colorScheme = "blue" }) => {
    return (
    <div
      className={`
        rounded-xl shadow-lg p-3 flex flex-col items-center justify-center 
        w-full h-[100px] sm:h-[110px]
      transition-all duration-300 border 
        hover:scale-105 hover:shadow-xl hover:-translate-y-1
        bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 text-white
        ${highlight ? "border-green-400 shadow-green-500/30 bg-gradient-to-br from-green-600/20 to-slate-800" : "hover:border-slate-500"}
    `}
    >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xl sm:text-2xl font-bold text-white">
            {formatValue(value, fixed)}
        </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-300">
          {unit}
        </span>
      </div>

        <p className="text-[10px] sm:text-xs font-bold text-center mb-1 text-slate-200">
        {title}
      </p>

        <div className="text-lg sm:text-xl text-white">
        {icon}
      </div>
    </div>
  );
  };

  // Category Section Component
  const CategorySection = ({ title, children, color = "blue" }) => {
    return (
      <div className="flex-1 min-w-[280px] rounded-xl border border-slate-300 bg-slate-50/80 p-3 shadow-md">
        <h2 className="text-sm sm:text-base font-bold text-slate-800 mb-3 px-2 border-b border-slate-300 pb-1">
          {title}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Back Button */}
      <button
        onClick={() => router.push("/ews")}
        className="fixed top-16 sm:top-20 left-3 sm:left-4 md:left-6 p-2 sm:p-2.5 rounded-full shadow-lg z-40 transition-all hover:scale-110 bg-white hover:bg-gray-50 text-slate-800 border border-gray-200"
        title="Go back to EWS"
      >
        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* HERO IMAGE */}
      <div className="relative w-full h-[220px] sm:h-[260px] md:h-[300px] lg:h-[340px]">
        <Image
          src={currentStation.image}
          alt={currentStation.name}
          fill
          className="object-cover"
        />

        {/* Gradient bottom */}
        <div className="absolute bottom-0 w-full h-20 md:h-24 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Station name */}
        <div className="absolute bottom-4 md:bottom-6 w-full flex justify-center px-4">
          <div
            className={`
            px-5 md:px-8 py-3 md:py-4 rounded-xl bg-black/90 border-2 border-yellow-400/50 shadow-2xl 
            transition-all duration-700 backdrop-blur-sm
            ${showHeading ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white">
              <span className="text-yellow-400 text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                {currentStation.name.charAt(0)}
              </span>
              {currentStation.name.slice(1)}
            </h1>
          </div>
        </div>
      </div>

      {/* ***************** CARDS (Categorized Side-by-Side) ***************** */}
      <div className="mt-2 sm:mt-3 px-3 sm:px-4 md:px-6">
        <div className="flex flex-col lg:flex-row gap-3 max-w-7xl mx-auto">

          {/* Water Parameters */}
          <CategorySection title="Water Parameters" color="blue">
          <Card
              title="Discharge"
            value={latestData.water_discharge}
            unit="m³/s"
              icon={<FaWater className="text-white" />}
              highlight={true}
          />
          <Card
              title="Level"
            value={latestData.water_level}
            unit="m"
              icon={<FaWaveSquare className="text-white" />}
              colorScheme="blue"
          />
          <Card
            title="Surface Velocity"
            value={latestData.surface_velocity}
            unit="m/s"
              icon={<Activity className="w-5 h-5 text-white" />}
              colorScheme="blue"
          />
          <Card
              title="Avg Velocity"
            value={latestData.avg_surface_velocity}
            unit="m/s"
              icon={<Activity className="w-5 h-5 text-white" />}
              colorScheme="blue"
            />
            <Card
              title="Distance from Sensor"
              value={latestData.water_dist_sensor}
              unit="m"
              icon={<Ruler className="w-5 h-5 text-white" />}
              colorScheme="blue"
          />
          </CategorySection>

          {/* Device Parameters */}
          <CategorySection title="Device Parameters" color="green">
          <Card
            title="Tilt Angle"
            value={latestData.tilt_angle}
            unit="°"
              icon={<FaArrowUp className="text-white" />}
              colorScheme="green"
          />
        {station === "mana" && (
            <Card
              title="SNR"
              value={latestData.SNR}
              unit="dB"
                icon={<FaChartLine className="text-white" />}
                colorScheme="purple"
            />
            )}
          </CategorySection>

          {/* System Parameters - Only for Vasudhara */}
          {station === "vasudhara" && (
            <CategorySection title="System Parameters" color="purple">
              <Card
                title="Internal Temp"
                value={latestData.internal_temperature}
                unit="°C"
                icon={<Thermometer className="w-5 h-5 text-white" />}
                fixed={1}
                colorScheme="orange"
              />
              <Card
                title="Charge Current"
                value={latestData.charge_current}
                unit="A"
                icon={<BatteryCharging className="w-5 h-5 text-white" />}
                fixed={4}
                colorScheme="green"
              />
              <Card
                title="Absorbed Current"
                value={latestData.observed_current}
                unit="A"
                icon={<Zap className="w-5 h-5 text-white" />}
                fixed={4}
                colorScheme="orange"
              />
              <Card
                title="Battery Voltage"
                value={latestData.battery_voltage}
                unit="V"
                icon={<Battery className="w-5 h-5 text-white" />}
                fixed={1}
                colorScheme="blue"
              />
              <Card
                title="Solar Tracking"
                value={latestData.solar_panel_tracking}
                unit="V"
                icon={<Sun className="w-5 h-5 text-white" />}
                fixed={1}
                colorScheme="orange"
              />
            </CategorySection>
          )}
          </div>
      </div>

      {/* **************** GRAPH SECTION **************** */}
      <div
        className="
          mt-3 sm:mt-4 md:mt-5 mx-4 sm:mx-6 
          bg-[#f3f8ff] rounded-xl 
          shadow-lg p-3 sm:p-4 
          border border-blue-100
        "
      >
        <StationGraph station={station} />
      </div>
    </div>
  );
}
