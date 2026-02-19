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
      } else {
        const res_investor = await apiPost("/api/projects/dropdown/project", {
          investor_id: user?.id,
          project_status_id: PROJECT_STATUS.RUNNING
        });
        console.log("res_investor", res_investor);
        if (res_investor && res_investor.success) {
          setProjectList(res_investor.data);
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
        limit: String(PAGE_SIZE),
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
  }, [appliedProjectFilter, appliedSearchTerm, pageIndex]);

  // Fetch project list on component mount
  useEffect(() => {
    if (user?.id) {
      fetchProjectList();
    }
  }, [user?.id]);

  // 3) Handle submit to apply filters
  const handleSubmit = () => {
    if (!projectFilter) {
      alert("Please select Project");
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
    setPageIndex(nextPagination.pageIndex);
    setPagination(nextPagination);
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
    <div className="p-6 bg-white rounded-3xl shadow-md relative">
      {/* Fullscreen CSV Download Loader */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-3xl">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-lg">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-700 font-medium">{lang("common.downloading", "Downloading...")}</p>
          </div>
        </div>
      )}
      {/* Filter Section */}
      <div className="d-flex items-center justify-content-between gap-2 mb-4 mt-4 w-full flex-wrap">
        <div className="filter-button flex flex-wrap gap-2">
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
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang("reports.allprojects")}
                placeholder="Search project..."
              />
            )}
            sx={{ minWidth: 260 }}
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
          className="common-grey-color border rounded-3 btn"
          onClick={handleDownloadCSV}
        >
          {lang("reports.downloadcsv")}
        </button>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto relative">
        {!hasLoadedOnce && loading && (
          <div className="text-center py-6 text-gray-600">Loading...</div>
        )}

        {error && <div className="text-red-600">Error: {error}</div>}

        {hasLoadedOnce && (
          <>
            <Table
              data={filteredData}
              columns={columns}
              disablePagination={false}
              onSearchChange={handleSearchChange}
              onPaginationChange={handlePaginationChange}
              pageIndex={pageIndex}
              pageSize={PAGE_SIZE}
              serverSideTotal={pagination.total}
              initialPageSize={PAGE_SIZE}
            />
            {loading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-gray-600">
                Refreshing...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RoiReports;
