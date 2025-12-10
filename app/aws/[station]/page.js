'use client';
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, Tooltip, XAxis, YAxis, ResponsiveContainer, Legend, Brush, CartesianGrid
} from 'recharts';
import { motion } from 'framer-motion';
import Navbar from '../../../components/Navbar';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  WiHumidity,
  WiBarometer,
  WiDaySunny,
  WiStrongWind,
  WiRaindrop,
  WiCloud,
  WiThunderstorm,
  WiCloudy,
} from 'react-icons/wi';
import { GiWeight, GiSolarPower } from 'react-icons/gi';

const stationStates = {
  mana: 'Uttarakhand',
  lambagad: 'Uttarakhand',
  vasudhara: 'Uttarakhand',
};


const parameters = [
  'Temperature',
  'Pressure',
  'Humidity',
  'Wind',
  'Rain',
  'Precipitation',
  'Solar Radiation',
  'Avg Solar Radiation',
  'Bucket Weight',
];

const units = {
  Temperature: '°C',
  Pressure: 'hPa',
  Humidity: '%',
  Rain: 'mm',
  Precipitation: 'mm',
  'Solar Radiation': 'W/m²',
  'Avg Solar Radiation': 'W/m²',
  Wind: 'm/s',
  'Bucket Weight': 'gm',
};

const colors = {
  Temperature: '#ff4c4c',
  Pressure: '#0099cc',
  Humidity: '#4caf50',
  Wind: '#6a1b9a',
  Rain: '#1e88e5',
  Precipitation: '#0288d1',
  'Solar Radiation': '#ffb300',
  'Avg Solar Radiation': '#f57f17',
  'Bucket Weight': '#607d8b',
};

const getBackgroundGradient = (temperature) => {
  if (temperature === null || temperature === undefined)
    return 'from-[#1d3557] to-[#457b9d]';
  if (temperature < 0) return 'from-[#1e3c72] to-[#2a5298]';
  if (temperature < 15) return 'from-[#457b9d] to-[#a8dadc]';
  if (temperature < 30) return 'from-[#f9c74f] to-[#f9844a]';
  return 'from-[#f94144] to-[#f3722c]';
};

// 🌤️ Weather logic
const getWeatherCondition = (temp, humidity, pressure, rain) => {
  if (rain > 1)
    return { icon: <WiRaindrop className="text-blue-500 text-[80px]" />, status: 'Rainy' };
  if (pressure < 1000 && rain > 0)
    return { icon: <WiThunderstorm className="text-gray-700 text-[80px]" />, status: 'Thunderstorm' };
  if (humidity > 85 && rain === 0)
    return { icon: <WiCloudy className="text-gray-400 text-[80px]" />, status: 'Humid / Cloudy' };
  if (temp < 5)
    return { icon: <WiCloud className="text-blue-300 text-[80px]" />, status: 'Cold' };
  if (pressure > 1020 && humidity < 60 && rain === 0)
    return { icon: <WiDaySunny className="text-yellow-400 text-[80px]" />, status: 'Sunny' };
  return { icon: <WiCloud className="text-yellow-300 text-[80px]" />, status: 'Partly Cloudy' };
};

// 🌦️ Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="backdrop-blur-lg bg-white/95 shadow-2xl border border-gray-300 rounded-2xl p-4 min-w-[260px] text-gray-800 transition-all duration-200">
        <div className="flex justify-between items-center mb-2">
          <p className="font-bold text-lg text-blue-700">🕒 {label}</p>
          <p className="text-xs font-semibold text-gray-500">
            {new Date(data.rawTimestamp).toLocaleString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
              day: '2-digit',
              month: 'short',
            })}
          </p>
        </div>
        <div className="h-px bg-gradient-to-r from-blue-200 via-gray-300 to-blue-200 mb-3" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {Object.keys(data)
            .filter((key) => parameters.includes(key))
            .map((key) => (
              <div
                key={key}
                className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 pb-1"
              >
                <span className="flex items-center gap-1" style={{ color: colors[key] }}>
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: colors[key] }}></span>
                  {key}
                </span>
                <span className="text-gray-800">
                  {data[key]} {units[key]}
                </span>
              </div>
            ))}
        </div>
        <div className="mt-3 text-xs text-gray-600 italic text-center">
          Data recorded at {label} from AWS Station
        </div>
      </div>
    );
  }
  return null;
};

export default function StationPage() {
  const { station } = useParams();
  const router = useRouter();
  const stationKey = station.toLowerCase();
  const stationDisplay =
  stationKey === 'mana'
    ? 'Mana'
    : stationKey === 'lambagad'
    ? 'Barrage'
    : 'Vasudhara';

  const stateName = stationStates[stationKey] || 'Uttarakhand';

  const [selectedParams, setSelectedParams] = useState(['Temperature']);
  const [data, setData] = useState([]);
  const [liveData, setLiveData] = useState(null);
  const [isCelsius, setIsCelsius] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) window.location.replace('/auth/login');
  }, []);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const res = await fetch('http://115.242.156.230:5000/api/aws-live/all');
        const json = await res.json();
        if (!json?.data) return;

        let stationArr = [];

if (stationKey === 'mana') stationArr = json.data.Mana;
else if (stationKey === 'lambagad') stationArr = json.data.Lambagad;
else if (stationKey === 'vasudhara') stationArr = json.data.Vasudhara;

        if (!Array.isArray(stationArr) || !stationArr.length) return;

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));

        const filtered = stationArr.filter((item) => new Date(item.timestamp) >= startOfDay);

        const formatted = filtered.map((d) => ({
          time: new Date(d.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          rawTimestamp: d.timestamp,
          Temperature: parseFloat(d.temperature) || 0,
          Pressure: parseFloat(d.pressure) || 0,
          Humidity: parseFloat(d.relative_humidity) || 0,
          Rain: parseFloat(d.rain) || 0,
          Precipitation: parseFloat(d.precipitation) || 0,
          'Solar Radiation': parseFloat(d.PIR) || 0,
          'Avg Solar Radiation': parseFloat(d.avg_PIR) || 0,
          Wind: parseFloat(d.windspeed) || 0,
          'Bucket Weight': parseFloat(d.bucket_weight) || 0,
        }));

        setData(formatted);

        const latest = stationArr[0];
        setLiveData({
          Temperature: parseFloat(latest.temperature) || 0,
          Pressure: parseFloat(latest.pressure) || 0,
          Humidity: parseFloat(latest.relative_humidity) || 0,
          Rain: parseFloat(latest.rain) || 0,
          Precipitation: parseFloat(latest.precipitation) || 0,
          SolarRadiation: parseFloat(latest.PIR) || 0,
          AvgSolarRadiation: parseFloat(latest.avg_PIR) || 0,
          BucketWeight: parseFloat(latest.bucket_weight) || 0,
          Wind: parseFloat(latest.windspeed) || 0,
        });
      } catch (err) {
        console.error('Error fetching live data:', err);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 10000);
    return () => clearInterval(interval);
  }, [stationKey]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleParam = (param) => {
    setSelectedParams((prev) =>
      prev.includes(param)
        ? prev.filter((p) => p !== param)
        : [...prev, param]
    );
  };

  const formattedDate = currentTime.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const temperatureValue =
    liveData && isCelsius
      ? liveData.Temperature
      : liveData
      ? Math.round((liveData.Temperature * 9) / 5 + 32)
      : '--';

  const { icon: weatherIcon, status: weatherStatus } = getWeatherCondition(
    liveData?.Temperature || 0,
    liveData?.Humidity || 0,
    liveData?.Pressure || 0,
    liveData?.Rain || 0
  );

  return (
    <div
      className={`min-h-screen bg-gradient-to-b ${getBackgroundGradient(
        liveData?.Temperature
      )} pb-20 text-white transition-all duration-700`}
    >
      <Navbar />

      {/* Back Button */}
      <button
        onClick={() => router.push("/aws")}
        className="fixed top-16 sm:top-20 left-3 sm:left-4 md:left-6 p-2 sm:p-2.5 rounded-full shadow-lg z-40 transition-all hover:scale-110 bg-white/90 hover:bg-white text-slate-800 border border-white/20 backdrop-blur-sm"
        title="Go back to AWS"
      >
        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Top Section */}
      <div className="pt-28 px-4 md:px-12">
        <div className="w-full bg-[#f0f5ff] text-black rounded-3xl shadow-md p-4 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Left Info */}
          <div className="flex flex-col text-center sm:text-left">
            <h1 className="text-3xl md:text-5xl font-extrabold flex gap-2 justify-center sm:justify-start text-blue-600">
              {stationDisplay}
            </h1>

            <div className="text-base md:text-xl text-gray-700 font-semibold">{stateName}</div>
            <div className="text-sm md:text-md text-gray-600 font-medium">{formattedDate}, {formattedTime}</div>

            {liveData && (
              <div className="w-full flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                {[
                  { icon: <WiDaySunny />, label: 'Temperature', value: `${liveData.Temperature}°C`, color: colors.Temperature },
                  { icon: <WiHumidity />, label: 'Humidity', value: `${liveData.Humidity}%`, color: colors.Humidity },
                  { icon: <WiBarometer />, label: 'Pressure', value: `${liveData.Pressure} hPa`, color: colors.Pressure },
                  { icon: <WiStrongWind />, label: 'Wind', value: `${liveData.Wind} m/s`, color: colors.Wind },
                  { icon: <WiRaindrop />, label: 'Rain', value: `${liveData.Rain} mm`, color: colors.Rain },
                  { icon: <WiRaindrop />, label: 'Precipitation', value: `${liveData.Precipitation} mm`, color: colors.Precipitation },
                  { icon: <GiSolarPower />, label: 'Solar Radiation', value: `${liveData.SolarRadiation} W/m²`, color: colors['Solar Radiation'] },
                  { icon: <GiSolarPower />, label: 'Avg Solar Radiation', value: `${liveData.AvgSolarRadiation} W/m²`, color: colors['Avg Solar Radiation'] },
                  { icon: <GiWeight />, label: 'Bucket Weight', value: `${liveData.BucketWeight} gm`, color: colors['Bucket Weight'] },
                ].map(({ icon, label, value, color }, index) => (
                  <div
                    key={index}
                    className="w-[95px] sm:w-[115px] h-[95px] sm:h-[115px] rounded-xl flex flex-col items-center justify-center text-white font-bold text-center shadow-md"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 6px 15px -3px ${color}90`,
                    }}
                  >
                    <div className="text-xl sm:text-[26px] mb-1">{icon}</div>
                    <div className="text-xs sm:text-sm leading-tight">
                      {label}
                      <br />
                      <span className="text-sm sm:text-base font-semibold">
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <motion.div
            key={weatherStatus}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center md:flex-row gap-4 text-right"
          >
            <div className="text-[72px] font-extrabold text-black flex items-center gap-2">
              {temperatureValue}°
            </div>
            <div className="flex flex-col items-center md:items-start">
              {weatherIcon}
              <motion.p className="text-lg font-semibold text-gray-700 mt-1">
                {weatherStatus}
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Graph Section */}
      <div className="bg-[#f0f5ff] rounded-3xl shadow-lg p-4 mx-4 md:mx-12 mt-6 text-black">
        <div className="flex flex-wrap gap-4 border-b border-gray-300 mb-4">
          {parameters.map((param) => (
            <span
              key={param}
              onClick={() => toggleParam(param)}
              style={{
                borderBottom: selectedParams.includes(param)
                  ? `4px solid ${colors[param]}`
                  : '4px solid transparent',
                color: selectedParams.includes(param)
                  ? colors[param]
                  : '#6b7280',
              }}
              className="text-sm md:text-lg font-semibold cursor-pointer transition pb-1"
            >
              {param}
            </span>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={isDesktop ? 430 : 220}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#d1d5db" 
              opacity={0.4}
              vertical={false}
            />
            <XAxis 
              dataKey="time" 
              tick={{ fill: '#6b7280', fontSize: 11 }} 
              reversed
              axisLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
              tickLine={{ stroke: '#9ca3af' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
              tickLine={{ stroke: '#9ca3af' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value) => <span style={{ color: '#374151', fontSize: '12px', fontWeight: '600' }}>{value}</span>}
            />
            <Brush 
              dataKey="time" 
              height={30} 
              stroke="#409ac7" 
              fill="#f3f4f6"
              tickFormatter={(value) => value}
            />
            {selectedParams.map((param) => (
              <Line
                key={param}
                type="monotone"
                dataKey={param}
                stroke={colors[param]}
                strokeWidth={3}
                dot={false}
                activeDot={{ 
                  r: 6, 
                  strokeWidth: 2, 
                  fill: '#fff', 
                  stroke: colors[param],
                  style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }
                }}
                connectNulls={false}
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
