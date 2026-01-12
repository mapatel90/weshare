"use client";
import React, { useEffect, useState, useMemo } from "react";
import Table from "@/components/shared/table/Table";
import { apiGet, apiDelete } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiEdit3, FiTrash2, FiEye } from "react-icons/fi";
import { showSuccessToast } from "@/utils/topTost";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";
import { Chip, IconButton, Stack } from "@mui/material";

const InvoiceTable = () => {
  const { lang } = useLanguage();
  const router = useRouter();
  const [invoicesData, setInvoicesData] = useState([]);
  console.log("Invoices Data:", invoicesData);
  const [taxesData, setTaxesData] = useState([]);
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
      if (response?.success && response?.data?.invoices) {
        setInvoicesData(response.data.invoices);
        const apiPagination = response.data.pagination || {};
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

  const fetchTaxes = async () => {
    try {
      const response = await apiGet("/api/settings/taxes");
      if (response?.success && response?.data) {
        setTaxesData(response.data);
      } else {
        setTaxesData([]);
      }
    } catch (e) {
      setTaxesData([]);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await apiGet("/api/projects?status=1&limit=1000");
      if (response?.success && Array.isArray(response?.projectList)) {
        const active = response.projectList.filter(
          (p) => String(p?.status) === "1"
        );
        setProjectList(active);
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
      // Support both shapes: { data: users[] } or { data: { users: users[] } }
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
    fetchTaxes();
    fetchProjects();
    fetchOfftakers();
    const onSaved = () => fetchInvoices();
    window.addEventListener("invoice:saved", onSaved);
    return () => window.removeEventListener("invoice:saved", onSaved);
  }, []);

  console.log("Invoices Data:", invoicesData);
  console.log("Pagination State:", projectFilter, offtakerFilter, searchTerm, pageIndex, pageSize, pagination);
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

  const handleDelete = async (id) => {
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
      const res = await apiDelete(`/api/invoice/${id}`);
      if (res.success) {
        showSuccessToast(lang("invoice.invoiceDeletedSuccessfully"));
        fetchInvoices();
      }
    } catch (_) {
      // noop
    }
  };

  const columns = [
    {
      accessorKey: "invoice_number",
      header: () => lang("invoice.invoiceNumber") || "Invoice Number",
      cell: ({ row }) => {
        const prefix = row?.original?.invoice_prefix || "";
        const number = row?.original?.invoice_number || "";
        if (!prefix && !number) return "-";
        return (
          <Link
            href={`/admin/finance/invoice/view/${row.original.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}
          >
            {`${prefix}-${number}`}
          </Link>
        );
      },
    },
    {
      accessorKey: "project.project_name",
      header: () => lang("invoice.project"),
      cell: ({ row }) => row?.original?.projects?.project_name || "-",
    },
    {
      accessorKey: "offtaker",
      header: () => lang("invoice.offtaker"),
      cell: ({ row }) => {
        const u = row?.original?.users;
        if (!u) return "-";
        return u.full_name || "-";
      },
    },
    {
      accessorKey: "tax",
      header: () => lang("invoice.tax"),
      cell: ({ row }) => {
        const taxId = row?.original?.tax_id;
        if (!taxId) return "-";
        const tax = taxesData.find((t) => t.id === taxId);
        if (!tax) return "-";
        return `${tax.name || ""} (${tax.value || 0}%)`;
      },
    },
    // { accessorKey: "sub_amount", header: () => lang("invoice.subamount") },
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
    // { accessorKey: "total_amount", header: () => lang("invoice.totalUnit") },
    {
      accessorKey: "total_amount",
      header: () => lang("invoice.totalUnit"),
      cell: ({ getValue }) => priceWithCurrency(getValue()),
    },
    // {
    //   accessorKey: "start_time",
    //   header: () => "Start Time",
    //   cell: ({ row }) => formatTime(row.original.start_time),
    // },
    // {
    //   accessorKey: "end_time",
    //   header: () => "End Time",
    //   cell: ({ row }) => formatTime(row.original.end_time),
    // },
    {
      accessorKey: "status",
      header: () => lang("invoice.status"),
      cell: ({ row }) => {
        const status = row.original.status;
        const config = {
          1: { label: lang("invoice.paid"), color: "#17c666" },
          0: { label: lang("invoice.unpaid"), color: "#ea4d4d" },
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
          <IconButton
            size="small"
            onClick={() => handleDelete(row.original.id)}
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
          <Link
            href={`/admin/finance/invoice/view/${row.original.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconButton size="small">
              <FiEye size={18} />
            </IconButton>
          </Link>
        </Stack>
      ),
      meta: {
        disableSort: true,
      },
    },
  ];

  return (
    <div className="p-6 bg-white rounded-3xl shadow-md">
      <div className="d-flex items-center justify-content-between gap-2 mb-4 mt-4 w-full flex-wrap">
        <div className="filter-button">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 mx-2 text-sm"
          >
            <option value="">{lang("reports.allprojects") || "All Projects"}</option>
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_name}
              </option>
            ))}
          </select>

          <select
            value={offtakerFilter}
            onChange={(e) => setOfftakerFilter(e.target.value)}
            className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm"
          >
            <option value="">{lang("invoice.allOfftaker") || "All Offtakers"}</option>
            {offtakerList.map((o) => (
              <option key={o.id} value={o.id}>
                {o.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto relative">
        {!hasLoadedOnce && loading && (
          <div className="text-center py-6 text-gray-600">Loading...</div>
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

export default InvoiceTable;
