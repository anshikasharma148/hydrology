'use client';
import React from 'react';
import { useParams } from 'next/navigation';

const stationCoordinates = {
  'vishnu-prayag': { lat: 30.0767, long: 79.6133 },
  'mana': { lat: 30.7188, long: 79.6674 },
  'binakuli': { lat: 30.2711, long: 79.7436 },
  'vasudhara': { lat: 30.0794, long: 79.8292 }
};

export default function StationCoordinates() {
  const params = useParams();
  const station = params?.station;

  // Default to N/A if station is not recognized
  const coordinates = stationCoordinates[station] || { lat: 'N/A', long: 'N/A' };

  const stationDisplay = station ? station.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown Station';

  return (
    <div className="min-h-screen relative overflow-hidden pb-20">
      <div className="flex flex-col lg:flex-row justify-start items-center lg:items-start gap-10 mt-[50px] px-6">
        
        {/* Coordinates Card */}
        <div className="bg-[#f0f5ff] rounded-3xl shadow-xl px-10 py-8 w-[320px] md:w-[500px] h-[320px] flex flex-col text-black">
          <div className="flex items-center gap-2 text-3xl md:text-4xl font-semibold text-[#409ac7] mb-1">
            <span className="text-[#409ac7]">📍</span> {/* Pin icon for the location */}
            {stationDisplay}
          </div>
          <div className="text-xl md:text-2xl font-semibold">Latitude & Longitude</div>

          <div className="flex items-center justify-between mt-6 mb-4">
            <div className="text-[40px] md:text-[60px] font-bold">{coordinates.lat}</div>
            <div className="text-[40px] md:text-[60px] font-bold">{coordinates.long}</div>
          </div>

          <div className="flex items-center gap-2 mb-4 text-lg font-semibold justify-center">
            <span className="text-[#409ac7]">Latitude</span>
            <span className="text-gray-400">|</span>
            <span className="text-[#409ac7]">Longitude</span>
          </div>
        </div>
      </div>
    </div>
  );
}
