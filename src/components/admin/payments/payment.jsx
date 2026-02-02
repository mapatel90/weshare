"use client";
import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/shared/pageHeader/PageHeader";
import DynamicTitle from "@/components/common/DynamicTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiGet, apiPost, apiUpload, apiPut } from "@/lib/api";
import Table from "@/components/shared/table/Table";
import { FiImage, FiDownload, FiMoreHorizontal } from "react-icons/fi";
import { showSuccessToast, showErrorToast } from "@/utils/topTost";
import PaymentModal from "@/components/portal/billings/PaymentModal";
import { downloadPaymentPDF } from "@/components/portal/payments/PaymentPdf";
import Dropdown from "@/components/shared/Dropdown";
import {
  Autocomplete,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
} from "@mui/material";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";
import { useAuth } from "@/contexts/AuthContext";
import { PROJECT_STATUS } from "@/constants/project_status";

const PaymentsPage = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [screenshotModal, setScreenshotModal] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const priceWithCurrency = usePriceWithCurrency();

  // Filter and pagination states
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentDateFilter, setPaymentDateFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Dropdown lists
  const [projectList, setProjectList] = useState([]);

  const fetchItems = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });

      if (projectFilter) {
        params.append("projectId", projectFilter);
      }

      if (statusFilter !== "") {
        params.append("status", statusFilter);
      }

      if (paymentDateFilter) {
        params.append("paymentDate", paymentDateFilter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const res = await apiGet(`/api/payments?${params.toString()}`);
      if (res?.success && Array.isArray(res?.data)) {
        const formatted = res.data.map((payment) => ({
          id: payment.id,
          invoice_id: payment.invoice_id,
          projectName: payment.invoices?.projects?.project_name || "N/A",
          invoiceNumber: payment.invoices?.invoice_number || "N/A",
          invoicePrefix: payment.invoices?.invoice_prefix || "",
          paymentDate: payment.created_at
            ? new Date(payment.created_at).toLocaleDateString("en-US")
            : "N/A",
          invoiceDate: payment.invoices?.invoice_date
            ? new Date(payment.invoices.invoice_date).toLocaleDateString(
                "en-US"
              )
            : "N/A",
          dueDate: payment.invoices?.due_date
            ? new Date(payment.invoices.due_date).toLocaleDateString("en-US")
            : "N/A",
          amount: payment.amount || 0,
          status: payment.status === 1 ? "Paid" : "Pending Verification",
          ss_url: payment.ss_url || "",
        }));
        setItems(formatted);

        // Update pagination info
        const apiPagination = res.pagination || {};
        setPagination({
          page: apiPagination.page || 1,
          pageSize: apiPagination.pageSize || pageSize,
          totalCount: apiPagination.totalCount || 0,
          totalPages: apiPagination.totalPages || 0,
        });

        const maxPageIndex = Math.max(0, (apiPagination.totalPages || 1) - 1);
        if (pageIndex > maxPageIndex) {
          setPageIndex(maxPageIndex);
        }
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error("Error fetching payments:", e);
      setItems([]);
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
        setProjectList(response.data);
      } else {
        setProjectList([]);
      }
    } catch (e) {
      console.error("Error fetching projects:", e);
      setProjectList([]);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [projectFilter, statusFilter, paymentDateFilter, searchTerm, pageIndex, pageSize]);

  useEffect(() => {
    setPageIndex(0);
  }, [projectFilter, statusFilter, paymentDateFilter, searchTerm]);

  const openAdd = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleDownload = async (paymentId) => {
    if (!paymentId) return;
    await downloadPaymentPDF(paymentId, priceWithCurrency);
  };

  const handleSave = async (data) => {
    try {
      // Upload screenshot first
      let ss_url = "";
      if (data.image) {
        const formData = new FormData();
        formData.append("file", data.image);
        formData.append("folder", "payment");

        const uploadResponse = await apiUpload("/api/upload", formData);
        if (uploadResponse?.success && uploadResponse?.data?.url) {
          ss_url = uploadResponse.data.url;
        } else {
          throw new Error("Failed to upload screenshot");
        }
      }

      // Prepare payload with correct types
      const payload = {
        invoice_id: data.invoice_id ? Number(data.invoice_id) : 0,
        offtaker_id: user?.id || null,
        amount: parseFloat(data.amount) || 0,
        ss_url: ss_url,
        status: 1,
        created_by: user?.id || null,
      };

      const res = await apiPost("/api/payments", payload);
      if (res?.success) {
        showSuccessToast(
          lang("payments.createdSuccessfully", "Payment Created Successfully")
        );
        closeModal();
        await fetchItems();
      } else {
        showErrorToast(
          res?.message ||
            lang(
              "payments.errorOccurred",
              "An error occurred. Please try again."
            )
        );
      }
    } catch (err) {
      showErrorToast(
        err?.message ||
          lang("payments.errorOccurred", "An error occurred. Please try again.")
      );
    }
  };

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

  const handleMarkAsPaid = async (paymentId) => {
    try {
      const res = await apiPut(`/api/payments/${paymentId}/mark-as-paid`, {});
      if (res?.success) {
        showSuccessToast(
          lang("payments.markedAsPaid", "Payment Marked as Paid")
        );
        await fetchItems();
      } else {
        showErrorToast(
          res?.message ||
            lang("payments.errorOccurred", "An error occurred. Please try again.")
        );
      }
    } catch (err) {
      showErrorToast(
        err?.message ||
          lang("payments.errorOccurred", "An error occurred. Please try again.")
      );
    }
  };

  const columns = [
    {
      accessorKey: "projectName",
      header: () => lang("projects.projectName", "Project Name"),
      cell: (info) => info.getValue() || "N/A",
    },
    {
      accessorKey: "invoiceNumber",
      header: () => lang("invoice.invoice", "Invoice"),
      cell: ({ row }) => {
        const prefix = row.original?.invoicePrefix || "";
        const number = row.original?.invoiceNumber || "N/A";
        return `${prefix}${prefix ? "-" : ""}${number}`;
      },
    },
    {
      accessorKey: "amount",
      header: () => lang("invoice.amount", "Amount"),
      cell: (info) => priceWithCurrency(info.getValue() || 0),
    },
    {
      accessorKey: "invoiceDate",
      header: () => lang("invoice.invoiceDate", "Invoice Date"),
      cell: (info) => info.getValue() || "N/A",
    },
    {
      accessorKey: "dueDate",
      header: () => lang("invoice.dueDate", "Due Date"),
      cell: (info) => info.getValue() || "N/A",
    },
    {
      accessorKey: "paymentDate",
      header: () => lang("payments.paymentDate", "Payment Date"),
      cell: (info) => info.getValue() || "N/A",
    },
    {
      accessorKey: "status",
      header: () => lang("payments.status", "Status"),
      cell: (info) => {
        const status = info.getValue();
        const config = {
          Paid: { label: lang("payments.paid", "Paid"), color: "#17c666" },
          "Pending Verification": {
            label: lang("common.pendingVerification", "Pending Verification"),
            color: "#ea4d4d",
          },
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
      accessorKey: "ss_url",
      header: () => lang("payments.screenshot", "Screenshot"),
      cell: ({ row }) => {
        const ss_url = row.original?.ss_url;
        return ss_url ? (
          <IconButton
            size="small"
            onClick={() => {
              setSelectedScreenshot(ss_url);
              setScreenshotModal(true);
            }}
            sx={{ color: "#1976d2" }}
            title="View Screenshot"
          >
            <FiImage size={18} />
          </IconButton>
        ) : (
          <span className="text-gray-400">No Screenshot</span>
        );
      },
    },
    {
      accessorKey: "actions",
      header: () => lang("common.actions", "Actions"),
      cell: ({ row }) => {
        const paymentId = row.original.id;
        const paymentStatus = row.original.status;
        
        const rowActions = [
          {
            label: "Download PDF",
            icon: <FiDownload />,
            onClick: async () => {
              await handleDownload(paymentId);
            },
          },
          { type: "divider" },
        ];

        if (paymentStatus !== "Paid") {
          rowActions.push({
            label: "Mark as Paid",
            icon: <span>✓</span>,
            onClick: async () => {
              await handleMarkAsPaid(paymentId);
            },
          });
        }

        return (
          <div className="hstack gap-2 justify-content-start">
            <Dropdown
              dropdownItems={rowActions}
              triggerClass="avatar-md"
              triggerIcon={<FiMoreHorizontal />}
            />
          </div>
        );
      },
      meta: {
        disableSort: true,
      },
    },
  ];

  return (
    <>
      <PageHeader>
        <div className="ms-auto">
          <Button
            variant="contained"
            className="common-orange-color"
            onClick={openAdd}
          >
            + {lang("payments.addPayment", "Add Payment")}
          </Button>
        </div>
      </PageHeader>
      <div className="main-content">
        <div className="row">
          <div className="p-6 bg-white rounded-3xl shadow-md">
            <div className="d-flex items-center justify-content-between gap-2 mb-4 mt-4 w-full flex-wrap">
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
                  options={[
                    { value: "1", label: lang("invoice.paid", "Paid") },
                    { value: "0", label: lang("common.pending", "Pending") },
                  ]}
                  value={
                    statusFilter === ""
                      ? null
                      : statusFilter === "1"
                      ? { value: "1", label: lang("invoice.paid", "Paid") }
                      : { value: "0", label: lang("common.pending", "Pending") }
                  }
                  onChange={(e, newValue) => {
                    setPageIndex(0);
                    setStatusFilter(newValue?.value || "");
                  }}
                  getOptionLabel={(option) => option?.label || ""}
                  isOptionEqualToValue={(option, value) => option?.value === value?.value}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={lang("payments.status", "Status")}
                      placeholder="Search status..."
                    />
                  )}
                  sx={{ minWidth: 200 }}
                  clearOnEscape
                />

                <TextField
                  type="date"
                  value={paymentDateFilter}
                  onChange={(e) => setPaymentDateFilter(e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 180 }}
                />
              </div>
            </div>

            <div className="overflow-x-auto relative">
              {!hasLoadedOnce && loading && (
                <div className="text-center py-6 text-gray-600">Loading...</div>
              )}

              {hasLoadedOnce && (
                <>
                  <Table
                    data={items}
                    columns={columns}
                    disablePagination={false}
                    onSearchChange={handleSearchChange}
                    onPaginationChange={handlePaginationChange}
                    pageIndex={pageIndex}
                    pageSize={pageSize}
                    serverSideTotal={pagination.totalCount}
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
        </div>
      </div>

      <PaymentModal
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={handleSave}
        lang={lang}
        payments={items}
      />

      {/* Screenshot Viewer Modal */}
      <Dialog
        open={screenshotModal}
        onClose={() => setScreenshotModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "1.25rem",
            borderBottom: "1px solid #e0e0e0",
            pb: 1.5,
          }}
        >
          Payment Screenshot
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            background: "#fafafa",
            px: 3,
            py: 3,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          {selectedScreenshot && (
            <Box
              component="img"
              src={selectedScreenshot}
              alt="Payment Screenshot"
              sx={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: 2,
              }}
              onError={(e) => {
                e.target.src = "/images/general/no-image.png";
              }}
            />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5, borderTop: "1px solid #e0e0e0" }}>
          <Button
            onClick={() => setScreenshotModal(false)}
            variant="contained"
            sx={{
              background: "#424242",
              "&:hover": { background: "#333" },
              borderRadius: 2,
              textTransform: "none",
              px: 3,
            }}
          >
            {lang("common.close", "Close")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PaymentsPage;
