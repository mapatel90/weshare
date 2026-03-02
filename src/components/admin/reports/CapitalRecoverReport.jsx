"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import Table from "@/components/shared/table/Table";
import { apiGet } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { ROLES } from "@/constants/roles";

const PAGE_SIZE = 50;

const CapitalRecoverReport = () => {
  const { lang } = useLanguage();

  const [reportsData, setReportsData] = useState([]);
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
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  // Investor filter (admin can pick investor)
  const [investorList, setInvestorList] = useState([]);
  const [investorFilter, setInvestorFilter] = useState(""); // selected investor id (string)
  const [appliedInvestor, setAppliedInvestor] = useState("");

  // Fetch investors for dropdown
  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        const res = await apiGet(`/api/users?role=${ROLES.INVESTOR}`);
        const items = res?.data?.users || res?.data || [];
        setInvestorList(Array.isArray(items) ? items : []);
      } catch (e) {
        setInvestorList([]);
      }
    };

    fetchInvestors();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        limit: String(PAGE_SIZE),
      });

      if (appliedSearchTerm) params.append("search", appliedSearchTerm);
      if (appliedInvestor) params.append("investor_id", appliedInvestor);

      const res = await apiGet(
        `/api/projects/report/capital-recovery?${params.toString()}`
      );
      const items = Array.isArray(res?.data) ? res.data : [];

      const mappedData = items.map((item, idx) => ({
        id: item.id ?? item.project_id ?? idx,
        projectId: item.project_id ?? item.id ?? null,
        projectName: item.project_name || `Project ${item.project_id ?? ""}`,
        askingPrice: item.asking_price || "0",
        totalPayout: item.total_payout || "0",
        invoiceTotalAmount: item.invoice_total_amount || "0",
        capitalRecovery: item.capital_recovery || "0",
      }));

      setReportsData(mappedData);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSearchTerm, appliedInvestor, pageIndex]);

  const filteredData = reportsData;

  const handleSearchChange = (value) => {
    setPageIndex(0);
    setSearchTerm(value);
    setAppliedSearchTerm(value);
  };

  const handlePaginationChange = (nextPagination) => {
    setPageIndex(nextPagination.pageIndex);
    setPagination(nextPagination);
  };

  const handleInvestorChange = (event, newValue) => {
    const nextId = newValue ? String(newValue.id) : "";
    setInvestorFilter(nextId);
    setAppliedInvestor(nextId);
    setPageIndex(0);
  };

  const handleDownloadCSV = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: "1",
        limit: "1000000",
      });

      if (appliedSearchTerm) params.append("search", appliedSearchTerm);
      if (appliedInvestor) params.append("investor_id", appliedInvestor);

      const res = await apiGet(
        `/api/projects/report/capital-recovery?${params.toString()}&downloadAll=true`
      );
      const items = Array.isArray(res?.data) ? res.data : [];

      const csvData = items.map((item, idx) => ({
        projectName:
          item.project_name || `Project ${item.project_id ?? idx ?? ""}`,
        askingPrice: item.asking_price || "0",
        totalPayout: item.total_payout || "0",
        invoiceTotalAmount: item.invoice_total_amount || "0",
        capitalRecovery: item.capital_recovery || "0",
      }));

      const headers = [
        lang("projects.projectName", "Project Name"),
        lang("projects.askingPrice", "Asking Price"),
        lang("reports.totalInvoiceAmount", "Total Invoice Amount"),
        lang("reports.capitalRecovery", "Capital Recovery"),
      ];

      const csvRows = [
        headers.join(","),
        ...csvData.map((row) => {
          const values = [
            `"${(row.projectName || "-").replace(/"/g, '""')}"`,
            row.askingPrice ?? "0",
            row.invoiceTotalAmount ?? "0",
            `${parseFloat(row.capitalRecovery || 0).toFixed(2)}%`,
          ];
          return values.join(",");
        }),
      ];

      const csvContent = csvRows.join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      let filename = "capital_recovery_reports";
      filename += `_${new Date().toISOString().split("T")[0]}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err?.message || "Failed to download CSV");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value || value === "0") return "0.00";
    const num = parseFloat(value);
    return Number.isNaN(num) ? "0.00" : num.toFixed(2);
  };

  const formatPercentage = (value) => {
    if (!value || value === "0") return "0.00%";
    const num = parseFloat(value);
    return Number.isNaN(num) ? "0.00%" : `${num.toFixed(2)}%`;
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "projectName",
        header: () => lang("projects.projectName", "Project Name"),
      },
      {
        accessorKey: "askingPrice",
        header: () => lang("projects.askingPrice", "Asking Price"),
        cell: ({ row }) => formatCurrency(row.original.askingPrice),
      },
      {
        accessorKey: "invoiceTotalAmount",
        header: () => lang("reports.totalInvoiceAmount", "Total Invoice Amount"),
        cell: ({ row }) => formatCurrency(row.original.invoiceTotalAmount),
      },
      {
        accessorKey: "capitalRecovery",
        header: () => lang("reports.capitalRecovery", "Capital Recovery"),
        cell: ({ row }) => formatPercentage(row.original.capitalRecovery),
      },
    ],
    [lang]
  );

  return (
    <div className="p-6 bg-white rounded-3xl shadow-md relative">
      {/* Fullscreen CSV / fetch Loader */}
      {loading && !hasLoadedOnce && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-3xl">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-lg">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-700 font-medium">
              {lang("common.loading", "Loading...")}
            </p>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="d-flex items-center justify-content-between gap-2 mb-4 mt-4 w-full flex-wrap">
        <div className="filter-button flex flex-wrap gap-2 d-flex">
          <Autocomplete
            size="small"
            options={investorList}
            value={
              investorList.find((inv) => String(inv.id) === investorFilter) ||
              null
            }
            onChange={handleInvestorChange}
            getOptionLabel={(option) =>
              option.full_name ||
              option.name ||
              option.email ||
              `Investor ${option.id ?? ""}`
            }
            isOptionEqualToValue={(option, value) =>
              String(option.id) === String(value.id)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang("authentication.becomeInvestor") || "Investor"}
                placeholder={
                  lang("common.searchInvestor") || "Search investor..."
                }
              />
            )}
            sx={{ minWidth: 260 }}
          />
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
            {loading && hasLoadedOnce && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-gray-600">
                {lang("common.refreshing", "Refreshing...")}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CapitalRecoverReport;