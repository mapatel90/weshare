"use client";
import { apiGet } from "@/lib/api";

export const downloadInvoicePDF = async (invoiceId, priceWithCurrency) => {
  try {
    // Fetch invoice data
    const response = await apiGet(`/api/invoice/${invoiceId}`, {
      includeAuth: true,
    });

    if (!response?.success || !response?.data) {
      alert("Failed to load invoice for download");
      return;
    }

    const inv = response.data;

    // Fetch taxes for display
    const taxesResponse = await apiGet("/api/settings/taxes", {
      includeAuth: true,
    });
    const taxes = taxesResponse?.success ? taxesResponse.data : [];

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

    const getTaxDisplay = () => {
      if (!inv?.tax_id) return "No Tax";
      const taxValue = parseFloat(inv.tax_id);
      const matchedTax = taxes.find((t) => Number(t.id) === taxValue);
      if (matchedTax) {
        return `(${matchedTax.name} - ${matchedTax.value}%)`;
      }
      return String(inv.tax_id);
    };

    const qrCodeSrc = settings?.finance_qr_code || "/images/invoice_qr.jpg";
    const companyCity = getLocationName(settings?.site_city, "city");
    const companyState = getLocationName(settings?.site_state, "state");
    const companyCountry = getLocationName(settings?.site_country, "country");
    const companyLocation = [companyCountry, companyState, companyCity].filter(Boolean).join(", ");

    // Build client address
    const clientAddress = [
      inv?.users?.address_1,
      inv?.users?.address_2,
      inv?.users?.cities?.name,
      inv?.users?.states?.name,
      inv?.users?.zipcode,
    ].filter(Boolean).join(", ") || "";

    // Create invoice HTML for PDF
    const invoiceHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <h1 style="color: #ff9800; margin: 0 0 10px 0; font-size: 28px;">${
                settings?.site_name || "WeShare"
              }</h1>
              <div style="color: #666; font-size: 13px;">
                ${settings?.site_address ? `<div>${settings.site_address}</div>` : ""}
                ${companyLocation ? `<div>${companyLocation}</div>` : ""}
                ${settings?.site_zip ? `<div>${settings.site_zip}</div>` : ""}
              </div>
            </div>
            <div style="display: flex; align-items: center;">
              <img src="${qrCodeSrc}" alt="Finance QR Code" style="width: 128px; height: 128px; object-fit: contain;" />
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h2 style="margin: 0 0 10px 0; font-size: 20px;">INVOICE</h2>
            <p style="margin: 5px 0; color: #374151;"><strong>Invoice:</strong> ${
              inv?.invoice_prefix || ""
            }-${inv?.invoice_number || ""}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Created:</strong> ${formatDate(
              inv?.invoice_date
            )}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Due:</strong> ${formatDate(
              inv?.due_date
            )}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 5px 0; color: #6b7280;">Invoiced To:</p>
            <p style="margin: 5px 0; font-weight: bold;">${
              inv?.users?.full_name || "—"
            }</p>
            <p style="margin: 5px 0; color: #6b7280; font-size: 13px;">${
              inv?.users?.email || ""
            }</p>
            ${clientAddress ? `<p style="margin: 5px 0; color: #6b7280; font-size: 13px;">${clientAddress}</p>` : ""}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: 600;">#</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: 600;">DESCRIPTION</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: 600;">UNIT(KWH)</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: 600;">RATE(PER KWH)</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: 600;">ITEM TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${(inv?.invoice_items || [])
              .map(
                (item, idx) => `
              <tr style="background-color: ${idx % 2 ? "#ffffff" : "#f9fafb"};">
                <td style="padding: 10px; border: 1px solid #ddd;">${item.id}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">
                  <div style="font-weight: 600;">${item.item || "Item"}</div>
                  <div style="font-size: 12px; color: #666;">${
                    item.description || ""
                  }</div>
                </td>
                <td style="padding: 10px; border: 1px solid #ddd;">${Number(
                  item.unit || 0
                ).toFixed(2)}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${priceWithCurrency(
                  item.price
                )}</td>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${priceWithCurrency(
                  item.item_total
                )}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 30px;">
          <div style="width: 48%; border: 1px solid #ddd; border-radius: 8px; padding: 16px; background: #f9fafb;">
            <div style="margin-bottom: 15px;">
              <div style="font-weight: bold; margin-bottom: 8px; color: #374151; font-size: 14px;">Notes:</div>
              <div style="color: #6b7280; font-size: 13px; line-height: 1.6;">
                ${inv?.notes || "No additional notes"}
              </div>
            </div>
            <div>
              <div style="font-weight: bold; margin-bottom: 8px; color: #374151; font-size: 14px;">Terms & Conditions:</div>
              <div style="color: #6b7280; font-size: 13px; line-height: 1.6;">
                ${inv?.terms_and_conditions || "No terms and conditions provided"}
              </div>
            </div>
          </div>

          <div style="width: 48%; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background: #f9fafb;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Subtotal:</span>
              <span style="font-weight: bold; color: #111827;">${priceWithCurrency(
                inv?.sub_amount
              )}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Tax ${getTaxDisplay()}:</span>
              <span style="font-weight: bold; color: #b91c1c;">${priceWithCurrency(
                inv?.tax_amount
              )}</span>
            </div>
            <div style="border-top: 2px solid #333; padding-top: 12px; margin-top: 12px; display: flex; justify-content: space-between;">
              <span style="font-weight: bold; color: #111827; font-size: 16px;">Total Due:</span>
              <span style="font-weight: bold; color: #1d4ed8; font-size: 18px;">${priceWithCurrency(
                inv?.total_amount ?? inv?.sub_amount
              )}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const filename = `${inv?.invoice_prefix || "INV"}-${
      inv?.invoice_number || invoiceId || "invoice"
    }.pdf`;

    const opt = {
      margin: 10,
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
    };

    // Dynamically import html2pdf and generate PDF
    import("html2pdf.js").then((html2pdf) => {
      const element = document.createElement("div");
      element.innerHTML = invoiceHTML;
      html2pdf.default().set(opt).from(element).save();
    });
  } catch (error) {
    console.error("Failed to download PDF:", error);
    alert("Unable to download invoice PDF");
  }
};
