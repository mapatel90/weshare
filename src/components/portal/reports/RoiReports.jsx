"use client";
import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Table from "@/components/shared/table/Table";

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

  // 2) Fetch reports with server-side filters (like SavingReports)
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: "1",
        downloadAll: "1",
      });

      if (projectFilter) params.append("projectId", projectFilter);
      if (inverterFilter) params.append("inverterId", inverterFilter);
      if (searchTerm) params.append("search", searchTerm);

      const res = await apiGet(`/api/inverter-data?${params.toString()}`);
      const items = Array.isArray(res?.data) ? res.data : [];

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

      const total = mappedData.length;
      setPagination({
        page: 1,
        limit: PAGE_SIZE,
        total,
        pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      });
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
  }, [projectFilter, inverterFilter, searchTerm, allowedIds]);

  // 3) Filtered data (client-side on fetched set)
  const filteredData = useMemo(() => {
    return reportsData.filter((d) => {
      if (projectFilter && String(d.projectId) !== projectFilter) return false;
      if (inverterFilter && String(d.inverterId) !== inverterFilter) return false;
      return true;
    });
  }, [projectFilter, inverterFilter, reportsData]);

  // Reset inverter filter when project changes
  useEffect(() => {
    if (!inverterFilter) return;
    const available = new Set((inverterList || []).map((i) => String(i.id)));
    if (!available.has(inverterFilter)) setInverterFilter("");
  }, [projectFilter, inverterList, inverterFilter]);

  const total = filteredData.length;

  // Format date helper
  const formatDateDDMMYYYY = (raw) => {
    if (!raw) return "";
    const datePart = String(raw).trim().split(/[ T]/)[0];
    const [y, m, d] = datePart.split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
    return "";
  };

  // CSV Download
  const handleDownloadCSV = async () => {
    try {
      const rows = filteredData.map((r) => ({
        projectName: r.projectName,
        inverterName: r.inverterName,
        date: r.date,
        time: r.time,
        generatedKW: r.generatedKW,
        Acfrequency: r.Acfrequency,
        DailyYield: r.DailyYield,
        AnnualYield: r.AnnualYield,
        TotalYield: r.TotalYield,
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
      link.setAttribute("download", "roi_reports.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("CSV download failed", err);
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
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm"
          >
            <option value="">{lang("reports.allprojects")}</option>
            {projectList.map((p) => (
              <option key={p.id ?? p.project_id} value={p.id ?? p.project_id}>
                {p.project_name || `Project ${p.id}`}
              </option>
            ))}
          </select>

          <select
            value={inverterFilter}
            onChange={(e) => setInverterFilter(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm"
          >
            <option value="">{lang("reports.allinverters")}</option>
            {inverterList.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
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

        {hasLoadedOnce && filteredData.length === 0 && !error && !loading && (
          <div className="text-center py-6 text-gray-600">
            {lang("common.noData")}
          </div>
        )}

        {hasLoadedOnce && (
          <>
            <Table
              data={filteredData}
              columns={columns}
              disablePagination={false}
              onSearchChange={setSearchTerm}
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
