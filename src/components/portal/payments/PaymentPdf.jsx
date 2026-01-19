"use client";
import { apiGet } from "@/lib/api";

export const downloadPaymentPDF = async (paymentId, priceWithCurrency) => {
  try {
    /* ================= FETCH PAYMENT ================= */
    const response = await apiGet(`/api/payments/${paymentId}`, {
      includeAuth: true,
    });

    if (!response?.success || !response?.data) {
      alert("Failed to load payment");
      return;
    }

    const payment = response.data;

    /* ================= HELPERS ================= */
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

    const statusLabel = (value) => {
      if (typeof value === "string") return value;
      const map = { 0: "Pending", 1: "Paid" };
      return map[value] ?? "Pending";
    };

    /* ================= DATA ================= */
    const invoiceNumber = `${payment?.invoices?.invoice_prefix || ""}-${payment?.invoices?.invoice_number || ""}`.trim();
    const projectName = payment?.invoices?.projects?.project_name || "N/A";
    const invoiceStatus = statusLabel(payment?.status);

    /* ================= STATUS STYLES (FIXED) ================= */
    const statusStyles = {
      Paid: {
        text: "#065f46",
        bg: "#ecfdf5",
        border: "#10b981",
      },
      Pending: {
        text: "#92400e",
        bg: "#fffbeb",
        border: "#f59e0b",
      },
      Unfunded: {
        text: "#92400e",
        bg: "#fffbeb",
        border: "#f59e0b",
      },
      Unpaid: {
        text: "#7f1d1d",
        bg: "#fef2f2",
        border: "#ef4444",
      },
    };

    const s =
      statusStyles[invoiceStatus] || {
        text: "#374151",
        bg: "#f3f4f6",
        border: "#9ca3af",
      };

    /* ================= PDF HTML ================= */
    const paymentHTML = `
    <div style="max-width: 820px; margin: 0 auto; background: #ffffff; font-family: Inter, system-ui, -apple-system; color: #111827;">

      <!-- HEADER -->
      <div style="padding: 24px 28px; border-bottom: 1px solid #e5e7eb;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700;">
          Payment Receipt
        </h1>
        <p style="margin: 6px 0 0; font-size: 14px; color: #6b7280;">
          Invoice No: <strong>${invoiceNumber || "—"}</strong>
        </p>
      </div>

      <!-- BODY -->
      <div style="padding: 28px;">

        <!-- PROJECT & AMOUNT & STATUS -->
        <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 16px; margin-bottom: 28px; align-items: center;">
          <div>
            <p style="margin: 0; font-size: 13px; color: #6b7280;">Project</p>
            <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600;">
              ${projectName}
            </p>
          </div>

          <div>
            <p style="margin: 0; font-size: 13px; color: #6b7280;">Amount Paid</p>
            <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #0f766e;">
              ${priceWithCurrency(payment?.amount || 0)}
            </p>
          </div>

          <div>
            <p style="margin: 0; font-size: 13px; color: #6b7280;">Status</p>
            <span style="
              display: inline-flex;
              align-items: center;
              gap: 8px;
              margin-top: 14px;
              padding: 0px 10px 4px 0px;
              font-size: 13px;
              font-weight: 600;
              color: ${s.text};
              background: ${s.bg};
              border: 1px solid ${s.border};
              border-radius: 999px;
            ">
              <span style="
                border-radius: 50%;
                background: ${s.border};
                display: inline-block;
              "></span>
              ${invoiceStatus}
            </span>
          </div>
        </div>

        <!-- DATES -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px;">
          <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Invoice Date</p>
            <p style="margin: 6px 0 0; font-size: 14px; font-weight: 600;">
              ${formatDate(payment?.invoices?.invoice_date)}
            </p>
          </div>

          <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Due Date</p>
            <p style="margin: 6px 0 0; font-size: 14px; font-weight: 600;">
              ${formatDate(payment?.invoices?.due_date)}
            </p>
          </div>

          <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Payment Date</p>
            <p style="margin: 6px 0 0; font-size: 14px; font-weight: 600;">
              ${formatDate(payment?.created_at)}
            </p>
          </div>
        </div>



        <!-- SCREENSHOT -->
        ${
          payment?.ss_url
            ? `
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="padding: 12px 16px; background: #f9fafb; font-weight: 600;">
            Payment Screenshot
          </div>
          <div style="padding: 16px; text-align: center;">
            <img
              src="${payment.ss_url}"
              style="max-width: 100%; max-height: 420px; border-radius: 8px; border: 1px solid #e5e7eb; object-fit: contain;"
            />
          </div>
        </div>
        `
            : ""
        }

      </div>

      <!-- FOOTER -->
      <div style="padding: 16px 28px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
        This is a system generated receipt.
      </div>

    </div>
    `;

    /* ================= PDF OPTIONS ================= */
    const opt = {
      margin: 10,
      filename: `Payment-${invoiceNumber || paymentId}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
    };

    /* ================= GENERATE PDF ================= */
    const html2pdf = (await import("html2pdf.js")).default;
    const element = document.createElement("div");
    element.innerHTML = paymentHTML;

    html2pdf().set(opt).from(element).save();
  } catch (err) {
    console.error(err);
    alert("Unable to download payment PDF");
  }
};
