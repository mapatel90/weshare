"use client";

import React, { useState, useEffect } from 'react';
import { apiGet } from "@/lib/api";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";

function DocumentsCard( { lang } ) {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const priceWithCurrency = usePriceWithCurrency();

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                setLoading(true);
                const response = await apiGet('/api/payments?page=1&pageSize=5', { includeAuth: true });
                
                if (response?.success && Array.isArray(response?.data)) {
                    const formattedPayments = response.data.map((payment) => ({
                        id: payment.id,
                        projectName: payment.invoices?.projects?.project_name || "N/A",
                        invoiceNumber: payment.invoices?.invoice_number || "N/A",
                        invoicePrefix: payment.invoices?.invoice_prefix || "",
                        period: payment.invoices?.invoice_date 
                            ? new Date(payment.invoices.invoice_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                            : "N/A",
                        amount: payment.amount || 0,
                        status: payment.status,
                    }));
                    setPayments(formattedPayments);
                }
            } catch (err) {
                console.error("Error fetching payments:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, []);

    return (
         <div className="billing-card">
            <div className="card-header">
                <div className="card-title">💳 {lang("navigation.payment", "Payments")}</div>
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
                            <td colSpan="5" className="text-center py-4">Loading...</td>
                        </tr>
                    ) : payments.length > 0 ? (
                        payments.map((payment) => (
                            <tr key={payment.id}>
                                <td>{payment.projectName}</td>
                                <td>{`${payment.invoicePrefix}-${payment.invoiceNumber}`}</td>
                                <td>{payment.period}</td>
                                <td>{priceWithCurrency(payment.amount)}</td>
                                <td>
                                    <span className={`status-badge ${payment.status === 0 ? "status-upcoming" : "status-installation"}`}>
                                        {payment.status === 0 ? lang("common.pending", "Pending") : lang("invoice.paid", "Paid")}
                                    </span>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="text-center py-4">{lang("messages.dataNotFound", "No payments found")}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default DocumentsCard;