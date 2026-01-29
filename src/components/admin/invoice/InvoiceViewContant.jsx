"use client";
import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiUpload } from "@/lib/api";
import PaymentModal from "@/components/portal/billings/PaymentModal";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { showSuccessToast } from "@/utils/topTost";
import { useLanguage } from "@/contexts/LanguageContext";

const InvoiceViewContant = ({ invoiceId }) => {
  const [invoiceData, setInvoiceData] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [taxes, setTaxes] = useState([]);
  const [companySettings, setCompanySettings] = useState({});
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [hasPayment, setHasPayment] = useState(false);
  const priceWithCurrency = usePriceWithCurrency();
  const { user } = useAuth();
  const router = useRouter();
  const { lang } = useLanguage();

  useEffect(() => {
    const fetchTaxes = async () => {
      try {
        const response = await apiGet("/api/settings/taxes", { includeAuth: true });
        if (response?.success && Array.isArray(response?.data)) {
          setTaxes(response.data);
        }
      } catch (err) {
        console.error("Error fetching taxes:", err);
      }
    };

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

    fetchTaxes();
    fetchCompanySettings();
    fetchLocations();
  }, []);

  useEffect(() => {
    if (companySettings?.site_country) {
      const fetchStates = async () => {
        try {
          const statesRes = await apiGet(`/api/locations/countries/${companySettings.site_country}/states`);
          if (statesRes?.success && Array.isArray(statesRes?.data)) {
            setStates(statesRes.data);
          }
        } catch (err) {
          console.error("Error fetching states:", err);
        }
      };
      fetchStates();
    }
  }, [companySettings?.site_country]);

  useEffect(() => {
    if (companySettings?.site_state) {
      const fetchCities = async () => {
        try {
          const citiesRes = await apiGet(`/api/locations/states/${companySettings.site_state}/cities`);
          if (citiesRes?.success && Array.isArray(citiesRes?.data)) {
            setCities(citiesRes.data);
          }
        } catch (err) {
          console.error("Error fetching cities:", err);
        }
      };
      fetchCities();
    }
  }, [companySettings?.site_state]);

  const fetchInvoice = async () => {
    if (!invoiceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

      try {
        const response = await apiGet(`/api/invoice/${invoiceId}`, { includeAuth: true });

        if (response?.success && response?.data) {
          const apiInv = response.data;
          setHasPayment(Array.isArray(apiInv?.payments) && apiInv.payments.length > 0);
          const formatDate = (val) => {
            if (!val) return "—";
            const d = new Date(val);
            return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
          };

          const formatCurrency = (val) => {
            const num = Number(val);
            return Number.isFinite(num) ? `$${num.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "—";
          };

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

          const normalized = {
            company: {
              name: companySettings?.site_name || "WeShare",
              address: companySettings?.site_address || "",
              city: getLocationName(companySettings?.site_city, "city"),
              state: getLocationName(companySettings?.site_state, "state"),
              country: getLocationName(companySettings?.site_country, "country"),
              zip: companySettings?.site_zip || "",
            },
            invoice: {
              number: apiInv?.invoice_number || "—",
              prefix: apiInv?.invoice_prefix || "",
              created: formatDate(apiInv?.invoice_date),
              due: formatDate(apiInv?.due_date),
              qr_code_url: apiInv?.qr_code_url || "",
            },
            client: {
              name: apiInv?.users?.full_name || "—",
              email: apiInv?.users?.email || "—",
              address: [
                apiInv?.users?.address_1,
                apiInv?.users?.address_2,
                apiInv?.users?.cities?.name,
                apiInv?.users?.states?.name,
                apiInv?.users?.zipcode,
              ]
                .filter(Boolean)
                .join(", ") || "—",
            },
            items: (apiInv?.invoice_items || []).map((item) => ({
              id: item?.id,
              title: item?.item || "Item",
              desc: item?.description || "",
              unit: item?.unit || "0",
              price: priceWithCurrency(item?.price),
              subtotal: priceWithCurrency(item?.item_total),
            })),
            payment: {
              method: "Visa ***** ***** 1234",
            },
            summary: {
              summary: priceWithCurrency(apiInv?.sub_amount),
              discount: "$0",
              tax_id: apiInv?.tax_id || "0%",
              tax_amount: priceWithCurrency(apiInv?.tax_amount),
              total: priceWithCurrency(apiInv?.total_amount ?? apiInv?.sub_amount),
            },
            notes: apiInv?.notes || "",
            terms_and_conditions: apiInv?.terms_and_conditions || "",
            status: apiInv?.status || 0,
          };

          setInvoiceData(normalized);
        } else {
          setError("Failed to load invoice.");
          setInvoiceData("");
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError("Unable to fetch invoice data.");
        setInvoiceData("");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId, companySettings, countries, states, cities]);

  const { company, invoice, client, items, payment, summary } = invoiceData || {};
  const invoiceDisplay = `${invoice?.prefix || ""}-${invoice?.number || ""}`;
  console.log("Invoice Data:", invoice);
  const qrCodeSrc = invoice?.qr_code_url || "";

  const getTaxDisplay = () => {
    if (!invoiceData?.summary?.tax_id || invoiceData.summary.tax_id === "0%") return "No Tax";
    const taxValue = parseFloat(invoiceData.summary.tax_id);
    const matchedTax = taxes.find((t) => Number(t.id) === taxValue);
    if (matchedTax) {
      return `(${matchedTax.name} - ${matchedTax.value}%)`;
    }
    return invoiceData.summary.tax_id;
  };

  const handleModalSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      // Upload screenshot first
      let ss_url = "";
      if (data.image) {
        const formData = new FormData();
        formData.append("file", data.image);
        formData.append("folder", "payment");

        const uploadResponse = await apiUpload("/api/upload", formData);
        if (uploadResponse?.success && uploadResponse?.data?.url) {
          ss_url = uploadResponse.data.url;
        } else {
          throw new Error("Failed to upload screenshot");
        }
      }

      // Create payment record
      const amountString = summary?.total?.replace(/[^\d.]/g, "") || "0";
      const paymentData = {
        invoice_id: invoiceId,
        offtaker_id: user?.id,
        amount: Number(amountString) || 0,
        ss_url: ss_url,
        status: 1, // Paid status
        created_by: user?.id,
      };

      const response = await apiPost("/api/payments", paymentData);
      if (!response?.success) {
        throw new Error(response?.message || "Payment creation failed");
      }

      // Show success message
      showSuccessToast("Payment submitted successfully!");
      setHasPayment(true);
      setModalOpen(false);
      router.push("/admin/finance/invoice");
    } catch (err) {
      console.error("Payment submission error:", err);
      setError(err.message || "Failed to submit payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!invoiceData) return;

    const element = document.getElementById("invoice-content-body");
    if (!element) return;

    const filename = `${invoice?.prefix || "INV"}-${invoice?.number || invoiceId || "invoice"}.pdf`;

    const opt = {
      margin: 10,
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
    };

    import("html2pdf.js").then((html2pdf) => {
      html2pdf.default().set(opt).from(element).save();
    });
  };

  return (
      <div className="bg-white rounded shadow p-4">
        <div id="invoice-content-body">
        <h2 className="h4 fw-semibold mb-4">{lang("menu.invoice")}</h2>
        <div className="border rounded p-4 mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3">
            <div>
              <div className="h3 fw-bold theme-org-color mb-2">{company?.name || ""}</div>
              <div className="text-muted small">
                {company?.address && <div>{company.address}</div>}
                {(company?.country || company?.state || company?.city) && (
                  <div>{[company.country, company.state, company.city].filter(Boolean).join(", ")}</div>
                )}
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
            <div className="fw-bold h5 mb-2">{lang("invoice.invoice")}</div>
            <div style={{ color: '#374151' }}>{lang("payments.invoice")}: <span className="fw-semibold">{invoiceDisplay}</span></div>
            <div style={{ color: '#374151' }}>{lang("usersView.created")}: <span className="fw-semibold">{invoice?.created || ""}</span></div>
            <div style={{ color: '#374151' }}>{lang("common.due")}: <span className="fw-semibold">{invoice?.due || ""}</span></div>
          </div>
          <div className="text-end mt-3 mt-md-0">
            <div className="text-muted">{lang("invoice.invoiceto")}:</div>
            <div className="fw-bold">{client?.name || ""}</div>
            <div className="text-muted">{client?.email || ""}</div>
            <div className="text-muted">{client?.address || ""}</div>
          </div>
        </div>

        <div className="table-responsive border rounded mb-4">
          <table className="table table-sm mb-0">
            <thead style={{ backgroundColor: '#f3f4f6' }}>
              <tr>
                <th className="px-3 py-2 text-start fw-semibold">{lang("invoice.item")}</th>
                <th className="px-3 py-2 text-start fw-semibold">{lang("common.unit(kwh)")}</th>
                <th className="px-3 py-2 text-start fw-semibold">{lang("common.rate(perkwh)")}</th>
                <th className="px-3 py-2 text-start fw-semibold">{lang("common.itemtotal")}</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((item, idx) => (
                <tr key={item.id} style={{ backgroundColor: idx % 2 ? '#ffffff' : '#f9fafb' }}>
                  <td className="px-3 py-2 text-nowrap">
                    <div className="fw-semibold">{item.title}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.desc}</div>
                  </td>
                  <td className="px-3 py-2 text-nowrap">{(item.unit).toFixed(2)}</td>
                  <td className="px-3 py-2 text-nowrap">{item.price}</td>
                  <td className="px-3 py-2 text-nowrap fw-bold">{item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <div className="row g-3">
            {/* Left Column - Notes and Terms */}
            <div className="col-12 col-md-6">
              <div className="border rounded-3 p-3 shadow-sm" style={{ background: '#f9fafb', height: '100%' }}>
                <div className="mb-3">
                  <div className="fw-bold mb-2" style={{ color: '#374151', fontSize: '14px' }}>{lang("menu.notes")}:</div>
                  <div className="text-muted" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    {invoiceData?.notes || 'No additional notes'}
                  </div>
                </div>
                <div>
                  <div className="fw-bold mb-2" style={{ color: '#374151', fontSize: '14px' }}>{lang("authentication.termsConditions")}:</div>
                  <div className="text-muted" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    {invoiceData?.terms_and_conditions || 'No terms and conditions provided'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Totals */}
            <div className="col-12 col-md-6">
              <div className="border rounded-3 p-3 p-md-4 shadow-sm" style={{ background: '#f9fafb' }}>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">{lang("common.subtotal")}</span>
                    <span className="fw-semibold" style={{ color: '#111827' }}>{summary?.summary || ''}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">{lang("common.tax")} {getTaxDisplay()}</span>
                    <span className="fw-semibold" style={{ color: '#b91c1c' }}>{summary?.tax_amount || ''}</span>
                  </div>
                  <div className="border-top pt-3 mt-2 d-flex justify-content-between align-items-center">
                    <span className="fw-bold" style={{ color: '#111827' }}>{lang("common.totaldue")}</span>
                    <span className="fw-bold h5 mb-0" style={{ color: '#1d4ed8' }}>{summary?.total || ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button
            className="btn btn-secondary fw-bold px-4 py-2 rounded shadow"
            type="button"
            onClick={handleDownloadPDF}
          >
            {lang("common.downloadPdf")}
          </button>
          {!hasPayment && invoiceData?.status !== 1 && (
          <button
            className="btn text-white fw-bold px-4 py-2 rounded shadow common-orange-color"
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={submitting}
          >
            {submitting ? lang("common.processing") : lang("common.makePayment")}
          </button>
          )}
        </div>
        <PaymentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          invoiceNumber={invoiceDisplay || ""}
          totalAmount={summary?.total || ""}
          onSubmit={handleModalSubmit}
          lang={lang}
        />
      </div>
  );
};

export default InvoiceViewContant;
