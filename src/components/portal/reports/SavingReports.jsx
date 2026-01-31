"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Table from "@/components/shared/table/Table";
import { formatMonthYear, formatShort } from "@/utils/common";
import { PROJECT_STATUS } from "@/constants/project_status";

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
  const [groupBy, setGroupBy] = useState("day");
  const [appliedGroupBy, setAppliedGroupBy] = useState("day");
  const isSubmitDisabled = !projectFilter;

  const fetch_project_list = async () => {
    try {
      const res = await apiPost("/api/projects/dropdown/project", { offtaker_id: user?.id, project_status_id: PROJECT_STATUS.RUNNING });
      if (res && res.success) {
        setProjectList(res.data);
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
        limit: String(PAGE_SIZE),
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

      params.append("offtaker_id", user?.id);

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
  }, [pageIndex, appliedProject, appliedStartDate, appliedEndDate, appliedGroupBy, searchTerm, user?.id]);

  const handleSearchChange = (value) => {
    setPageIndex(0);
    setSearchTerm(value);
  };

  const handlePaginationChange = (nextPagination) => {
    const updated = typeof nextPagination === "function"
      ? nextPagination({ pageIndex, pageSize: PAGE_SIZE })
      : nextPagination;
    setPageIndex(updated.pageIndex || 0);
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
      setLoading(true);

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

      params.append("offtaker_id", user?.id);

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
      setLoading(false);
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
    <div className="p-6 bg-white rounded-3xl shadow-md">
      <div className="d-flex items-center justify-content-between gap-2 mb-4 mt-4 w-full flex-wrap">
        <div className="filter-button flex flex-wrap items-center gap-3">

          {/* Project */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm min-w-[180px]"
          >
            <option value="">{lang("reports.allprojects")}</option>
            {projectList.map((p) => (
              <option key={p.id ?? p.project_id} value={p.id ?? p.project_id}>
                {p.project_name ?? p.projectName ?? `Project ${p.id ?? ""}`}
              </option>
            ))}
          </select>

          {/* Group By */}
          <select
            value={groupBy}
            onChange={(e) => {
              const newGroupBy = e.target.value;
              setGroupBy(newGroupBy);
              if (appliedGroupBy !== newGroupBy && appliedProject) {
                setSearchTerm("");
              }
            }}
            className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm min-w-[120px]"
          >
            <option value="day">{lang("common.day")}</option>
            <option value="month">{lang("common.month")}</option>
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm" style={{backgroundColor: '#102c41', color: 'white'}}
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || undefined}
            className="border rounded-md px-3 py-2 text-sm" style={{backgroundColor: '#102c41', color: 'white'}}
          />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`theme-btn-blue-color border rounded-md px-5 py-2 text-sm whitespace-nowrap
    ${isSubmitDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {lang("common.submit")}
          </button>

        </div>


        <button
          onClick={downloadCSV}
          className="common-grey-color border rounded-3 btn"
        >
          {lang("reports.downloadcsv")}
        </button>
      </div>

      <div className="overflow-x-auto relative">
        {error && <div className="text-red-600">Error: {error}</div>}
        <>
          <Table
            data={reportsData}
            columns={columns}
            disablePagination={false}
            onSearchChange={handleSearchChange}
            onPaginationChange={handlePaginationChange}
            pageIndex={pageIndex}
            pageSize={PAGE_SIZE}
            serverSideTotal={pagination.total}
            initialPageSize={PAGE_SIZE}
          />
        </>
      </div>
    </div>
  );
};

export default SavingReports;
