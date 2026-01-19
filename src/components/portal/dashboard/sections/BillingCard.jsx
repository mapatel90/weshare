"use client";

import React, { useEffect, useState } from 'react';
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";

const statusColors = {
  Paid: "status-installation",
  Unpaid: "status-upcoming",
  Pending: "status-upcoming",
};

export default function BillingCard( { lang } ) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const priceWithCurrency = usePriceWithCurrency();

    const formatDate = (value) => {
        if (!value) return "—";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "—";
        const month = d.toLocaleDateString("en-US", { month: "long" });
        const year = d.getFullYear();
        return `${month} ${year}`;
    };

    const statusLabel = (value) => {
        if (typeof value === "string") return value;
        const map = {
            0: lang("common.pending", "Pending"),
            1: lang("invoice.paid", "Paid"),
        };
        return map[value] ?? "Pending";
    };

    useEffect(() => {
        const fetchInvoices = async () => {
            if (!user?.id) {
                setInvoices([]);
                return;
            }

            setLoading(true);

            try {
                const params = new URLSearchParams({
                    page: "1",
                    limit: "5",
                });

                if (user.role === 3) {
                    params.append("offtaker_id", String(user.id));
                }

                const response = await apiGet(`/api/invoice?${params.toString()}`, {
                    includeAuth: true,
                });

                const list = response?.data;

                if (response?.success && Array.isArray(list)) {
                    const normalized = list.map((inv, idx) => ({
                        id: inv?.id ?? idx,
                        projectName: inv?.projects?.project_name || "—",
                        invoiceName: inv?.invoice_number
                            ? `${inv?.invoice_prefix || ""}-${inv.invoice_number}`.trim()
                            : "—",
                        period: formatDate(inv?.invoice_date),
                        amount: inv?.total_amount ?? inv?.amount ?? 0,
                        status: statusLabel(inv?.status),
                    }));

                    setInvoices(normalized);
                } else {
                    setInvoices([]);
                }
            } catch (error) {
                console.error("Failed to fetch invoices", error);
                setInvoices([]);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, [user?.id, user?.role]);

    return (
        <div className="billing-card">
            <div className="card-header">
                <div className="card-title">💳 {lang("dashboard.billing", "Billing")}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>{lang("projects.projectName", "Project Name")}</th>
                        <th>{lang("menu.invoices", "Invoice")}</th>
                        <th>{lang("dashboard.period", "Period")}</th>
                        <th>{lang("payments.amount", "Amount")}</th>
                        <th>{lang("common.status", "Status")}</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                                {lang("common.loading", "Loading...")}
                            </td>
                        </tr>
                    ) : invoices.length === 0 ? (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                                No invoices found
                            </td>
                        </tr>
                    ) : (
                        invoices.map((inv) => (
                            <tr key={inv.id}>
                                <td>{inv.projectName}</td>
                                <td>{inv.invoiceName}</td>
                                <td>{inv.period}</td>
                                <td>{priceWithCurrency(inv.amount)}</td>
                                <td>
                                    <span className={`status-badge ${statusColors[inv.status] || "status-upcoming"}`}>
                                        {inv.status}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}