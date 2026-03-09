"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { PROJECT_STATUS } from "@/constants/project_status";
import Table from "@/components/shared/table/Table";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";
import { FiDownload, FiEye } from "react-icons/fi";
import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField } from "@mui/material";
import Link from "next/link";
import { ROLES } from "@/constants/roles";
import { downloadPayoutPDF } from "./PayoutPdf";
import { buildUploadUrl } from "@/utils/common";
import { PAYOUT_STATUS } from "@/constants/payout_status";
import Swal from "sweetalert2";

const PayoutsPage = () => {
    const PAGE_SIZE = 50;
    const [pageSize, setPageSize] = useState(PAGE_SIZE);
    const [pageIndex, setPageIndex] = useState(0); // 0-based index for Table
    const { lang } = useLanguage();
    const { user } = useAuth();
    const [projectList, setProjectList] = useState([]);
    const [projectFilter, setProjectFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [documentPreview, setDocumentPreview] = useState(null);
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, pageSize: pageSize, totalCount: 0, totalPages: 0 });
    const [searchTerm, setSearchTerm] = useState("");
    const priceWithCurrency = usePriceWithCurrency();


    const fetchProjects = async () => {
        try {
            const response = await apiPost("/api/projects/dropdown/project", {
                investor_id: user?.id || undefined,
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

    const fetchPayouts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: String(pageIndex + 1),
                pageSize: String(pageSize),
            });

            if (projectFilter) {
                params.append("projectId", projectFilter);
            }

            if (statusFilter) {
                params.append("status", statusFilter);
            }

            if (searchTerm) {
                params.append("search", searchTerm);
            }
            if (user?.role === ROLES.INVESTOR) {
                params.append("investorId", user?.id);
            }


            const response = await apiGet(`/api/payouts?${params.toString()}`);

            if (response?.success) {
                setPayouts(response.data);
                setPagination(response.pagination);
            }
        } catch (e) {
            console.error("Error fetching payouts:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (value) => {
        setPageIndex(0);
        setSearchTerm(value);
    };

    const handleViewDocument = (url) => {
        setDocumentPreview(buildUploadUrl(url));
    };

    const handlePaginationChange = (nextPagination) => {
        const current = { pageIndex, pageSize };
        const updated =
            typeof nextPagination === "function"
                ? nextPagination(current)
                : nextPagination || {};
        let newPageIndex = typeof updated.pageIndex === "number" ? updated.pageIndex : 0;
        let newPageSize = typeof updated.pageSize === "number" ? updated.pageSize : pageSize;
        setPageIndex(newPageIndex);
        setPageSize(newPageSize);
        // fetch payouts for new page (pageIndex is 0-based, API expects 1-based)
        fetchPayouts(newPageIndex + 1, newPageSize);
    };

    useEffect(() => {
        fetchProjects();
        fetchPayouts();
    }, []);

    useEffect(() => {
        fetchPayouts();
    }, [projectFilter, statusFilter, searchTerm, pageIndex, pageSize]);


    useEffect(() => {
        // fetch payouts when pageIndex or pageSize changes (but not on filter/search change)
        if (user) {
            fetchPayouts(pageIndex + 1, pageSize);
        }
    }, [pageIndex, pageSize]);


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
            const baseName = `${invoice?.invoice_prefix || "INV"}-${invoice?.invoice_number || "invoice"
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
                title: "Download invoice pdf is not available.",
                icon: "error",
            });
        }
    };

    const handlePayoutDownload = async (payout) => {
        const fileUrl = buildUploadUrl(payout?.payout_pdf);
        if (!fileUrl) {
            Swal.fire({
            title: "Payout PDF not available",
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
            const baseName = `${payout?.payout_prefix || "INV"}-${
            payout?.payout_number || "Payout"
            }`;
            link.href = objectUrl;
            link.download = `${baseName}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(objectUrl);
        } catch (error) {
            console.error("Failed to download payout PDF:", error);
            Swal.fire({
            title: "Unable to download payout PDF",
            icon: "error",
            });
        }
    };

    // -----------------------------
    // Table Columns
    // -----------------------------
    const columns = useMemo(
        () => [
            {
                accessorKey: "projects.project_name",
                header: () => lang("projects.projectName", "Project Name"),
                cell: (info) => info.getValue() || "N/A",
            },
            {
                id: "investor",
                header: () => lang("payouts.investor_name", "Investor Name"),
                accessorFn: (row) => {
                    return row.users?.full_name || "N/A";
                },
            },
            {
                id: "invoices",
                header: () => lang("invoice.invoiceNumber", "Invoice Number"),
                cell: ({ row }) => {
                    const prefix = row.original.invoices?.invoice_prefix || "";
                    const number = row.original.invoices?.invoice_number || "";
                    const display = prefix && number ? `${prefix}-${number}` : "N/A";
                    if (!row.original.invoices?.id) return "N/A";
                    return (
                        <p
                            onClick={() => handleDownload(row.original.invoices)}
                            title="Download invoice pdf"
                            style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500, cursor: 'pointer' }}
                        >
                            {display}
                        </p>
                    );
                },
            },
            {
                accessorKey: "invoice_amount",
                header: () => lang("payouts.invoice_amount", "Amount"),
                cell: ({ getValue }) => priceWithCurrency(getValue()),
            },
            {
                accessorKey: "payout_amount",
                header: () => lang("payouts.payout_amount", "Amount"),
                cell: ({ getValue }) => priceWithCurrency(getValue()),
            },
            {
                accessorKey: "investor_percent",
                header: () => lang("payouts.investor_percentage", "Investor %"),
                cell: ({ getValue }) => {
                    const value = getValue();
                    if (value === null || value === undefined || value === "")
                        return "N/A";
                    return `${value}%`;
                },
            },
            {
                accessorKey: "status",
                header: () => lang("invoice.status", "Status"),
                cell: (info) => {
                    const status = info.getValue();
                    if (status === PAYOUT_STATUS.PAYOUT) {
                        return <span className="badge bg-soft-success text-success">
                            {lang("payouts.payouts", "Paid")}
                        </span>;
                    } else if (status === PAYOUT_STATUS.PENDING) {
                        return <span className="badge bg-soft-warning text-warning">
                            {lang("common.pending", "Pending")}
                        </span>;
                    }
                    else if (status === PAYOUT_STATUS.CANCELLED) {
                        return <span className="badge bg-soft-danger text-danger">
                            {lang("common.cancelled", "Cancelled")}
                        </span>;
                    }
                },
            },
            {
                id: "document",
                header: () => (
                    <div className="text-center">
                        {lang("payouts.uploaded_image", "Document")}
                    </div>
                ),
                cell: ({ row }) => {
                    const docUrl = row.original.document;

                    return (
                        <div className="d-flex justify-content-center align-items-center">
                            {!docUrl ? (
                                <span className="text-muted fw-bold">-</span>
                            ) : (
                                <Button
                                    size="small"
                                    title="View document"
                                    onClick={() => handleViewDocument(docUrl)}
                                    style={{
                                        color: "#1976d2",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                        padding: 0,
                                        minWidth: "auto",
                                    }}
                                >
                                    {lang("navigation.view", "View")}
                                </Button>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: "actions",
                header: () => lang("invoice.actions"),
                cell: ({ row }) => (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap" }}>
                        <Link
                            href={`/investor/payouts/view/${row.original.id}`}
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
                                title="View payout"
                            >
                                <FiEye size={18} />
                            </IconButton>
                        </Link>
                        <IconButton
                            size="small"
                            onClick={() => handlePayoutDownload(row.original)}
                            sx={{
                                color: "#2e7d32",
                                transition: "transform 0.2s ease",
                                "&:hover": {
                                    backgroundColor: "rgba(46, 125, 50, 0.08)",
                                    transform: "scale(1.1)",
                                },
                            }}
                            title="Download payout pdf"
                        >
                            <FiDownload size={18} />
                        </IconButton>
                    </Stack>
                ),
                meta: {
                    disableSort: true,
                },
            },
        ]
        , [lang]);

    return (
        <>
            <div className="p-6 bg-white rounded-3xl shadow-md">
                <div className="flex flex-wrap items-center gap-2 mb-4 mt-4 w-full">
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
                                placeholder={lang("common.searchProject", "Search project...")}
                            />
                        )}
                        sx={{ width: { xs: "100%", sm: 260 } }}
                    />
                    <TextField
                        select
                        fullWidth
                        size="small"
                        label={lang("invoice.status", "Status")}
                        value={statusFilter}
                        onChange={(e) => {
                            setPageIndex(0);
                            setStatusFilter(e.target.value);
                        }}
                        SelectProps={{
                            native: true,
                        }}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: { xs: "100%", sm: 220 } }}
                    >
                        <option value="">
                            {lang("common.all", "All Status")}
                        </option>
                        <option value={PAYOUT_STATUS.PENDING}>
                            {lang("common.pending", "Pending")}
                        </option>
                        <option value={PAYOUT_STATUS.PAYOUT}>
                            {lang("payouts.payouts", "Paid")}
                        </option>
                        <option value={PAYOUT_STATUS.CANCELLED}>
                            {lang("common.cancelled", "Cancelled")}
                        </option>
                    </TextField>
                </div>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto relative">
                    <>
                        {/* Keep the table mounted so search input state is retained */}
                        <Table
                            data={payouts}
                            columns={columns}
                            disablePagination={false}
                            onSearchChange={handleSearchChange}
                            onPaginationChange={handlePaginationChange}
                            pageIndex={pageIndex}
                            pageSize={pageSize}
                            serverSideTotal={pagination.totalCount}
                            initialPageSize={PAGE_SIZE}
                        />
                    </>
                </div>

                {/* Mobile Card View */}
                <div className="block md:hidden space-y-3 mt-3">
                    {payouts.length === 0 ? (
                        <div className="text-center text-sm text-gray-500 py-8">
                            {lang("payouts.noPayoutsFound", "No payouts found")}
                        </div>
                    ) : (
                        payouts.map((payout) => {
                            const invoicePrefix = payout.invoices?.invoice_prefix || "";
                            const invoiceNumber = payout.invoices?.invoice_number || "";
                            const invoiceDisplay = invoicePrefix && invoiceNumber ? `${invoicePrefix}-${invoiceNumber}` : "N/A";
                            const investorPercent = payout.investor_percent;

                            const statusBadge = () => {
                                if (payout.status === PAYOUT_STATUS.PAYOUT)
                                    return <span className="badge bg-soft-success text-success">{lang("payouts.payouts", "Paid")}</span>;
                                if (payout.status === PAYOUT_STATUS.PENDING)
                                    return <span className="badge bg-soft-warning text-warning">{lang("common.pending", "Pending")}</span>;
                                if (payout.status === PAYOUT_STATUS.CANCELLED)
                                    return <span className="badge bg-soft-danger text-danger">{lang("common.cancelled", "Cancelled")}</span>;
                                return null;
                            };

                            return (
                                <div
                                    key={payout.id}
                                    className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                                        <div>
                                            <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">
                                                {payout.projects?.project_name || "N/A"}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                                {payout.users?.full_name || "N/A"}
                                            </p>
                                        </div>
                                        <div className="ml-2">{statusBadge()}</div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="space-y-2 mb-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-600">{lang("invoice.invoiceNumber", "Invoice Number")}:</span>
                                            {payout.invoices?.id ? (
                                                <span
                                                    onClick={() => handleDownload(payout.invoices)}
                                                    className="font-medium text-blue-600 cursor-pointer"
                                                    title="Download invoice pdf"
                                                >
                                                    {invoiceDisplay}
                                                </span>
                                            ) : (
                                                <span className="font-medium text-gray-900">N/A</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-600">{lang("payouts.invoice_amount", "Invoice Amount")}:</span>
                                            <span className="font-medium text-gray-900">{priceWithCurrency(payout.invoice_amount)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-600">{lang("payouts.payout_amount", "Payout Amount")}:</span>
                                            <span className="font-medium text-gray-900">{priceWithCurrency(payout.payout_amount)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-600">{lang("payouts.investor_percentage", "Investor %")}:</span>
                                            <span className="font-medium text-gray-900">
                                                {investorPercent !== null && investorPercent !== undefined && investorPercent !== ""
                                                    ? `${investorPercent}%`
                                                    : "N/A"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className={`grid gap-2 pt-3 border-t border-gray-100 ${payout.document ? "grid-cols-3" : "grid-cols-2"}`}>
                                        {payout.document && (
                                            <button
                                                onClick={() => handleViewDocument(payout.document)}
                                                className="w-full whitespace-nowrap px-2 py-2 text-xs font-semibold text-slate-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
                                            >
                                                {lang("payouts.uploaded_image", "Document")}
                                            </button>
                                        )}
                                        <Link
                                            href={`/investor/payouts/view/${payout.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block"
                                        >
                                            <button className="w-full whitespace-nowrap px-2 py-2 text-xs font-semibold text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-center">
                                                {lang("navigation.view", "View")}
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => handlePayoutDownload(payout)}
                                            className="w-full whitespace-nowrap px-2 py-2 text-xs font-semibold text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-center"
                                        >
                                            {lang("common.download", "Download")}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            {/* Upload Image Preview Modal */}
            <Dialog
                open={!!documentPreview}
                onClose={() => setDocumentPreview(null)}
                maxWidth="md"
            >
                <DialogTitle>{lang("payouts.uploaded_image")}</DialogTitle>
                <DialogContent dividers sx={{ textAlign: "center" }}>
                    {documentPreview && (
                        <img
                            src={documentPreview}
                            alt="Document"
                            style={{ maxWidth: "100%", borderRadius: 8 }}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDocumentPreview(null)} color="primary">
                        {lang("common.close")}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default PayoutsPage;
