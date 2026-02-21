"use client";
import React, { useEffect, useState, useMemo } from "react";
import Table from "@/components/shared/table/Table";
import { apiGet, apiDelete, apiPost } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiEdit3, FiTrash2, FiEye, FiDownload } from "react-icons/fi";
import { showSuccessToast } from "@/utils/topTost";
import Swal from "sweetalert2";
import Link from "next/link";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";
import { Autocomplete, Chip, IconButton, Stack, TextField } from "@mui/material";
import { buildUploadUrl } from "@/utils/common";
import { PROJECT_STATUS } from "@/constants/project_status";
import usePermissions from "@/hooks/usePermissions";

const InvoiceTable = () => {
  const { lang } = useLanguage();
  const { canEdit, canDelete } = usePermissions();
  const [invoicesData, setInvoicesData] = useState([]);
  const priceWithCurrency = usePriceWithCurrency();

  // Filter and pagination states
  const [projectFilter, setProjectFilter] = useState("");
  const [offtakerFilter, setOfftakerFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Dropdown lists
  const [projectList, setProjectList] = useState([]);
  const [offtakerList, setOfftakerList] = useState([]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        limit: String(pageSize),
      });

      if (projectFilter) {
        params.append("project_id", projectFilter);
      }

      if (offtakerFilter) {
        params.append("offtaker_id", offtakerFilter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await apiGet(`/api/invoice?${params.toString()}`);
      if (response?.success && response?.data) {
        const payload = response.data;
        console.log("Fetched invoices:", payload);
        let invoices = Array.isArray(payload?.invoices)
          ? payload.invoices
          : Array.isArray(payload)
            ? payload
            : [];

        // Filter invoices to show only those with project_status_id = 3 (RUNNING)
        invoices = invoices.filter(
          (invoice) => invoice?.projects?.project_status_id === PROJECT_STATUS.RUNNING
        );

        setInvoicesData(invoices);

        const apiPagination = response.pagination || payload?.pagination || {};
        setPagination({
          page: apiPagination.page || 1,
          limit: apiPagination.limit || pageSize,
          total: apiPagination.total || 0,
          pages: apiPagination.pages || 0,
        });

        const maxPageIndex = Math.max(0, (apiPagination.pages || 1) - 1);

        if (pageIndex > maxPageIndex) {
          setPageIndex(maxPageIndex);
        }
      } else {
        setInvoicesData([]);
      }
    } catch (e) {
      console.error("Error fetching invoices:", e);
      setInvoicesData([]);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await apiPost("/api/projects/dropdown/project", {
        project_status_id: PROJECT_STATUS.RUNNING,
      });
      if (response?.success && Array.isArray(response?.data)) {
        console.log("Fetched projects for invoice filter:", response);
        setProjectList(response.data);
      } else {
        setProjectList([]);
      }
    } catch (e) {
      console.error("Error fetching projects:", e);
      setProjectList([]);
    }
  };

  const fetchOfftakers = async () => {
    try {
      const response = await apiGet("/api/users?role=3&limit=1000");
      const usersArray = Array.isArray(response?.data?.users)
        ? response.data.users
        : Array.isArray(response?.data)
          ? response.data
          : [];
      setOfftakerList(usersArray);
    } catch (e) {
      console.error("Error fetching offtakers:", e);
      setOfftakerList([]);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchProjects();
    fetchOfftakers();
    const onSaved = () => fetchInvoices();
    window.addEventListener("invoice:saved", onSaved);
    return () => window.removeEventListener("invoice:saved", onSaved);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [projectFilter, offtakerFilter, searchTerm, pageIndex, pageSize]);

  useEffect(() => {
    setPageIndex(0);
  }, [projectFilter, offtakerFilter, searchTerm]);

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

  const handleDelete = async (invoice) => {
    if (Number(invoice?.status) === 1) {
      await Swal.fire({
        title: "You can not delete this invoice.",
        icon: "error",
      });
      return;
    }

    const result = await Swal.fire({
      title: lang("messages.confirmDelete"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: lang("common.yesDelete"),
      cancelButtonText: lang("common.cancel"),
    });
    if (!result.isConfirmed) return;
    try {
      const res = await apiDelete(`/api/invoice/${invoice?.id}`);
      if (res.success) {
        showSuccessToast(lang("invoice.invoiceDeletedSuccessfully"));
        fetchInvoices();
      }
    } catch (_) {
      // noop
    }
  };

  const handleDownload = async (invoice) => {
    const fileUrl = buildUploadUrl(invoice?.invoice_pdf);
    if (!fileUrl) {
      Swal.fire({
        title: "Invoice PDF not available",
        icon: "info",
      });
      return;
    }

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const baseName = `${invoice?.invoice_prefix || "INV"}-${
        invoice?.invoice_number || "invoice"
      }`;
      link.href = objectUrl;
      link.download = `${baseName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Failed to download invoice PDF:", error);
      Swal.fire({
        title: "Unable to download invoice PDF",
        icon: "error",
      });
    }
  };

  const columns = [
    {
      id: "invoice_display",
      accessorFn: (row) => {
        const prefix = row?.invoice_prefix || "";
        const number = row?.invoice_number || "";
        const combined = `${prefix ? `${prefix}-` : ""}${number}`;
        return combined || "";
      },
      header: () => lang("invoice.invoiceNumber") || "Invoice Number",
      cell: ({ row }) => {
        const display = row.getValue("invoice_display") || "";
        if (!display.trim()) return "-";
        return (
          <Link
            href={`/admin/finance/invoice/view/${row.original.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}
          >
            {display}
          </Link>
        );
      },
    },
    {
      id: "project_name",
      accessorFn: (row) => row?.projects?.project_name || "",
      header: () => lang("invoice.project"),
      cell: ({ row }) => row.getValue("project_name") || "-",
    },
    {
      id: "offtaker_name",
      accessorFn: (row) => row?.users?.full_name || "",
      header: () => lang("payments.offtaker"),
      cell: ({ row }) => row.getValue("offtaker_name") || "-",
    },
    {
      id: "tax_label",
      accessorFn: (row) => {
        const taxName = row?.taxes?.name;
        const taxValue = row?.taxes?.value;

        if (!taxName) return "";
        if (!taxValue) return "";

        return `${taxName || ""} (${taxValue || 0}%)`;
      },
      header: () => lang("invoice.tax"),
      cell: ({ row }) => row.getValue("tax_label") || "-",
    },
    {
      accessorKey: "sub_amount",
      header: () => lang("invoice.subamount"),
      cell: ({ getValue }) => priceWithCurrency(getValue()),
    },
    {
      accessorKey: "tax_amount",
      header: () => lang("invoice.taxAmount"),
      cell: ({ getValue }) => priceWithCurrency(getValue()),
    },
    {
      accessorKey: "total_amount",
      header: () => lang("invoice.totalUnit"),
      cell: ({ getValue }) => priceWithCurrency(getValue()),
    },
    {
      id: "weshare_profite",
      header: () => lang("invoice.weshare_profite"),
      cell: ({ row }) => {
        const data = row.original; // always fresh row
        const weshareProfite = data?.projects?.weshare_profit || 0;
        const totalAmount = data?.total_amount || 0;
        const weshareAmount = (totalAmount * weshareProfite) / 100;
        return priceWithCurrency(weshareAmount);
      }
    },
    {
      id: "investor_profit",
      header: () => lang("invoice.investor_profite"),
      cell: ({ row }) => {
        const data = row.original; // always fresh row
        const offtakerProfite = data?.projects?.investor_profit || 0;
        const totalAmount = data?.total_amount || 0;
        const offtakerAmount = (totalAmount * offtakerProfite) / 100;
        return priceWithCurrency(offtakerAmount);
      }
    },
    {
      accessorKey: "status",
      header: () => lang("invoice.status"),
      cell: ({ row }) => {
        const status = row.original.status;
        const config = {
          1: { label: lang("invoice.paid"), color: "#17c666" },
          0: { label: lang("common.pending"), color: "#ea4d4d" },
        }[status] || { label: String(status ?? "-"), color: "#999" };
        return (
          <Chip
            label={config.label}
            sx={{
              backgroundColor: config.color,
              color: "#fff",
              fontWeight: 500,
              minWidth: 80,
              "&:hover": {
                backgroundColor: config.color,
                opacity: 0.9,
              },
            }}
          />
        );
      },
    },
    {
      accessorKey: "actions",
      header: () => lang("invoice.actions"),
      cell: ({ row }) => (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap" }}>
          {canEdit("invoices") && (
            <Link
              href={`/admin/finance/invoice/edit/${row.original.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconButton
                size="small"
                sx={{
                  color: "#1976d2",
                  transition: "transform 0.2s ease",
                  "&:hover": {
                    backgroundColor: "rgba(25, 118, 210, 0.08)",
                    transform: "scale(1.1)",
                  },
                }}
              >
                <FiEdit3 size={18} />
              </IconButton>
            </Link>
          )}
          {canDelete("invoices") && (
            <IconButton
              size="small"
              onClick={() => handleDelete(row.original)}
              sx={{
                color: "#d32f2f",
                transition: "transform 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(211, 47, 47, 0.08)",
                  transform: "scale(1.1)",
                },
              }}
            >
              <FiTrash2 size={18} />
            </IconButton>
          )}
          <Link
            href={`/admin/finance/invoice/view/${row.original.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconButton
              size="small"
              sx={{
                color: "#1976d2",
                transition: "transform 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                  transform: "scale(1.1)",
                },
              }}
            >
              <FiEye size={18} />
            </IconButton>
          </Link>
          {row.original.invoice_pdf && (
            <IconButton
              size="small"
              onClick={() => handleDownload(row.original)}
              sx={{
                color: "#2e7d32",
                transition: "transform 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(46, 125, 50, 0.08)",
                  transform: "scale(1.1)",
                },
              }}
            >
              <FiDownload size={18} />
            </IconButton>
          )}
        </Stack>
      ),
      meta: {
        disableSort: true,
      },
    },
  ];

  return (
    <div className="p-6 bg-white shadow-md rounded-3xl">
      <div className="flex-wrap items-center w-full gap-2 mt-4 mb-4 d-flex justify-content-between">
        <div className="filter-button" style={{ display: "flex", gap: "2%" }}>
          <Autocomplete
            size="small"
            options={projectList}
            value={
              projectList.find(
                (p) => (p.id ?? p.project_id) === projectFilter
              ) || null
            }
            onChange={(e, newValue) => {
              setPageIndex(0);
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
            fullWidth
            options={offtakerList}
            value={
              offtakerList.find((o) => o.id === offtakerFilter) || null
            }
            onChange={(e, newValue) => {
              setPageIndex(0);
              setOfftakerFilter(newValue ? newValue.id : "");
            }}
            getOptionLabel={(option) => option?.full_name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang("invoice.allOfftaker") || "All Offtakers"}
                placeholder="Search offtaker..."
              />
            )}
            sx={{ minWidth: 260 }}
          />
        </div>
      </div>

      <div className="relative overflow-x-auto">
        {!hasLoadedOnce && loading && (
          <div className="py-6 text-center text-gray-600">Loading...</div>
        )}

        {hasLoadedOnce && (
          <>
            <Table
              data={invoicesData}
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
              <div className="absolute inset-0 flex items-center justify-center text-gray-600 bg-white/70">
                Refreshing...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InvoiceTable;
