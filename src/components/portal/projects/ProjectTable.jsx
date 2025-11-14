"use client";
import React, { useState, useMemo, useEffect } from "react";
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
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const statusDictionary = {
  0: "Under Installation",
  1: "Upcoming",
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(number);
};

const formatNumber = (value) => {
  if (!value && value !== 0) return "—";
  const number = Number(value);
  return Number.isNaN(number) ? value : number.toLocaleString("en-US");
};

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isNaN(number) ? `${value}` : `${number}%`;
};

const normalizeApiProject = (project) => {
  const formatDateForDisplay = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    // show as DD/MM/YYYY
    return d.toLocaleDateString("en-GB");
  };

  const tsOrZero = (iso) => {
    if (!iso) return 0;
    const t = Date.parse(iso);
    return Number.isNaN(t) ? 0 : t;
  };

  const statusString =
    statusDictionary[project?.status] ?? project?.status ?? "Upcoming";
  // map display status to numeric filter codes: Upcoming => 1, Under Installation => 0
  const statusCode =
    statusString === "Upcoming"
      ? 1
      : statusString === "Under Installation"
      ? 0
      : project?.status ?? null;

  return {
    id: project?.id ? `#${project.id}` : project?.project_code ?? "—",
    projectName: project?.project_name ?? "—",
    status: statusString,
    statusCode,
    expectedROI: formatPercent(project?.expected_roi ?? project?.roi),
    targetInvestment: formatCurrency(
      project?.asking_price ?? project?.asking_price
    ),
    paybackPeriod: project?.lease_term ? String(project.lease_term) : "—",
    // formatted display strings
    startDate: formatDateForDisplay(project?.createdAt),
    endDate: formatDateForDisplay(project?.project_close_date),
    // timestamps for accurate sorting/comparison
    startDateTs: tsOrZero(project?.createdAt),
    endDateTs: tsOrZero(project?.project_close_date),
    expectedGeneration: formatNumber(project?.project_size),
    // Store offtaker_id for filtering (Prisma returns offtaker_id directly in the project object)
    offtakerId: project?.offtaker_id ?? null,
  };
};

const SolarProjectTable = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
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

  // pending values used inside dropdown inputs; only commit on Apply
  const [pendingDateStart, setPendingDateStart] = useState("");
  const [pendingDateEnd, setPendingDateEnd] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const response = await apiGet("/api/projects?page=1&limit=50");
        if (response?.success && Array.isArray(response?.data?.projects)) {
          console.log("Fetched Projects:", response.data.projects);
          const normalized = response.data.projects.map(normalizeApiProject);
          setAllProjects(normalized); // do not fallback to static data
        } else {
          // no projects returned -> keep empty
          setAllProjects([]);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        setFetchError("Unable to fetch live project data.");
        setAllProjects([]); // ensure no static data used
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateDropdownOpen && !event.target.closest('.date-filter-dropdown')) {
        setDateDropdownOpen(false);
      }
      if (statusDropdownOpen && !event.target.closest('.status-filter-dropdown')) {
        setStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dateDropdownOpen, statusDropdownOpen]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Upcoming":
        return "bg-amber-100 text-amber-700 border border-amber-300";
      case "Under Installation":
        return "bg-green-100 text-green-700 border border-green-300";
      case "Completed":
        return "bg-blue-100 text-blue-700 border border-blue-300";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  const filteredProjects = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return allProjects.filter((project) => {
      // If user is an offtaker (role 3), only show their projects
      if (user && user.role === 3) {
        if (project.offtakerId !== user.id) {
          return false;
        }
      }

      const combined = `${project.id} 
       ${project.projectName} 
       ${project.status} 
       ${project.expectedROI} 
       ${project.targetInvestment} 
       ${project.paybackPeriod} 
       ${project.startDate} 
       ${project.endDate} 
       ${project.expectedGeneration}`.toLowerCase();

      const matchesSearch = combined.includes(term);

      // statusFilter is 'All' or numeric code (1 = Upcoming, 0 = Under Installation)
      const matchesStatus =
        statusFilter === "All" || project.statusCode == statusFilter;

      // Date range filtering
      let matchesDateRange = true;
      if (dateFilterStart || dateFilterEnd) {
        // Parse filter dates to timestamps
        let startDateTs = null;
        let endDateTs = null;
        
        if (dateFilterStart) {
          const startDate = new Date(dateFilterStart);
          if (!isNaN(startDate.getTime())) {
            startDate.setHours(0, 0, 0, 0);
            startDateTs = startDate.getTime();
          }
        }
        
        if (dateFilterEnd) {
          const endDate = new Date(dateFilterEnd);
          if (!isNaN(endDate.getTime())) {
            endDate.setHours(23, 59, 59, 999);
            endDateTs = endDate.getTime();
          }
        }

        // Get project timestamps (only if valid, not 0)
        const projectStartTs = project.startDateTs && project.startDateTs > 0 ? project.startDateTs : null;
        const projectEndTs = project.endDateTs && project.endDateTs > 0 ? project.endDateTs : null;

        // If project has no valid dates, exclude it
        if (!projectStartTs && !projectEndTs) {
          matchesDateRange = false;
        } else {
          if (startDateTs && endDateTs) {
            // Both dates entered: show projects where BOTH start date AND end date fall within the range
            // Project start date should be >= filter start date AND project end date should be <= filter end date
            matchesDateRange =
              projectStartTs &&
              projectEndTs &&
              projectStartTs >= startDateTs &&
              
              projectEndTs <= endDateTs;
          } else if (startDateTs) {
            // Only start date entered: show projects where start date OR end date matches/falls on or after this date
            const filterDateStart = new Date(dateFilterStart).setHours(0, 0, 0, 0);
            const filterDateEnd = new Date(dateFilterStart).setHours(23, 59, 59, 999);
            matchesDateRange = 
              (projectStartTs && projectStartTs >= filterDateStart && projectStartTs <= filterDateEnd) || 
              (projectEndTs && projectEndTs >= filterDateStart && projectEndTs <= filterDateEnd);
          } else if (endDateTs) {
            // Only end date entered: show projects where start date OR end date matches/falls on or before this date
            const filterDateStart = new Date(dateFilterEnd).setHours(0, 0, 0, 0);
            const filterDateEnd = new Date(dateFilterEnd).setHours(23, 59, 59, 999);
            matchesDateRange = 
              (projectStartTs && projectStartTs >= filterDateStart && projectStartTs <= filterDateEnd) || 
              (projectEndTs && projectEndTs >= filterDateStart && projectEndTs <= filterDateEnd);
          }
        }
      }

      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [searchTerm, statusFilter, dateFilterStart, dateFilterEnd, allProjects, user]);

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

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortableHeader = ({ label, sortKey }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ChevronDown
          className={`w-3 h-3 transition-transform ${
            sortConfig.key === sortKey && sortConfig.direction === "desc"
              ? "rotate-180"
              : ""
          }`}
        />
      </div>
    </th>
  );

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
      }
    }
    return pages;
  };

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
                  placeholder="Search here..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                  style={{ backgroundColor: "#F5F5F5" }}
                />
              </div>

              <div className="relative date-filter-dropdown">
                <button
                  onClick={() =>
                    setDateDropdownOpen((v) => {
                      const next = !v;
                      // when opening, seed pending inputs with currently applied filters
                      if (!v) {
                        setPendingDateStart(dateFilterStart);
                        setPendingDateEnd(dateFilterEnd);
                      }
                      return next;
                    })
                  }
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  aria-haspopup="true"
                  aria-expanded={dateDropdownOpen}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Start Date - End Date
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {dateDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-20 p-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={pendingDateStart}
                          onChange={(e) => setPendingDateStart(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={pendingDateEnd}
                          onChange={(e) => setPendingDateEnd(e.target.value)}
                          min={pendingDateStart || undefined}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            // clear both pending and applied filters
                            setPendingDateStart("");
                            setPendingDateEnd("");
                            setDateFilterStart("");
                            setDateFilterEnd("");
                            setDateDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => {
                            // commit pending -> applied filters
                            setDateFilterStart(pendingDateStart);
                            setDateFilterEnd(pendingDateEnd);
                            setDateDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className="flex-1 px-3 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Location</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              <div className="relative status-filter-dropdown">
                <div className="relative">
                  <button
                    onClick={() => setStatusDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    aria-haspopup="true"
                    aria-expanded={statusDropdownOpen}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Status</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {statusDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                      <button
                        onClick={() => {
                          setStatusFilter("All");
                          setStatusDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          statusFilter === "All"
                            ? "bg-slate-100"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter(1);
                          setStatusDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          statusFilter == 1
                            ? "bg-slate-100"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        Upcoming
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter(0);
                          setStatusDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          statusFilter == 0
                            ? "bg-slate-100"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        Under Installation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {fetchError && (
              <div className="px-6 py-3 text-sm text-amber-700 bg-amber-50 border-b border-amber-100">
                {fetchError}
              </div>
            )}
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <SortableHeader label="ID" sortKey="id" />
                  <SortableHeader label="Project Name" sortKey="projectName" />
                  <SortableHeader label="Status" sortKey="status" />
                  <SortableHeader
                    label="Expected ROI (%)"
                    sortKey="expectedROI"
                  />
                  <SortableHeader
                    label="Target Investment Amount"
                    sortKey="targetInvestment"
                  />
                  <SortableHeader
                    label="Payback Period (Years)"
                    sortKey="paybackPeriod"
                  />
                  <SortableHeader label="Start Date" sortKey="startDate" />
                  <SortableHeader label="End Date" sortKey="endDate" />
                  <SortableHeader
                    label="Expected Generation (kWh/Year)"
                    sortKey="expectedGeneration"
                  />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      Loading projects...
                    </td>
                  </tr>
                ) : currentProjects.length ? (
                  currentProjects.map((project, idx) => (
                    <tr
                      key={project.id ?? idx}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {project.id}
                      </td>
                      <td className="px-4 py-4 text-sm text-black">
                        {project.projectName}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            project.status
                          )}`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {project.expectedROI}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {project.targetInvestment}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {project.paybackPeriod}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {project.startDate}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {project.endDate}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {project.expectedGeneration}
                      </td>
                      <td className="px-4 py-4">
                        <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                          <MoreHorizontal className="w-5 h-5 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 border rounded-lg text-sm text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                style={{ backgroundColor: "#102C41" }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">entries</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-black"
                style={{ backgroundColor: "#F5F5F5" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-slate-800 text-white"
                      : "border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-black"
                style={{ backgroundColor: "#F5F5F5" }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(endIndex, sortedProjects.length)} of{" "}
              {sortedProjects.length} entries
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarProjectTable;
