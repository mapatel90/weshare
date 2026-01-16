"use client";
import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Table from "@/components/shared/table/Table";

const InverterEnvReport = () => {
  const PAGE_SIZE = 50; // show 50 rows per page
  const { user } = useAuth();
  const { lang } = useLanguage();

  const [reportsData, setReportsData] = useState([]);
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

  // Dropdown lists
  const [projectList, setProjectList] = useState([]);
  const [inverterList, setInverterList] = useState([]);

  const [appliedProject, setAppliedProject] = useState("");
  const [appliedInverter, setAppliedInverter] = useState("");
  const isSubmitDisabled = !projectFilter || !inverterFilter;


  // -----------------------------
  // Fetch Project List
  // -----------------------------
  const fetchProjectList = async () => {
    try {
      if (!user?.id) return;

      const res = await apiPost("/api/projects/dropdown/project", {
        offtaker_id: user.id
      });

      if (res && res.success && Array.isArray(res.data)) {
        setProjectList(res.data);
      } else if (Array.isArray(res)) {
        setProjectList(res);
      } else {
        setProjectList([]);
      }
    } catch (err) {
      console.error("Error fetching project list:", err);
      setProjectList([]);
    }
  };

  // -----------------------------
  // Fetch Inverter List
  // -----------------------------
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

  // -----------------------------
  // Fetch Reports Function
  // -----------------------------
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError("User not logged in");
        setLoading(false);
        return;
      }


      // if (!projectFilter || !inverterFilter) {
      //   setReportsData([]);
      //   setPagination({
      //     page: 1,
      //     limit: PAGE_SIZE,
      //     total: 0,
      //     pages: 1,
      //   });
      //   return;
      // }

      const params = new URLSearchParams({
        page: "1",
        downloadAll: "1", // fetch all data
      });

      // Add projectId filter if selected
      if (appliedProject) {
        params.append("projectId", appliedProject);
      }

      if (appliedInverter) {
        params.append("inverterId", appliedInverter);
      }


      // Add search term
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const res = await apiGet(`/api/inverter-data?${params.toString()}`);
      const items = Array.isArray(res?.data) ? res.data : [];

      // Filter to only include offtaker's projects
      const offtakerProjectIds = (res?.projectList || [])
        .filter((p) => Number(p.offtaker_id) === Number(user.id))
        .map((p) => Number(p.id));

      const filteredItems = items.filter((item) => {
        const projectId = Number(item.project_id ?? item.projectId);
        return offtakerProjectIds.includes(projectId);
      });

      const mappedData = filteredItems.map((item) => ({
        id: item.id,
        projectId: item.project_id ?? item.projectId ?? null,
        inverterId: item.project_inverter_id ?? null,
        projectName:
          item.projects?.project_name || `Project ${item.project_id ?? ""}`,
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

      // Note: Project and inverter lists are now fetched separately via fetchProjectList and fetchInverterList
      // This ensures dropdowns are populated on component mount, not just after submit

      const apiTotal = mappedData.length;
      setPagination({
        page: 1,
        limit: PAGE_SIZE,
        total: apiTotal,
        pages: Math.max(1, Math.ceil(apiTotal / PAGE_SIZE)),
      });

      setError(null);
    } catch (err) {
      setError(err?.message || "Failed to load reports");
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

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

  // Reset inverter filter when inverter list changes and selected inverter is not available
  useEffect(() => {
    if (!inverterFilter) return;

    const available = new Set((inverterList || []).map((i) => String(i.id)));
    if (!available.has(inverterFilter)) {
      setInverterFilter("");
    }
  }, [inverterList, inverterFilter]);


  const handleSubmit = () => {
    if (!projectFilter || !inverterFilter) {
      alert("Please select both Project and Inverter");
      return;
    }

    // Clear old data and reset loading state when submitting new filters
    setReportsData([]);
    setHasLoadedOnce(false);
    setLoading(true);
    setAppliedProject(projectFilter);
    setAppliedInverter(inverterFilter);
  };

  useEffect(() => {
    if (!appliedProject || !appliedInverter) return;

    fetchReports();

    const interval = setInterval(fetchReports, 120000);
    return () => clearInterval(interval);
  }, [appliedProject, appliedInverter, searchTerm, user?.id]);


  // -----------------------------
  // Filtered Data
  // -----------------------------
  const filteredData = useMemo(() => {
    return reportsData.filter((d) => {
      if (appliedProject && String(d.projectId) !== appliedProject) return false;
      if (appliedInverter && String(d.inverterId) !== appliedInverter)
        return false;
      return true;
    });
  }, [appliedProject, appliedInverter, reportsData]);

  // -----------------------------
  // CSV Download
  // -----------------------------
  const handleDownloadCSV = async () => {
    try {

      if (!projectFilter || !inverterFilter) {
        alert("Please select both Project and Inverter to download CSV");
        return;
      }

      const params = new URLSearchParams();
      if (projectFilter) params.append("projectId", projectFilter);
      if (inverterFilter) params.append("inverterId", inverterFilter);
      if (searchTerm && searchTerm.trim())
        params.append("search", searchTerm.trim());
      params.append("downloadAll", "1");

      const res = await apiGet(`/api/inverter-data?${params.toString()}`);
      const items = Array.isArray(res?.data) ? res.data : [];

      // Filter to offtaker's projects
      const offtakerProjectIds = (res?.projectList || [])
        .filter((p) => Number(p.offtaker_id) === Number(user.id))
        .map((p) => Number(p.id));

      const filteredItems = items.filter((item) => {
        const projectId = Number(item.project_id ?? item.projectId);
        return offtakerProjectIds.includes(projectId);
      });

      const rows = filteredItems.map((item) => ({
        projectName:
          item.projects?.project_name || `Project ${item.project_id ?? ""}`,
        inverterName: item?.project_inverters?.inverter_name || "-",
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
        "data:text/csv;charset=utf-8,\uFEFF" +
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
      {
        accessorKey: "AnnualYield",
        header: () => lang("reports.annualYield"),
      },
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
              <option key={p.id ?? p.project_id} value={p.id ?? p.project_id}>
                {p.project_name ?? p.projectName ?? `Project ${p.id ?? ""}`}
              </option>
            ))}
          </select>

          <select
            value={inverterFilter}
            onChange={(e) => setInverterFilter(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm"
          >
            <option value="">{lang("reports.allinverters")}</option>
            {inverterList.map((i) => (
              <option key={i.id} value={i.id}>
                {i.inverter_name ?? i.name ?? `Inverter ${i.id}`}
              </option>
            ))}
          </select>

          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`theme-btn-blue-color border rounded-md px-4 py-2 text-sm ${isSubmitDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Submit
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
        {/* {!hasLoadedOnce && loading && (
          <div className="text-center py-6 text-gray-600">Loading...</div>
        )} */}

        {error && <div className="text-red-600">Error: {error}</div>}
        {console.log("filteredData", filteredData)}
        {/* {filteredData.length === 0 && !error && (
          <div className="text-center py-6 text-gray-600">
            {lang("common.noData")}
          </div>
        )} */}

        {/* {filteredData.length > 0 && ( */}
        <>
          <Table
            data={filteredData}
            columns={columns}
            disablePagination={false}
            onSearchChange={setSearchTerm}
            serverSideTotal={pagination.total}
            initialPageSize={PAGE_SIZE}
          />
          {/* {loading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-gray-600">
                Refreshing...
              </div>
            )} */}
        </>
        {/* )} */}
      </div>
    </div>
  );
};

export default InverterEnvReport;
