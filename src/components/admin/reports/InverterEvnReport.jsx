"use client";

import React, { useMemo, useState, useEffect } from "react";
import Table from "@/components/shared/table/Table";
import { apiGet } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatEnergyUnit, sortByNameAsc } from "@/utils/common";

const InverterEvnReport = () => {
  const PAGE_SIZE = 50; // default rows per table page
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [projectFilter, setProjectFilter] = useState(""); // store projectId (string)
  const [inverterFilter, setInverterFilter] = useState(""); // store inverterId (string)
  const [searchTerm, setSearchTerm] = useState(""); // global search value from Table
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState(""); // YYYY-MM-DD
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: pageSize,
    total: 0,
    pages: 0,
  });
  const [pageIndex, setPageIndex] = useState(0); // zero-based for Table

  const { lang } = useLanguage();

  // Dropdown lists (populated from single API)
  const [projectList, setProjectList] = useState([]);
  const [inverterList, setInverterList] = useState([]);

  const [appliedProject, setAppliedProject] = useState("");
  const [appliedInverter, setAppliedInverter] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const isSubmitDisabled = !projectFilter;

  // -----------------------------
  // Handle Submit - Apply filters and fetch data
  // -----------------------------
  const handleSubmit = () => {
    setAppliedProject(projectFilter);
    setAppliedInverter(inverterFilter);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setPageIndex(0); // Reset to first page
  };

  // -----------------------------
  // Fetch Reports Function (always fetch latest 50)
  // -----------------------------
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // basic client-side validation to avoid inverted ranges
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

      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        limit: String(pageSize),
      });

      // Add projectId if selected
      if (appliedProject) {
        params.append("projectId", appliedProject);
      }

      // Add inverterId if selected
      if (appliedInverter) {
        params.append("inverterId", appliedInverter);
      }

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

      const res = await apiGet(`/api/inverter-data?${params.toString()}`);
      const items = Array.isArray(res?.data) ? res.data : [];
      const mappedData = items.map((item) => ({
        id: item.id,
        projectId: item.project_id ?? item.project_id ?? null,
        inverterId: item.project_inverter_id ?? item.project_inverter_id ?? null,
        projectName: item.projects?.project_name || `Project ${item.projectId ?? item.project_id ?? ""}`,
        inverterName: item.project_inverters?.inverter_name,
        date: item.date,
        time: item.time ?? "",
        generatedKW: item.generate_kw != null ? formatEnergyUnit(Number(item.generate_kw)) : "",
        Acfrequency: item.ac_frequency ?? "",
        DailyYield:
          item.daily_yield !== undefined && item.daily_yield !== null
            ? formatEnergyUnit(item.daily_yield)
            : "",
        AnnualYield:
          item.annual_yield !== undefined && item.annual_yield !== null
            ? formatEnergyUnit(item.annual_yield)
            : "",
        TotalYield:
          item.total_yield !== undefined && item.total_yield !== null
            ? formatEnergyUnit(item.total_yield)
            : "",
      }));
      setReportsData(mappedData);

      // set dropdown lists from response (projectList/inverterList)
      setProjectList(Array.isArray(res?.projectList) ? res.projectList : []);
      // inverterList from backend comes as [{id, name, projectId?}]
      setInverterList(Array.isArray(res?.inverterList) ? res.inverterList : []);

      const apiTotal = res?.pagination?.total ?? mappedData.length;
      const total = apiTotal;

      const nextPage = res?.pagination?.page ?? pageIndex + 1;
      const nextLimit = res?.pagination?.limit ?? pageSize;
      const nextPages = res?.pagination?.pages ?? Math.max(1, Math.ceil(total / nextLimit));

      setPagination({
        page: nextPage,
        limit: nextLimit,
        total,
        pages: nextPages,
      });

      // If current page exceeds total pages after filters, snap back to last page
      const maxPageIndex = Math.max(0, nextPages - 1);
      if (pageIndex > maxPageIndex) {
        setPageIndex(maxPageIndex);
      }

      setError(null);
    } catch (err) {
      setError(err?.message || "Failed to load reports");
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  // Fetch dropdown lists on mount (projects and inverters)
  useEffect(() => {
    const fetchDropdownLists = async () => {
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "1",
        });
        const res = await apiGet(`/api/inverter-data?${params.toString()}`);
        setProjectList(Array.isArray(res?.projectList) ? res.projectList : []);
        setInverterList(Array.isArray(res?.inverterList) ? res.inverterList : []);
      } catch (err) {
        console.error("Failed to load dropdown lists", err);
      }
    };
    fetchDropdownLists();
  }, []);

  // Fetch + refresh when applied filters/search/pagination change
  useEffect(() => {
    // Only fetch if at least project is selected (applied)
    if (!appliedProject) {
      setLoading(false);
      setHasLoadedOnce(false);
      setReportsData([]);
      setPagination({ page: 1, limit: pageSize, total: 0, pages: 0 });
      return;
    }

    fetchReports();

    const interval = setInterval(() => {
      if (appliedProject) {
        fetchReports();
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [appliedProject, appliedInverter, appliedStartDate, appliedEndDate, searchTerm, pageIndex, pageSize]);

  // Filter inverters based on selected project
  const filteredInverterList = useMemo(() => {
    if (!projectFilter) {
      // If no project selected, show all inverters
      return inverterList;
    }
    // Filter inverters that belong to the selected project
    return inverterList.filter(
      (inverter) => String(inverter.project_id) === String(projectFilter)
    );
  }, [projectFilter, inverterList]);

  // When projectFilter changes: if the currently selected inverter is not in filtered list => reset inverterFilter
  useEffect(() => {
    if (!inverterFilter) return;

    const available = new Set((filteredInverterList || []).map((i) => String(i.id)));
    if (!available.has(inverterFilter)) {
      setInverterFilter("");
    }
  }, [projectFilter, filteredInverterList, inverterFilter]);

  // -----------------------------
  // Filtered Data (server-side filtering, so just return reportsData)
  // -----------------------------
  const filteredData = useMemo(() => {
    return reportsData;
  }, [reportsData]);

  const handleSearchChange = (value) => {
    setPageIndex(0);
    setSearchTerm(value);
  };

  const handlePaginationChange = (nextPagination) => {
    const current = { pageIndex, pageSize };
    const updated =
      typeof nextPagination === "function"
        ? nextPagination(current)
        : nextPagination || {};
    if (typeof updated.pageIndex === "number") {
      setPageIndex(updated.pageIndex);
    } else if (updated.pageIndex == null) {
      setPageIndex(0);
    }
    if (typeof updated.pageSize === "number") {
      setPageSize(updated.pageSize);
    }
  };

  // -----------------------------
  // CSV Download (exports filtered set from the 50)
  // -----------------------------
  const handleDownloadCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (appliedProject) params.append("projectId", appliedProject);
      if (appliedInverter) params.append("inverterId", appliedInverter);
      if (searchTerm && searchTerm.trim())
        params.append("search", searchTerm.trim());
      if (appliedStartDate) params.append("startDate", appliedStartDate);
      if (appliedEndDate) params.append("endDate", appliedEndDate);
      params.append("downloadAll", "1");

      const res = await apiGet(`/api/inverter-data?${params.toString()}`);
      const items = Array.isArray(res?.data) ? res.data : [];

      const rows = items.map((item) => ({
        projectName:
          item.projects?.project_name ||
          `Project ${item.project_id ?? item.project_id ?? ""}`,
        inverterName: item?.project_inverters?.inverter_name,
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

      const header = [
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

      const csvRows = rows.map((row) => [
        row.projectName,
        row.inverterName,
        formatDateDDMMYYYY(row.date),
        row.time ?? "",
        row.generatedKW ?? "",
        row.Acfrequency ?? "",
        row.DailyYield ?? "",
        row.AnnualYield ?? "",
        row.TotalYield ?? "",
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [header, ...csvRows].map((e) => e.join(",")).join("\n");

      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", "saving_reports.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("CSV download failed", err);
    }
  };

  // helper to show date without timezone shift (dd/mm/yyyy)
  const formatDateDDMMYYYY = (raw) => {
    if (!raw) return "";
    // take only date part (works for "YYYY-MM-DD" or "YYYY-MM-DD HH:mm:ss")
    const datePart = String(raw).trim().split(/[ T]/)[0];
    const [y, m, d] = datePart.split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
    return "";
  };

  // -----------------------------
  // Table Columns
  // -----------------------------
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
      {
        accessorKey: "TotalYield",
        header: () => lang("reports.totalYield"),
        meta: { disableSort: true },
      },
    ],
    [lang]
  );

  // -----------------------------
  // UI Rendering
  // -----------------------------
  return (
    <div className="p-6 bg-white rounded-3xl shadow-md">
      <div className="d-flex items-center justify-content-between gap-2 mb-4 mt-4 w-full flex-wrap">
        <div className="filter-button">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 mx-2 text-sm"
          >
            <option value="">{lang("reports.allprojects")}</option>
            {projectList.map((p) => (
              <option
                key={p.id ?? p.project_id ?? p.id}
                value={p.id ?? p.project_id ?? p.id}
              >
                {p.project_name ??
                  p.projectName ??
                  `Project ${p.id ?? p.project_id ?? ""}`}
              </option>
            ))}
          </select>

          <select
            value={inverterFilter}
            onChange={(e) => setInverterFilter(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm"
            disabled={!projectFilter}
          >
            <option value="">{lang("reports.allinverters")}</option>
            {sortByNameAsc(filteredInverterList, "name").map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm"
            placeholder={lang("common.startDate") || "Start Date"}
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || undefined}
            className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm"
            placeholder={lang("common.endDate") || "End Date"}
          />

          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`theme-btn-blue-color border rounded-md px-4 py-2 text-sm ${
              isSubmitDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {lang("common.submit")}
          </button>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="common-grey-color border rounded-3 btn"
        >
          {lang("reports.downloadcsv")}
        </button>
      </div>

      <div className="overflow-x-auto relative">
        {!hasLoadedOnce && loading && (
          <div className="text-center py-6 text-gray-600">Loading...</div>
        )}

        {error && <div className="text-red-600">Error: {error}</div>}
          <>
            {/* Keep the table mounted so search input state is retained */}
            <Table
              data={filteredData}
              columns={columns}
              disablePagination={false}
              onSearchChange={handleSearchChange}
              onPaginationChange={handlePaginationChange}
              pageIndex={pageIndex}
              pageSize={pageSize}
              serverSideTotal={pagination.total} // total rows from server
              initialPageSize={pageSize}
            />
          </>
      </div>
    </div>
  );
};

export default InverterEvnReport;
