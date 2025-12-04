import L from 'leaflet';
import flagImage from '../public/images/red-flag.png'; // ✅ Adjust the path if needed

export const customFlagIcon = new L.Icon({
  iconUrl: flagImage,
  iconSize: [64, 64],
  iconAnchor: [32, 64],
  popupAnchor: [0, -60],
});