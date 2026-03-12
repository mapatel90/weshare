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
    <div className="p-3 sm:p-4 md:p-6 bg-white shadow-md rounded-lg sm:rounded-xl">
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 md:flex-row md:items-center md:justify-between">
        {/* Project Dropdown Filter */}
        <div className="flex flex-col gap-1 w-full sm:w-auto">
          <Autocomplete
            size="small"
            options={dropdownProjects}
            value={dropdownProjects.find((p) => p.id === projectFilter) || null}
            onChange={(e, newValue) => handleProjectFilterChange(newValue ? newValue.id : "")}
            getOptionLabel={(option) => option.name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={projectsLoading}
            renderOption={(props, option, { selected }) => (
              <li
                {...props}
                // style={{
                //   padding: "10px 16px",
                //   cursor: "pointer",
                //   background: selected ? "#F6A623" : "#fff9f0",
                //   fontWeight: selected ? 600 : 400,
                //   color: selected ? "#fff" : "#b26800",
                //   borderLeft: selected ? "4px solid #e8920a" : "4px solid transparent",
                //   transition: "background 0.15s",
                // }}
              >
                {option.name}
              </li>
            )}
            // componentsProps={{
            //   paper: {
            //     sx: {
            //       border: "2px solid rgba(246,166,35,0.2)",
            //       borderRadius: "8px",
            //       boxShadow: "0 4px 16px rgba(246,166,35,0.2)",
            //       mt: 0.5,
            //     },
            //   },
            // }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang("dashboard.all_project", "All Projects")}
                placeholder={lang("common.searchProject", "Select project...")}
                // sx={{
                //   "& .MuiOutlinedInput-root": {
                //     "&:hover fieldset": { borderColor: "#F6A623" },
                //     "&.Mui-focused fieldset": { borderColor: "#F6A623" },
                //   },
                //   "& label.Mui-focused": { color: "#b26800" },
                // }}
              />
            )}
            sx={{ minWidth: 200, width: { xs: "100%", sm: "auto" } }}
          />
          {projectsError && (
            <p className="text-xs text-red-600">{projectsError}</p>
          )}
        </div>

        <div className="relative"></div>

        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-2 md:gap-3">
          <input
            type="text"
            placeholder={lang("invoice.searchProjectOrInvoice", "Search project or invoice...")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full sm:flex-1 px-3 py-2 text-xs sm:text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
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
            renderOption={(props, option, { selected }) => (
              <li
                {...props}
                // style={{
                //   padding: "10px 16px",
                //   cursor: "pointer",
                //   background: selected ? "#F6A623" : "#fff9f0",
                //   fontWeight: selected ? 600 : 400,
                //   color: selected ? "#fff" : "#b26800",
                //   borderLeft: selected ? "4px solid #e8920a" : "4px solid transparent",
                //   transition: "background 0.15s",
                // }}
              >
                {option.label}
              </li>
            )}
            // componentsProps={{
            //   paper: {
            //     sx: {
            //       border: "2px solid rgba(246,166,35,0.2)",
            //       borderRadius: "8px",
            //       boxShadow: "0 4px 16px rgba(246,166,35,0.2)",
            //       mt: 0.5,
            //     },
            //   },
            // }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={lang("invoice.allStatus", "All Status")}
                placeholder={lang("common.selectStatus", "Select status...")}
                // sx={{
                //   "& .MuiOutlinedInput-root": {
                //     "&:hover fieldset": { borderColor: "#F6A623" },
                //     "&.Mui-focused fieldset": { borderColor: "#F6A623" },
                //   },
                //   "& label.Mui-focused": { color: "#b26800" },
                // }}
              />
            )}
            sx={{ minWidth: 150, width: { xs: "100%", sm: "auto" } }}
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
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
                <td className="px-4 py-6 text-center text-gray-500" colSpan={10}>
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

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-8">
            No invoices found
          </div>
        ) : (
          filteredInvoices.map((inv, idx) => (
            <div
              key={inv.id}
              className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">
                    {inv.projectName}
                  </h3>
                  <Link
                    href={`/offtaker/billings/invoice/${inv.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#1976d2",
                      textDecoration: "none",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                    className="inline-block mt-0.5"
                  >
                    {inv.invoiceName}
                  </Link>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                    getStatusColorClass(inv.status)
                  }`}
                >
                  {inv.status === 1 ? lang("invoice.paid", "Paid") : lang("common.pending", "Pending")}
                </span>
              </div>

              {/* Card Body */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">{lang("invoice.invoiceDate", "Invoice Date")}:</span>
                  <span className="font-medium text-gray-900">{inv.invoiceDate}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">{lang("invoice.dueDate", "Due Date")}:</span>
                  <span className="font-medium text-gray-900">{inv.dueDate}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">{lang("invoice.tax", "Tax")}:</span>
                  <span className="font-medium text-gray-900">{inv.tax}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">{lang("invoice.subamount", "Sub Amount")}:</span>
                  <span className="font-medium text-gray-900">{inv.subAmount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">{lang("invoice.taxAmount", "Tax Amount")}:</span>
                  <span className="font-medium text-gray-900">{inv.taxAmount}</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-gray-100">
                  <span className="font-semibold text-gray-700">{lang("invoice.totalAmount", "Total Amount")}:</span>
                  <span className="font-bold text-slate-900">{priceWithCurrency(inv.amount)}</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    handleView(inv.id);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs font-semibold text-slate-900 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  {lang("common.view", "View")}
                </button>
                {inv.download && inv.invoicePdf && (
                  <button
                    onClick={() => {
                      handleDownload(inv);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                  >
                    {lang("common.download", "Download")}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 border-t border-gray-200 text-xs sm:text-sm">
        <div className="text-gray-500 order-2 sm:order-1">
          {pagination.total === 0
            ? "No entries"
            : `${pageIndex * pageSize + 1} - ${Math.min(
                (pageIndex + 1) * pageSize,
                pagination.total
              )} of ${pagination.total} entries`}
        </div>
        <div className="flex gap-1 flex-wrap justify-center order-1 sm:order-2">
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded font-bold text-xs sm:text-sm ${
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
