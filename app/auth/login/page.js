"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon, ArrowPathIcon } from "@heroicons/react/20/solid";
import AuthSlider from "../../../components/AuthSlider";
import Image from "next/image";
import logo from "../../../public/images/logo.png";

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "Shift Engineer",
    oldPassword: "cdc@123",
    newPassword: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isFirstLogin && formData.newPassword !== formData.confirmPassword) {
      alert("New password and confirm password must match");
      return;
    }

    setIsLoading(true);

    try {
      if (isFirstLogin) {
        // First login → update password
        const res = await fetch("http://115.242.156.230:5000/api/users/update-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            oldPassword: formData.oldPassword,
            newPassword: formData.newPassword
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update password");

        alert("Password updated successfully. Please log in now.");
        setIsFirstLogin(false);
      } else {
        // Normal login
        const res = await fetch("http://115.242.156.230:5000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            role: formData.role,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");

        // ✅ Save token and user details in localStorage
        localStorage.setItem("token", data.token);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        // Redirect to dashboard
        router.push("/dashboard");
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AuthSlider />

      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-center">
            <div className="flex justify-center mb-4">
              <Image
                src={logo}
                alt="Company Logo"
                width={160}
                height={70}
                priority
                className="hover:scale-105 transition-transform"
              />
            </div>
            <h2 className="text-3xl font-bold text-white">
              {isFirstLogin ? "Hydrology Welcomes You!" : "Welcome to Hydrology!"}
            </h2>

            {isFirstLogin ? (
              <div className="mt-2">
                <p className="text-blue-100">Please set your new password</p>
                <p
                  onClick={() => setIsFirstLogin(false)}
                  className="mt-1 text-white underline cursor-pointer hover:text-blue-200"
                >
                  Back to Login
                </p>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-blue-100">Sign in to continue</p>
                <p
                  onClick={() => setIsFirstLogin(true)}
                  className="mt-1 text-white underline cursor-pointer hover:text-blue-200"
                >
                  Set a new password
                </p>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none"
                  required
                >
                  <option value="Shift Engineer">Shift Engineer</option>
                  <option value="Viewer">Viewer</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Corporate">Corporate</option>
                </select>
              </div>

              {isFirstLogin ? (
                <>
                  {/* Old Password */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temporary Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="oldPassword"
                      value={formData.oldPassword}
                      onChange={handleChange}
                      readOnly
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                    <span
                      className="absolute right-3 top-10 cursor-pointer text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </span>
                  </div>

                  {/* New Password */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Create new password"
                      required
                      minLength={8}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        formData.newPassword &&
                        formData.confirmPassword &&
                        formData.newPassword !== formData.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all`}
                    />
                    <span
                      className="absolute right-3 top-10 cursor-pointer text-gray-400 hover:text-gray-600"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </span>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                      required
                      className={`w-full px-4 py-3 rounded-lg border ${
                        formData.newPassword &&
                        formData.confirmPassword &&
                        formData.newPassword !== formData.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all`}
                    />
                    <span
                      className="absolute right-3 top-10 cursor-pointer text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </span>
                    {formData.newPassword &&
                      formData.confirmPassword &&
                      formData.newPassword !== formData.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">
                          Passwords do not match
                        </p>
                      )}
                  </div>
                </>
              ) : (
                <>
                  {/* Normal Login Password */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                    <span
                      className="absolute right-3 top-10 cursor-pointer text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </span>
                  </div>
                </>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center ${
                  isLoading ? "opacity-80" : ""
                }`}
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                    {isFirstLogin ? "Updating Password..." : "Signing In..."}
                  </>
                ) : isFirstLogin ? (
                  "Set New Password"
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Admin Login Link at bottom */}
              <div className="text-center text-sm text-gray-600 pt-2">
                Admin?{" "}
                <a
                  href="/admin/login"
                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  Log in here
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
