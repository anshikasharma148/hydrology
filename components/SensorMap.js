"use client";

import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Thermometer,
  Droplets,
  Gauge,
  Wind,
  CloudRain,
  Sun,
  Waves,
  Activity,
  MapPin,
  Clock,
} from "lucide-react";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png").default,
  iconUrl: require("leaflet/dist/images/marker-icon.png").default,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
});

const formatTS = (ts) => (ts ? new Date(ts).toLocaleString() : "---");
const dmsToDecimal = (d, m, s) => d + m / 60 + s / 3600;

// Animated River Layer
const AnimatedRiverFlow = ({ positions, index, speed = 1 }) => {
  const [dashOffset, setDashOffset] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setDashOffset((p) => (p + speed) % 50);
    }, 30);
    return () => clearInterval(interval);
  }, [speed]);

  useEffect(() => {
    if (ref.current?.leafletElement) {
      ref.current.leafletElement.setStyle({ dashOffset: `${dashOffset + index * 12}` });
    }
  }, [dashOffset, index]);

  return (
    <Polyline
      ref={ref}
      positions={positions}
      pathOptions={{
        color: "#60a5fa",
        weight: 6,
        opacity: 0.8,
        dashArray: "20, 30",
        lineCap: "round",
      }}
    />
  );
};

const FreshSensorMap = () => {
  const [awsData, setAwsData] = useState({});
  const [ewsData, setEwsData] = useState({});
  const [loading, setLoading] = useState(true);

  const stations = [
    {
      key: "mana",
      name: "Mana",
      lat: 30.763327,
      lng: 79.49845,
      hasEws: true,
      image: "/dash_station_img/mana.jpg",
    },
    {
      key: "vasudhara",
      name: "Vasudhara",
      lat: 30.7880086,
      lng: 79.452111,
      hasEws: true,
      image: "/dash_station_img/vasudhara.png",
    },
    {
      key: "barrage",
      name: "Barrage",
      lat: dmsToDecimal(30, 40, 20.9),
      lng: dmsToDecimal(79, 30, 49.0),
      hasEws: false,
      image: "/dash_station_img/barrage.jpg",
    },
  ];

  // River paths: Simple linear connection Barrage -> Mana -> Vasudhara
  const riverPaths = [
    // Path 1: Barrage to Mana
    [
      [dmsToDecimal(30, 40, 20.9), dmsToDecimal(79, 30, 49.0)], // Barrage
      [30.763327, 79.49845], // Mana
    ],
    // Path 2: Mana to Vasudhara
    [
      [30.763327, 79.49845], // Mana
      [30.7880086, 79.452111], // Vasudhara
    ],
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // AWS
      const awsRes = await fetch("http://115.242.156.230:5000/api/aws-live/all");
      const awsJson = await awsRes.json();
      const awsFinal = {};
      if (awsJson?.data) {
        Object.entries(awsJson.data).forEach(([key, arr]) => {
          if (arr && arr.length > 0) {
            const k = key.toLowerCase();
            if (k === "lambagad") awsFinal["barrage"] = arr[0];
            awsFinal[k] = arr[0];
          }
        });
      }

      // EWS
      const ewsRes = await fetch("http://115.242.156.230:5000/api/ews-live/all");
      const ewsJson = await ewsRes.json();
      const ewsFinal = {};
      if (ewsJson?.data) {
        Object.entries(ewsJson.data).forEach(([key, arr]) => {
          if (arr && arr.length > 0) ewsFinal[key.toLowerCase()] = arr[0];
        });
      }

      setAwsData(awsFinal);
      setEwsData(ewsFinal);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // CRITICAL: fixed z-index + tooltip stacking
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "map-stacking-fix";
    style.textContent = `
      /* FIX: Correct Leaflet stacking */
      .leaflet-tile-pane { z-index: 200 !important; }
      .leaflet-overlay-pane { z-index: 300 !important; }
      .leaflet-shadow-pane { z-index: 350 !important; }
      .leaflet-marker-pane { z-index: 400 !important; }
      .leaflet-tooltip-pane { z-index: 5000 !important; }
      .leaflet-popup-pane { z-index: 6000 !important; }

      /* Ensure tooltip and popup are always opaque */
      .leaflet-tooltip, .leaflet-tooltip * {
        opacity: 1 !important;
        filter: none !important;
    }

      .custom-tooltip.leaflet-tooltip {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
      .custom-tooltip .leaflet-tooltip-content-wrapper {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
      .custom-tooltip .leaflet-tooltip-content {
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }
      .custom-popup .leaflet-popup-content-wrapper {
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        border: 2px solid #e5e7eb;
      }
      .custom-popup .leaflet-popup-content {
        margin: 0;
        padding: 0;
      }
    `;
    document.head.appendChild(style);
    return () => document.getElementById("map-stacking-fix")?.remove();
  }, []);

  const getIcon = (img) =>
    new L.Icon({
      iconUrl: img,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -50],
      className: "rounded-full border-[3px] border-white shadow-xl",
    });

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-lg overflow-hidden shadow-xl">
      <MapContainer center={[30.775, 79.48]} zoom={12} className="w-full h-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Stations */}
        {stations.map((s) => {
          const aws = awsData[s.key];
          const ews = ewsData[s.key];

          return (
            <Marker key={s.key} position={[s.lat, s.lng]} icon={getIcon(s.image)}>
              {/* Compact Hover Tooltip - All Info */}
              <Tooltip direction="top" offset={[0, -25]} opacity={1} className="custom-tooltip" permanent={false}>
                <div 
                  className="rounded-xl overflow-hidden min-w-[300px] max-w-[360px]"
                  style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                    border: '2px solid #3b82f6',
                    boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(59, 130, 246, 0.4)',
                  }}
                >
                  {/* Compact Header */}
                  <div 
                    className="flex items-center gap-2 p-2.5 border-b"
                    style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}
            >
                    <img 
                      src={s.image} 
                      alt={s.name}
                      className="w-10 h-10 rounded-lg object-cover border"
                      style={{ borderColor: '#3b82f6' }}
                    />
                    <div className="flex-1">
                      <div 
                        className="font-bold text-base"
                        style={{ color: '#ffffff' }}
                      >
                        {s.name}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div 
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: aws ? '#10b981' : '#6b7280' }}
                        ></div>
                        <span 
                          className="text-[10px] font-semibold"
                          style={{ color: '#93c5fd' }}
                        >
                          {s.hasEws ? "AWS + EWS" : "AWS"}
                      </span>
                      </div>
                    </div>
                  </div>

                  {/* AWS Data - All Parameters */}
                  {aws && (
                    <div className="p-2.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sun className="w-3 h-3" style={{ color: '#fbbf24' }} />
                        <span 
                          className="text-[10px] font-bold uppercase"
                          style={{ color: '#fbbf24' }}
                        >
                              AWS
                            </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className="flex items-center justify-between p-1.5 rounded" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                          <div className="flex items-center gap-1">
                            <Thermometer className="w-3 h-3" style={{ color: '#fca5a5' }} />
                            <span style={{ color: '#cbd5e1' }}>Temp</span>
                          </div>
                          <span className="font-bold" style={{ color: '#fca5a5' }}>{aws.temperature ?? "-"}°C</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-1.5 rounded" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                          <div className="flex items-center gap-1">
                            <Droplets className="w-3 h-3" style={{ color: '#93c5fd' }} />
                            <span style={{ color: '#cbd5e1' }}>Humidity</span>
                          </div>
                          <span className="font-bold" style={{ color: '#93c5fd' }}>{aws.relative_humidity ?? "-"}%</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-1.5 rounded" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                          <div className="flex items-center gap-1">
                            <Gauge className="w-3 h-3" style={{ color: '#c4b5fd' }} />
                            <span style={{ color: '#cbd5e1' }}>Pressure</span>
                          </div>
                          <span className="font-bold" style={{ color: '#c4b5fd' }}>{aws.pressure ?? "-"} hPa</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-1.5 rounded" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                          <div className="flex items-center gap-1">
                            <Wind className="w-3 h-3" style={{ color: '#67e8f9' }} />
                            <span style={{ color: '#cbd5e1' }}>Wind</span>
                          </div>
                          <span className="font-bold" style={{ color: '#67e8f9' }}>{aws.windspeed ?? "-"} m/s</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-1.5 rounded" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                          <div className="flex items-center gap-1">
                            <Wind className="w-3 h-3" style={{ color: '#67e8f9' }} />
                            <span style={{ color: '#cbd5e1' }}>Wind Dir</span>
                          </div>
                          <span className="font-bold" style={{ color: '#67e8f9' }}>{aws.winddirection ?? "-"}°</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-1.5 rounded" style={{ background: 'rgba(14, 165, 233, 0.1)' }}>
                          <div className="flex items-center gap-1">
                            <CloudRain className="w-3 h-3" style={{ color: '#7dd3fc' }} />
                            <span style={{ color: '#cbd5e1' }}>Rain</span>
                          </div>
                          <span className="font-bold" style={{ color: '#7dd3fc' }}>{aws.rain ?? "-"} mm</span>
                        </div>
                        
                        {aws.precipitation !== undefined && (
                          <div className="flex items-center justify-between p-1.5 rounded" style={{ background: 'rgba(14, 165, 233, 0.1)' }}>
                            <div className="flex items-center gap-1">
                              <CloudRain className="w-3 h-3" style={{ color: '#7dd3fc' }} />
                              <span style={{ color: '#cbd5e1' }}>Snow</span>
                            </div>
                            <span className="font-bold" style={{ color: '#7dd3fc' }}>{aws.precipitation ?? "-"} mm</span>
                          </div>
                        )}
                        
                        {aws.PIR !== undefined && (
                          <div className="flex items-center justify-between p-1.5 rounded" style={{ background: 'rgba(251, 191, 36, 0.1)' }}>
                            <div className="flex items-center gap-1">
                              <Sun className="w-3 h-3" style={{ color: '#fbbf24' }} />
                              <span style={{ color: '#cbd5e1' }}>PIR</span>
                              </div>
                            <span className="font-bold" style={{ color: '#fbbf24' }}>{aws.PIR ?? "-"} W/m²</span>
                          </div>
                        )}
                      </div>
                      </div>
                    )}

                  {/* EWS Data - All Parameters */}
                  {s.hasEws && ews && (
                    <div className="p-2.5 pt-2 space-y-1.5 border-t" style={{ borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Waves className="w-3 h-3" style={{ color: '#10b981' }} />
                        <span 
                          className="text-[10px] font-bold uppercase"
                          style={{ color: '#10b981' }}
                        >
                              EWS
                            </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className="flex items-center justify-between p-1.5 rounded" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                          <div className="flex items-center gap-1">
                            <Waves className="w-3 h-3" style={{ color: '#6ee7b7' }} />
                            <span style={{ color: '#cbd5e1' }}>Level</span>
                          </div>
                          <span className="font-bold" style={{ color: '#6ee7b7' }}>{ews.water_level ?? "-"} m</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-1.5 rounded" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                          <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" style={{ color: '#6ee7b7' }} />
                            <span style={{ color: '#cbd5e1' }}>Vel</span>
                          </div>
                          <span className="font-bold" style={{ color: '#6ee7b7' }}>{ews.surface_velocity ?? "-"} m/s</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-1.5 rounded" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                          <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" style={{ color: '#6ee7b7' }} />
                            <span style={{ color: '#cbd5e1' }}>Avg Vel</span>
                          </div>
                          <span className="font-bold" style={{ color: '#6ee7b7' }}>{ews.avg_surface_velocity ?? "-"} m/s</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-1.5 rounded" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                          <div className="flex items-center gap-1">
                            <Droplets className="w-3 h-3" style={{ color: '#10b981' }} />
                            <span style={{ color: '#cbd5e1' }}>Discharge</span>
                          </div>
                          <span className="font-bold" style={{ color: '#10b981' }}>{ews.water_discharge ?? "-"} m³/s</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-1.5 rounded" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                          <div className="flex items-center gap-1">
                            <Gauge className="w-3 h-3" style={{ color: '#6ee7b7' }} />
                            <span style={{ color: '#cbd5e1' }}>Distance</span>
                          </div>
                          <span className="font-bold" style={{ color: '#6ee7b7' }}>{ews.water_dist_sensor ?? "-"} m</span>
                        </div>
                        
                        {ews.tilt_angle !== undefined && (
                          <div className="flex items-center justify-between p-1.5 rounded" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                            <div className="flex items-center gap-1">
                              <Gauge className="w-3 h-3" style={{ color: '#6ee7b7' }} />
                              <span style={{ color: '#cbd5e1' }}>Tilt</span>
                            </div>
                            <span className="font-bold" style={{ color: '#6ee7b7' }}>{ews.tilt_angle ?? "-"}°</span>
                          </div>
                        )}
                        
                        {ews.flow_direction !== undefined && (
                          <div className="flex items-center justify-between p-1.5 rounded" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                            <div className="flex items-center gap-1">
                              <Wind className="w-3 h-3" style={{ color: '#6ee7b7' }} />
                              <span style={{ color: '#cbd5e1' }}>Flow Dir</span>
                              </div>
                            <span className="font-bold" style={{ color: '#6ee7b7' }}>{ews.flow_direction ?? "-"}°</span>
                          </div>
                        )}
                      </div>
                      </div>
                    )}

                  {/* Timestamp */}
                  {aws && (
                    <div 
                      className="flex items-center gap-1.5 px-2.5 py-1.5 border-t text-[9px]"
                      style={{ borderColor: 'rgba(59, 130, 246, 0.2)', color: '#94a3b8' }}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span className="font-semibold">{formatTS(aws.timestamp)}</span>
                  </div>
                  )}

                  {!aws && (
                    <div className="p-4 text-center">
                      <div style={{ color: '#94a3b8' }} className="text-xs">No data available</div>
                  </div>
                  )}
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default FreshSensorMap;
