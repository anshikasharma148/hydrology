'use client';
import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { FaCloudSun, FaCloudRain, FaCloud, FaSun, FaWind } from 'react-icons/fa';

const weatherStations = ["Vishnu Prayag", "Mana", "Binakuli", "Vasudhara", "Khero"];

export default function WeatherSlider() {
  const [weatherData, setWeatherData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      const apiKey = "16899ee8b3d54ff5e323f8fbdff5b5da";
      const data = {};

      for (const station of weatherStations) {
        try {
          const res = await fetch(`http://api.weatherstack.com/current?access_key=${apiKey}&query=${encodeURIComponent(station)}`);
          const result = await res.json();
          if (result && result.current) {
            data[station] = {
              temperature: result.current.temperature,
              condition: result.current.weather_descriptions[0],
              icon: result.current.weather_icons[0]
            };
          }
        } catch (error) {
          console.error(`Failed to fetch weather for ${station}`, error);
        }
      }

      setWeatherData(data);
      setIsLoading(false);
    };

    fetchWeather();
  }, []);

  const getWeatherIcon = (condition) => {
    const c = condition?.toLowerCase();
    if (!c) return <FaCloud className="text-white text-6xl mb-2 icon" />;
    if (c.includes("sun")) return <FaSun className="text-white text-6xl mb-2 icon" />;
    if (c.includes("cloud")) return <FaCloud className="text-white text-6xl mb-2 icon" />;
    if (c.includes("rain")) return <FaCloudRain className="text-white text-6xl mb-2 icon" />;
    if (c.includes("wind")) return <FaWind className="text-white text-6xl mb-2 icon" />;
    return <FaCloudSun className="text-white text-6xl mb-2 icon" />;
  };

  return (
    <div className="w-[850px]">
      <h2 className="text-3xl text-white font-extrabold mb-6 ml-2">Live Weather Update</h2>
      <Swiper
        modules={[Navigation]}
        slidesPerView={3}
        spaceBetween={25}
        loop={true}
        navigation={{
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom'
        }}
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <SwiperSlide key={i}>
              <div className="bg-[#409ac7] rounded-2xl h-[250px] w-[240px] px-6 py-6 flex flex-col justify-center items-center text-white shadow-lg text-xl font-semibold">
                Loading...
              </div>
            </SwiperSlide>
          ))
        ) : (
          weatherStations.map((station, i) => (
            <SwiperSlide key={i}>
              <div className="bg-[#409ac7] group rounded-2xl h-[250px] w-[240px] px-6 py-6 flex flex-col justify-center items-center text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.03]">
                {getWeatherIcon(weatherData[station]?.condition)}
                <h3 className="text-4xl font-extrabold mb-1 group-hover:text-yellow-300 transition duration-300">{weatherData[station]?.temperature}°</h3>
                <p className="text-lg font-semibold mb-1 group-hover:text-yellow-300 transition duration-300">({weatherData[station]?.condition})</p>
                <p className="text-xl font-bold group-hover:text-yellow-300 transition duration-300">{station}</p>
              </div>
            </SwiperSlide>
          ))
        )}
        <div className="swiper-button-prev-custom text-white text-xl ml-[-20px]"></div>
        <div className="swiper-button-next-custom text-white text-xl mr-[-20px]"></div>
      </Swiper>

      <style jsx>{`
        .icon {
          transition: color 0.3s ease-in-out;
        }
        .group:hover .icon {
          color: #facc15;
        }
        .swiper-button-prev-custom,
        .swiper-button-next-custom {
          position: absolute;
          top: 40%;
          z-index: 10;
          width: 25px;
          height: 25px;
          background-color: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          cursor: pointer;
        }
        .swiper-button-prev-custom {
          left: -10px;
        }
        .swiper-button-next-custom {
          right: -10px;
        }
        .swiper-button-prev-custom::after,
        .swiper-button-next-custom::after {
          font-size: 16px;
          color: white;
        }
      `}</style>
    </div>
  );
}
