"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const stations = [
  { name: "Lambagad", video: "/globe/vishnuprayagglobe.mp4" },
  { name: "Mana", video: "/globe/managlobe.mp4" },
  { name: "Vasudhara", video: "/globe/vasudharaglobe.mp4" },
  { name: "Ghastoli", video: "/globe/ghastoliglobe.mp4" },
  { name: "Khirao", video: "/globe/khiraoglobe.mp4" }
];

export default function StationSelector({ selectedStation }) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStationChange = (e) => {
    const station = e.target.value;
    router.push(`/ews/${station.toLowerCase()}`);
  };

  const handleCheckboxChange = (station) => {
    router.push(`/ews/${station.toLowerCase()}`);
  };

  return (
    <div className="pt-20 px-6 flex justify-between items-start">
      {/* Left side: Station Selector */}
      <div>
        {/* Select Station Dropdown */}
        <label htmlFor="station-select" className="text-lg font-semibold text-gray-700">
          Select Station:
        </label>
        <select
          id="station-select"
          value={selectedStation}
          onChange={handleStationChange}
          className="border border-gray-400 rounded-md p-2 ml-2 text-gray-700"
        >
          {stations.map((station) => (
            <option key={station.name} value={station.name}>
              {station.name}
            </option>
          ))}
        </select>

        
      </div>

      {/* Right side: Live Clock */}
      <div className="text-right">
        <div className="text-xl font-bold text-gray-800">
          {currentTime.toLocaleDateString()}
        </div>
        <div className="text-lg text-gray-600">
          {currentTime.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
