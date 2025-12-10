"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "../../../public/images/logo.png";

export default function AdminLogin() {
  const router = useRouter();
  const [adminData, setAdminData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const lockElement = document.querySelector(".lock-icon");
      if (lockElement) {
        lockElement.classList.add("animate-float");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdminData({ ...adminData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!adminData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!adminData.password) {
      newErrors.password = "Password is required";
    } else if (adminData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("http://115.242.156.230:5000/api/users/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminData),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ form: data.message || "Invalid credentials" });
        setShake(true);
        setTimeout(() => setShake(false), 500);
      } else {
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          document.cookie = `adminToken=${data.token}; path=/;`;
        }
        router.push("/admin");
      }
    } catch (error) {
      setErrors({ form: "Server error. Please try again later." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-gray-200 p-4 sm:p-6">
      <div
        className={`flex flex-col md:flex-row items-center bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-4xl transition-all duration-300 ${
          shake ? "animate-shake" : ""
        }`}
      >
        {/* Illustration Side (Hidden on Mobile) */}
        <div className="hidden md:flex w-2/5 justify-center items-center p-6 md:p-8 bg-gray-100 relative">
          <div className="text-center">
            <div className="lock-icon mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 md:h-24 md:w-24 text-indigo-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Secure Admin Access</h3>
            <p className="text-gray-600 text-sm">Restricted access only</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full md:w-3/5 p-6 sm:p-8 md:p-10">
          <div className="flex justify-center mb-6 md:mb-8">
            <Image src={logo} alt="Logo" width={150} height={60} className="w-40 sm:w-44 md:w-48" />
          </div>

          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin Portal
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm font-medium">Sign in to access the dashboard</p>
          </div>

          {errors.form && (
            <div className="mb-5 sm:mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="admin@example.com"
                value={adminData.email}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${
                  errors.email ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-indigo-500"
                } focus:ring-2 focus:ring-indigo-100 transition-all duration-200 shadow-sm text-sm sm:text-base`}
              />
              {errors.email && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={adminData.password}
                  onChange={handleChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${
                    errors.password ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-indigo-500"
                  } focus:ring-2 focus:ring-indigo-100 transition-all duration-200 shadow-sm text-sm sm:text-base`}
                />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 cursor-pointer"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </div>
              </div>
              {errors.password && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 ${
                isLoading ? "opacity-80 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
