'use client'
import { useState, useEffect } from 'react';
import { format, subDays, parseISO, isWithinInterval } from 'date-fns';
import { 
  FiDownload, FiFilter, FiCalendar, FiClock, FiBarChart2, 
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight 
} from 'react-icons/fi';
import Navbar from 'components/Navbar';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const ReportsDashboard = () => {
  const router = useRouter();
  // Station data
  // <-- Per your request: only real EWS-supported stations kept (Option B)
  const ewsStations = [
    { name: "Vasudhara", slug: "vasudhara" },
    { name: "Mana", slug: "mana" }
  ];

  const awsStations = [
    { name: "Vasudhara", slug: "vasudhara" },
    { name: "Mana", slug: "mana" },
    { name: "Barrage (Lambagad)", slug: "vishnu_prayag" }
  ];

  // State management
  const [stationType, setStationType] = useState('AWS');
  const [selectedStation, setSelectedStation] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [statFilter, setStatFilter] = useState('instant');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ✅ Auth Guard
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/auth/login");
    }
  }, []);

  // Calculate pagination values
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredData.slice(startIndex, endIndex);

  // Detect color scheme preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mq.matches);
    const onChange = (e) => setIsDarkMode(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // Fetch data based on selected station and type
  useEffect(() => {
    if (!selectedStation) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        let apiUrl = "";

        if (stationType === "AWS") {
          // ✅ Use new single API for both Mana and Lambagad
          apiUrl = "http://115.242.156.230:5000/api/aws-live/all";
        } else {
          // ✅ Use real live EWS API (replaces old dummy /api/ews-all/...)
          apiUrl = "http://115.242.156.230:5000/api/ews-live/all";
        }

        const response = await fetch(apiUrl, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401) {
          window.location.replace("/auth/login");
          return;
        }

        if (!response.ok) throw new Error("Failed to fetch data");

        const result = await response.json();

        // Normalize result into an array of rows for the selected station
        let formattedData = [];

        // ------------------------
        // AWS: same mapping as before
        // ------------------------
        if (stationType === "AWS" && result?.data) {
          // incoming keys are like result.data.Mana or result.data.Lambagad
          const stationKey =
            selectedStation.toLowerCase().includes("mana")
              ? "Mana"
              : "Lambagad";

          const stationData = result.data?.[stationKey];

          if (Array.isArray(stationData)) {
            formattedData = stationData.map((item) => ({
              timestamp: item.timestamp,
              temperature: item.temperature,
              pressure: item.pressure,
              humidity: item.relative_humidity,
              windspeed: item.windspeed,
              winddirection: item.winddirection,
              rain: item.rain,
              precipitation: item.precipitation,
              bucket_weight: item.bucket_weight,
              PIR: item.PIR,
              avg_PIR: item.avg_PIR,
              DeviceID: item.DeviceID,
              StationID: item.StationID,
              UID: item.UID,
            }));
          }
        }

        // ------------------------
        // EWS: use result.data.Mana or result.data.Vasudhara
        // ------------------------
        if (stationType === "EWS" && result?.data) {
          const stationKey =
            selectedStation.toLowerCase().includes("mana")
              ? "Mana"
              : "Vasudhara";

          const stationData = result.data?.[stationKey];
          const isVasudhara = stationKey === "Vasudhara";

          if (Array.isArray(stationData)) {
            formattedData = stationData.map((item) => {
              const baseData = {
              timestamp: item.timestamp,
              surface_velocity: item.surface_velocity,
              SNR: item.SNR,
              avg_surface_velocity: item.avg_surface_velocity,
              water_dist_sensor: item.water_dist_sensor,
              water_level: item.water_level,
              water_discharge: item.water_discharge,
              tilt_angle: item.tilt_angle,
              flow_direction: item.flow_direction,
              DeviceID: item.DeviceID,
              StationID: item.StationID,
              UID: item.UID,
              };

              // Add Vasudhara-specific fields
              if (isVasudhara) {
                baseData.internal_temperature = item.internal_temperature;
                baseData.charge_current = item.charge_current;
                baseData.absorbed_current = item.observed_current;
                baseData.battery_voltage = item.battery_voltage;
                baseData.solar_panel_tracking = item.solar_panel_tracking;
              }

              return baseData;
            });
          } else if (Array.isArray(result)) {
            // fallback if API returns array directly (unlikely with provided sample)
            formattedData = result;
          }
        }

        // If nothing matched above, and result itself is an array, use it
        if (!formattedData.length && Array.isArray(result)) {
          formattedData = result;
        }

        setData(formattedData);
        setFilteredData(formattedData);
        setCurrentPage(1);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedStation, stationType]);

  // Apply filters when any filter changes
  useEffect(() => {
    if (!data.length) return;

    let filtered = [...data];
    
    // Apply date filter
    const now = new Date();
    let startDate, endDate;
    
    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'yesterday':
        startDate = subDays(new Date(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = subDays(new Date(), 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case '3days':
        startDate = subDays(new Date(), 3);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        break;
      case '7days':
        startDate = subDays(new Date(), 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        break;
      case '15days':
        startDate = subDays(new Date(), 15);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        break;
      case '1month':
        startDate = subDays(new Date(), 30);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      default:
        break;
    }
    
    if (dateFilter !== 'all' && startDate && endDate) {
      filtered = filtered.filter(item => {
        if (!item.timestamp) return false;
        try {
          const itemDate = parseISO(item.timestamp);
          return isWithinInterval(itemDate, { start: startDate, end: endDate });
        } catch {
          return false;
        }
      });
    }
    
    if (statFilter !== 'instant') {
      console.log(`Applying ${statFilter} filter would require additional processing`);
    }
    
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [data, dateFilter, statFilter, customStartDate, customEndDate]);

  // Handle CSV download
  const handleDownloadCSV = () => {
    if (!filteredData.length) return;
    
    const headers = Object.keys(filteredData[0]).join(',');
    const csvData = filteredData.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${csvData}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${stationType}_${selectedStation}_${dateFilter}_report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!filteredData.length) return;

    try {
      setPdfLoading(true);

      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      // Force landscape
      const doc = new jsPDF({ orientation: 'landscape' });

      // --- Step 1: Reorder headers (timestamp first) ---
      let headers = Object.keys(filteredData[0]);
      if (headers.includes('timestamp')) {
        headers = ['timestamp', ...headers.filter(h => h !== 'timestamp')];
      }

      // --- Step 2: Prepare table data ---
      const tableHead = [headers.map(h => h.toUpperCase())];
      const tableBody = filteredData.map(row =>
        headers.map(h => {
          let val = row[h];
          if (h === 'timestamp' && val) {
            try {
              val = format(parseISO(val), 'yyyy-MM-dd HH:mm:ss'); // full date + time
            } catch {}
          }
          if (val === null || val === undefined) val = 'N/A';
          return String(val);
        })
      );

      // --- Step 3: Title ---
      const stationName = ewsStations.concat(awsStations).find(s => s.slug === selectedStation)?.name || selectedStation;
      doc.setFontSize(16).setFont(undefined, 'bold');
      doc.text(`${stationType} Report - ${stationName}`, doc.internal.pageSize.width / 2, 15, { align: 'center' });

      doc.setFontSize(10).setFont(undefined, 'normal');
      doc.text(
        `Date Range: ${dateFilter} | Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
        doc.internal.pageSize.width / 2,
        22,
        { align: 'center' }
      );

      // --- Step 4: AutoTable with proper borders ---
      autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 30,
        styles: {
          fontSize: 7,
          cellPadding: 2,
          halign: 'center',
          valign: 'middle'
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        theme: 'grid', // adds table borders
        tableWidth: 'auto',
      });

      // --- Step 5: Page numbers ---
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
      }

      // --- Save PDF ---
      doc.save(`${stationType}_${selectedStation}_${dateFilter}_report.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Error generating PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  // Pagination functions
  const goToPage = (page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Generate page numbers for pagination controls
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        end = 4;
      }
      
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }
      
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  // ---------------------------
  // RENDER: NO UI CHANGES FROM YOUR ORIGINAL FILE
  // ---------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6">
      <Navbar/>
      
      {/* Back Button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="fixed top-16 sm:top-20 left-3 sm:left-4 md:left-6 p-2.5 sm:p-3 rounded-xl shadow-xl z-40 transition-all hover:scale-110 bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-indigo-50 text-slate-800 border-2 border-gray-200 hover:border-blue-300"
        title="Go back to Dashboard"
      >
        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <div className="max-w-7xl mx-auto">
        <div className="mb-8 mt-6">
          <div className="overflow-x-auto w-full px-4 sm:px-0">
            <div className="flex items-center justify-center pt-8 sm:pt-20 relative z-20 mb-6">
              <div className="text-center">
                <h1 className="flex flex-wrap items-end justify-center leading-tight text-center mb-3">
                  <span className="text-4xl sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  W
                </span>
                  <span className="ml-1 text-xl sm:text-3xl md:text-4xl font-bold text-gray-800">eather</span>

                  <span className="ml-3 text-4xl sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  S
                </span>
                  <span className="ml-1 text-xl sm:text-3xl md:text-4xl font-bold text-gray-800">tation</span>

                  <span className="ml-3 text-4xl sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  R
                </span>
                  <span className="ml-1 text-xl sm:text-3xl md:text-4xl font-bold text-gray-800">eports</span>
              </h1>
                <p className="mx-auto text-center mt-3 text-gray-600 text-sm sm:text-base max-w-2xl font-medium">
                  Access and download comprehensive data reports from AWS and EWS monitoring stations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-5 sm:p-7 mb-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <FiFilter className="text-white text-xl" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                Filters & Export
            </h2>
            </div>
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 justify-center sm:justify-end">
              <button
                onClick={handleDownloadCSV}
                disabled={!filteredData.length || loading}
                className={`w-full sm:w-auto flex items-center justify-center text-sm sm:text-base px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 transform ${
                  !filteredData.length || loading
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer"
                }`}
              >
                <FiDownload className="mr-2 text-lg" />
                {loading ? "Loading..." : "Download CSV"}
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={!filteredData.length || pdfLoading}
                className={`w-full sm:w-auto flex items-center justify-center text-sm sm:text-base px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 transform ${
                  !filteredData.length || pdfLoading
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer"
                }`}
              >
                <FiDownload className="mr-2 text-lg" />
                {pdfLoading ? "Generating PDF..." : "Download PDF"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Station Type Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Station Type</label>
              <select
                value={stationType}
                onChange={(e) => {
                  setStationType(e.target.value);
                  setSelectedStation('');
                }}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <option value="AWS">AWS</option>
                <option value="EWS">EWS</option>
              </select>
            </div>

            {/* Station Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Station</label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <option value="">Select a station</option>
                {(stationType === 'AWS' ? awsStations : ewsStations).map(station => (
                  <option key={station.slug} value={station.slug}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiCalendar className="text-blue-500" /> Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="3days">Last 3 Days</option>
                <option value="7days">Last 7 Days</option>
                <option value="15days">Last 15 Days</option>
                <option value="1month">Last 1 Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Stat Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiBarChart2 className="text-indigo-500" /> Data Type
              </label>
              <select
                value={statFilter}
                onChange={(e) => setStatFilter(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <option value="instant">Instant Value</option>
                <option value="average">Average</option>
                <option value="min">Minimum (24h)</option>
                <option value="max">Maximum (24h)</option>
                <option value="median">Median</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                />
              </div>
            </div>
          )}
        </div>

        {/* Data Display */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-5 sm:p-7 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                {selectedStation ? (
                  <span>
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {stationType}
                    </span>
                    {' '}: {ewsStations.concat(awsStations).find(s => s.slug === selectedStation)?.name}
                  </span>
                ) : (
                  <span className="text-gray-500">Select a station to view data</span>
                )}
            </h2>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-200">
              <FiClock className="text-blue-600" /> 
              <span className="text-sm font-semibold text-blue-700">
              Showing {totalItems === 0 ? 0 : startIndex + 1}-{endIndex} of {totalItems} records
              </span>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Loading data...</p>
            </div>
          )}

          {error && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl p-5 mb-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                  <svg className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && currentItems.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-inner">
                <table className="min-w-full divide-y divide-gray-200 text-sm sm:text-base">
                  <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                    <tr>
                      {Object.keys(currentItems[0]).map(key => (
                        <th key={key} className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((row, index) => (
                      <tr 
                        key={index} 
                        className={`transition-all duration-150 hover:bg-blue-50 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="px-4 sm:px-6 py-3 sm:py-4 whitespace-normal sm:whitespace-nowrap text-sm font-medium text-gray-700">
                            {typeof value === 'object' ? JSON.stringify(value) : (value ?? '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4">
                <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start gap-3">
                  <span className="text-sm font-semibold text-gray-700">
                    Rows per page:
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border-2 border-gray-200 rounded-xl p-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-blue-300 transition-all duration-200 shadow-sm"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
                 
                <div className="flex items-center space-x-1 bg-gray-50 p-2 rounded-xl border border-gray-200">
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentPage === 1 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-blue-100 hover:text-blue-600 cursor-pointer'
                    }`}
                  >
                    <FiChevronsLeft size={18} />
                  </button>
                   
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentPage === 1 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-blue-100 hover:text-blue-600 cursor-pointer'
                    }`}
                  >
                    <FiChevronLeft size={18} />
                  </button>
                   
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' ? goToPage(page) : null}
                      className={`w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm flex items-center justify-center rounded-lg font-semibold transition-all duration-200 ${
                        page === currentPage 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-110' 
                          : typeof page === 'number' 
                            ? 'text-gray-700 hover:bg-blue-100 hover:text-blue-600 cursor-pointer' 
                            : 'text-gray-500 cursor-default'
                      }`}
                      disabled={page === '...'}
                    >
                      {page}
                    </button>
                  ))}
                   
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentPage === totalPages 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-blue-100 hover:text-blue-600 cursor-pointer'
                    }`}
                  >
                    <FiChevronRight size={18} />
                  </button>
                   
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentPage === totalPages 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-blue-100 hover:text-blue-600 cursor-pointer'
                    }`}
                  >
                    <FiChevronsRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}

          {!loading && !error && selectedStation && filteredData.length === 0 && (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">No data found</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Try adjusting your filters to see more results.
              </p>
            </div>
          )}

          {!loading && !error && !selectedStation && (
            <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-300">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2M7 7h10" />
              </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Select a station</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Choose a station from the filters above to view its data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
  
export default ReportsDashboard;
