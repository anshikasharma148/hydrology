'use client';
import React, { useEffect, useState } from 'react';
import {
  WiHumidity,
  WiBarometer,
  WiDaySunny,
  WiStrongWind,
  WiSnow,
  WiRaindrop,
  WiDirectionUp
} from 'react-icons/wi';
import { MapPin } from 'lucide-react';
import { FaSun } from 'react-icons/fa';

const stationStates = {
  'vishnu_prayag': 'Uttarakhand',
  'mana': 'Uttarakhand',
  'binakuli': 'Uttarakhand',
  'vasudhara': 'Uttarakhand'
};

function dmsToDecimal(degrees, minutes, seconds) {
  return degrees + minutes / 60 + seconds / 3600;
}

const stationCoordinates = {
  'vishnu_prayag': { lat: dmsToDecimal(30, 40, 20.9).toFixed(6), long: dmsToDecimal(79, 30, 49.0).toFixed(6) },
  'mana': { lat: 30.763327, long: 79.498450 },
  'binakuli': { lat: dmsToDecimal(30, 41, 12.5).toFixed(6), long: dmsToDecimal(79, 30, 28.9).toFixed(6) },
  'vasudhara': { lat: 30.7880086, long: 79.452111 }
};

export default function StationOverview({ station, liveData }) {
  const [weather, setWeather] = useState(liveData || null);
  const [loading, setLoading] = useState(!liveData);
  const [tempUnit, setTempUnit] = useState('C');
  const [sunrise, setSunrise] = useState('');
  const [sunset, setSunset] = useState('');

  useEffect(() => {
    const fetchWeather = async () => {
      if (!station || liveData) return;

      try {
        const apiStation = station.replace(/-/g, '_');
        const response = await fetch(`http://115.242.156.230:5000/api/aws-all/${apiStation}`);
        if (!response.ok) throw new Error('Failed to fetch weather data');
        const data = await response.json();

        if (data && data.length > 0) {
          const latestData = data[data.length - 1];
          setWeather({
            temperature: latestData.temperature,
            humidity: latestData.humidity,
            pressure: latestData.pressure,
            wind_speed: latestData.wind_speed,
            wind_direction: latestData.wind_direction,
            rain: latestData.rain,
            snow: latestData.snow,
            timestamp: latestData.timestamp
          });
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSunriseSunset = async () => {
      if (!station) return;

      try {
        const coords = stationCoordinates[station];
        if (!coords) return;

        const response = await fetch(
          `https://api.sunrise-sunset.org/json?lat=${coords.lat}&lng=${coords.long}&formatted=0`
        );
        const data = await response.json();
        if (data?.results) {
          setSunrise(new Date(data.results.sunrise).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          }));
          setSunset(new Date(data.results.sunset).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          }));
        }
      } catch (error) {
        console.error('Error fetching sunrise/sunset:', error);
      }
    };

    if (!liveData) fetchWeather();
    fetchSunriseSunset();
  }, [station, liveData]);

  if (loading) return <div className="flex justify-center items-center h-[560px] text-2xl">Loading...</div>;
  if (!weather) return <div className="flex justify-center items-center h-[560px] text-2xl text-red-500">Failed to load data</div>;

  const stationDisplay = station.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const stateName = stationStates[station] || 'Uttarakhand';
  const temperature = tempUnit === 'C' ? Math.round(weather.temperature) : Math.round((weather.temperature * 9 / 5) + 32);
  const date = new Date(weather.timestamp || new Date());
  const formattedDate = date.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long' });
  const formattedTime = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
  const coordinates = stationCoordinates[station] || { lat: 'N/A', long: 'N/A' };

  return (
    <div className="min-h-screen relative overflow-hidden pb-20">
      {/* ✅ Responsive center container for huge screens */}
      <div className="w-[95%] xl:w-[90%] 2xl:w-[85%] max-w-[1800px] mx-auto flex flex-col lg:flex-row justify-center items-start gap-10 mt-[30px] px-2 md:px-6">

        {/* Main Weather Card */}
        <div className="bg-[#f0f5ff] w-full md:w-[480px] h-auto md:h-[565px] rounded-3xl shadow-md flex flex-col justify-between items-center text-black p-6 md:p-8">
          <div className="w-full flex flex-col items-start mb-2">
            <div className="flex items-center gap-2 text-2xl md:text-4xl font-semibold text-[#409ac7] mb-1">
              <MapPin className="text-[#409ac7]" />
              {stationDisplay}
            </div>
            <div className="text-lg md:text-2xl font-semibold">{stateName}</div>
            <div className="text-base md:text-xl font-medium mt-1">{formattedDate}, {formattedTime}</div>
          </div>

          <div className="flex items-center justify-center w-full mt-2 mb-2">
            <div className="text-[80px] md:text-[120px] font-extrabold leading-none">{temperature}°</div>
            <WiDaySunny className="text-yellow-400 text-[90px] md:text-[140px] ml-4 md:ml-6" />
          </div>

          <div className="flex flex-col items-center w-full">
            <div className="flex items-center gap-2 mb-2 text-lg md:text-xl font-bold justify-center">
              <span onClick={() => setTempUnit('C')} className={`cursor-pointer ${tempUnit === 'C' ? 'text-black' : 'text-gray-400'}`}>°C</span>
              <span className="text-gray-400">|</span>
              <span onClick={() => setTempUnit('F')} className={`cursor-pointer ${tempUnit === 'F' ? 'text-black' : 'text-gray-400'}`}>°F</span>
            </div>
            <div className="text-center text-lg md:text-xl font-semibold mb-2">{weather.condition || 'Sunny'}</div>
          </div>

          <div className="flex flex-col gap-2 w-full items-center">
            <div className="flex items-center gap-2 text-base md:text-xl justify-center">
              <WiHumidity className="text-[36px] md:text-[48px] text-[#409ac7]" />
              <span><span className="text-[#409ac7] font-bold">Humidity:</span> {Math.round(weather.humidity)}%</span>
            </div>
            <div className="flex items-center gap-2 text-base md:text-xl justify-center">
              <WiBarometer className="text-[36px] md:text-[48px] text-[#409ac7]" />
              <span><span className="text-[#409ac7] font-bold">Pressure:</span> {Math.round(weather.pressure)} hPa</span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-col gap-6 w-full">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <WeatherSmallCard icon={<WiDirectionUp />} label="Wind Dir" value={weather.wind_direction || 'N/A'} />
            <WeatherSmallCard icon={<WiStrongWind />} label="Wind Speed" value={`${Math.round(weather.wind_speed)} km/h`} />
            <div className="bg-[#f0f5ff] w-full h-[220px] md:h-[270px] rounded-3xl shadow-md flex flex-col justify-center items-center p-4 md:p-6 text-black col-span-2 md:col-span-1">
              <div className="text-lg md:text-2xl font-semibold text-[#409ac7]">Latitude & Longitude</div>
              <div className="mt-2 md:mt-4 text-center">
                <div className="text-base md:text-xl font-semibold text-[#409ac7]">Latitude</div>
                <div className="text-xl md:text-3xl font-bold">{coordinates.lat}</div>
                <div className="text-base md:text-xl font-semibold text-[#409ac7] mt-1 md:mt-2">Longitude</div>
                <div className="text-xl md:text-3xl font-bold">{coordinates.long}</div>
              </div>
            </div>
            <WeatherSmallCard icon={<WiRaindrop />} label="Rain" value={`${Math.round(weather.rain)} mm`} />
            <WeatherSmallCard icon={<WiSnow />} label="Snow" value={`${Math.round(weather.snow)} cm`} />
            <div className="bg-[#f1f6ff] p-4 rounded-2xl shadow-sm flex flex-col justify-between min-w-[240px] h-[220px] md:h-[270px] col-span-2 md:col-span-1">
              <div className="flex justify-end mb-2">
                <FaSun className="text-orange-500 text-3xl md:text-4xl" />
              </div>
              <div className="w-full h-20 md:h-24 bg-gradient-to-t from-orange-300 to-orange-100 rounded-full"></div>
              <div className="flex justify-between mt-4 text-sm md:text-md font-medium text-black">
                <div>
                  <div>Sunrise</div>
                  <div className="text-lg font-bold">{sunrise}</div>
                </div>
                <div>
                  <div>Sunset</div>
                  <div className="text-lg font-bold">{sunset}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Small Card Component
function WeatherSmallCard({ icon, label, value }) {
  return (
    <div className="bg-[#f0f5ff] w-full h-[220px] md:h-[270px] rounded-3xl shadow-md flex flex-col justify-center items-center text-black hover:scale-105 transition-transform duration-300">
      <div className="text-[70px] md:text-[90px] text-[#409ac7]">{icon}</div>
      <div className="text-base md:text-xl font-semibold mt-1 md:mt-2">{label}</div>
      <div className="text-lg md:text-2xl font-bold">{value}</div>
    </div>
  );
}
