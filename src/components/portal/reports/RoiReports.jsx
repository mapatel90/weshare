"use client";
import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Table from "@/components/shared/table/Table";
import { Autocomplete, TextField } from "@mui/material";

const RoiReports = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();

  const PAGE_SIZE = 50;

  const [reportsData, setReportsData] = useState([]);
  const [allowedIds, setAllowedIds] = useState(null);
  const [projectFilter, setProjectFilter] = useState("");
  const [inverterFilter, setInverterFilter] = useState("");
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
  const [inverterList, setInverterList] = useState([]);
  const [appliedProjectFilter, setAppliedProjectFilter] = useState("");
  const [appliedInverterFilter, setAppliedInverterFilter] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const isSubmitDisabled = !projectFilter;

  // 1) Load allowed project IDs (Investor Logic)
  useEffect(() => {
    if (!user?.id) return setAllowedIds(null);

    apiGet(`/api/investors?page=1&limit=50&userId=${user.id}`)
      .then((res) => {
        if (!res?.success) return setAllowedIds([]);

        const normalized = res.data
          .map((item) =>
            Number(
              item?.project_id ||
              item?.project?.id
            )
          )
          .filter(Boolean);

        setAllowedIds(normalized);
      })
      .catch(() => setAllowedIds([]));
  }, [user?.id]);

  // Fetch Project List
  const fetchProjectList = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiPost("/api/projects/dropdown/project", { 
        offtaker_id: user?.id, 
        project_status_id: 2 // RUNNING status
      });

      if (res && res.data) {
        setProjectList(res.data);
      } else if (Array.isArray(res)) {
        setProjectList(res);
      } else {
        setProjectList([]);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setProjectList([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Inverter List based on selected project
  const fetchInverterList = async (projectId) => {
    try {
      if (!projectId) {
        setInverterList([]);
        return;
      }

      const res = await apiGet(`/api/project-inverters?project_id=${projectId}`);

      if (Array.isArray(res?.data)) {
        setInverterList(res.data);
      } else if (Array.isArray(res)) {
        setInverterList(res);
      } else {
        setInverterList([]);
      }
    } catch (err) {
      console.error("Error fetching inverter list:", err);
      setInverterList([]);
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
      if (appliedInverterFilter) params.append("inverterId", appliedInverterFilter);
      if (appliedSearchTerm) params.append("search", appliedSearchTerm);

      const res = await apiGet(`/api/inverter-data?${params.toString()}`);
      const items = Array.isArray(res?.data) ? res.data : [];
      console.log("Fetched ROI reports", items);

      // Restrict to investor-allowed projects
      const allowed = Array.isArray(allowedIds) ? allowedIds : null;
      const filteredItems = items.filter((item) => {
        if (!allowed) return true;
        const pid = Number(item.project_id ?? item.projectId ?? item?.project?.id);
        return allowed.includes(pid);
      });

      const mappedData = filteredItems.map((item, idx) => ({
        id: item.id ?? idx,
        projectId: item.project_id ?? item.projectId ?? item?.project?.id ?? null,
        inverterId: item.project_inverter_id ?? null,
        projectName: item.projects?.project_name || item?.project?.project_name || `Project ${item.project_id ?? ""}`,
        inverterName: item.project_inverters?.inverter_name || "-",
        date: item.date,
        time: item.time ?? "",
        generatedKW:
          item.generate_kw !== undefined && item.generate_kw !== null
            ? (Number(item.generate_kw) / 1000).toFixed(2) + " kwh"
            : "",
        Acfrequency: item.ac_frequency ?? "",
        DailyYield:
          item.daily_yield !== undefined && item.daily_yield !== null
            ? item.daily_yield + " kwh"
            : "",
        AnnualYield:
          item.annual_yield !== undefined && item.annual_yield !== null
            ? item.annual_yield + " kwh"
            : "",
        TotalYield:
          item.total_yield !== undefined && item.total_yield !== null
            ? item.total_yield + " kwh"
            : "",
      }));

      setReportsData(mappedData);

      // Dropdown lists: restrict to investor-allowed
      const resProjects = Array.isArray(res?.projectList) ? res.projectList : [];
      const resInverters = Array.isArray(res?.inverterList) ? res.inverterList : [];

      const allowedProjectSet = new Set((allowed ?? []).map(String));
      const investorProjects = resProjects.filter((p) => allowedProjectSet.has(String(p.id ?? p.project_id)));
      setProjectList(investorProjects);

      const investorInverters = resInverters.filter((inv) => allowedProjectSet.has(String(inv.project_id)));
      setInverterList(investorInverters);

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
  }, [appliedProjectFilter, appliedInverterFilter, appliedSearchTerm, allowedIds, pageIndex]);

  // Fetch project list on component mount
  useEffect(() => {
    if (user?.id) {
      fetchProjectList();
    }
  }, [user?.id]);

  // Fetch inverter list when project filter changes
  useEffect(() => {
    if (projectFilter) {
      fetchInverterList(projectFilter);
      // Reset inverter filter when project changes
      setInverterFilter("");
    } else {
      setInverterList([]);
      setInverterFilter("");
    }
  }, [projectFilter]);

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
    setAppliedInverterFilter(inverterFilter);
    setAppliedSearchTerm(searchTerm);
  };

  // 4) Server-side filtered data
  const filteredData = reportsData;

  // Reset inverter filter when project changes
  useEffect(() => {
    if (!inverterFilter) return;
    const available = new Set((inverterList || []).map((i) => String(i.id)));
    if (!available.has(inverterFilter)) setInverterFilter("");
  }, [projectFilter, inverterList, inverterFilter]);

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

  // CSV Download - Fetch all records
  const handleDownloadCSV = async () => {
    try {
      setLoading(true);

      // Build params to fetch all data for CSV export
      const params = new URLSearchParams({
        page: "1",
        limit: "1000000", // Large limit to get all data
      });

      if (appliedProjectFilter) params.append("projectId", appliedProjectFilter);
      if (appliedInverterFilter) params.append("inverterId", appliedInverterFilter);
      if (appliedSearchTerm) params.append("search", appliedSearchTerm);

      const res = await apiGet(`/api/inverter-data?${params.toString()}`);
      const items = Array.isArray(res?.data) ? res.data : [];

      // Restrict to investor-allowed projects
      const allowed = Array.isArray(allowedIds) ? allowedIds : null;
      const filteredItems = items.filter((item) => {
        if (!allowed) return true;
        const pid = Number(item.project_id ?? item.projectId ?? item?.project?.id);
        return allowed.includes(pid);
      });

      // Map data for CSV
      const csvData = filteredItems.map((item) => ({
        projectName: item.projects?.project_name || item?.project?.project_name || `Project ${item.project_id ?? ""}`,
        inverterName: item.project_inverters?.inverter_name || "-",
        date: item.date || "",
        time: item.time ?? "",
        generatedKW:
          item.generate_kw !== undefined && item.generate_kw !== null
            ? (Number(item.generate_kw) / 1000).toFixed(2) + " kwh"
            : "",
        Acfrequency: item.ac_frequency ?? "",
        DailyYield:
          item.daily_yield !== undefined && item.daily_yield !== null
            ? item.daily_yield + " kwh"
            : "",
        AnnualYield:
          item.annual_yield !== undefined && item.annual_yield !== null
            ? item.annual_yield + " kwh"
            : "",
        TotalYield:
          item.total_yield !== undefined && item.total_yield !== null
            ? item.total_yield + " kwh"
            : "",
      }));

      // Define CSV headers
      const headers = [
        lang("projects.projectName"),
        lang("inverter.inverterName"),
        lang("common.date"),
        lang("common.time"),
        lang("common.generatedKW"),
        lang("common.acFrequency"),
        lang("reports.dailyYield"),
        lang("reports.annualYield"),
        lang("reports.totalYield"),
      ];

      // Convert data to CSV rows
      const csvRows = [
        headers.join(","), // Header row
        ...csvData.map((row) => {
          const values = [
            `"${(row.projectName || "-").replace(/"/g, '""')}"`,
            `"${(row.inverterName || "-").replace(/"/g, '""')}"`,
            row.date ? `"${formatDateDDMMYYYY(row.date)}"` : '"-"',
            row.time ? `"${row.time}"` : '"-"',
            row.generatedKW ? `"${row.generatedKW}"` : '"-"',
            row.Acfrequency ? `"${row.Acfrequency}"` : '"-"',
            row.DailyYield ? `"${row.DailyYield}"` : '"-"',
            row.AnnualYield ? `"${row.AnnualYield}"` : '"-"',
            row.TotalYield ? `"${row.TotalYield}"` : '"-"',
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

  // Columns definition
  const columns = useMemo(
    () => [
      {
        accessorKey: "projectName",
        header: () => lang("projects.projectName"),
      },
      {
        accessorKey: "inverterName",
        header: () => lang("inverter.inverterName"),
      },
      {
        accessorKey: "date",
        header: () => lang("common.date"),
        cell: ({ row }) => formatDateDDMMYYYY(row.original.date),
      },
      { accessorKey: "time", header: () => lang("common.time") },
      { accessorKey: "generatedKW", header: () => lang("common.generatedKW") },
      { accessorKey: "Acfrequency", header: () => lang("common.acFrequency") },
      { accessorKey: "DailyYield", header: () => lang("reports.dailyYield") },
      { accessorKey: "AnnualYield", header: () => lang("reports.annualYield") },
      { accessorKey: "TotalYield", header: () => lang("reports.totalYield"), meta: { disableSort: true } },
    ],
    [lang]
  );

  return (
    <div className="p-6 bg-white rounded-3xl shadow-md">
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

          <Autocomplete
            size="small"
            options={[...inverterList].sort((a, b) => {
              const nameA = (a.inverter_name ?? a.name ?? "").toLowerCase();
              const nameB = (b.inverter_name ?? b.name ?? "").toLowerCase();
              return nameA.localeCompare(nameB);
            })}
            value={
              inverterList.find((i) => String(i.id) === String(inverterFilter)) || null
            }
            onChange={(e, newValue) => {
              setInverterFilter(newValue ? String(newValue.id) : "");
            }}
            getOptionLabel={(option) =>
              option.inverter_name ?? option.name ?? `Inverter ${option.id}`
            }
            isOptionEqualToValue={(option, value) =>
              String(option.id) === String(value.id)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang("reports.allinverters")}
                placeholder="Search inverter..."
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
          onClick={handleDownloadCSV}
          className="common-grey-color border rounded-3 btn"
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
