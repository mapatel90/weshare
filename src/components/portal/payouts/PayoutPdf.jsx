"use client";

import { apiGet } from "@/lib/api";

export const downloadPayoutPDF = async (payout_id, priceWithCurrency) => {
    try {
        // Fetch payout data
        const response = await apiGet(`/api/payouts/${payout_id}`);
        if (!response?.success || !response?.data) {
            alert("Payout not found");
            return;
        }

        // Fetch company settings
        const settingsResponse = await apiGet("/api/settings", {
            includeAuth: true,
        });
        const settings = settingsResponse?.success ? settingsResponse.data : {};

        // Fetch location data
        const countriesRes = await apiGet("/api/locations/countries");
        const countries = countriesRes?.success && Array.isArray(countriesRes?.data) ? countriesRes.data : [];

        let states = [];
        let cities = [];

        if (settings?.site_country) {
            const statesRes = await apiGet(`/api/locations/countries/${settings.site_country}/states`);
            states = statesRes?.success && Array.isArray(statesRes?.data) ? statesRes.data : [];
        }

        if (settings?.site_state) {
            const citiesRes = await apiGet(`/api/locations/states/${settings.site_state}/cities`);
            cities = citiesRes?.success && Array.isArray(citiesRes?.data) ? citiesRes.data : [];
        }


        const getLocationName = (id, type) => {
            if (!id) return "";
            const numId = Number(id);
            if (type === "country") {
                const found = countries.find(c => Number(c.id) === numId);
                return found?.name || "";
            } else if (type === "state") {
                const found = states.find(s => Number(s.id) === numId);
                return found?.name || "";
            } else if (type === "city") {
                const found = cities.find(c => Number(c.id) === numId);
                return found?.name || "";
            }
            return "";
        };

        const formatDate = (val) => {
            if (!val) return "—";
            const d = new Date(val);
            return Number.isNaN(d.getTime())
                ? "—"
                : d.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
        };

        const companyCity = getLocationName(settings?.site_city, "city");
        const companyState = getLocationName(settings?.site_state, "state");
        const companyCountry = getLocationName(settings?.site_country, "country");
        const companyLocation = [companyCountry, companyState, companyCity].filter(Boolean).join(", ");


        const payout = response.data;
        const invoice = payout?.invoices || {};
        const project = payout?.projects || {};
        const client = payout?.users || {};
        const qrCodeSrc = client?.qr_code || "/images/invoice_qr.jpg";
        // Build client address
        // const clientAddress = [
        //     inv?.users?.address_1,
        //     inv?.users?.address_2,
        //     inv?.users?.cities?.name,
        //     inv?.users?.states?.name,
        //     inv?.users?.zipcode,
        // ].filter(Boolean).join(", ") || "";

        // Create HTML
        const invoiceHTML = `
            <div style="font-family: Arial, sans-serif; padding:20px;">
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                    <h1 style="color: #ff9800; margin: 0 0 10px 0; font-size: 28px;">${settings?.site_name || "WeShare"}</h1>
                    <div style="color: #666; font-size: 13px;">
                        ${settings?.site_address ? `<div>${settings?.site_address}</div>` : ""}
                        ${companyLocation ? `<div>${companyLocation}</div>` : ""}
                        ${settings?.site_zip ? `<div>${settings?.site_zip}</div>` : ""}
                    </div>
                    </div>
                    <div style="display: flex; align-items: center;">
                    </div>
                </div>
            </div>
                <h2 style="margin-bottom:20px;">Payout Details</h2>

                <div><b>Payout No:</b> ${payout.payout_prefix}-${payout.payout_number}</div>
                <div><b>Project:</b> ${project.project_name || ""}</div>
                <div><b>Date:</b> ${payout.created_at ? new Date(payout.created_at).toLocaleDateString() : ""}</div>

                <hr style="margin:20px 0"/>

                <h3>Investor</h3>
                <div><b>Name:</b> ${client.full_name || ""}</div>
                <div><b>Email:</b> ${client.email || ""}</div>

                <hr style="margin:20px 0"/>

                <table style="width:100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="border:1px solid #ddd; padding:8px;">Payout Amount</th>
                            <th style="border:1px solid #ddd; padding:8px;">Transaction ID</th>
                            <th style="border:1px solid #ddd; padding:8px;">Payout Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border:1px solid #ddd; padding:8px;"><b>${priceWithCurrency(payout.payout_amount)}</b></td>
                            <td style="border:1px solid #ddd; padding:8px;">${payout.transaction_id || "-"}</td>
                            <td style="border:1px solid #ddd; padding:8px;">${payout.payout_date ? payout.payout_date : "-"}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        // Create temp element
        const element = document.createElement("div");
        element.innerHTML = invoiceHTML;

        // PDF options
        const opt = {
            margin: 0.5,
            filename: `Payout-${payout.payout_number}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        };

        //  Dynamic import + generate
        const html2pdf = (await import("html2pdf.js")).default;
        await html2pdf().set(opt).from(element).save();

    } catch (err) {
        console.error("PDF download error:", err);
        alert("Failed to download PDF");
    }
};
