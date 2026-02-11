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
import { useRouter } from "next/navigation";
import { getPrimaryProjectImage } from "@/utils/projectUtils";
import { buildUploadUrl, getFullImageUrl } from "@/utils/common";
import { PROJECT_STATUS } from "@/constants/project_status";
import { useLanguage } from "@/contexts/LanguageContext";
import { ROLES } from "@/constants/roles";


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

  const status_id = project?.projects.project_status_id ?? null;

  const STATUS_LABELS = {
    [PROJECT_STATUS.PENDING]: "Pending",
    [PROJECT_STATUS.UPCOMING]: "Upcoming",
    [PROJECT_STATUS.RUNNING]: "Running",
  };

  const statusLabel = STATUS_LABELS[status_id] || "Unknown";

  const rawCoverImage =
    getPrimaryProjectImage(project.projects || project) || "";
  const coverImage = rawCoverImage
    ? buildUploadUrl(rawCoverImage)
    : buildUploadUrl("/uploads/general/noimage.jpeg");

  return {
    id: project.projects?.id ? `#${project.projects.id}` : project.projects?.project_code ?? "—",
    project_image: coverImage,
    projectName: project.projects?.project_name ?? "—",
    project_status_id: status_id,
    status: statusLabel,
    statusCode: status_id,
    expectedROI: formatPercent(project.projects?.expected_roi ?? project.projects?.roi),
    targetInvestment: formatCurrency(project.projects?.asking_price ?? project.projects?.asking_price),
    paybackPeriod: project.projects?.lease_term ? String(project.projects.lease_term) : "—",
    startDate: formatDateForDisplay(project.projects?.created_at),
    endDate: formatDateForDisplay(project.projects?.project_close_date),
    startDateTs: tsOrZero(project.projects?.created_at),
    endDateTs: tsOrZero(project.projects?.project_close_date),
    expectedGeneration: formatNumber(project.projects?.project_size),
    offtakerId: project.projects?.offtaker_id ?? null,
    product_code: project.projects?.product_code ?? '-',
    offtaker_name: project.projects?.offtaker?.full_name ?? '-',
    project_slug: project.projects?.project_slug ?? '',
  };
};

const ProjectTable = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { lang } = useLanguage();
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
        // Add offtaker_id param if user.id exists
        let apiUrl = "/api/investors?page=1&limit=50";
        if (user?.id) {
          apiUrl += `&userId=${user.id}`;
        }
        const response = await apiGet(apiUrl);
        if (response?.success) {
          const normalized = response.data.map(normalizeApiProject);
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
  }, [user?.id]);

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

  const getStatusColor = (status_id) => {
    switch (status_id) {
      case PROJECT_STATUS.PENDING:
        return "bg-gray-100 text-gray-700 border-gray-300";
      case PROJECT_STATUS.UPCOMING:
        return "bg-amber-100 text-amber-700 border-amber-300";
      case PROJECT_STATUS.RUNNING:
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const filteredProjects = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return allProjects.filter((project) => {
      // If user is an offtaker (role 3), only show their projects
      if (user && user.role === ROLES.OFFTAKER) {
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

              <div className="relative date-filter-dropdown">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                  {/* <div className="relative"> */}
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Location</span>
                  <ChevronDown className="w-4 h-4" />
                  {/* </div> */}
                </button>
              </div>

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
                        className={`w-full text-left px-3 py-2 text-sm ${statusFilter === "All"
                          ? "bg-slate-100"
                          : "hover:bg-gray-50"
                          }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter(PROJECT_STATUS.UPCOMING);
                          setStatusDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${statusFilter === PROJECT_STATUS.UPCOMING
                            ? "bg-slate-100"
                            : "hover:bg-gray-50"
                          }`}
                      >
                        {lang("home.exchangeHub.upcoming", "Upcoming")}
                      </button>

                      <button
                        onClick={() => {
                          setStatusFilter(PROJECT_STATUS.PENDING); // or UNDER_INSTALLATION if you rename
                          setStatusDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${statusFilter === PROJECT_STATUS.PENDING
                            ? "bg-slate-100"
                            : "hover:bg-gray-50"
                          }`}
                      >
                        {lang("projects.under_installation", "Under Installation")}
                      </button>

                    </div>
                  )}
                </div>
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
              <div className="text-center text-sm text-gray-500 py-8">Loading projects...</div>
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
                        src={project.project_image || getFullImageUrl("/uploads/general/noimage.jpeg")}
                        alt={project.projectName}
                        className="object-cover w-full h-full"
                      />
                      <span className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full shadow ${getStatusColor(project.status)}`}>{project.status}</span>
                    </div>
                    {/* Card content */}
                    <div className="p-3 md:p-4 flex flex-col flex-1">
                      <h2
                        className="text-lg font-bold text-slate-900 mb-1 w-[220px] h-10 leading-5 overflow-hidden break-words line-clamp-2"
                        title={project.projectName}
                      >
                        {project.projectName}
                      </h2>
                      <div className="text-xs text-gray-500 mb-1">ID: {project.product_code}</div>
                      <div className="text-sm text-gray-600 mb-2">Offtaker: <span className="font-medium">{project.offtaker_name}</span></div>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <div className="text-base font-bold text-slate-900">{project.targetInvestment}</div>
                          <div className="text-xs text-gray-500">Target Investment</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <div className="text-base font-bold text-amber-600">{project.expectedGeneration} kWh/year</div>
                          <div className="text-xs text-gray-500">Expected Generation</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <div className="text-base font-bold text-orange-600">{project.expectedROI}</div>
                          <div className="text-xs text-gray-500">Expected ROI</div>
                        </div>
                      </div>
                      {/* Payback/Lease info */}
                      <div className="flex flex-col md:flex-row gap-2 bg-gray-100 rounded-lg p-2 mb-3 text-center text-xs font-medium text-gray-700">
                        <div className="flex-1 md:border-r border-gray-300">
                          <div>Payback Period</div>
                          <div className="text-lg font-bold text-slate-900">{project.paybackPeriod}</div>
                        </div>
                        <div className="flex-1">
                          <div>Lease Term</div>
                          <div className="text-lg font-bold text-slate-900">15 years</div>
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div className="flex gap-2 mt-auto">
                        {/* <button className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors text-sm">Invest Early</button> */}
                        <a
                          className="flex-1 px-4 py-2 border border-gray-300 text-slate-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm flex items-center justify-center gap-1"
                          href={`/frontend/exchange-hub/${project.project_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          View Details
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500 py-8">No data available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTable;
