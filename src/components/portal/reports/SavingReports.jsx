"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Table from "@/components/shared/table/Table";
import { formatMonthYear, formatShort } from "@/utils/common";
import { PROJECT_STATUS } from "@/constants/project_status";
import { Autocomplete, TextField } from "@mui/material";
import { ROLES } from "@/constants/roles";

const SavingReports = () => {
  const PAGE_SIZE = 50; // show 50 rows per page
  const { user } = useAuth();
  const { lang } = useLanguage();

  const [reportsData, setReportsData] = useState([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState(null);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });
  const [pageIndex, setPageIndex] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [projectList, setProjectList] = useState([]);
  const [appliedProject, setAppliedProject] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const [appliedGroupBy, setAppliedGroupBy] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const isSubmitDisabled = !projectFilter;

  const fetch_project_list = async () => {
    try {
      if (user.role === ROLES.OFFTAKER) {
        const res_offtaker = await apiPost("/api/projects/dropdown/project", { offtaker_id: user?.id, project_status_id: PROJECT_STATUS.RUNNING });
        if (res_offtaker && res_offtaker.success) {
          setProjectList(res_offtaker.data);
        }
      } else {
        const res_investor = await apiPost("/api/projects/dropdown/project", { investor_id: user?.id, project_status_id: PROJECT_STATUS.RUNNING });
        if (res_investor && res_investor.success) {
          setProjectList(res_investor.data);
        }
      }
    } catch (error) {
      console.error("Error fetching project list:", error);
    }
  };

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use applied filters (only fetch when submit is clicked)
      if (appliedStartDate && appliedEndDate) {
        const startTs = new Date(`${appliedStartDate}T00:00:00`);
        const endTs = new Date(`${appliedEndDate}T23:59:59`);
        if (startTs > endTs) {
          setError("Start date cannot be after end date.");
          setLoading(false);
          setHasLoadedOnce(true);
          return;
        }
      }

      // Don't fetch if no project is selected/applied
      if (!appliedProject) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        limit: String(pageSize),
      });

      params.append("projectId", appliedProject);

      // Add searchTerm for server-side search
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      // Add date range filters (inclusive)
      if (appliedStartDate) {
        params.append("startDate", appliedStartDate);
      }
      if (appliedEndDate) {
        params.append("endDate", appliedEndDate);
      }

      // Add groupBy parameter
      if (appliedGroupBy) {
        params.append("groupBy", appliedGroupBy);
      }

      if (user.role === ROLES.OFFTAKER) {
        params.append("offtaker_id", user?.id);
      } else {
        params.append("investor_id", user?.id);
      }

      const res = await apiGet(`/api/projects/report/saving-data?${params.toString()}`);

      if (res && res.success) {
        setReportsData(res.data || []);
        if (res.pagination) {
          setPagination({
            page: res.pagination.page,
            limit: res.pagination.limit,
            total: res.pagination.total,
            pages: res.pagination.pages,
          });
        }
        setHasLoadedOnce(true);
      } else {
        setError("Failed to load reports data");
        setReportsData([]);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setError(err?.message || "Failed to load reports");
      setReportsData([]);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, appliedProject, appliedStartDate, appliedEndDate, appliedGroupBy, searchTerm, user?.id]);

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
  };

  const handleSubmit = () => {
    // Apply the filters and reset to first page
    setAppliedProject(projectFilter);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setAppliedGroupBy(groupBy);
    setPageIndex(0);
    setSearchTerm(""); // Reset search on submit
  };


  const columns = useMemo(() => [
    {
      accessorKey: 'projects.project_name',
      header: lang("projects.projectName"),
      cell: ({ row }) => row.original.projects?.project_name || 'N/A',
    },
    {
      accessorKey: 'date',
      header: appliedGroupBy === 'day' ? lang("common.day") : lang("common.month"),
      cell: ({ row }) => {
        const date = row.original.date;
        if (!date) return 'N/A';

        try {
          if (appliedGroupBy === "month") {
            // If already in MM/YYYY format, return as is
            if (typeof date === 'string' && /^\d{2}\/\d{4}$/.test(date)) {
              return date;
            }
            // Otherwise format it
            return formatMonthYear(date);
          }
          // For day view, format as date
          const dateObj = new Date(date);
          if (isNaN(dateObj.getTime())) {
            return 'N/A';
          }
          return dateObj.toLocaleDateString();
        } catch (error) {
          console.error('Date formatting error:', error, date);
          return 'N/A';
        }
      },
    },
    {
      accessorKey: 'grid_purchased_energy',
      header: lang("reports.gridPurchased"),
      cell: ({ row }) => (formatShort(row.original.grid_purchased_energy) || 0),
    },
    {
      accessorKey: 'consume_energy',
      header: lang("reports.consumeEnergy"),
      cell: ({ row }) => (formatShort(row.original.consume_energy) || 0),
    },
    {
      accessorKey: 'full_hour',
      header: lang("reports.fullhour"),
      cell: ({ row }) => (formatShort(row.original.full_hour) || 0),
    },
    {
      accessorKey: 'battery_charge_energy',
      header: lang("reports.batteryCharge"),
      cell: ({ row }) => (formatShort(row.original.battery_charge_energy) || 0),
    },
    {
      accessorKey: 'battery_discharge_energy',
      header: lang("reports.batteryCharged"),
      cell: ({ row }) => (formatShort(row.original.battery_discharge_energy) || 0),
    },
    {
      accessorKey: 'home_grid_energy',
      header: lang("reports.homeGrid"),
      cell: ({ row }) => (formatShort(row.original.home_grid_energy) || 0),
    },
    {
      accessorKey: 'back_up_energy',
      header: lang("reports.backupEnergy"),
      cell: ({ row }) => (formatShort(row.original.back_up_energy) || 0),
    },
    {
      accessorKey: 'energy',
      header: lang("reports.energy"),
      cell: ({ row }) => (formatShort(row.original.energy) || 0),
    },
    {
      accessorKey: 'evn cost',
      header: lang("reports.evnCost"),
      cell: ({ row }) => (formatShort(row.original.evn_amount) || 0),
    },
    {
      accessorKey: 'weshare cost',
      header: lang("reports.weshareCost"),
      cell: ({ row }) => (formatShort(row.original.weshare_amount) || 0),
    },
    {
      accessorKey: 'saving_cost',
      header: lang("reports.savingCost"),
      cell: ({ row }) => (formatShort(row.original.saving_cost) || 0),
    },
  ], [appliedGroupBy]);

  const downloadCSV = async () => {
    try {
      setDownloadLoading(true);

      // Build params for CSV export (fetch all data, no pagination)
      // Use applied filters for CSV export
      const params = new URLSearchParams();

      if (appliedProject) {
        params.append("projectId", appliedProject);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (appliedStartDate) {
        params.append("startDate", appliedStartDate);
      }
      if (appliedEndDate) {
        params.append("endDate", appliedEndDate);
      }

      // Add groupBy parameter for CSV
      if (appliedGroupBy) {
        params.append("groupBy", appliedGroupBy);
      }

      // Fetch all data for CSV (set a high limit or fetch without pagination)
      params.append("page", "1");
      params.append("limit", "10000"); // Large limit to get all data
      if (user.role === ROLES.OFFTAKER) {
        params.append("offtaker_id", user?.id);
      } else {
        params.append("investor_id", user?.id);
      }

      const res = await apiGet(`/api/projects/report/saving-data?${params.toString()}`);

      if (res && res.success && res.data) {
        const data = res.data;

        // Define CSV headers matching table columns
        const headers = [
          'Project Name',
          appliedGroupBy === 'month' ? 'Month' : 'Date',
          'Grid Purchased',
          'Consume Energy',
          'Full Hour',
          'Battery Charge',
          'Battery Discharge',
          'Home Grid',
          'Backup Energy',
          'Energy',
          'EvN Cost',
          'Weshare Cost',
          'Saving Cost'
        ];

        // Convert data to CSV rows
        const csvRows = [
          headers.join(','), // Header row
          ...data.map(row => {
            let dateValue = 'N/A';
            if (row.date) {
              if (appliedGroupBy === 'month') {
                dateValue = formatMonthYear(row.date);
              } else {
                dateValue = new Date(row.date).toLocaleDateString();
              }
            }

            const values = [
              `"${(row.projects?.project_name || 'N/A')}"`,
              `"${dateValue}"`,
              formatShort(row.grid_purchased_energy) || 0,
              formatShort(row.consume_energy) || 0,
              formatShort(row.full_hour) || 0,
              formatShort(row.battery_charge_energy) || 0,
              formatShort(row.battery_discharge_energy) || 0,
              formatShort(row.home_grid_energy) || 0,
              formatShort(row.back_up_energy) || 0,
              formatShort(row.energy) || 0,
              formatShort(row.evn_amount) || 0,
              formatShort(row.weshare_amount) || 0,
              formatShort(row.saving_cost) || 0,
            ];
            return values.join(',');
          })
        ];

        // Create CSV content
        const csvContent = csvRows.join('\n');

        // Create blob and download
        const blob = new Blob(
          ["\uFEFF" + csvContent],
          { type: 'text/csv;charset=utf-8;' }
        );
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        // Generate filename with date range if applicable
        let filename = appliedGroupBy === 'month' ? 'project_month_report' : 'project_day_report';
        if (appliedStartDate && appliedEndDate) {
          filename += `_${appliedStartDate}_to_${appliedEndDate}`;
        } else if (appliedStartDate) {
          filename += `_from_${appliedStartDate}`;
        } else if (appliedEndDate) {
          filename += `_until_${appliedEndDate}`;
        }
        filename += `_${new Date().toISOString().split('T')[0]}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError("Failed to fetch data for CSV export");
      }
    } catch (err) {
      console.error("Failed to export CSV:", err);
      setError(err?.message || "Failed to export CSV");
    } finally {
      setDownloadLoading(false);
    }
  };

  useEffect(() => {
    fetch_project_list();
  }, []);


  // Only fetch when applied filters change or page/search changes
  useEffect(() => {
    // Only fetch if a project has been applied (after submit)
    if (appliedProject) {
      fetchReports();
    }
  }, [fetchReports]);


  return (
    <div className="p-6 bg-white rounded-3xl shadow-md relative">
      {/* Fullscreen CSV Download Loader */}
      {downloadLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-3xl">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-lg">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-700 font-medium">{lang("common.downloading", "Downloading...")}</p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-4 mt-4 w-full">

          {/* Project */}
          <Autocomplete
            size="small"
            options={projectList}
            value={projectList.find((p) => String(p.id ?? p.project_id) === projectFilter) || null}
            onChange={(e, newValue) =>
              setProjectFilter(newValue ? String(newValue.id ?? newValue.project_id) : "")
            }
            getOptionLabel={(option) => option.project_name ?? option.projectName ?? `Project ${option.id ?? ""}`}
            isOptionEqualToValue={(option, value) => String(option.id ?? option.project_id) === String(value.id ?? value.project_id)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang("reports.allprojects", "All Projects")}
                placeholder={lang("common.searchProject", "Search project...")}
              />
            )}
            sx={{ width: { xs: "100%", sm: 260 } }}
          />

          {/* Group By */}
          <Autocomplete
            size="small"
            options={[
              { value: "day", label: lang("common.day", "Day") },
              { value: "month", label: lang("common.month", "Month") },
            ]}
            value={
              [
                { value: "day", label: lang("common.day", "Day") },
                { value: "month", label: lang("common.month", "Month") },
              ].find((g) => g.value === groupBy) || null
            }
            onChange={(e, newValue) => {
              const newGroupBy = newValue ? newValue.value : "";
              setGroupBy(newGroupBy);
              if (appliedGroupBy !== newGroupBy && appliedProject) {
                setSearchTerm("");
              }
            }}
            getOptionLabel={(option) => option.label || ""}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang("common.groupBy", "Group By")}
                placeholder={lang("common.select", "Select...")}
              />
            )}
            sx={{ width: { xs: "100%", sm: 180 } }}
          />

          {/* Start Date */}
          <TextField
            size="small"
            type="date"
            label={lang("projects.startDate", "Start Date")}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              width: { xs: "100%", sm: 200 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                backgroundColor: "#fff",
              },
            }}
          />

          {/* End Date */}
          <TextField
            size="small"
            type="date"
            label={lang("projects.endDate", "End Date")}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            inputProps={{ min: startDate || undefined }}
            InputLabelProps={{ shrink: true }}
            sx={{
              width: { xs: "100%", sm: 200 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                backgroundColor: "#fff",
              },
            }}
          />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`theme-btn-blue-color border rounded-md px-5 py-2 text-sm whitespace-nowrap w-full sm:w-auto ${isSubmitDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {lang("common.submit")}
          </button>

          <button
            onClick={downloadCSV}
            className="common-grey-color border rounded-3 btn w-full sm:w-auto"
          >
            {lang("reports.downloadcsv")}
          </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto relative">
        {error && <div className="text-red-600">Error: {error}</div>}
        <>
          <Table
            data={reportsData}
            columns={columns}
            disablePagination={false}
            onSearchChange={handleSearchChange}
            onPaginationChange={handlePaginationChange}
            pageIndex={pageIndex}
            pageSize={pageSize}
            serverSideTotal={pagination.total}
            initialPageSize={pageSize}
          />
        </>
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
        {error && <div className="text-red-600 text-sm">Error: {error}</div>}
        {reportsData.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-8">
            {lang("common.noData", "No data found")}
          </div>
        ) : (
          reportsData.map((item, idx) => {
            let dateDisplay = 'N/A';
            if (item.date) {
              try {
                if (appliedGroupBy === "month") {
                  if (typeof item.date === 'string' && /^\d{2}\/\d{4}$/.test(item.date)) {
                    dateDisplay = item.date;
                  } else {
                    dateDisplay = new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  }
                } else {
                  dateDisplay = new Date(item.date).toLocaleDateString();
                }
              } catch (e) { dateDisplay = item.date; }
            }
            return (
              <div
                key={item.id ?? idx}
                className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                  <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">
                    {item.projects?.project_name || 'N/A'}
                  </h3>
                  <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{dateDisplay}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{lang("reports.gridPurchased", "Grid Purchased")}:</span>
                    <span className="font-medium text-gray-900">{formatShort(item.grid_purchased_energy) || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{lang("reports.consumeEnergy", "Consume Energy")}:</span>
                    <span className="font-medium text-gray-900">{formatShort(item.consume_energy) || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{lang("reports.fullhour", "Full Hour")}:</span>
                    <span className="font-medium text-gray-900">{formatShort(item.full_hour) || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{lang("reports.batteryCharge", "Battery Charge")}:</span>
                    <span className="font-medium text-gray-900">{formatShort(item.battery_charge_energy) || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{lang("reports.batteryCharged", "Battery Discharge")}:</span>
                    <span className="font-medium text-gray-900">{formatShort(item.battery_discharge_energy) || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{lang("reports.homeGrid", "Home Grid")}:</span>
                    <span className="font-medium text-gray-900">{formatShort(item.home_grid_energy) || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{lang("reports.backupEnergy", "Backup Energy")}:</span>
                    <span className="font-medium text-gray-900">{formatShort(item.back_up_energy) || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{lang("reports.energy", "Energy")}:</span>
                    <span className="font-medium text-gray-900">{formatShort(item.energy) || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{lang("reports.evnCost", "EvN Cost")}:</span>
                    <span className="font-medium text-gray-900">{formatShort(item.evn_amount) || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{lang("reports.weshareCost", "Weshare Cost")}:</span>
                    <span className="font-medium text-gray-900">{formatShort(item.weshare_amount) || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-gray-100 pt-2">
                    <span className="text-gray-700 font-semibold">{lang("reports.savingCost", "Saving Cost")}:</span>
                    <span className="font-bold text-green-700">{formatShort(item.saving_cost) || 0}</span>
                  </div>
                </div>
              </div>
            );
          })
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
    </div>
  );
};

export default SavingReports;
