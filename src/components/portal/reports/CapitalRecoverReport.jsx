"use client";
import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Table from "@/components/shared/table/Table";
import { showErrorToast } from "@/utils/topTost";

const CapitalRecoverReport = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const PAGE_SIZE = 50;
  const [reportsData, setReportsData] = useState([]);
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
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  // Note: no project dropdown needed for this report

  // 2) Fetch reports with server-side filters (like SavingReports)
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        limit: String(pageSize),
      });

      if (appliedSearchTerm) params.append("search", appliedSearchTerm);
      const res = await apiGet(
        `/api/projects/report/capital-recovery?${params.toString()}`
      );
      const items = Array.isArray(res?.data) ? res.data : [];

      const mappedData = items.map((item, idx) => ({
        id: item.id ?? item.project_id ?? idx,
        projectId: item.project_id ?? item.id ?? null,
        projectName: item.project_name || `Project ${item.project_id ?? ""}`,
        capexPerKwp: item.capex_per_kwp || "0",
        askingPrice: item.asking_price || "0",
        totalPayout: item.total_payout || "0",
        invoiceTotalAmount: item.invoice_total_amount || "0",
        capitalRecovery: item.capital_recovery || "0",
      }));

      setReportsData(mappedData);

      // Set pagination from server response
      if (res.pagination) {
        setPagination({
          page: res.pagination.page || pageIndex + 1,
          limit: res.pagination.limit || PAGE_SIZE,
          total: res.pagination.total || mappedData.length,
          pages:
            res.pagination.pages ||
            Math.max(1, Math.ceil(mappedData.length / PAGE_SIZE)),
        });
      } else {
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
  }, [appliedSearchTerm, pageIndex, pageSize]);

  // (no dropdown fetch)

  // 4) Server-side filtered data
  const filteredData = reportsData;

  const handleSearchChange = (value) => {
    setPageIndex(0);
    setSearchTerm(value);
    setAppliedSearchTerm(value);
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
      setLoading(true);

      // Build params to fetch all data for CSV export
      const params = new URLSearchParams({
        page: "1",
        limit: "1000000", // Large limit to get all data
      });

      if (appliedSearchTerm) params.append("search", appliedSearchTerm);

      const res = await apiGet(
        `/api/projects/report/capital-recovery?${params.toString()}&downloadAll=true`
      );
      const items = Array.isArray(res?.data) ? res.data : [];

      const csvData = items.map((item, idx) => ({
        projectName:
          item.project_name || `Project ${item.project_id ?? idx ?? ""}`,
        capexPerKwp: item.capex_per_kwp || "0",
        totalPayout: item.total_payout || "0",
        invoiceTotalAmount: item.invoice_total_amount || "0",
        capitalRecovery: item.capital_recovery || "0",
      }));

      // Define CSV headers
      const headers = [
        lang("projects.projectName", "Project Name"),
        lang("projects.capex_per_kwp", "Asking Price"),
        lang("reports.totalInvoiceAmount", "Total Invoice Amount"),
        lang("reports.capitalRecovery", "Capital Recovery"),
      ];

      // Convert data to CSV rows
      const csvRows = [
        headers.join(","), // Header row
        ...csvData.map((row) => {
          const values = [
            `"${(row.projectName || "-").replace(/"/g, '""')}"`,
            row.capexPerKwp ?? "0",
            row.invoiceTotalAmount ?? "0",
            `${parseFloat(row.capitalRecovery || 0).toFixed(2)}%`,
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
      let filename = "capital_recovery_reports";
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
        accessorKey: "capexPerKwp",
        header: () => lang("projects.capex_per_kwp", "Asking Price"),
        cell: ({ row }) => formatCurrency(row.original.capexPerKwp),
      },
      {
        accessorKey: "invoiceTotalAmount",
        header: () => lang("reports.acumulativerevenue", "Acumulative Revenue"),
        cell: ({ row }) => formatCurrency(row.original.invoiceTotalAmount),
      },
      {
        accessorKey: "capitalRecovery",
        header: () => lang("reports.capitalRecovery", "Capital Recovery"),
        cell: ({ row }) => formatPercentage(row.original.capitalRecovery),
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
      <div className="flex flex-wrap gap-2 mb-4 mt-4 w-full justify-end">
        <button
          className="common-grey-color border rounded-3 btn w-full sm:w-auto"
          onClick={handleDownloadCSV}
        >
          {lang("reports.downloadcsv")}
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto relative">
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
              pageSize={pageSize}
              serverSideTotal={pagination.total}
              initialPageSize={pageSize}
            />
            {loading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-gray-600">
                Refreshing...
              </div>
            )}
          </>
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
        {!hasLoadedOnce && loading && (
          <div className="text-center text-sm text-gray-500 py-8">Loading...</div>
        )}
        {error && <div className="text-red-600 text-sm">Error: {error}</div>}
        {hasLoadedOnce && filteredData.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-8">
            {lang("common.noData", "No data found")}
          </div>
        ) : (
          hasLoadedOnce && filteredData.map((item, idx) => (
            <div
              key={item.id ?? idx}
              className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-3 pb-3 border-b border-gray-100">
                <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{item.projectName}</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">{lang("projects.askingPrice", "Asking Price")}:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(item.askingPrice)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">{lang("reports.acumulativerevenue", "Acumulative Revenue")}:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(item.invoiceTotalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">{lang("reports.capitalRecovery", "Capital Recovery")}:</span>
                  <span className="font-medium text-gray-900">{formatPercentage(item.capitalRecovery)}</span>
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
    </div>
  );
};

export default CapitalRecoverReport;
