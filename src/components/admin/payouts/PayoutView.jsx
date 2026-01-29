"use client";

import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";

const PayoutView = ({ payout_id }) => {
    const { lang } = useLanguage();
    const { user } = useAuth();
    const [payoutData, setPayoutData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [companySettings, setCompanySettings] = useState({});
    const [countries, setCountries] = useState([]);


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

    // payout data for display (customize as needed)
    const company = {
        name: companySettings?.site_name || "WeShare",
        address: companySettings?.site_address || "",
        country: countries.find(c => Number(c.id) === Number(companySettings?.site_country))?.name || "",
        zip: companySettings?.site_zip || "",
    };
    const payout = payoutData;
    const invoice = payout?.invoices || {};
    const project = payout?.projects || {};
    const client = payout?.users || {};
    const summary = {
        summary: invoice?.sub_amount,
        tax_amount: invoice?.tax_amount,
        total: invoice?.total_amount,
    };
    const invoiceDisplay = `${invoice?.invoice_prefix || ""}-${invoice?.invoice_number || ""}`;
    const qrCodeSrc = client?.qr_code || "/images/invoice_qr.jpg";

    return (
        <div className="bg-white rounded shadow p-4">
            <div id="invoice-content-body">
                <h2 className="h4 fw-semibold mb-4">{lang("payouts.payouts")}</h2>
                <div className="border rounded p-4 mb-4">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3">
                        <div>
                            <div className="h3 fw-bold theme-org-color mb-2">{company?.name || ""}</div>
                            <div className="text-muted small">
                                {company?.address && <div>{company.address}</div>}
                                {company?.country && <div>{company.country}</div>}
                                {company?.zip && <div>{company.zip}</div>}
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
                            <img src={qrCodeSrc} alt="Finance QR Code" style={{ width: '128px', height: '128px', objectFit: 'contain' }} />
                        </div>
                    </div>
                </div>

                <div className="d-flex flex-column flex-md-row justify-content-between mb-3">
                    <div>
                        <div className="fw-bold h5 mb-2">{lang("payouts.payout_details")}</div>
                        <div style={{ color: '#374151' }}>{lang("payouts.payout_number")}: <span className="fw-semibold">{payout?.payout_prefix}-{payout?.payout_number}</span></div>
                        <div style={{ color: '#374151' }}>{lang("projects.projectName")}: <span className="fw-semibold">{project?.project_name || ""}</span></div>
                        <div style={{ color: '#374151' }}>{lang("invoice.invoiceNumber")}: <span className="fw-semibold">{invoiceDisplay}</span></div>
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
                                <th className="px-3 py-2 text-start fw-semibold">{lang("invoice.invoiceNumber")}</th>
                                <th className="px-3 py-2 text-start fw-semibold">{lang("payouts.invoice_amount")}</th>
                                <th className="px-3 py-2 text-start fw-semibold">{lang("payouts.investor_percentage")}</th>
                                <th className="px-3 py-2 text-start fw-semibold">{lang("payouts.payment_amount")}</th>
                                <th className="px-3 py-2 text-start fw-semibold">{lang("payouts.transaction_id")}</th>
                                <th className="px-3 py-2 text-start fw-semibold">{lang("payouts.payout_date")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ backgroundColor: '#ffffff' }}>
                                <td className="px-3 py-2 text-nowrap">
                                    <div className="fw-semibold">{invoice.invoice_prefix}-{invoice.invoice_number}</div>
                                    {/* <div className="text-muted" style={{ fontSize: '0.75rem' }}>{invoice.desc}</div> */}
                                </td>
                                <td className="px-3 py-2 text-nowrap">{invoice.total_amount ? priceWithCurrency(invoice.total_amount) : "-"}</td>
                                <td className="px-3 py-2 text-nowrap fw-bold">{payout.investor_percent ? payout.investor_percent + "%" : "-"}</td>
                                <td className="px-3 py-2 text-nowrap fw-bold">{payout.payout_amount ? priceWithCurrency(payout.payout_amount) : "-"}</td>
                                <td className="px-3 py-2 text-nowrap">{payout.transaction_id ? payout.transaction_id : "-"}</td>
                                <td className="px-3 py-2 text-nowrap">{payout.payout_date ? payout.payout_date : "-"}</td>
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
                                    {/* <div className="d-flex justify-content-between align-items-center">
                                        <span className="text-muted">{lang("common.subtotal")}</span>
                                        <span className="fw-semibold" style={{ color: '#111827' }}>{summary?.summary || ''}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="text-muted">{lang("common.tax")}</span>
                                        <span className="fw-semibold" style={{ color: '#b91c1c' }}>{summary?.tax_amount || ''}</span>
                                    </div> */}
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="fw-bold" style={{ color: '#111827' }}>{lang("payouts.payment_amount")}</span>
                                        <span className="fw-bold h5 mb-0" style={{ color: '#1d4ed8' }}>{priceWithCurrency(payout?.payout_amount) || ''}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayoutView;