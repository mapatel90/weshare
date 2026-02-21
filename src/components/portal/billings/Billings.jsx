"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Swal from "sweetalert2";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";
import { useLanguage } from "@/contexts/LanguageContext";
import { PROJECT_STATUS } from "@/constants/project_status";
import { ROLES } from "@/constants/roles";
import { buildUploadUrl } from "@/utils/common";
import { Autocomplete, TextField } from "@mui/material";

const statusColors = {
  Paid: "bg-green-100 text-green-700",
  Unfunded: "bg-orange-100 text-orange-700",
  Pending: "bg-gray-200 text-gray-700",
  Draft: "bg-gray-200 text-gray-700",
  Unpaid: "bg-orange-100 text-orange-700",
  PaidNumeric: "bg-green-100 text-green-700",
};

const Billings = () => {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState("");
  const [dropdownProjects, setDropdownProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [taxesData, setTaxesData] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const { user } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();
  const priceWithCurrency = usePriceWithCurrency();

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB");
  };

  const formatCurrency = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return value ?? "—";
    return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  const getStatusColorClass = (statusValue) => {
    const colorMap = {
      0: "bg-gray-200 text-gray-700", // Pending Verification
      1: "bg-green-100 text-green-700", // Paid
    };
    return colorMap[statusValue] ?? "bg-gray-200 text-gray-700";
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user?.id) {
        setInvoices([]);
        return;
      }

      setInvoicesLoading(true);
      setInvoicesError("");

      try {
        const params = new URLSearchParams({
          page: String(pageIndex + 1),
          limit: String(pageSize),
        });

        if (user.role === ROLES.OFFTAKER) {
          params.append("offtaker_id", String(user.id));
        }

        if (search && search.trim()) {
          params.append("search", search.trim());
        }

        if (statusFilter !== "") {
          params.append("status", statusFilter);
        }

        if (projectFilter) {
          params.append("project_id", projectFilter);
        }

        const response = await apiGet(`/api/invoice?${params.toString()}`, {
          includeAuth: true,
        });

        const list = response?.data;

        if (response?.success && Array.isArray(list)) {
          const normalized = list
            .filter((inv) => inv?.projects?.project_status_id === PROJECT_STATUS.RUNNING)
            .map((inv, idx) => {
            const taxId = inv?.tax_id;
            let taxDisplay = "";
            if (taxId) {
              const tax = taxesData.find((t) => t.id === taxId);
              if (tax) {
                taxDisplay = `${tax.name || ""} (${tax.value || 0}%)`;
              }
            }
            
            return {
              id: inv?.id ?? idx,
              projectId: inv?.projects?.id ?? null,
              projectName: inv?.projects?.project_name || "—",
              invoicePrefix: inv?.invoice_prefix || "",
              invoiceNumber: inv?.invoice_number || "",
              invoicePdf: inv?.invoice_pdf || "",
              invoiceName: inv?.invoice_number
                ? `${inv?.invoice_prefix || ""}-${inv.invoice_number}`.trim()
                : "—",
              invoiceDate: formatDate(inv?.invoice_date),
              dueDate: formatDate(inv?.due_date),
              tax: taxDisplay,
              subAmount: priceWithCurrency(inv?.sub_amount),
              taxAmount: priceWithCurrency(inv?.tax_amount),
              amount: inv?.total_amount ?? inv?.amount ?? 0,
              status: inv?.status,
              download: true,
            };
          });

          setInvoices(normalized);

          const apiPagination = response.pagination || {};
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
          setInvoices([]);
        }
      } catch (error) {
        console.error("Failed to fetch invoices", error);
        setInvoices([]);
        setInvoicesError("Unable to load invoices.");
      } finally {
        setInvoicesLoading(false);
      }
    };

    fetchInvoices();
  }, [
    user?.id,
    user?.role,
    search,
    statusFilter,
    projectFilter,
    pageIndex,
    pageSize,
    taxesData,
  ]);

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

  useEffect(() => {
    fetchTaxes();
  }, []);

  // Fetch stable projects list for dropdown independent of filters
  useEffect(() => {
    const fetchDropdownProjects = async () => {
      if (!user?.id) {
        setDropdownProjects([]);
        return;
      }

      setProjectsLoading(true);
      setProjectsError("");
      try {
        const payload = {
          project_status_id: PROJECT_STATUS.RUNNING,
        };
        
        if (user.role === ROLES.OFFTAKER) {
          payload.offtaker_id = user.id;
        }

        const response = await apiPost("/api/projects/dropdown/project", payload, {
          includeAuth: true,
        });

        const list = response?.data;
        if (response?.success && Array.isArray(list)) {
          const projectsArr = list.map((project) => ({
            id: project.id,
            name: project.project_name,
          }));
          setDropdownProjects(projectsArr);
        } else {
          setDropdownProjects([]);
        }
      } catch (err) {
        console.error("Failed to fetch dropdown projects", err);
        setProjectsError("Unable to load projects.");
        setDropdownProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchDropdownProjects();
  }, [user?.id, user?.role]);

  const handleSearchChange = (value) => {
    setPageIndex(0);
    setSearch(value);
  };

  const handleStatusFilterChange = (value) => {
    setPageIndex(0);
    setStatusFilter(value);
  };

  const handleProjectFilterChange = (value) => {
    setPageIndex(0);
    setProjectFilter(value);
  };

  const handlePageChange = (newPageIndex) => {
    setPageIndex(newPageIndex);
  };

  const filteredInvoices = invoices;

  const handleDownload = async (invoice) => {
    const fileUrl = buildUploadUrl(invoice?.invoicePdf);
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
      const baseName = `${invoice?.invoicePrefix || "INV"}-${
        invoice?.invoiceNumber || "invoice"
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

  const handleView = (invoiceId) => {
    router.push(`/offtaker/billings/invoice/${invoiceId}`);
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-xl">
      <div className="flex flex-col gap-2 mb-4 md:flex-row md:items-center md:justify-between">
        {/* Project Dropdown Filter */}
        <div className="flex flex-col gap-1">
          <Autocomplete
            size="small"
            options={dropdownProjects}
            value={dropdownProjects.find((p) => p.id === projectFilter) || null}
            onChange={(e, newValue) => handleProjectFilterChange(newValue ? newValue.id : "")}
            getOptionLabel={(option) => option.name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={projectsLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang("dashboard.all_project", "All Projects")}
                placeholder={lang("common.searchProject", "Select project...")}
              />
            )}
            sx={{ minWidth: 260 }}
          />
          {projectsError && (
            <p className="text-xs text-red-600">{projectsError}</p>
          )}
        </div>

        <div className="relative"></div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={lang("invoice.searchProjectOrInvoice", "Search project or invoice...")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <Autocomplete
            size="small"
            options={[
              { value: "1", label: lang("invoice.paid", "Paid") },
              { value: "0", label: lang("common.pending", "Pending") },
            ]}
            value={
              [
                { value: "1", label: lang("invoice.paid", "Paid") },
                { value: "0", label: lang("common.pending", "Pending") },
              ].find((s) => s.value === statusFilter) || null
            }
            onChange={(e, newValue) => handleStatusFilterChange(newValue ? newValue.value : "")}
            getOptionLabel={(option) => option.label || ""}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang("invoice.allStatus", "All Status")}
                placeholder={lang("common.selectStatus", "Select status...")}
              />
            )}
            sx={{ minWidth: 200 }}
          />
        </div>
      </div>

      <div className="border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-left">
                {lang("projects.projectName", "Project Name")}
              </th>
              <th className="px-4 py-3 font-semibold text-left">
                {lang("invoice.invoiceName", "Invoice Name")}
              </th>
              <th className="px-2 py-3 font-semibold text-left">
                {lang("invoice.invoiceDate", "Invoice Date")}
              </th>
              <th className="px-2 py-3 font-semibold text-left">{lang("invoice.dueDate", "Due Date")}</th>
              <th className="px-2 py-3 font-semibold text-left">{lang("invoice.tax", "Tax")}</th>
              <th className="px-2 py-3 font-semibold text-left">{lang("invoice.subamount", "Sub Amount")}</th>
              <th className="px-2 py-3 font-semibold text-left">{lang("invoice.taxAmount", "Tax Amount")}</th>
              <th className="px-2 py-3 font-semibold text-left">
                {lang("invoice.totalAmount", "Total Amount")}
              </th>
              <th className="px-2 py-3 font-semibold text-left">{lang("invoice.status", "Status")}</th>
              <th className="px-2 py-3 font-semibold text-left">{lang("common.download", "Download")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>
                  No invoices found
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv, idx) => (
                <tr
                  key={inv.id}
                  className={idx % 2 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-4 py-2 font-medium whitespace-nowrap">
                    {inv.projectName}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Link
                      href={`/offtaker/billings/invoice/${inv.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#1976d2",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      {inv.invoiceName}
                    </Link>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {inv.invoiceDate}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">{inv.dueDate}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{inv.tax}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {inv.subAmount}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {inv.taxAmount}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {priceWithCurrency(inv.amount)}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        getStatusColorClass(inv.status)
                      }`}
                    >
                      {inv.status === 1 ? lang("invoice.paid", "Paid") : lang("common.pending", "Pending")}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {inv.download ? (
                      <div className="relative inline-block text-left">
                        <button
                          className="px-2 py-1 bg-transparent border-none cursor-pointer dropdown-action-btn"
                          onClick={() => setDropdownOpen(idx)}
                        >
                          <span className="text-2xl">&#8942;</span>
                        </button>
                        {dropdownOpen === idx && (
                          <>
                            {/* Backdrop for outside click */}
                            <div
                              className="fixed inset-0 z-10"
                              style={{ background: "transparent" }}
                              onClick={() => setDropdownOpen(null)}
                            />
                            <div className="absolute right-0 z-20 w-32 mt-2 bg-white border rounded shadow-lg dropdown-action-menu">
                              {inv.invoicePdf && (
                                <button
                                  className="block w-full px-4 py-2 text-left text-blue-600 hover:bg-gray-100"
                                  onClick={() => {
                                    handleDownload(inv);
                                    setDropdownOpen(null);
                                  }}
                                >
                                  {lang("common.download", "Download")}
                                </button>
                              )}
                              <button
                                className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  handleView(inv.id);
                                  setDropdownOpen(null);
                                }}
                              >
                                {lang("common.view", "View")}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">{lang("common.download", "Download")}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          {pagination.total === 0
            ? "No entries"
            : `${pageIndex * pageSize + 1} - ${Math.min(
                (pageIndex + 1) * pageSize,
                pagination.total
              )} of ${pagination.total} entries`}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i)}
              className={`w-8 h-8 rounded font-bold ${
                pageIndex === i
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Billings;
