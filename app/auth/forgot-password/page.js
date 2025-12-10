"use client";
import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    alert(`Password reset link sent to: ${email}`);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#1E1B29]">
      <div className="bg-[#29243D] p-8 rounded-lg shadow-lg w-96 text-white">
        {/* 🔹 Stylish Heading */}
        <h2 className="text-3xl font-bold text-center mb-4">Forgot Password</h2>
        <p className="text-gray-400 text-center mb-6">Enter your email to receive a reset link.</p>

        {/* 🔹 Email Input */}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full p-3 border border-gray-600 rounded-md mb-4 bg-[#1E1B29] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* 🔹 Submit Button */}
          <button
            type="submit"
            className="w-full bg-purple-600 text-white p-3 rounded-md font-semibold hover:bg-purple-700 transition duration-300"
          >
            Send Reset Link
          </button>
        </form>

        {/* 🔹 Back to Login Link */}
        <div className="text-center mt-4">
          <a href="/auth/login" className="text-purple-400 hover:underline">Back to Login</a>
        </div>
      </div>
    </div>
  );
}
