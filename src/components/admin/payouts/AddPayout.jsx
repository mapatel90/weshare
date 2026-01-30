"use client";
import React, { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { Autocomplete, TextField } from "@mui/material";
import { apiGet, apiPost, apiUpload } from "@/lib/api";
import { PROJECT_STATUS } from "@/constants/project_status";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";
import { useLanguage } from "@/contexts/LanguageContext";

const AddPayout = () => {
    const { lang } = useLanguage();
    const [open, setOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [projectList, setProjectList] = useState([]);
    const [projectId, setProjectId] = useState(null);
    const [invoiceList, setInvoiceList] = useState([]);
    const [invoiceId, setInvoiceId] = useState(null);
    const [invoiceAmount, setInvoiceAmount] = useState(0);
    const [investorPercent, setInvestorPercent] = useState(0);
    const [payoutAmount, setPayoutAmount] = useState(0);
    const [invester, setInvester] = useState(null);
    const [loading, setLoading] = useState(false);
    const [transactionId, setTransactionId] = useState("");
    const [errors, setErrors] = useState({});
    const [selectedFile, setSelectedFile] = useState(null);
    const [editId, setEditId] = useState(null);
    const [documentUrl, setDocumentUrl] = useState(null);
    const priceWithCurrency = usePriceWithCurrency();

    const resetForm = () => {
        setProjectId(null);
        setInvoiceId(null);
        setInvoiceList([]);
        setInvoiceAmount(0);
        setPayoutAmount(0);
        setInvestorPercent(0);
        setInvester("");
        setTransactionId("");
        setErrors({});
        setSelectedFile(null);
        setDocumentUrl(null);
    };

    // ---------------------------
    // Open modal event listener
    // ---------------------------
    useEffect(() => {
        const handleOpen = (e) => {
            const data = e?.detail || null;

            if (data?.id) {
                // EDIT MODE
                setEditData(data);
                setProjectId(data?.project_id || null);
                setInvoiceId(data?.invoice_id || null);
                setInvoiceAmount(Number(data?.invoice_amount || 0));
                setPayoutAmount(Number(data?.payout_amount || 0));
                setInvestorPercent(Number(data?.investor_percent || 0));
                setInvester(data.users?.full_name || "");
                setTransactionId(data?.transaction_id || "");
                setDocumentUrl(data?.document || null);
            } else {
                // ADD MODE RESET
                setEditData(null);
                resetForm();
            }

            setOpen(true);
        };

        window.addEventListener("payout:open-edit", handleOpen);
        return () => window.removeEventListener("payout:open-edit", handleOpen);
    }, []);


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

    // ---------------------------
    // Fetch projects when modal opens
    // ---------------------------
    useEffect(() => {
        if (!open) return;
        fetchProjects();
    }, [open]);

    // ---------------------------
    // Fetch invoices when project changes
    // ---------------------------
    useEffect(() => {
        if (!projectId) return;
        if (editId) return; // Don't fetch invoices in edit mode
        const fetchInvoices = async () => {
            try {
                const res = await apiPost(`/api/invoice/dropdown`, {
                    project_id: projectId,
                    status: 1,
                });
                if (res?.success) {
                    setInvoiceList(res.data);
                } else {
                    setInvoiceList([]);
                }
            } catch (err) {
                console.error("Invoice dropdown error", err);
                setInvoiceList([]);
            }
        };
        fetchInvoices();
    }, [projectId, editId]);

    const handleProjectChange = (val) => {
        setProjectId(val?.id || null);
        setInvestorPercent(Number(val?.investor_profit || 0));
        setInvester(val?.investor.full_name || null);
        // Reset invoice related data
        setInvoiceId(null);
        setInvoiceAmount(0);
        setPayoutAmount(0);
    };

    const handleInvoiceChange = (val) => {
        setInvoiceId(val?.id || null);
        const amount = Number(val?.total_amount || 0);
        setInvoiceAmount(amount);
        // Calculation using project %
        const payout = (amount * investorPercent) / 100;
        setPayoutAmount(payout);
    };


    const validate = () => {
        const newErrors = {};

        if (!projectId) newErrors.projectId = "Project is required";
        if (!invoiceId) newErrors.invoiceId = "Invoice is required";
        if (!invoiceAmount || invoiceAmount <= 0)
            newErrors.invoiceAmount = "Invoice amount invalid";
        if (!payoutAmount || payoutAmount <= 0)
            newErrors.payoutAmount = "Payout amount invalid";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    // ---------------------------
    // Save payout
    // ---------------------------
    const handleSave = async () => {
        if (!editData && !validate()) return;

        try {
            setLoading(true);
            const formData = new FormData();
            if (editData) {
                // Only update transaction_id and document
                formData.append('id', editData.id);
                formData.append('transaction_id', transactionId);
                if (selectedFile) {
                    formData.append('document', selectedFile);
                }
                console.log('ee')
                const res = await apiUpload("/api/payouts/update", formData);
                if (res?.success) {
                    window.dispatchEvent(new Event("payout:refresh"));
                    handleClose();
                }
            } else {
                // Add mode
                formData.append('project_id', projectId);
                formData.append('invoice_id', invoiceId);
                formData.append('transaction_id', transactionId);
                if (selectedFile) {
                    formData.append('document', selectedFile);
                }
                const res = await apiUpload("/api/payouts/create", formData);
                if (res?.success) {
                    window.dispatchEvent(new Event("payout:refresh"));
                    handleClose();
                }
            }
        } catch (err) {
            console.error(editId ? "Update payout error" : "Create payout error", err);
        } finally {
            setLoading(false);
        }
    };


    const handleClose = () => {
        setOpen(false);
        setProjectId(null);
        setInvoiceId(null);
        setInvoiceList([]);
        setTransactionId("");
        setErrors({});
        setEditId(null);
        setDocumentUrl(null);
        setSelectedFile(null);
    };


    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{editData ? "Edit Payout" : "Add Payout"}</DialogTitle>

            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                {/* Project Dropdown */}
                <Autocomplete
                    sx={{ mt: 1 }}
                    options={projectList}
                    value={projectList.find((p) => p.id === projectId) || null}
                    onChange={(e, val) => handleProjectChange(val)}
                    getOptionLabel={(option) => option.project_name || ""}
                    disabled={!!editData}   // only disable component in edit
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={lang('home.exchangeHub.project')}
                            error={!!errors.projectId}
                            helperText={errors.projectId}
                        />
                    )}
                />

                {projectId && (
                    <TextField
                        label={lang("payouts.investor_name")}
                        value={invester || ""}
                        InputProps={{ readOnly: true }}
                        InputLabelProps={{ shrink: true }}
                        disabled
                    />
                )}

                {/* Invoice Dropdown */}
                <Autocomplete
                    options={invoiceList}
                    value={invoiceList.find((i) => i.id === invoiceId) || null}
                    onChange={(e, val) => handleInvoiceChange(val)}
                    getOptionLabel={(option) =>
                        `${option.invoice_prefix}-${option.invoice_number}`
                    }
                    disabled={!projectId || !!editData}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={lang('menu.invoice')}
                            error={!!errors.invoiceId}
                            helperText={errors.invoiceId}
                        />
                    )}
                />

                <TextField
                    label={lang("payouts.invoice_amount")}
                    value={priceWithCurrency(invoiceAmount)}
                    InputProps={{ readOnly: true }}
                    disabled
                    error={!!errors.invoiceAmount}
                    helperText={errors.invoiceAmount}
                />

                <TextField
                    label={lang("payouts.investor_percentage")}
                    value={`${investorPercent}%`}
                    disabled
                    InputProps={{ readOnly: true }}
                />

                <TextField
                    label={lang("payouts.payout_amount")}
                    value={priceWithCurrency(payoutAmount)}
                    InputProps={{ readOnly: true }}
                    disabled
                    error={!!errors.payoutAmount}
                    helperText={errors.payoutAmount}
                />

                <TextField
                    label={lang("payouts.transaction_id")}
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder={lang("payouts.enterTransactionId")}
                    fullWidth
                />
                <TextField
                    fullWidth
                    type="file"
                    inputProps={{ accept: "image/*" }}
                    label={lang("projects.uploadImage")}
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) => {
                        const file = (e.target.files && e.target.files[0]) || null;
                        setSelectedFile(file);
                    }}
                />

                {documentUrl && !selectedFile && (
                    <div style={{ marginTop: 10 }}>
                        <p>{lang("payouts.uploaded_image")}:</p>
                        <img
                            src={documentUrl}
                            alt="Document"
                            style={{
                                width: 160,
                                height: "auto",
                                borderRadius: 8,
                                border: "1px solid #ddd",
                                objectFit: "cover"
                            }}
                        />
                    </div>
                )}
                {selectedFile &&
                    <div style={{ marginTop: 10 }}>
                        <p>{lang("payouts.selected_image")}:</p>
                        <img src={URL.createObjectURL(selectedFile)}
                            style={{
                                width: 160,
                                height: "auto",
                                borderRadius: 8,
                                border: "1px solid #ddd",
                                objectFit: "cover"
                            }} />
                    </div>
                }
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} color="error" variant="outlined" className="custom-orange-outline">Cancel</Button>
                <Button onClick={handleSave} variant="contained" disabled={loading} className="common-grey-color">
                    {loading ? "Saving..." : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddPayout;
