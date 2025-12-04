'use client'
import { useState } from 'react';

const StationForm = () => {
  const [formData, setFormData] = useState({
    stationId: '',
    stationName: '',
    serviceId: '',
    longitude: '',
    latitude: '',
    country: '',
    state: '',
    district: '',
    pinCode: ''
  });

  const [currentStep, setCurrentStep] = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-gray-200 p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto my-6 sm:my-10 p-6 sm:p-10 bg-white rounded-2xl shadow-lg animate-fade-in-up">
        
        {/* Stepper Progress Bar */}
<div className="mb-10 relative">
  {/* Connector Line (background) */}
  <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-300"></div>
  {/* Active Line */}
  <div
    className="absolute top-4 left-0 h-0.5 bg-blue-500 transition-all duration-500"
    style={{ width: `${(currentStep - 1) / (3 - 1) * 100}%` }}
  ></div>

  <div className="flex justify-between relative z-10">
    {["Basic Info", "Coordinates", "Location"].map((label, index) => {
      const step = index + 1;
      return (
        <div key={label} className="flex flex-col items-center flex-1">
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border-2 
              transition-colors duration-300 ${
                currentStep >= step
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "bg-white border-gray-300 text-gray-400"
              }`}
          >
            {step}
          </div>
          <span className="mt-2 text-xs sm:text-sm font-medium text-gray-700">
            {label}
          </span>
        </div>
      );
    })}
  </div>
</div>


        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 relative">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-2 tracking-tight">
            Register New Station
          </h1>
          <p className="text-gray-600 text-sm sm:text-lg">
            Expand your network with a new station location
          </p>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Station ID */}
            <div>
              <label htmlFor="stationId" className="block text-sm font-medium text-gray-700 mb-2">
                Station ID
              </label>
              <input
                type="text"
                id="stationId"
                name="stationId"
                value={formData.stationId}
                onChange={handleChange}
                onFocus={() => setCurrentStep(1)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl 
                           focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-gray-50 focus:bg-white 
                           transition-all duration-300 text-sm sm:text-base"
                placeholder="Enter unique station ID"
                required
              />
            </div>

            {/* Station Name */}
            <div>
              <label htmlFor="stationName" className="block text-sm font-medium text-gray-700 mb-2">
                Station Name
              </label>
              <input
                type="text"
                id="stationName"
                name="stationName"
                value={formData.stationName}
                onChange={handleChange}
                onFocus={() => setCurrentStep(1)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl 
                           focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-gray-50 focus:bg-white 
                           transition-all duration-300 text-sm sm:text-base"
                placeholder="Enter station name"
                required
              />
            </div>

            {/* Service ID */}
            <div>
              <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 mb-2">
                Service ID
              </label>
              <input
                type="text"
                id="serviceId"
                name="serviceId"
                value={formData.serviceId}
                onChange={handleChange}
                onFocus={() => setCurrentStep(1)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl 
                           focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-gray-50 focus:bg-white 
                           transition-all duration-300 text-sm sm:text-base"
                placeholder="Enter service identifier"
                required
              />
            </div>

            {/* Longitude */}
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="text"
                id="longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                onFocus={() => setCurrentStep(2)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl 
                           focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-gray-50 focus:bg-white 
                           transition-all duration-300 text-sm sm:text-base"
                placeholder="Enter longitude"
                required
              />
            </div>

            {/* Latitude */}
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="text"
                id="latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                onFocus={() => setCurrentStep(2)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl 
                           focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-gray-50 focus:bg-white 
                           transition-all duration-300 text-sm sm:text-base"
                placeholder="Enter latitude"
                required
              />
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                onFocus={() => setCurrentStep(3)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl 
                           focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-gray-50 focus:bg-white 
                           transition-all duration-300 text-sm sm:text-base"
                placeholder="Enter country"
                required
              />
            </div>

            {/* State */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                onFocus={() => setCurrentStep(3)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl 
                           focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-gray-50 focus:bg-white 
                           transition-all duration-300 text-sm sm:text-base"
                placeholder="Enter state"
                required
              />
            </div>

            {/* District */}
            <div>
              <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                District
              </label>
              <input
                type="text"
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                onFocus={() => setCurrentStep(3)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl 
                           focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-gray-50 focus:bg-white 
                           transition-all duration-300 text-sm sm:text-base"
                placeholder="Enter district"
                required
              />
            </div>

            {/* Pin Code */}
            <div>
              <label htmlFor="pinCode" className="block text-sm font-medium text-gray-700 mb-2">
                Pin Code
              </label>
              <input
                type="text"
                id="pinCode"
                name="pinCode"
                value={formData.pinCode}
                onChange={handleChange}
                onFocus={() => setCurrentStep(3)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl 
                           focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-gray-50 focus:bg-white 
                           transition-all duration-300 text-sm sm:text-base"
                placeholder="Enter postal code"
                required
              />
            </div>

            {/* Submit */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 sm:py-4 px-4 rounded-xl 
                           shadow-md hover:shadow-lg transform hover:-translate-y-0.5 
                           transition-all duration-300 font-semibold text-base sm:text-lg flex items-center justify-center"
              >
                Register Station
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default StationForm;
