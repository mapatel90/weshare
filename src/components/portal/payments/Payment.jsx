"use client";

import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiUpload } from "@/lib/api";
import { useRouter } from "next/navigation";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";
import { FiImage } from "react-icons/fi";
import PaymentModal from "../billings/PaymentModal";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccessToast } from "@/utils/topTost";
import { downloadPaymentPDF } from "./PaymentPdf";
import { useLanguage } from "@/contexts/LanguageContext";
import { PROJECT_STATUS } from "@/constants/project_status";
import { ROLES } from "@/constants/roles";
import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { buildUploadUrl } from "@/utils/common";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/vi";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const router = useRouter();
  const priceWithCurrency = usePriceWithCurrency();
  const { user } = useAuth();
  const { lang, currentLanguage } = useLanguage();
  const isOfftaker = user?.role === ROLES.OFFTAKER;

  // Status color mapping function based on numeric status
  const getStatusColorClass = (statusValue) => {
    const colorMap = {
      0: "bg-gray-200 text-gray-700", // Pending Verification
      1: "bg-green-100 text-green-700", // Paid
    };
    return colorMap[statusValue] ?? "bg-gray-200 text-gray-700";
  };

  // Fetch payments from API with server-side search, date filters, and pagination
  const fetchPayments = async (
    searchQuery = search,
    paymentDateVal = paymentDate,
    projectId = selectedProject,
    status = selectedStatus,
    page = currentPage,
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        search: searchQuery,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      // If user is offtaker, automatically filter by their ID
      if (isOfftaker && user?.id) {
        params.append("offtakerId", user?.id);
      }

      if (paymentDateVal) {
        params.append("paymentDate", paymentDateVal);
      }

      if (projectId) {
        params.append("projectId", projectId);
      }

      if (status) {
        params.append("status", status);
      }

      const response = await apiGet(`/api/payments?${params.toString()}`, {
        includeAuth: true,
      });

      if (response?.success && Array.isArray(response?.data)) {
        const formattedPayments = response.data
          .filter(
            (payment) =>
              payment.invoices?.projects?.project_status_id ===
              PROJECT_STATUS.RUNNING,
          )
          .map((payment) => ({
            id: payment.id,
            invoice_id: payment.invoice_id,
            paymentId: payment.id,
            projectName: payment.invoices?.projects?.project_name || "N/A",
            invoiceNumber: payment.invoices?.invoice_number || "N/A",
            invoicePrefix: payment.invoices?.invoice_prefix || "",
            paymentDate: payment.created_at
              ? new Date(payment.created_at).toLocaleDateString("en-US")
              : "N/A",
            invoiceDate: payment.invoices?.invoice_date
              ? new Date(payment.invoices.invoice_date).toLocaleDateString(
                "en-US",
              )
              : "N/A",
            dueDate: payment.invoices?.due_date
              ? new Date(payment.invoices.due_date).toLocaleDateString("en-US")
              : "N/A",
            amount: payment.amount || 0,
            status: payment.status,
            ss_url: payment.ss_url || "",
            download: true,
          }));
        setPayments(formattedPayments);
        setError("");

        // Update pagination info
        if (response.pagination) {
          setTotalCount(response.pagination.totalCount);
          setTotalPages(response.pagination.totalPages);
        }
      } else {
        setError("Failed to load payments");
        setPayments([]);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError("Unable to fetch payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchPaymentProjects = async () => {
      try {
        const payload = {
          project_status_id: PROJECT_STATUS.RUNNING,
        };

        if (user?.role === ROLES.OFFTAKER) {
          payload.offtaker_id = user.id;
        }

        const response = await apiPost(
          "/api/projects/dropdown/project",
          payload,
          { includeAuth: true },
        );
        if (response?.success && Array.isArray(response?.data)) {
          setProjects(response.data);
        }
      } catch (err) {
        console.error("Error fetching payment projects:", err);
      }
    };

    fetchPaymentProjects();
    fetchPayments();
  }, [user?.id, user?.role]);

  // Handle search with debounce effect
  useEffect(() => {
    if (search.trim() === "") return;

    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchPayments(search, paymentDate, selectedProject, selectedStatus, 1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Handle date filter
  useEffect(() => {
    setCurrentPage(1);
    fetchPayments(search, paymentDate, selectedProject, selectedStatus, 1);
  }, [paymentDate]);

  // Handle project filter
  useEffect(() => {
    setCurrentPage(1);
    fetchPayments(search, paymentDate, selectedProject, selectedStatus, 1);
  }, [selectedProject]);

  // Handle status filter
  useEffect(() => {
    setCurrentPage(1);
    fetchPayments(search, paymentDate, selectedProject, selectedStatus, 1);
  }, [selectedStatus]);

  // Handle page change
  useEffect(() => {
    if (currentPage > 1) {
      fetchPayments(
        search,
        paymentDate,
        selectedProject,
        selectedStatus,
        currentPage,
      );
    }
  }, [currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // No custom event listeners needed. Use backdrop for outside click.

  const handleDownload = async (paymentId) => {
    if (!paymentId) return;
    await downloadPaymentPDF(paymentId, priceWithCurrency);
  };

  const openScreenshot = (url) => {
    if (!url) return;
    setScreenshotPreview(buildUploadUrl(url));
  };

  const handlePaymentSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError("");
      // Upload screenshot first
      let ss_url = "";
      const formData = new FormData();
      formData.append("file", data.image);
      formData.append("folder", "payment");
      formData.append("invoice_id", data.invoice_id);
      formData.append("offtaker_id", user?.id);
      formData.append("amount", parseFloat(data.amount) || 0);
      formData.append("status", 0);
      formData.append("created_by", user?.id);
      // Create payment record
      const response = await apiUpload("/api/payments", formData, { includeAuth: true });
      if (response?.success) {
        showSuccessToast("Payment submitted successfully!");
        setModalOpen(false);
      } else {
        throw new Error("Payment creation failed");
      }

      // Refresh payments list
      await fetchPayments();
    } catch (err) {
      console.error("Payment submission error:", err);
      setError(err.message || "Failed to submit payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading payments...</p>
        </div>
      )}

      {!loading && (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <input
                type="text"
                placeholder={lang(
                  "payments.searchPlaceholder",
                  "Search project or invoice...",
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-[260px] border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <Autocomplete
                size="small"
                options={projects}
                value={projects.find((p) => p.id === selectedProject) || null}
                onChange={(e, newValue) =>
                  setSelectedProject(newValue ? newValue.id : "")
                }
                getOptionLabel={(option) => option.project_name || ""}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option, { selected }) => (
                  <li
                    {...props}
                  >
                    {option.project_name}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={lang("reports.allprojects", "All Projects")}
                    placeholder={lang("common.searchProject", "Search project...")}
                  />
                )}
                sx={{ width: { xs: "100%", sm: 260 } }}
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
                  ].find((s) => s.value === selectedStatus) || null
                }
                onChange={(e, newValue) =>
                  setSelectedStatus(newValue ? newValue.value : "")
                }
                getOptionLabel={(option) => option.label || ""}
                isOptionEqualToValue={(option, value) =>
                  option.value === value.value
                }
                renderOption={(props, option, { selected }) => (
                  <li
                    {...props}
                  >
                    {option.label}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={lang("invoice.allStatus", "All Status")}
                    placeholder={lang("common.selectStatus", "Select status...")}
                  />
                )}
                sx={{ width: { xs: "100%", sm: 200 } }}
              />
              {/* <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm text-balck focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Payment Date"
              /> */}
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={currentLanguage}>
                <DatePicker
                  label={lang("payments.paymentDate", "Payment Date")}
                  format="DD-MM-YYYY"
                  value={paymentDate ? dayjs(paymentDate) : null}
                  onChange={(newValue) =>
                    setPaymentDate(newValue ? newValue.format("YYYY-MM-DD") : "")
                  }
                  slotProps={{
                    textField: { size: "small" },
                    actionBar: { actions: ["clear", "accept"] },
                  }}
                />
              </LocalizationProvider>
            </div>
            <div className="flex items-center gap-2 justify-end mt-2">
              <button
                className="theme-btn-org-color text-white px-4 py-2 rounded shadow hover:bg-orange-500 w-[140px] sm:w-[200px] md:w-auto"
                onClick={() => setModalOpen(true)}
                disabled={submitting}
              >
                {lang("payments.addPayment", "Add Payment")}
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">
                    {lang("projects.projectName", "Project Name")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    {lang("payments.invoice", "Invoice")}
                  </th>
                  <th className="px-2 py-3 text-left font-semibold">
                    {lang("payments.amount", "Amount")}
                  </th>
                  <th className="px-2 py-3 text-left font-semibold">
                    {lang("invoice.invoiceDate", "Invoice Date")}
                  </th>
                  <th className="px-2 py-3 text-left font-semibold">
                    {lang("invoice.dueDate", "Due Date")}
                  </th>
                  <th className="px-2 py-3 text-left font-semibold">
                    {lang("payments.paymentDate", "Payment Date")}
                  </th>
                  <th className="px-2 py-3 text-left font-semibold">
                    {lang("common.status", "Status")}
                  </th>
                  <th className="px-2 py-3 text-center">
                    {lang("payments.screenshot", "Screenshot")}
                  </th>
                  <th className="px-2 py-3 text-left font-semibold">
                    {lang("common.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.length > 0 ? (
                  payments.map((payment, idx) => (
                    <tr
                      key={payment.id}
                      className={idx % 2 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-4 py-2 font-medium whitespace-nowrap">
                        {payment.projectName}
                      </td>
                      <td className="px-4 py-2 font-medium whitespace-nowrap">{`${payment.invoicePrefix}-${payment.invoiceNumber}`}</td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {priceWithCurrency(payment.amount)}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {payment.invoiceDate}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {payment.dueDate}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {payment.paymentDate}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColorClass(payment.status)
                            }`}
                        >
                          {payment.status === 1
                            ? lang("invoice.paid", "Paid")
                            : lang("common.pending_verification", "Pending")}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => openScreenshot(payment.ss_url)}
                          disabled={!payment.ss_url}
                          title={
                            payment.ss_url ? "View Screenshot" : "No Screenshot"
                          }
                          className={`text-xl ${payment.ss_url
                            ? "text-blue-600 hover:text-blue-800"
                            : "text-gray-400 cursor-not-allowed"
                            }`}
                        >
                          <FiImage />
                        </button>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {payment.download ? (
                          <div className="relative inline-block text-left">
                            <button
                              className="bg-transparent border-none cursor-pointer px-2 py-1 dropdown-action-btn"
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
                                <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-20 dropdown-action-menu">
                                  <button
                                    className="block w-full text-left px-4 py-2 text-blue-600 hover:bg-gray-100"
                                    onClick={() => {
                                      handleDownload(payment.id);
                                      setDropdownOpen(null);
                                    }}
                                  >
                                    {lang("common.download", "Download")}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">
                            {lang("common.download", "Download")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="10"
                      className="px-4 py-4 text-center text-gray-500"
                    >
                      {lang("payments.noPaymentsFound", "No payments found")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {payments.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-8">
                {lang("payments.noPaymentsFound", "No payments found")}
              </div>
            ) : (
              payments.map((payment, idx) => (
                <div
                  key={payment.id}
                  className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">
                        {payment.projectName}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        {`${payment.invoicePrefix}-${payment.invoiceNumber}`}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${getStatusColorClass(payment.status)}`}
                    >
                      {payment.status === 1
                        ? lang("invoice.paid", "Paid")
                        : lang("common.pending_verification", "Pending")}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">{lang("invoice.invoiceDate", "Invoice Date")}:</span>
                      <span className="font-medium text-gray-900">{payment.invoiceDate}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">{lang("invoice.dueDate", "Due Date")}:</span>
                      <span className="font-medium text-gray-900">{payment.dueDate}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">{lang("payments.paymentDate", "Payment Date")}:</span>
                      <span className="font-medium text-gray-900">{payment.paymentDate}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-gray-100">
                      <span className="font-semibold text-gray-700">{lang("payments.amount", "Amount")}:</span>
                      <span className="font-bold text-slate-900">{priceWithCurrency(payment.amount)}</span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {payment.ss_url && (
                      <button
                        onClick={() => openScreenshot(payment.ss_url)}
                        className="flex-1 px-3 py-1.5 text-xs font-semibold text-slate-900 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        {lang("payments.screenshot", "Screenshot")}
                      </button>
                    )}
                    {payment.download && (
                      <button
                        onClick={() => handleDownload(payment.id)}
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-3">
            <div className="text-sm text-gray-500 text-center sm:text-left">
              {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{" "}
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
              entries
            </div>
            <div className="flex gap-1 items-center justify-center sm:justify-end flex-wrap">
              <button
                className="px-3 h-8 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                {lang("common.prev", "Prev")}
              </button>
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  className={`w-8 h-8 rounded font-bold ${currentPage === page
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="px-3 h-8 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                {lang("news.next", "Next")}
              </button>
            </div>
          </div>
        </>
      )}

      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handlePaymentSubmit}
        lang={lang}
        payments={payments}
        roles={ROLES}
      />

      {/* Screenshot Preview Modal */}
      <Dialog
        open={!!screenshotPreview}
        onClose={() => setScreenshotPreview(null)}
        // maxWidth="md"
        fullWidth
      >
        <DialogTitle>{lang("payments.screenshot", "Screenshot")}</DialogTitle>
        <DialogContent dividers sx={{ textAlign: "center" }}>
          {screenshotPreview && (
            <img
              src={screenshotPreview}
              alt="Payment Screenshot"
              style={{ maxWidth: "100%", borderRadius: 8 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScreenshotPreview(null)} color="primary">
            {lang("common.close", "Close")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Payments;
