"use client";

import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { downloadPayoutPDF } from "./PayoutPdf";
import { buildUploadUrl } from "@/utils/common";

const PayoutView = ({ payout_id }) => {
    const { lang } = useLanguage();
    const { user } = useAuth();
    const [payoutData, setPayoutData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [companySettings, setCompanySettings] = useState({});
    const [countries, setCountries] = useState([]);
    const [documentPreview, setDocumentPreview] = useState(null);
    const priceWithCurrency = usePriceWithCurrency();

    useEffect(() => {
        const fetchCompanySettings = async () => {
            try {
                const response = await apiGet("/api/settings", { includeAuth: true });
                if (response?.success && response?.data) {
                    setCompanySettings(response.data);
                }
            } catch (err) {
                console.error("Error fetching company settings:", err);
            }
        };
        const fetchLocations = async () => {
            try {
                const countriesRes = await apiGet("/api/locations/countries");
                if (countriesRes?.success && Array.isArray(countriesRes?.data)) {
                    setCountries(countriesRes.data);
                }
            } catch (err) {
                console.error("Error fetching countries:", err);
            }
        };
        fetchCompanySettings();
        fetchLocations();
    }, []);

    useEffect(() => {
        const fetchPayout = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await apiGet(`/api/payouts/${payout_id}`);
                if (response?.success && response?.data) {
                    setPayoutData(response.data);
                } else {
                    setError("Payout not found");
                }
            } catch (e) {
                setError("Error fetching payout details");
            } finally {
                setLoading(false);
            }
        };
        if (payout_id) fetchPayout();
    }, [payout_id]);

    if (loading) {
        return <div>Loading payout details...</div>;
    }
    if (error) {
        return <div className="text-red-600">{error}</div>;
    }
    if (!payoutData) {
        return <div>No payout data found.</div>;
    }

    const payout = payoutData;
    const project = payout?.projects || {};
    const client = payout?.users || {};
    const handleViewDocument = (url) => {
        setDocumentPreview(buildUploadUrl(url));
    };

    const handlePayoutDownload = async (payout) => {
        console.log("Downloading payout PDF for payout ID:", payout);
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

    return (
        <div className="bg-white mt-5 rounded shadow p-4">
            <div id="invoice-content-body">
                <div className="d-flex flex-column flex-md-row justify-content-between mb-3">
                    <div>
                        <div className="fw-bold h5 mb-2">{lang("payouts.payout_details")}</div>
                        <div style={{ color: '#374151' }}>{lang("payouts.payout_number")}: <span className="fw-semibold">{payout?.payout_prefix}-{payout?.payout_number}</span></div>
                        <div style={{ color: '#374151' }}>{lang("projects.projectName")}: <span className="fw-semibold">{project?.project_name || ""}</span></div>
                        <div style={{ color: '#374151' }}>{lang("common.createdAt")}: <span className="fw-semibold">{payout?.created_at ? new Date(payout.created_at).toLocaleDateString("en-CA") : ""}</span></div>
                    </div>
                    <div className="text-end mt-3 mt-md-0">
                        <div className="text-muted">{lang("payouts.payoutto")}:</div>
                        <div className="fw-bold">{client?.full_name || ""}</div>
                        <div className="text-muted">{client?.email || ""}</div>
                    </div>
                </div>

                {/* Table for invoice and payout items*/}
                <div className="table-responsive border rounded mb-4">
                    <table className="table table-sm mb-0">
                        <thead style={{ backgroundColor: '#f3f4f6' }}>
                            <tr>
                                <th className="px-3 py-2 text-start fw-semibold">{lang("payouts.payout_amount")}</th>
                                <th className="px-3 py-2 text-start fw-semibold">{lang("payouts.transaction_id")}</th>
                                <th className="px-3 py-2 text-start fw-semibold">{lang("payouts.payout_date")}</th>
                                <th className="px-3 py-2 text-start fw-semibold">{lang("payouts.uploaded_image")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ backgroundColor: '#ffffff' }}>
                                <td className="px-3 py-2 text-nowrap fw-bold">{payout.payout_amount ? priceWithCurrency(payout.payout_amount) : "-"}</td>
                                <td className="px-3 py-2 text-nowrap">{payout.transaction_id ? payout.transaction_id : "-"}</td>
                                <td className="px-3 py-2 text-nowrap">{payout?.payout_date ? new Date(payout.payout_date).toLocaleDateString("en-CA") : "-"}</td>
                                <td className="px-3 py-2 text-nowrap">
                                    <Button
                                        size="small"
                                        onClick={() => handleViewDocument(payout?.document)}
                                    >
                                        {lang("navigation.view", "View")}
                                    </Button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-4">
                    <div className="row g-3">
                        {/* Left Column - Notes and Terms */}
                        <div className="col-12 col-md-6">
                            {/* <div className="border rounded-3 p-3 shadow-sm" style={{ background: '#f9fafb', height: '100%' }}>
                                <div className="mb-3">
                                    <div className="fw-bold mb-2" style={{ color: '#374151', fontSize: '14px' }}>{lang("menu.notes")}:</div>
                                    <div className="text-muted" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                                        {invoice?.notes || 'No additional notes'}
                                    </div>
                                </div>
                                <div>
                                    <div className="fw-bold mb-2" style={{ color: '#374151', fontSize: '14px' }}>{lang("authentication.termsConditions")}:</div>
                                    <div className="text-muted" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                                        {invoice?.terms_and_conditions || 'No terms and conditions provided'}
                                    </div>
                                </div>
                            </div> */}
                        </div>

                        {/* Right Column - Totals */}
                        <div className="col-12 col-md-6">
                            <div className="border rounded-3 p-3 p-md-4 shadow-sm" style={{ background: '#f9fafb' }}>
                                <div className="d-flex flex-column gap-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="fw-bold" style={{ color: '#111827' }}>{lang("payouts.payout_amount")}</span>
                                        <span className="fw-bold h5 mb-0" style={{ color: '#1d4ed8' }}>{priceWithCurrency(payout?.payout_amount) || ''}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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
                        {lang("common.close", "Close")}
                    </Button>
                </DialogActions>
            </Dialog>
            <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                    className="btn btn-secondary fw-bold px-4 py-2 rounded shadow"
                    type="button"
                    onClick={() => handlePayoutDownload(payoutData)}
                >
                    {lang("common.downloadPdf")}
                </button>
            </div>
        </div>
    );
};

export default PayoutView;