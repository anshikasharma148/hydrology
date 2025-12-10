"use client";
import { useState } from "react";
import {
  ChevronLeft,
  Server,
  Cloud,
  FilePlus,
  FolderOpen,
  BarChart,
  ChevronDown,
  MapPin,
} from "lucide-react"; // ✅ Import icons

export default function Sidebar({ isOpen, toggleSidebar, openForm }) {
  const [awsOpen, setAwsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(false);

  return (
    <div
      className={`fixed top-0 left-0 h-full w-48 bg-white text-[#1E1B29] shadow-lg transform ${
        isOpen ? "translate-x-0" : "-translate-x-64"
      } transition-transform duration-300 ease-in-out`}
    >
      {/* ✅ Back Arrow for Closing Sidebar */}
      <div className="flex justify-start p-4">
        <button onClick={toggleSidebar} className="text-[#1E1B29] hover:text-purple-600">
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* ✅ Sidebar Menu */}
      <ul className="space-y-2 px-4">
        {/* ✅ EWS */}
        <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-100 hover:text-purple-600 cursor-pointer">
          <Server size={18} />
          <span>EWS</span>
        </li>

        {/* ✅ AWS */}
        <li className="flex flex-col">
          <div
            className="flex items-center justify-between p-2 rounded-lg hover:bg-purple-100 hover:text-purple-600 cursor-pointer"
            onClick={() => setAwsOpen(!awsOpen)}
          >
            <div className="flex items-center gap-3">
              <Cloud size={18} />
              <span>AWS</span>
            </div>
            <ChevronDown size={18} className={`${awsOpen ? "rotate-180" : ""} transition-transform`} />
          </div>

          {/* ✅ AWS Dropdown */}
          {awsOpen && (
            <ul className="ml-4 bg-gray-100 w-full rounded-lg shadow-md">
              <li
                className="p-2 flex items-center gap-3 hover:bg-purple-200 hover:text-purple-700 cursor-pointer"
                onClick={openForm} // ✅ Open AddStationForm
              >
                <FilePlus size={18} />
                <span>Create</span>
              </li>

              {/* ✅ Open (Triggers Station Submenu) */}
              <li
                className="p-2 flex items-center justify-between hover:bg-purple-200 hover:text-purple-700 cursor-pointer"
                onClick={() => setOpenSubmenu(!openSubmenu)}
              >
                <div className="flex items-center gap-3">
                  <FolderOpen size={18} />
                  <span>Open</span>
                </div>
                <ChevronDown size={18} className={`${openSubmenu ? "rotate-180" : ""} transition-transform`} />
              </li>

              {/* ✅ Station Submenu */}
              {openSubmenu && (
                <ul className="ml-6 bg-gray-300 w-full rounded-lg shadow-md">
                  <li className="p-2 flex items-center gap-3 hover:bg-purple-300 hover:text-purple-800 cursor-pointer">
                    <MapPin size={18} />
                    <span>Vishnu Prayag</span>
                  </li>
                  <li className="p-2 flex items-center gap-3 hover:bg-purple-300 hover:text-purple-800 cursor-pointer">
                    <MapPin size={18} />
                    <span>Another Station</span>
                  </li>
                  {/* ✅ Add More Stations Here */}
                </ul>
              )}

              <li className="p-2 flex items-center gap-3 hover:bg-purple-200 hover:text-purple-700 cursor-pointer">
                <BarChart size={18} />
                <span>Trend</span>
              </li>
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
}
