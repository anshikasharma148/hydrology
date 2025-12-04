'use client';
import { useEffect, useState } from "react";

export default function AdminHome() {
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAdminName(user.name || "Admin");
      } catch (err) {
        console.error("Error parsing stored user:", err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "adminToken=; path=/; max-age=0";
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-gray-200 p-4 sm:p-6 flex flex-col items-center justify-center relative">
      
      {/* ✅ Admin Info */}
      <div className="absolute top-4 right-4 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 bg-white/80 backdrop-blur-sm rounded-full py-2 px-3 sm:px-4 shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700">Hi, {adminName}</span>
        </div>
        <div className="hidden sm:block h-4 w-px bg-gray-300"></div>
        <button
          onClick={handleLogout}
          className="flex items-center text-xs sm:text-sm text-gray-500 hover:text-red-600 transition-colors duration-200 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

      {/* ✅ Dashboard Card */}
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl mt-16 sm:mt-0">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a7 7 0 110 14 7 7 0 010-14z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">Manage your application settings</p>
          </div>

          {/* ✅ Menu Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            
            {/* Assign Users */}
            <a href="/admin/users" className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 group">
              <div className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 bg-indigo-100 rounded-lg mr-3 sm:mr-4 group-hover:bg-indigo-200 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4a4 4 0 100 8 4 4 0 000-8zm-6 14v-1a6 6 0 0112 0v1" />
                </svg>
              </div>
              <div>
                <h2 className="font-medium text-gray-700 text-sm sm:text-base group-hover:text-indigo-600">Assign Users</h2>
                <p className="text-xs sm:text-sm text-gray-500">Manage user permissions and roles</p>
              </div>
            </a>

            {/* User Management */}
            <a href="/admin/user-management" className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 group">
              <div className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 bg-indigo-100 rounded-lg mr-3 sm:mr-4 group-hover:bg-indigo-200 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM6 8c1.66 0 3-1.34 3-3S7.66 2 6 2 3 3.34 3 5s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V18h14v-4.5C13 11.17 8.33 10 6 10zm10 1c-.29 0-.62.02-.97.05 1.16.84 1.97 2.11 1.97 3.45V18h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
              <div>
                <h2 className="font-medium text-gray-700 text-sm sm:text-base group-hover:text-indigo-600">User Management</h2>
                <p className="text-xs sm:text-sm text-gray-500">View, edit, and delete user accounts</p>
              </div>
            </a>

            {/* Manage Stations */}
            <a href="/admin/stations" className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 group">
              <div className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 bg-indigo-100 rounded-lg mr-3 sm:mr-4 group-hover:bg-indigo-200 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 6a4 4 0 110 8 4 4 0 010-8z" />
                </svg>
              </div>
              <div>
                <h2 className="font-medium text-gray-700 text-sm sm:text-base group-hover:text-indigo-600">Manage Stations</h2>
                <p className="text-xs sm:text-sm text-gray-500">Add, edit, and manage stations</p>
              </div>
            </a>

            {/* Settings */}
            <a href="/admin/settings" className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 group">
              <div className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 bg-indigo-100 rounded-lg mr-3 sm:mr-4 group-hover:bg-indigo-200 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12z" />
                </svg>
              </div>
              <div>
                <h2 className="font-medium text-gray-700 text-sm sm:text-base group-hover:text-indigo-600">Settings</h2>
                <p className="text-xs sm:text-sm text-gray-500">Configure application preferences</p>
              </div>
            </a>

          </div>
        </div>
      </div>
    </div>
  );
}
