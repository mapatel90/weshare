"use client";
import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Table from "@/components/shared/table/Table";
import { Autocomplete, TextField } from "@mui/material";
import { PROJECT_STATUS } from "@/constants/project_status";
import { ROLES } from "@/constants/roles";
import { formatShort } from "@/utils/common";
import { showErrorToast } from "@/utils/topTost";

const RoiReports = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const PAGE_SIZE = 50;
  const [reportsData, setReportsData] = useState([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState(null);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });
  const [projectList, setProjectList] = useState([]);
  const [appliedProjectFilter, setAppliedProjectFilter] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const isSubmitDisabled = !projectFilter;
  const isAdminUser = [ROLES.SUPER_ADMIN, ROLES.STAFF_ADMIN].includes(user?.role);

  // Fetch Project List
  const fetchProjectList = async () => {
    try {
      setLoading(true);
      setError(null);
      if (user.role === ROLES.OFFTAKER) {
        const res_offtaker = await apiPost("/api/projects/dropdown/project", {
          offtaker_id: user?.id,
          project_status_id: PROJECT_STATUS.RUNNING
        });
        if (res_offtaker && res_offtaker.success) {
          setProjectList(res_offtaker.data);
        }
      } else if (user.role === ROLES.INVESTOR) {
        const res_investor = await apiPost("/api/projects/dropdown/project", {
          investor_id: user?.id,
          project_status_id: PROJECT_STATUS.RUNNING
        });
        if (res_investor && res_investor.success) {
          setProjectList(res_investor.data);
        }
      } else {
        const res = await apiPost("/api/projects/dropdown/project", {project_status_id: PROJECT_STATUS.RUNNING});
        if (res && res.success) {
          setProjectList(res.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setProjectList([]);
    } finally {
      setLoading(false);
    }
  };

  // 2) Fetch reports with server-side filters (like SavingReports)
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        limit: String(pageSize),
      });

      if (appliedProjectFilter) params.append("projectId", appliedProjectFilter);
      if (appliedSearchTerm) params.append("search", appliedSearchTerm);
      if (appliedProjectFilter) {

        const res = await apiGet(`/api/projects/report/roi-data?${params.toString()}`);
        const items = Array.isArray(res?.data) ? res.data : [];

        const mappedData = items.map((item, idx) => ({
          id: item.id ?? idx,
          projectId: item.project_id ?? null,
          projectName: item.project_name || `Project ${item.project_id ?? ""}`,
          askingPrice: item.asking_price || "0",
          month_energy: item.month_energy || "0",
          revenue: item.revenue || "0",
          monthRevenue: item.month_revenue || "0",
          monthRoi: item.month_roi || "0",
          month: item.month || "",
          weshare_price: item.weshare_price || "0",
          capexValue: item.capexValue || "0",
        }));

        setReportsData(mappedData);

        setProjectList(res?.projectList);

        // Set pagination from server response
        if (res.pagination) {
          setPagination({
            page: res.pagination.page || pageIndex + 1,
            limit: res.pagination.limit || PAGE_SIZE,
            total: res.pagination.total || mappedData.length,
            pages: res.pagination.pages || Math.max(1, Math.ceil(mappedData.length / PAGE_SIZE)),
          });
        } else {
          // Fallback if no pagination in response
          setPagination({
            page: pageIndex + 1,
            limit: PAGE_SIZE,
            total: mappedData.length,
            pages: Math.max(1, Math.ceil(mappedData.length / PAGE_SIZE)),
          });
        }
      }
    } catch (err) {
      setError(err?.message || "Failed to load reports");
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    fetchReports();

    const interval = setInterval(() => {
      fetchReports();
    }, 120000);

    return () => clearInterval(interval);
  }, [appliedProjectFilter, appliedSearchTerm, pageIndex, pageSize]);

  // Fetch project list on component mount
  useEffect(() => {
    if (user?.id) {
      fetchProjectList();
    }
  }, [user?.id]);

  // 3) Handle submit to apply filters
  const handleSubmit = () => {
    if (!projectFilter) {
      alert(lang("response_messages.please_select_project", "Please select Project"));
      return;
    }

    // Clear old data and reset loading state when submitting new filters
    setReportsData([]);
    setHasLoadedOnce(false);
    setLoading(true);
    setPageIndex(0);
    setSearchTerm('');
    setAppliedProjectFilter(projectFilter);
    setAppliedSearchTerm(searchTerm);
  };

  // 4) Server-side filtered data
  const filteredData = reportsData;

  const handleSearchChange = (value) => {
    setPageIndex(0);
    setSearchTerm(value);
  };

  const handlePaginationChange = (nextPagination) => {
    const updated = typeof nextPagination === "function"
      ? nextPagination({ pageIndex, pageSize })
      : nextPagination;
    setPageIndex(updated.pageIndex ?? 0);
    if (updated.pageSize && updated.pageSize !== pageSize) {
      setPageSize(updated.pageSize);
      setPageIndex(0);
    }
    setPagination(updated);
  };

  // Format date helper
  const formatDateDDMMYYYY = (raw) => {
    if (!raw) return "";
    const datePart = String(raw).trim().split(/[ T]/)[0];
    const [y, m, d] = datePart.split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
    return "";
  };

  const handleDownloadCSV = async () => {
    try {
      // Require applied filters like the table
      if (!appliedProjectFilter) {
        showErrorToast(lang("common.pleaseSelectProject", "Please select project after downloading CSV"));
        return;
      }

      setLoading(true);

      // Build params to fetch all data for CSV export
      const params = new URLSearchParams({
        page: "1",
        limit: "1000000", // Large limit to get all data
      });

      if (appliedProjectFilter) params.append("projectId", appliedProjectFilter);
      if (appliedSearchTerm) params.append("search", appliedSearchTerm);

      // Use the same ROI report API as the table
      const res = await apiGet(`/api/projects/report/roi-data?${params.toString()}`);
      const items = Array.isArray(res?.data) ? res.data : [];

      const csvData = items.map((item, idx) => ({
        projectName: item.project_name || `Project ${item.project_id ?? idx ?? ""}`,
        month: item.month || "",
        askingPrice: item.asking_price || "0",
        capexValue: item.capexValue ?? item.capex_value ?? "0",
        monthEnergy: item.month_energy || "0",
        wesharePrice: item.weshare_price || "0",
        monthRevenue: item.month_revenue || "0",
        monthRoi: item.month_roi || "0",
      }));

      // Define CSV headers
      const headers = [
        lang("projects.projectName", "Project Name"),
        lang("reports.month", "Month"),
        lang("projects.askingPrice", "Asking Price"),
        lang("projects.capexValue", "Capex Value"),
        lang("reports.monthEnergy", "Energy"),
        lang("projects.wesharePrice", "Weshare Price (kWh)"),
        lang("reports.monthRevenue", "Month Revenue"),
        lang("reports.monthRoi", "ROI"),
      ];

      // Convert data to CSV rows
      const csvRows = [
        headers.join(","), // Header row
        ...csvData.map((row) => {
          const values = [
            `"${(row.projectName || "-").replace(/"/g, '""')}"`,
            `"${(row.month || "-").replace(/"/g, '""')}"`,
            row.askingPrice ?? "0",
            row.capexValue ?? "0",
            row.monthEnergy ?? "0",
            row.wesharePrice ?? "0",
            row.monthRevenue ?? "0",
            `${parseFloat(row.monthRoi || 0).toFixed(2)}%`,
          ];
          return values.join(",");
        }),
      ];

      // Create CSV content
      const csvContent = csvRows.join("\n");

      // Create blob and download
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      // Generate filename
      let filename = "roi_reports";
      if (appliedProjectFilter) {
        const project = projectList.find((p) => String(p.id ?? p.project_id) === String(appliedProjectFilter));
        if (project) filename += `_${project.project_name || appliedProjectFilter}`;
      }
      filename += `_${new Date().toISOString().split("T")[0]}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("CSV download failed", err);
      setError(err?.message || "Failed to download CSV");
    } finally {
      setLoading(false);
    }
  };

  // Format currency helper
  const formatCurrency = (value) => {
    if (!value || value === "0") return "0.00";
    const num = parseFloat(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  // Format percentage helper
  const formatPercentage = (value) => {
    if (!value || value === "0") return "0.00%";
    const num = parseFloat(value);
    return isNaN(num) ? "0.00%" : `${num.toFixed(2)}%`;
  };

  // Columns definition
  const columns = useMemo(
    () => [
      {
        accessorKey: "projectName",
        header: () => lang("projects.projectName", "Project Name"),
      },
      {
        accessorKey: "month",
        header: () => lang("reports.month", "Month"),
      },
      {
        accessorKey: "askingPrice",
        header: () => lang("projects.askingPrice", "Asking Price"),
        cell: ({ row }) => formatCurrency(row.original.askingPrice),
      },
      {
        accessorKey: "capexValue",
        header: () => lang("projects.capexValue", "Capex Value"),
        cell: ({ row }) => {
          const value = parseFloat(row.original.capexValue);
          return isNaN(value) ? "0.00" : value.toFixed(2);
        },
      },
      {
        accessorKey: "month_energy",
        header: () => lang("reports.monthEnergy", "Energy"),
        cell: ({ row }) => formatShort(row.original.month_energy),
      },
      {
        accessorKey: "weshare_price",
        header: () => lang("projects.wesharePrice", "Weshare Price (kWh)"),
        cell: ({ row }) => row.original.weshare_price,
      },

      {
        accessorKey: "monthRevenue",
        header: () => lang("reports.monthRevenue", "Revenue"),
        cell: ({ row }) => row.original.monthRevenue,
      },
      {
        accessorKey: "monthRoi",
        header: () => lang("reports.monthRoi", "ROI"),
        cell: ({ row }) => (formatPercentage(row.original.monthRoi)),
      }
    ],
    [lang]
  );

  return (
    <div
      className="p-6 bg-white rounded-3xl shadow-md relative"
      style={isAdminUser ? { padding: "24px", backgroundColor: "#fff", borderRadius: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", position: "relative" } : undefined}
    >
      {/* Fullscreen CSV Download Loader */}
      {loading && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-3xl"
          style={isAdminUser ? { position: "fixed", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1050 } : undefined}
        >
          <div
            className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-lg"
            style={isAdminUser ? { backgroundColor: "#fff", borderRadius: "8px", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" } : undefined}
          >
            <div
              className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
              style={isAdminUser ? { width: "48px", height: "48px", border: "4px solid #bfdbfe", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 1s linear infinite" } : undefined}
            ></div>
            <p className="text-gray-700 font-medium" style={isAdminUser ? { color: "#374151", fontWeight: 500, margin: 0 } : undefined}>{lang("common.downloading", "Downloading...")}</p>
          </div>
        </div>
      )}
      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 mt-4 w-full flex-wrap">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Autocomplete
            size="small"
            options={projectList}
            value={
              projectList.find(
                (p) => (p.id ?? p.project_id) === projectFilter
              ) || null
            }
            onChange={(e, newValue) => {
              setProjectFilter(newValue ? (newValue.id ?? newValue.project_id) : "");
            }}
            getOptionLabel={(option) =>
              option.project_name ||
              option.projectName ||
              `Project ${option.id ?? option.project_id ?? ""}`
            }
            isOptionEqualToValue={(option, value) =>
              (option.id ?? option.project_id) === (value.id ?? value.project_id)
            }
            renderOption={(props, option, { selected }) => (
              <li
                {...props}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  background: selected ? "#F6A623" : "#fff9f0",
                  fontWeight: selected ? 600 : 400,
                  color: selected ? "#fff" : "#b26800",
                  borderLeft: selected ? "4px solid #e8920a" : "4px solid transparent",
                  transition: "background 0.15s",
                }}
              >
                {option.project_name || option.projectName || `Project ${option.id ?? option.project_id ?? ""}`}
              </li>
            )}
            componentsProps={{
              paper: {
                sx: {
                  border: "2px solid rgba(246,166,35,0.2)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 16px rgba(246,166,35,0.2)",
                  mt: 0.5,
                },
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang("reports.allprojects")}
                placeholder={lang("common.searchProject", "Search project...")}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": { borderColor: "#F6A623" },
                    "&.Mui-focused fieldset": { borderColor: "#F6A623" },
                  },
                  "& label.Mui-focused": { color: "#b26800" },
                }}
              />
            )}
            sx={{ width: { xs: "100%", sm: 260 } }}
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`theme-btn-blue-color border rounded-md px-4 py-2 text-sm ${isSubmitDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {lang("common.submit", "Submit")}
          </button>
        </div>
        <button
          className="common-grey-color border rounded-3 btn w-full sm:w-auto"
          onClick={handleDownloadCSV}
        >
          {lang("reports.downloadcsv")}
        </button>
      </div>

      {/* Table Section */}
      <div className="relative">
        {!hasLoadedOnce && loading && (
          <div className="text-center py-6 text-gray-600">Loading...</div>
        )}

        {error && <div className="text-red-600">Error: {error}</div>}

        {hasLoadedOnce && (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto relative">
              <Table
                data={filteredData}
                columns={columns}
                disablePagination={false}
                onSearchChange={handleSearchChange}
                onPaginationChange={handlePaginationChange}
                pageIndex={pageIndex}
                pageSize={pageSize}
                serverSideTotal={pagination.total}
                initialPageSize={pageSize}
              />
              {loading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-gray-600">
                  Refreshing...
                </div>
              )}
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3 mt-3">
              {/* Top Page Size Selector */}
              <div className="flex items-center justify-end gap-2 pb-2 border-b border-gray-100">
                <span className="text-xs text-gray-500">{lang("common.rowsPerPage", "Rows per page")}:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
                  className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {[10, 30, 50, 70, 100].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {filteredData.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-8">
                  {lang("reports.noData", "No data found")}
                </div>
              ) : (
                filteredData.map((row) => (
                  <div
                    key={row.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Card Header */}
                    <div className="mb-3 pb-3 border-b border-gray-100">
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {row.projectName}
                      </h3>
                      {row.month && (
                        <p className="text-xs text-gray-500 mt-0.5">{row.month}</p>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">{lang("projects.askingPrice", "Asking Price")}:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(row.askingPrice)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">{lang("projects.capexValue", "Capex Value")}:</span>
                        <span className="font-medium text-gray-900">
                          {isNaN(parseFloat(row.capexValue)) ? "0.00" : parseFloat(row.capexValue).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">{lang("reports.monthEnergy", "Energy")}:</span>
                        <span className="font-medium text-gray-900">{formatShort(row.month_energy)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">{lang("projects.wesharePrice", "Weshare Price (kWh)")}:</span>
                        <span className="font-medium text-gray-900">{row.weshare_price}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">{lang("reports.monthRevenue", "Revenue")}:</span>
                        <span className="font-medium text-gray-900">{row.monthRevenue}</span>
                      </div>
                      <div className="flex justify-between text-xs pt-2 border-t border-gray-100">
                        <span className="font-semibold text-gray-700">{lang("reports.monthRoi", "ROI")}:</span>
                        <span className="font-bold text-slate-900">{formatPercentage(row.monthRoi)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Mobile Pagination */}
              {pagination.total > 0 && (
                <div className="space-y-2 pt-3 border-t border-gray-200 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {pageIndex * pageSize + 1}–{Math.min((pageIndex + 1) * pageSize, pagination.total)} {lang("common.of", "of")} {pagination.total}
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={pageIndex === 0}
                        onClick={() => setPageIndex(pageIndex - 1)}
                        className="px-3 py-1 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50 transition-colors"
                      >
                        ← {lang("common.prev", "Prev")}
                      </button>
                      <button
                        disabled={(pageIndex + 1) >= pagination.pages}
                        onClick={() => setPageIndex(pageIndex + 1)}
                        className="px-3 py-1 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50 transition-colors"
                      >
                        {lang("common.next", "Next")} →
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{lang("common.rowsPerPage", "Rows per page")}:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
                      className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      {[10, 30, 50, 70, 100].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RoiReports;
