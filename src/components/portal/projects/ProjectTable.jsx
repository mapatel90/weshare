"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  MapPin,
  Filter,
} from "lucide-react";
import { buildUploadUrl, formatEnergyUnit, getFullImageUrl, getTimeLeft } from "@/utils/common";
import { getPrimaryProjectImage } from "@/utils/projectUtils";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { PROJECT_STATUS } from "@/constants/project_status";
import { ROLES } from "@/constants/roles";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import MeterReading from "./sections/MeterReading";

const formatNumber = (value) => {
  if (!value && value !== 0) return "—";
  const number = Number(value);
  return Number.isNaN(number) ? value : number.toLocaleString("en-US");
};

const SolarProjectTable = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(""); // debounced search for API calls
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(12);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [statusFilter, setStatusFilter] = useState("All");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [dateFilterStart, setDateFilterStart] = useState("");
  const [dateFilterEnd, setDateFilterEnd] = useState("");
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  //   const [locationFilter, setLocationFilter] = useState('All');
  const [allProjects, setAllProjects] = useState([]); // start empty; no static fallback
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [selectedProjectForMeter, setSelectedProjectForMeter] = useState(null);

  // pending values used inside dropdown inputs; only commit on Apply
  const [pendingDateStart, setPendingDateStart] = useState("");
  const [pendingDateEnd, setPendingDateEnd] = useState("");
  const priceWithCurrency = useFormatPrice();

  // Debounce search term - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProjects = async (filters = {}) => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("limit", "50");

      if (user?.id) {
        params.append("offtaker_id", user.id);
      }

      // Apply server-side filters
      if (filters.search && filters.search.trim()) {
        params.append("search", filters.search.trim());
      }
      if (filters.status && filters.status !== "All") {
        params.append("project_status_id", filters.status);
      }
      if (filters.startDate) {
        params.append("start_date", filters.startDate);
      }
      if (filters.endDate) {
        params.append("end_date", filters.endDate);
      }

      const response = await apiGet(`/api/projects?${params.toString()}`);

      // response.data is the projects array
      if (response?.success && Array.isArray(response?.data)) {
        setAllProjects(response.data);
      } else {
        setAllProjects([]);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setFetchError("Unable to fetch live project data.");
      setAllProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch projects when filters change (server-side filtering)
  useEffect(() => {
    fetchProjects({
      search: debouncedSearch,
      status: statusFilter,
      startDate: dateFilterStart,
      endDate: dateFilterEnd,
    });
    setCurrentPage(1); // Reset to first page when filters change
  }, [user?.id, debouncedSearch, statusFilter, dateFilterStart, dateFilterEnd]);

  // Listen for projectCreated event to refresh the list
  useEffect(() => {
    const handleProjectCreated = () => {
      fetchProjects({
        search: debouncedSearch,
        status: statusFilter,
        startDate: dateFilterStart,
        endDate: dateFilterEnd,
      });
    };

    window.addEventListener("projectCreated", handleProjectCreated);
    return () => {
      window.removeEventListener("projectCreated", handleProjectCreated);
    };
  }, [user?.id, debouncedSearch, statusFilter, dateFilterStart, dateFilterEnd]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateDropdownOpen && !event.target.closest(".date-filter-dropdown")) {
        setDateDropdownOpen(false);
      }
      if (
        statusDropdownOpen &&
        !event.target.closest(".status-filter-dropdown")
      ) {
        setStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dateDropdownOpen, statusDropdownOpen]);

  const getStatusColor = (statusId) => {
    switch (statusId) {
      case PROJECT_STATUS.IN_PROGRESS:
        return "bg-gray-100 text-gray-700 border-gray-300";
      case PROJECT_STATUS.UPCOMING:
        return "bg-amber-100 text-amber-700 border-amber-300";
      case PROJECT_STATUS.RUNNING:
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };


  // Filtering is now done server-side, so we just filter by offtaker role if needed
  const filteredProjects = useMemo(() => {
    return allProjects.filter((project) => {
      // If user is an offtaker (role 3), only show their projects
      if (user && user.role === ROLES.OFFTAKER) {
        if (project.offtaker_id !== user.id) {
          return false;
        }
      }
      return true;
    });
  }, [allProjects, user]);

  const sortedProjects = useMemo(() => {
    let sorted = [...filteredProjects];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        const numberKeys = [
          "expectedROI",
          "paybackPeriod",
          "targetInvestment",
          "expectedGeneration",
        ];
        // handle number-like values
        if (numberKeys.includes(sortConfig.key)) {
          const clean = (val) => {
            if (typeof val === "number") return val;
            if (!val) return 0;
            return Number(String(val).replace(/[^\d.-]/g, "")) || 0;
          };
          aVal = clean(aVal);
          bVal = clean(bVal);
        }

        // handle date keys using the timestamp fields we added
        const dateKeys = ["startDate", "endDate"];
        if (dateKeys.includes(sortConfig.key)) {
          aVal = a[`${sortConfig.key}Ts`] ?? 0;
          bVal = b[`${sortConfig.key}Ts`] ?? 0;
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filteredProjects, sortConfig]);

  const totalPages = Math.ceil(sortedProjects.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentProjects = sortedProjects.slice(startIndex, endIndex);

  return (
    <div className="min-h-full from-slate-50 to-slate-100">
      <div className="mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header */}
          {/* <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Solar Projects Dashboard</h1>
            <p className="text-slate-300 text-sm mt-1">Manage and track all solar energy projects</p>
          </div> */}

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[250px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={lang("home.exchangeHub.searchPlaceholder", "Search here...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                  style={{ backgroundColor: "#F5F5F5" }}
                />
              </div>

              <div
                className="date-filter-dropdown"
                style={{ position: "relative", zIndex: dateDropdownOpen ? 30 : undefined }}
              >
                <button
                  type="button"
                  className="btn bg-black text-white"
                  onClick={() =>
                    setDateDropdownOpen((v) => {
                      const next = !v;
                      if (!v) {
                        setPendingDateStart(dateFilterStart);
                        setPendingDateEnd(dateFilterEnd);
                      }
                      return next;
                    })
                  }
                  aria-haspopup="true"
                  aria-expanded={dateDropdownOpen}
                  style={{ minWidth: "130px" }}
                >
                  <Calendar className="w-4 h-4" style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                  <span style={{ verticalAlign: "middle" }}>
                    {lang("projects.startDate", "Start Date")} - {lang("projects.endDate", "End Date")}
                  </span>
                  {" "}▼
                </button>

                {dateDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "100%",
                      zIndex: 40,
                      background: "#fff",
                      border: "2px solid rgba(246,166,35,0.2)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 16px rgba(246,166,35,0.2)",
                      minWidth: "280px",
                      overflow: "hidden",
                      marginTop: "4px",
                      padding: "16px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#b26800", marginBottom: "4px" }}>
                          {lang("projects.startDate", "Start Date")}
                        </label>
                        <input
                          type="date"
                          value={pendingDateStart}
                          onChange={(e) => setPendingDateStart(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1.5px solid rgba(246,166,35,0.35)",
                            borderRadius: "6px",
                            fontSize: "14px",
                            outline: "none",
                            color: "#333",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#b26800", marginBottom: "4px" }}>
                          {lang("projects.endDate", "End Date")}
                        </label>
                        <input
                          type="date"
                          value={pendingDateEnd}
                          onChange={(e) => setPendingDateEnd(e.target.value)}
                          min={pendingDateStart || undefined}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1.5px solid rgba(246,166,35,0.35)",
                            borderRadius: "6px",
                            fontSize: "14px",
                            outline: "none",
                            color: "#333",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingDateStart("");
                            setPendingDateEnd("");
                            setDateFilterStart("");
                            setDateFilterEnd("");
                            setDateDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            fontSize: "13px",
                            background: "#fff9f0",
                            color: "#b26800",
                            border: "1.5px solid rgba(246,166,35,0.35)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: 500,
                            transition: "background 0.15s",
                          }}
                        >
                          {lang("projects.clear", "Clear")}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDateFilterStart(pendingDateStart);
                            setDateFilterEnd(pendingDateEnd);
                            setDateDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            fontSize: "13px",
                            background: "#F6A623",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: 600,
                            transition: "background 0.15s",
                          }}
                        >
                          {lang("projects.apply", "Apply")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="date-filter-dropdown" style={{ position: "relative" }}>
                <button
                  type="button"
                  className="btn bg-black text-white"
                  style={{ minWidth: "120px" }}
                >
                  <MapPin className="w-4 h-4" style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                  <span style={{ verticalAlign: "middle" }}>{lang("leaseRequest.location", "Location")}</span>
                  {" "}▼
                </button>
              </div>

              <div
                className="status-filter-dropdown"
                style={{ position: "relative", zIndex: statusDropdownOpen ? 30 : undefined }}
              >
                <button
                  type="button"
                  className="btn bg-black text-white"
                  onClick={() => setStatusDropdownOpen((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={statusDropdownOpen}
                  style={{ minWidth: "130px" }}
                >
                  <Filter className="w-4 h-4" style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                  <span style={{ verticalAlign: "middle" }}>
                    {statusFilter === "All"
                      ? lang("projects.status", "Status")
                      : statusFilter === PROJECT_STATUS.IN_PROGRESS
                        ? lang("common.pending", "Pending")
                        : statusFilter === PROJECT_STATUS.UPCOMING
                          ? lang("project_status.upcoming", "Upcoming")
                          : statusFilter === PROJECT_STATUS.RUNNING
                            ? lang("project_status.running", "Running")
                            : lang("projects.status", "Status")
                    }
                  </span>
                  {" "}▼
                </button>

                {statusDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "100%",
                      zIndex: 40,
                      background: "#fff",
                      border: "2px solid rgba(246,166,35,0.2)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 16px rgba(246,166,35,0.2)",
                      minWidth: "160px",
                      overflow: "hidden",
                      marginTop: "4px",
                    }}
                  >
                    <ul style={{ listStyle: "none", margin: 0, padding: "4px 0" }}>
                      {[
                        { value: "All", label: lang("common.all", "All") },
                        { value: PROJECT_STATUS.IN_PROGRESS, label: lang("PROJECT_STATUS.IN_PROGRESS", "Pending") },
                        { value: PROJECT_STATUS.UPCOMING, label: lang("project_status.upcoming", "Upcoming") },
                        { value: PROJECT_STATUS.RUNNING, label: lang("project_status.running", "Running") },
                      ].map(({ value, label }) => {
                        const isActive = statusFilter === value;
                        return (
                          <li
                            key={value}
                            role="button"
                            tabIndex={0}
                            style={{
                              padding: "10px 16px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              background: isActive ? "#F6A623" : "#fff9f0",
                              fontWeight: isActive ? 600 : 400,
                              color: isActive ? "#fff" : "#b26800",
                              borderLeft: isActive ? "4px solid #e8920a" : "4px solid transparent",
                              transition: "background 0.15s",
                            }}
                            onClick={() => {
                              setStatusFilter(value);
                              setStatusDropdownOpen(false);
                              setCurrentPage(1);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                setStatusFilter(value);
                                setStatusDropdownOpen(false);
                                setCurrentPage(1);
                              }
                            }}
                          >
                            {label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card Grid */}
          <div className="px-6 py-4">
            {fetchError && (
              <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                {fetchError}
              </div>
            )}
            {isLoading ? (
              <div className="text-center text-sm text-gray-500 py-8">
                Loading projects...
              </div>
            ) : currentProjects.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
                {currentProjects.map((project, idx) => (
                  <div
                    key={project.id ?? idx}
                    className="bg-white rounded-xl shadow border border-gray-200 p-0 flex flex-col hover:shadow-lg transition-shadow overflow-hidden md:p-1 sm:p-0"
                  >
                    {/* Image and status badge */}
                    <div className="relative w-full h-36 sm:h-44 md:h-40 lg:h-36 xl:h-40 overflow-hidden">
                      <img
                        src={buildUploadUrl(getPrimaryProjectImage(project)) || "/uploads/general/noimage.jpeg"}
                        alt={project.project_name}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          // Handle AccessDenied, 404, or any image load error
                          e.target.onerror = null; // Prevent infinite loop
                          e.target.src = "/uploads/general/noimage.jpeg";
                        }}
                      />
                      <span
                        className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full shadow ${getStatusColor(
                          project.project_status_id
                        )}`}
                      >
                        {project.project_status?.name}
                      </span>
                    </div>
                    {/* Card content */}
                    <div className="p-3 md:p-4 flex flex-col flex-1">
                      <h2 className="text-lg font-bold text-slate-900 mb-1 w-full md:w-[220px] h-10 leading-5 overflow-hidden break-words line-clamp-2">
                        {project.project_name}
                      </h2>
                      <div className="text-xs text-gray-500 mb-1">
                        {lang("home.exchangeHub.id", "ID")}: {project.product_code}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {lang("home.exchangeHub.offtaker", "Offtaker")}:{" "}
                        <span className="font-medium">
                          {project.offtaker?.full_name}
                        </span>
                      </div>
                      {/* Ratings */}
                      {/* <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500 font-semibold">Ratings:</span>
                        <span className="flex gap-0.5">
                          {[...Array(4)].map((_, i) => (
                            <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><polygon points="10,1 12.59,7.36 19.51,7.36 13.96,11.64 16.55,18 10,13.72 3.45,18 6.04,11.64 0.49,7.36 7.41,7.36" /></svg>
                          ))}
                          <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><polygon points="10,1 12.59,7.36 19.51,7.36 13.96,11.64 16.55,18 10,13.72 3.45,18 6.04,11.64 0.49,7.36 7.41,7.36" /></svg>
                        </span>
                      </div> */}
                      {/* Stats boxes */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3 md:h-[95px]">
                        <div className="bg-gray-50 rounded-lg p-2 text-center" style={{ wordWrap: "break-word" }}>
                          <div className="text-base font-bold text-slate-900">
                            {priceWithCurrency(project.asking_price)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {lang("home.exchangeHub.targetInvestment", "Target Investment")}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <div className="text-base font-bold text-amber-600">
                            {formatEnergyUnit(project.total_energy)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {lang("home.exchangeHub.accumulativeGeneration", "Total Generation")}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <div className="text-base font-bold text-orange-600">
                            {project.project_status_id === PROJECT_STATUS.RUNNING ? (project.calculated_roi ? parseFloat(project.calculated_roi) : 0) : (project.estimated_roi ? parseFloat(project.estimated_roi) : 0)} %
                          </div>
                          <div className="text-xs text-gray-500">
                            {project.project_status_id === PROJECT_STATUS.RUNNING ? lang("home.exchangeHub.realtimeMonthlyROI", "ROI") : lang("home.exchangeHub.estimatedROI", "Expected ROI")}
                          </div>
                        </div>
                      </div>
                      {/* Payback/Lease info */}
                      <div className="flex flex-col md:flex-row gap-2 bg-gray-100 rounded-lg p-2 mb-3 text-center text-xs font-medium text-gray-700">
                        <div className="flex-1 md:border-r border-gray-300">
                          <div>{lang("home.exchangeHub.paybackPeriod", "Payback Period")}</div>
                          <div className="text-lg font-bold text-slate-900">
                            {project.payback_period}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div>{lang("home.exchangeHub.leaseTerm", "Lease Term")}</div>
                          <div className="text-lg font-bold text-slate-900">
                            {project.project_status_id === PROJECT_STATUS.UPCOMING ? project.lease_term + " " + lang("home.exchangeHub.years", "years") : getTimeLeft(project?.project_close_date)}
                          </div>
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div className="flex gap-2 mt-auto">
                        {/* <button className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors text-sm">Invest Early</button> */}
                        <a
                          className="flex-1 px-4 py-2 border border-gray-300 text-slate-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm flex items-center justify-center gap-1"
                          href={`/offtaker/projects/details/${project.id ?? ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {lang("home.exchangeHub.viewDetails", "View Details")}
                        </a>

                        {project.project_status_id === PROJECT_STATUS.RUNNING && (
                          <button
                            type="button"
                            className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors text-sm flex items-center justify-center gap-1"
                            onClick={() => setSelectedProjectForMeter(project)}
                          >
                            {lang("meter.meterReading", "Meter Reading")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500 py-8">
                {lang("common.noData", "No data available.")}
              </div>
            )}

            {/* Pagination */}
            {sortedProjects.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{lang("common.show", "Show")}</span>
                  <select
                    value={entriesPerPage}
                    onChange={(e) => {
                      setEntriesPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                    <option value={96}>96</option>
                  </select>
                  <span>{lang("common.entries", "entries")}</span>
                  <span className="ml-2">
                    ({lang("common.showing", "Showing")} {startIndex + 1}-{Math.min(endIndex, sortedProjects.length)} {lang("common.of", "of")} {sortedProjects.length})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first, last, current, and adjacent pages
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                      })
                      .map((page, idx, arr) => (
                        <React.Fragment key={page}>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                              ? "bg-slate-800 text-white"
                              : "hover:bg-gray-100 text-gray-700"
                              }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <MeterReading
        isOpen={!!selectedProjectForMeter}
        project={selectedProjectForMeter}
        onClose={() => setSelectedProjectForMeter(null)}
      />
    </div>
  );
};

export default SolarProjectTable;
