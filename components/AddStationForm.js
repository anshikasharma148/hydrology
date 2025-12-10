"use client";
import { useState } from "react";
import Image from "next/image"; // ✅ Import Next.js Image component
import bgImage from "../public/images/slider1.png"; // ✅ Background Image

export default function AddStationForm({ isOpen, closeForm }) {
  if (!isOpen) return null;

  const [stationData, setStationData] = useState({
    stationName: "",
    stationId: "",
    latitude: "",
    longitude: "",
    elevation: "",
    dataloggerModel: "DA-18K",
    installationDate: "",
    sensorType: "",
    batteryVoltage: "",
    transmissionFrequency: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStationData({ ...stationData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Station Data:", stationData);
    closeForm();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* ✅ Background Image using Next.js */}
      <Image
        src={bgImage}
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="absolute inset-0 z-0"
        priority
      />

      {/* ✅ Form Container */}
      <div className="relative z-10 w-full max-w-4xl bg-white shadow-md rounded-lg border border-gray-300 p-6">
        {/* ✅ Form Header */}
        <div className="bg-purple-100 text-purple-700 font-semibold text-lg text-center py-3 rounded-t-lg">
          Add Station
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          {/* ✅ Station Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Station Name</label>
            <input
              type="text"
              name="stationName"
              value={stationData.stationName}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white text-gray-700 placeholder-gray-400"
              placeholder="Enter Station Name"
            />
          </div>

          {/* ✅ Station ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Station ID</label>
            <input
              type="text"
              name="stationId"
              value={stationData.stationId}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white text-gray-700 placeholder-gray-400"
              placeholder="Enter Station ID"
            />
          </div>

          {/* ✅ Latitude */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude</label>
            <input
              type="text"
              name="latitude"
              value={stationData.latitude}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white text-gray-700 placeholder-gray-400"
              placeholder="Enter Latitude"
            />
          </div>

          {/* ✅ Longitude */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude</label>
            <input
              type="text"
              name="longitude"
              value={stationData.longitude}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white text-gray-700 placeholder-gray-400"
              placeholder="Enter Longitude"
            />
          </div>

          {/* ✅ Elevation */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Elevation (m)</label>
            <input
              type="text"
              name="elevation"
              value={stationData.elevation}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white text-gray-700 placeholder-gray-400"
              placeholder="Enter Elevation"
            />
          </div>

          {/* ✅ Install Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Install Date</label>
            <input
              type="date"
              name="installationDate"
              value={stationData.installationDate}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white text-gray-700"
            />
          </div>

          {/* ✅ Sensor Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Sensor</label>
            <input
              type="text"
              name="sensorType"
              value={stationData.sensorType}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white text-gray-700 placeholder-gray-400"
              placeholder="Enter Sensor Type"
            />
          </div>

          {/* ✅ Battery Voltage */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Battery (V)</label>
            <input
              type="text"
              name="batteryVoltage"
              value={stationData.batteryVoltage}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white text-gray-700 placeholder-gray-400"
              placeholder="Enter Battery Voltage"
            />
          </div>

          {/* ✅ Transmission Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Frequency</label>
            <input
              type="text"
              name="transmissionFrequency"
              value={stationData.transmissionFrequency}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white text-gray-700 placeholder-gray-400"
              placeholder="Enter Frequency"
            />
          </div>

          {/* ✅ Datalogger Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Datalogger</label>
            <input
              type="text"
              name="dataloggerModel"
              value={stationData.dataloggerModel}
              disabled
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed"
            />
          </div>
        </form>

        {/* ✅ Buttons */}
        <div className="mt-6 flex justify-center p-4">
          <button
            type="submit"
            className="w-full py-3 bg-purple-700 text-white font-semibold rounded-md hover:bg-purple-800 transition"
          >
            Add Station
          </button>
        </div>
      </div>
    </div>
  );
}
