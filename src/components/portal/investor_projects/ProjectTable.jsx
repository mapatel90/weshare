"use client";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet } from "@/lib/api";
import { Search, Calendar, ChevronDown, MapPin, Filter } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";

const ProjectTable = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilterStart, setDateFilterStart] = useState("");
  const [dateFilterEnd, setDateFilterEnd] = useState("");
  const [pendingDateStart, setPendingDateStart] = useState("");
  const [pendingDateEnd, setPendingDateEnd] = useState("");
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  // For pagination reset
  const setCurrentPage = setPage;

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page,
          limit,
          userId: user.id,
          search: searchTerm,
          status: statusFilter !== "All" ? statusFilter : "",
          startDate: dateFilterStart,
          endDate: dateFilterEnd,
        });
        const res = await apiGet('/api/investors?' + params.toString());
        if (res.success) {
          setProjects(res.data);
          setTotal(res.total);
        } else {
          setError(res.message || 'Failed to fetch projects');
        }
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    };
    fetchProjects();
  }, [page, limit, searchTerm, statusFilter, dateFilterStart, dateFilterEnd, user.id]);

  return (
    <div className="min-h-full from-slate-50 to-slate-100">
      <div className="mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
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
                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                 aria-haspopup="true"
                    aria-expanded={statusDropdownOpen}
                >
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
                          setStatusFilter(1);
                          setStatusDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${statusFilter == 1
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
                        className={`w-full text-left px-3 py-2 text-sm ${statusFilter == 0
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
          {loading && <div className="p-4">Loading...</div>}
          {error && <div className="p-4 text-red-500">{error}</div>}
          <div className="flex flex-wrap gap-6 p-6">
            {projects.length === 0 && !loading && (
              <div className="text-gray-500 text-center w-full">No projects found.</div>
            )}
            {projects.map((data, idx) => (
              <div
                key={data.project.id ?? idx}
                className="bg-white rounded-xl shadow border border-gray-200 p-0 flex flex-col hover:shadow-lg transition-shadow overflow-hidden md:p-1 sm:p-0"
              >
                {/* Image and status badge */}
                <div className="relative w-full h-36 sm:h-44 md:h-40 lg:h-36 xl:h-40 overflow-hidden">
                  <img
                    src={data.project.project_image || "/images/general/solar-card.jpg"}
                    alt={data.project.project_name}
                    className="object-cover w-full h-full"
                  />
                  <span className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full shadow`}>{data.project.status}</span>
                </div>
                {/* Card content */}
                <div className="p-3 md:p-4 flex flex-col flex-1">
                  <h2 className="text-lg font-bold text-slate-900 mb-1">{data.project.project_name}</h2>
                  <div className="text-xs text-gray-500 mb-1">ID: {data.project.product_code}</div>
                  <div className="text-sm text-gray-600 mb-2">Offtaker: <span className="font-medium">{data.project.offtaker?.fullName}</span></div>
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-base font-bold text-slate-900">{data.project.asking_price}</div>
                      <div className="text-xs text-gray-500">Target Investment</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-base font-bold text-amber-600">{data.project.project_size} kWh/year</div>
                      <div className="text-xs text-gray-500">Expected Generation</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-base font-bold text-orange-600">{data.project.expected_roi ? `${data.project.expected_roi}%` : "N/A"}</div>
                      <div className="text-xs text-gray-500">Expected ROI</div>
                    </div>
                  </div>
                  {/* Payback/Lease info */}
                  <div className="flex flex-col md:flex-row gap-2 bg-gray-100 rounded-lg p-2 mb-3 text-center text-xs font-medium text-gray-700">
                    <div className="flex-1 md:border-r border-gray-300">
                      <div>Payback Period</div>
                      <div className="text-lg font-bold text-slate-900">{data.project.lease_term ? `${data.project.lease_term} years` : "N/A"}</div>
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
                      href={`/exchange-hub/${data.project.project_slug}`}
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
        </div>
      </div>
    </div>
  );
};

export default ProjectTable;
