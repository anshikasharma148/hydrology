"use client";
import { useState, useEffect } from "react";
import {
  Menu,
  LogOut,
  Settings,
  BarChart3,
  TrendingUp,
  FileText,
  Cloud,
  AlertTriangle,
  Droplets,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user data", error);
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    // Clear user data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie =
      "adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Redirect to login and replace history
    window.location.replace("/auth/login");

    // Continuously trap navigation attempts
    setTimeout(() => {
      window.history.pushState(null, "", window.location.href);
      window.addEventListener("popstate", () => {
        window.history.pushState(null, "", window.location.href);
      });
    }, 200);
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { name: "AWS", href: "/aws", icon: Cloud },
    { name: "EWS", href: "/ews", icon: AlertTriangle },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Trends", href: "/trends", icon: TrendingUp },
  ];

  const fullName = user ? `${user.first_name} ${user.last_name || ""}`.trim() : "User";

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 py-3 px-6 flex items-center justify-between transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200"
          : "bg-white border-b border-gray-100"
      }`}
    >
      {/* Left Side - Logo/Branding */}
      <Link
        href="/dashboard"
        className="flex items-center hover:opacity-80 transition-opacity no-underline [&_*]:no-underline cursor-pointer"
      >
        <div className="h-12 w-12 rounded-lg flex items-center justify-center">
          <Droplets size={32} className="text-blue-600" />
        </div>
        <div className="ml-3">
          <h1 className="text-2xl font-bold text-gray-900">Hydrology</h1>
          <p className="text-xs text-gray-500 font-medium">Monitoring System</p>
        </div>
      </Link>

      {/* Center - Navigation Links (Desktop) */}
      <div className="hidden lg:flex items-center space-x-1 absolute left-1/2 transform -translate-x-1/2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-2 rounded-md text-lg font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={20} className="mr-2" />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Right Side - User Section */}
      <div className="flex items-center space-x-4">
        {/* User Greeting (Desktop) */}
        <div className="hidden md:block text-gray-700 text-base">
          Welcome,{" "}
          <span className="font-semibold text-blue-700">{fullName}</span>
        </div>

        {/* Logout Button (Desktop) */}
        <button
          onClick={handleLogout}
          className="hidden md:flex items-center space-x-2 px-4 py-2 
             text-white 
             bg-red-600/80 
             border border-red-600 
             backdrop-blur-sm 
             rounded-md 
             transition-all duration-300 
             hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/40"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Menu size={28} />
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-lg border-b border-gray-200 lg:hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-base font-medium text-gray-700">
              Welcome, {fullName}
            </p>
          </div>

          <div className="py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-lg font-medium ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={20} className="mr-3" />
                  {item.name}
                </Link>
              );
            })}

            <div className="border-t border-gray-200 mt-2 pt-2">
              <Link
                href="/settings"
                className="flex items-center px-4 py-3 text-base text-gray-700 hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                <Settings size={20} className="mr-3" />
                Settings
              </Link>

              <div className="flex justify-center mt-4">
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 
               text-white 
               bg-red-600/80 
               border border-red-600 
               backdrop-blur-sm 
               rounded-md 
               transition-all duration-300 
               hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/40"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
