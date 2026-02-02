"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import React, { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPost, apiUpload } from "@/lib/api";
import { PROJECT_STATUS } from "@/constants/project_status";
import Table from "@/components/shared/table/Table";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";
import { FiDownload, FiEdit, FiEye, FiTrash2 } from "react-icons/fi";
import { BsQrCode } from "react-icons/bs";
import { Autocomplete, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField } from "@mui/material";
import Link from "next/link";
import { downloadPayoutPDF } from "./PayoutPdf";
import { ROLES } from "@/constants/roles";
import Swal from "sweetalert2";
import { showSuccessToast } from "@/utils/topTost";
import { PAYOUT_STATUS } from "@/constants/payout_status";
import { identity } from "@fullcalendar/core/internal";
import TransactionDialog from "./TransactionDialog";


const PayoutsPage = () => {
    const PAGE_SIZE = 50;
    const [pageSize, setPageSize] = useState(PAGE_SIZE);
    const [pageIndex, setPageIndex] = useState(0); // 0-based index for Table
    const { lang } = useLanguage();
    const { user } = useAuth();
    const [projectList, setProjectList] = useState([]);
    const [projectFilter, setProjectFilter] = useState("");
    const [payouts, setPayouts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pageSize: pageSize, totalCount: 0, totalPages: 0 });
    const [searchTerm, setSearchTerm] = useState("");
    const [investorList, setInvestorList] = useState([]);
    const [investorFilter, setInvestorFilter] = useState(null);
    const [investorSearch, setInvestorSearch] = useState("");
    const [documentPreview, setDocumentPreview] = useState(null);
    const [txModalOpen, setTxModalOpen] = useState(false);
    const [txId, setTxId] = useState("");
    const [selectedPayout, setSelectedPayout] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedQRCode, setSelectedQRCode] = useState(null);
    const priceWithCurrency = usePriceWithCurrency();

    const fetchProjects = async () => {
        try {
            const response = await apiPost("/api/projects/dropdown/project", {
                offtaker_id: user?.offtaker_id || undefined,
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

    const fetchInvestors = async (search = "") => {
        try {
            const res = await apiPost("/api/users/dropdown/users", {
                role_id: ROLES.INVESTOR,
                search,
            });

            if (res?.success) {
                setInvestorList(res.data);
            } else {
                setInvestorList([]);
            }
        } catch (err) {
            console.error("Investor dropdown error", err);
            setInvestorList([]);
        }
    };

    useEffect(() => {
    }, [investorSearch]);

    const fetchPayouts = async () => {
        try {
            const params = new URLSearchParams({
                page: String(pageIndex + 1),
                pageSize: String(pageSize),
            });

            if (projectFilter) {
                params.append("projectId", projectFilter);
            }

            if (searchTerm) {
                params.append("search", searchTerm);
            }
            if (investorFilter?.id) {
                params.append("investorId", investorFilter.id);
            }

            const response = await apiGet(`/api/payouts?${params.toString()}`);

            if (response?.success) {
                setPayouts(response.data);
                setPagination(response.pagination);
            }
        } catch (e) {
            console.error("Error fetching payouts:", e);
        } finally {
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
        let newPageIndex = typeof updated.pageIndex === "number" ? updated.pageIndex : 0;
        let newPageSize = typeof updated.pageSize === "number" ? updated.pageSize : pageSize;
        setPageIndex(newPageIndex);
        setPageSize(newPageSize);
        // fetch payouts for new page (pageIndex is 0-based, API expects 1-based)
        fetchPayouts(newPageIndex + 1, newPageSize);
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
            const res = await apiDelete(`/api/payouts/delete/${id}`);
            if (res.success) {
                showSuccessToast(lang("payouts.payoutDeletedSuccessfully"));
                fetchPayouts();
            }
        } catch (_) {
            // Handle error (optional)
            console.error("Error deleting payout:", _);
        }
    };

    const handleViewDocument = (url) => {
        setDocumentPreview(url);
    };

    const handleShowQRCode = (qrCode, userName) => {
        if (!qrCode) {
            Swal.fire({
                icon: 'warning',
                title: 'QR Code Not Found',
                text: `QR code is not available for ${userName}`
            });
            return;
        }
        setSelectedQRCode({ qrCode, userName });
        setShowQRModal(true);
    };

    const handleMarkPay = (rowData) => {
        setSelectedFile(null); // reset previous upload
        setSelectedPayout(rowData);
        setTxModalOpen(true);
    };

    const validate = () => {
        const newErrors = {};
        if (selectedPayout && !selectedPayout.transaction_id) {
            if (!txId) newErrors.transactionId = lang("payouts.transaction_id_is_required", "Transaction ID is required");
        }
        if (selectedFile === null) newErrors.document = lang("payouts.uploaded_image_is_required");
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const markAsPaid = async (id, transactionId) => {
        try {
            if (!validate()) return;
            const formData = new FormData();

            if (identity) {
                formData.append('id', id);
            }
            if (transactionId) {
                formData.append("transaction_id", transactionId);
            }
            if (selectedFile) {
                formData.append("document", selectedFile);
            }
            formData.append("mark_as_paid", "true");

            const res = await apiUpload("/api/payouts/update", formData);
            if (res?.success) {
                showSuccessToast("Payout marked as paid");
                handleCloseTxModal();
                fetchPayouts();
            }
        } catch (err) {
            console.error(err);
        }
    };


    const handleCloseTxModal = () => {
        setTxModalOpen(false);
        setTxId("");               // clear input
        setSelectedPayout(null);   // clear selected payout
        setSelectedFile(null);
        setErrors({});
    };

    useEffect(() => {
        fetchProjects();
        fetchPayouts();

        // Listen for payout:refresh event to refresh the payout list
        const handlePayoutRefresh = () => {
            fetchPayouts();
        };
        window.addEventListener("payout:refresh", handlePayoutRefresh);
        return () => {
            window.removeEventListener("payout:refresh", handlePayoutRefresh);
        };
    }, []);

    useEffect(() => {
        fetchInvestors();
        fetchPayouts();
    }, [projectFilter, searchTerm, pageIndex, pageSize, investorFilter]);


    useEffect(() => {
        // fetch payouts when pageIndex or pageSize changes (but not on filter/search change)
        if (user) {
            fetchPayouts(pageIndex + 1, pageSize);
        }
    }, [pageIndex, pageSize]);

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
                accessorFn: (row) => {
                    const prefix = row.invoices?.invoice_prefix || "";
                    const number = row.invoices?.invoice_number || "";
                    return prefix && number ? `${prefix}-${number}` : "N/A";
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
                id: "qr_code",
                header: () => "QR Code",
                cell: ({ row }) => {
                    const qrCode = row.original.users?.qr_code;

                    if (!qrCode) return "N/A";

                    return (
                        <Button
                            variant="contained"
                            size="small"
                            sx={{
                                backgroundColor: "#28a745",
                                color: "#fff",
                                padding: "4px 8px",
                                fontSize: "12px",
                                textTransform: "none",
                                "&:hover": { backgroundColor: "#218838" },
                            }}
                            onClick={() => handleShowQRCode(qrCode, row.original.users?.full_name)}
                        >
                            <BsQrCode className="me-1" style={{ marginRight: '4px' }} />
                            {lang("table.qr_code")}
                        </Button>
                    );
                },
            },
            {
                id: "document",
                header: () => lang("payouts.uploaded_image", "Document"),
                cell: ({ row }) => {
                    const docUrl = row.original.document; // check DB field name

                    if (!docUrl) return "N/A";

                    return (
                        <Button
                            size="small"
                            // variant="outlined"
                            onClick={() => handleViewDocument(docUrl)} // direct call
                        >
                            {lang("navigation.view", "View")}
                        </Button>
                    );
                },
            },
            {
                id: "markAsPay",
                header: () => "Payment",
                cell: ({ row }) => {
                    const data = row.original;
                    if (data.status === PAYOUT_STATUS.PAYOUT) return <Chip
                        label="Paid"
                        sx={{
                            backgroundColor: "#28a745",
                            color: "#fff",
                            fontWeight: "bold"
                        }}
                    />;
                    return (
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleMarkPay(data)}
                            sx={{
                                backgroundColor: "#da1919",
                                color: "#fff",
                                padding: "4px 8px",
                                fontSize: "12px",
                                textTransform: "none",
                                "&:hover": { backgroundColor: "#b31515" },
                            }}
                        >
                            {lang("payouts.mark_as_pay", "Mark as pay")}
                        </Button>
                    );
                },
            },
            {
                accessorKey: "actions",
                header: () => lang("invoice.actions"),
                cell: ({ row }) => (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap" }}>
                        <IconButton
                            size="small"
                            onClick={() => {
                                // Dispatch event to open edit modal with payout data
                                window.dispatchEvent(
                                    new CustomEvent("payout:open-edit", {
                                        detail: row.original, // WHOLE payout row send karo
                                    })
                                );
                            }}
                            sx={{
                                color: "#ed6c02",
                                transition: "transform 0.2s ease",
                                "&:hover": {
                                    backgroundColor: "rgba(237, 108, 2, 0.08)",
                                    transform: "scale(1.1)",
                                },
                            }}
                        >
                            <FiEdit size={18} />
                        </IconButton>
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
                        ><FiTrash2 size={18} />
                        </IconButton>
                        <Link
                            href={`/admin/finance/payouts/view/${row.original.id}`}
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
                        <IconButton
                            size="small"
                            onClick={() => downloadPayoutPDF(row.original.id, priceWithCurrency)}
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
                    </Stack>
                ),
                meta: {
                    disableSort: true,
                },
            }
        ]
        , [lang]);

    return (
        <>
            <div className="p-6 bg-white rounded-3xl shadow-md">
                <div className="d-flex items-center justify-content-between gap-2 mb-4 mt-4 w-full flex-wrap">
                    <div style={{ display: "flex", gap: "2%" }}>
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
                            options={investorList}
                            value={investorFilter}
                            sx={{ minWidth: 260 }}
                            onChange={(e, newValue) => {
                                setPageIndex(0);
                                setInvestorFilter(newValue);   // store full object
                            }}
                            onInputChange={(e, value, reason) => {
                                if (reason === "input") {
                                    setInvestorSearch(value);
                                }
                                if (reason === "clear") {
                                    setInvestorFilter(null);     // prevent reselection
                                }
                            }}
                            getOptionLabel={(option) => option?.full_name || ""}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={lang("authentication.becomeInvestor", "Investor")}
                                    placeholder="Search investor..."
                                />
                            )}
                        />

                    </div>
                </div>
                <div className="overflow-x-auto relative">
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

            {/* QR Code Modal */}
            {showQRModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowQRModal(false)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <BsQrCode className="me-2" />
                                    {lang("table.qr_code")} - {selectedQRCode?.userName}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowQRModal(false)}></button>
                            </div>
                            <div className="modal-body text-center p-4">
                                {selectedQRCode?.qrCode ? (
                                    <div>
                                        <img
                                            src={selectedQRCode.qrCode}
                                            alt={`QR Code for ${selectedQRCode.userName}`}
                                            className="img-fluid"
                                            style={{ maxWidth: '300px', width: '100%' }}
                                        />
                                        <p className="mt-3 text-muted">{lang("table.scan_qr_code")}</p>
                                    </div>
                                ) : (
                                    <div className="text-muted">
                                        <BsQrCode size={48} className="mb-3" />
                                        <p>{lang("table.no_qr_code_available")}</p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowQRModal(false)}>
                                    {lang("modal.close")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction ID Modal */}
            <TransactionDialog
                open={txModalOpen}
                onClose={handleCloseTxModal}
                onSubmit={() => markAsPaid(selectedPayout?.id, txId)}
                txId={txId}
                setTxId={setTxId}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                errors={errors}
                lang={lang}
                showTxId={!selectedPayout?.transaction_id}
            />
        </>
    );
};

export default PayoutsPage;
