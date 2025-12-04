"use client";
import { useState, useEffect } from "react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch all users
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://115.242.156.230:5000/api/users/admin/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ Reset Password
  const handleResetPassword = async (userId, userName) => {
    if (!confirm(`Reset password for ${userName} to default (cdc@123)?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://115.242.156.230:5000/api/users/admin/users/${userId}/reset-password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to reset password");
      alert("Password reset to default (cdc@123) and status set to Pending.");
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  // ✅ Delete User
  const handleDelete = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://115.242.156.230:5000/api/users/admin/users/${userId}`,
        { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to delete user");
      alert("User deleted successfully");
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  // Status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "inactive": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Role badge styling
  const getRoleBadgeClass = (role) => {
    switch (role?.toLowerCase()) {
      case "admin": return "bg-purple-100 text-purple-800";
      case "shift engineer": return "bg-blue-100 text-blue-800";
      case "manager": return "bg-orange-100 text-orange-800";
      case "viewer": return "bg-teal-100 text-teal-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-gray-200 p-4 sm:p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Manage all user accounts and permissions
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 mb-6 rounded">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm sm:text-base text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm sm:text-base divide-y divide-gray-200">
              <thead className="bg-gray-100 text-xs sm:text-sm">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">User</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Password Info</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase w-32 sm:w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    {/* User Info */}
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-800 text-xs sm:text-sm font-medium">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-sm sm:text-base font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-xs">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-[10px] sm:text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                        {user.role || 'N/A'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-[10px] sm:text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(user.status)}`}>
                        {user.status || 'N/A'}
                      </span>
                    </td>

                    {/* Password Info */}
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                      <div className="truncate max-w-[120px] sm:max-w-xs mb-1">
                        <span className="font-medium">Default:</span> {user.default_password || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Current:</span> {user.new_password ? '••••••' : 'Not set'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleResetPassword(user.id, `${user.first_name} ${user.last_name}`)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 sm:px-3 sm:py-1.5 rounded transition-colors flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          Reset
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, `${user.first_name} ${user.last_name}`)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 sm:px-3 sm:py-1.5 rounded transition-colors flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {users.length === 0 && !loading && (
            <div className="text-center py-10 sm:py-12">
              <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">Get started by creating a new user.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
