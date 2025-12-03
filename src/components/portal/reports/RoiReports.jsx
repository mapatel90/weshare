"use client";
import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const SavingReports = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();

  const [items, setItems] = useState([]);
  const [allowedIds, setAllowedIds] = useState(null);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [inverterFilter, setInverterFilter] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 20;

  // --------------------------------------------
  // 1) Load allowed project IDs (Investor Logic)
  // --------------------------------------------
  useEffect(() => {
    if (!user?.id) return setAllowedIds(null);

    let apiUrl = `/api/investors?page=1&limit=50&userId=${user.id}`;

    apiGet(apiUrl)
      .then((res) => {
        if (!res?.success) return setAllowedIds([]);

        const normalized = res.data
          .map((item) =>
            Number(
              item?.project?.id ||
                item?.project_id ||
                item?.projectId ||
                item?.project?.project_id
            )
          )
          .filter(Boolean);

        setAllowedIds(normalized);
      })
      .catch(() => setAllowedIds([]));
  }, [user?.id]);

  // --------------------------------------------
  // 2) Fetch inverter data (Auto refresh 2 min)
  // --------------------------------------------
  const fetchInverterData = () => {
    apiGet("/api/inverter-data")
      .then((res) => setItems(res?.data || []))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    fetchInverterData(); // First load

    const interval = setInterval(() => {
      fetchInverterData(); // Auto refresh every 2 min
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  // --------------------------------------------
  // Normalize
  // --------------------------------------------
  const normalize = (item, idx) => {
    const pid =
      Number(
        item?.project?.id ||
          item?.project_id ||
          item?.projectId ||
          item?.project?.project_id
      ) || null;

    return {
      id: item.id ?? idx,
      projectId: pid,
      projectName:
        item?.project?.name ||
        item?.project?.project_name ||
        item?.projectName ||
        `Project ${pid}`,
      inverterName:
        item?.inverter?.name ||
        item?.inverter?.inverterName ||
        `Inverter ${item?.inverter_id || ""}`,
      date: item.date || item.created_at || "",
      startTime: item.time || item.startTime || "",
      endTime: item.end_time || item.endTime || "",
      generatedKW: item.generate_kw
        ? (Number(item.generate_kw) / 1000).toFixed(3)
        : item.generatedKW || "",
      Acfrequency: item.ac_frequency || "",
      DailyYield: item.daily_yield || "",
      AnnualYield: item.annual_yield || "",
      TotalYield: item.total_yield || "",
    };
  };

  // --------------------------------------------
  // Apply investor allowed project filtering
  // --------------------------------------------
  const cleaned = useMemo(() => {
    return items.map(normalize).filter((row) => {
      if (Array.isArray(allowedIds)) {
        if (allowedIds.length === 0) return false;
        if (!allowedIds.includes(row.projectId)) return false;
      }
      return true;
    });
  }, [items, allowedIds]);

  // --------------------------------------------
  // Filters + Search
  // --------------------------------------------
  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return cleaned.filter((r) => {
      if (projectFilter && r.projectName !== projectFilter) return false;
      if (inverterFilter && r.inverterName !== inverterFilter) return false;

      if (!q) return true;

      return (
        r.projectName.toLowerCase().includes(q) ||
        r.inverterName.toLowerCase().includes(q) ||
        String(r.date).toLowerCase().includes(q)
      );
    });
  }, [cleaned, search, projectFilter, inverterFilter]);

  // --------------------------------------------
  // Pagination
  // --------------------------------------------
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Keep page within range if data changes
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  // --------------------------------------------
  // CSV Export
  // --------------------------------------------
  const downloadCSV = () => {
    const csv =
      "Project,Inverter,Date,Start,End,GeneratedKW,AcFrequency,DailyYield,AnnualYield,TotalYield\n" +
      filtered
        .map((r) =>
          [
            r.projectName,
            r.inverterName,
            r.date,
            r.startTime,
            r.endTime,
            r.generatedKW,
            r.Acfrequency,
            r.DailyYield,
            r.AnnualYield,
            r.TotalYield
          ].join(",")
        )
        .join("\n");

    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
    link.download = "saving_reports.csv";
    link.click();
  };

  const projects = [...new Set(cleaned.map((r) => r.projectName))];

  const inverters = useMemo(() => {
    const list = projectFilter
      ? cleaned.filter((r) => r.projectName === projectFilter).map((r) => r.inverterName)
      : cleaned.map((r) => r.inverterName);
    return [...new Set(list)];
  }, [cleaned, projectFilter]);

  useEffect(() => {
    setInverterFilter("");
  }, [projectFilter]);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 text-sm"
          placeholder="Search..."
        />

        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="border px-3 py-2 text-sm"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>

        <select
          value={inverterFilter}
          onChange={(e) => setInverterFilter(e.target.value)}
          className="border px-3 py-2 text-sm"
        >
          <option value="">All Inverters</option>
          {inverters.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>

        <button onClick={downloadCSV} className="border px-3 py-2 text-sm">
          Download CSV
        </button>
      </div>

      {/* Table */}
      <table className="min-w-full text-sm shadow-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3">{lang("projects.projectName")}</th>
            <th className="px-4 py-3">{lang("inverter.inverterName")}</th>
            <th className="px-4 py-3">{lang("common.date")}</th>
            <th className="px-4 py-3">{lang("common.time")}</th>
            <th className="px-4 py-3">{lang("common.generatedKW")}</th>
            <th className="px-4 py-3">{lang("common.acFrequency")}</th>
            <th className="px-4 py-3">{lang("reports.dailyYield")}</th>
            <th className="px-4 py-3">{lang("reports.annualYield")}</th>
            <th className="px-4 py-3">{lang("reports.totalYield")}</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((r, idx) => (
            <tr key={idx} className={idx % 2 ? "bg-white" : "bg-gray-50"}>
              <td className="px-4 py-2">{r.projectName}</td>
              <td className="px-4 py-2">{r.inverterName}</td>
              <td className="px-4 py-2">
                {new Date(r.date).toLocaleDateString()}
              </td>
              <td className="px-4 py-2">{r.startTime}</td>
              <td className="px-4 py-2">{r.generatedKW}</td>
              <td className="px-4 py-2">{r.Acfrequency}</td>
              <td className="px-4 py-2">{r.DailyYield}</td>
              <td className="px-4 py-2">{r.AnnualYield}</td>
              <td className="px-4 py-2">{r.TotalYield}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between mt-4 items-center">
        <span>{total} entries</span>

        <div className="flex items-center gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-3 py-1 rounded ${
              page === 1
                ? "bg-gray-200 text-gray-400"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Prev
          </button>

          {(() => {
            const windowSize = 3;
            const windowIndex = Math.floor((page - 1) / windowSize);
            const start = windowIndex * windowSize + 1;
            const end = Math.min(totalPages, start + windowSize - 1);

            const list = [];
            for (let i = start; i <= end; i++) list.push(i);

            return list.map((i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded ${
                  page === i
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {i}
              </button>
            ));
          })()}

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={`px-3 py-1 rounded ${
              page === totalPages
                ? "bg-gray-200 text-gray-400"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavingReports;
