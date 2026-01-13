"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, apiUpload } from "@/lib/api";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";
import { useAuth } from "@/contexts/AuthContext";
import PaymentModal from "@/components/portal/billings/PaymentModal";
import { showSuccessToast } from "@/utils/topTost";

const InvoicePage = ({ invoiceId }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [taxes, setTaxes] = useState([]);
  const [companySettings, setCompanySettings] = useState({});
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const priceWithCurrency = usePriceWithCurrency();

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
        // Fetch countries
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

  // Fetch states when company settings with country_id is loaded
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

  // Fetch cities when company settings with state_id is loaded
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

  useEffect(() => {
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
              status: apiInv?.status,
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

    fetchInvoice();
  }, [invoiceId, companySettings, countries, states, cities]);

  const { company, invoice, client, items, payment, summary } = invoiceData || {};
  const invoiceDisplay = `${invoice?.prefix || ""}-${invoice?.number || ""}`;
  const qrCodeSrc = companySettings?.finance_qr_code || "/images/invoice_qr.jpg";

  const getCompanyAddress = () => {
    if (!company) return "";
    const parts = [
      company.address,
      company.city,
      company.state,
      company.country,
      company.zip
    ].filter(Boolean);
    return parts.join(", ");
  };

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
      // Upload screenshot file to server
      let uploadedImageUrl = "";
      if (data.image) {
        const formData = new FormData();
        formData.append("file", data.image);
        formData.append("folder", "payment");

        try {
          const uploadResponse = await apiUpload("/api/upload", formData, { includeAuth: true });
          if (uploadResponse?.success && uploadResponse?.data?.url) {
            uploadedImageUrl = uploadResponse.data.url;
          }
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError);
          alert("Failed to upload screenshot. Please try again.");
          return;
        }
      }

      // Create payment record in database
      const amountString = summary?.total?.replace(/[^\d.]/g, "") || "0";
      const paymentData = {
        invoice_id: invoiceId,
        offtaker_id: user?.id,
        ss_url: uploadedImageUrl,
        amount: Number(amountString),
        status: 1, // Pending status
      };

      const paymentResponse = await apiPost("/api/payments", paymentData, { includeAuth: true });

      if (paymentResponse?.success) {
        // alert("Payment submitted successfully!");
        showSuccessToast("Payment submitted successfully!");
        setModalOpen(false);
        router.push("/offtaker/billings");
      } else {
        alert("Failed to submit payment. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting payment:", error);
      alert("Error submitting payment: " + error.message);
    }
  };

  const handleDownloadPDF = () => {
    if (!invoiceData) return;

    const element = document.getElementById("invoice-content");
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `${invoice?.prefix || ""}-${invoice?.number || "invoice"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
    };

    // Dynamically import html2pdf
    import("html2pdf.js").then((html2pdf) => {
      html2pdf.default().set(opt).from(element).save();
    });
  };

  return (
      <div className="w-full bg-white rounded-xl shadow-md p-8">
        <div id="invoice-content">
          <div className="border rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
            <div>
              <div className="text-2xl font-bold theme-org-color mb-1">{company?.name || ""}</div>
              <div className="text-gray-500 text-sm">
                {company?.address && <div>{company.address}</div>}
                {(company?.country || company?.state || company?.city) && (
                  <div>{[company.country, company.state, company.city].filter(Boolean).join(", ")}</div>
                )}
                {company?.zip && <div>{company.zip}</div>}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <img src={qrCodeSrc} alt="Finance QR Code" className="w-32 h-32 object-contain" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between mb-4">
          <div>
            <div className="font-bold text-lg mb-2">INVOICE</div>
            <div className="text-gray-700">Invoice : <span className="font-semibold">{invoiceDisplay}</span></div>
            <div className="text-gray-700">Created: <span className="font-semibold">{invoice?.created || ""}</span></div>
            <div className="text-gray-700">Due: <span className="font-semibold">{invoice?.due || ""}</span></div>
          </div>
          <div className="text-right mt-4 md:mt-0">
            <div className="text-gray-500">Invoiced To:</div>
            <div className="font-bold">{client?.name || ""}</div>
            <div className="text-gray-500">{client?.email || ""}</div>
            <div className="text-gray-500">{client?.address || ""}</div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border mb-8">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ITEM</th>
                <th className="px-4 py-3 text-left font-semibold">QTY</th>
                <th className="px-4 py-3 text-left font-semibold">RATE</th>
                <th className="px-4 py-3 text-left font-semibold">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((item, idx) => (
                <tr key={item.id} className={idx % 2 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-gray-500 text-xs">{item.desc}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{item.unit}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{item.price}</td>
                  <td className="px-4 py-2 whitespace-nowrap font-bold">{item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column - Notes and Terms */}
            <div className="border rounded-lg p-4 shadow-sm bg-gray-50">
              <div className="mb-4">
                <div className="font-bold mb-2 text-gray-700 text-sm">Notes:</div>
                <div className="text-gray-500 text-xs leading-relaxed">
                  {invoiceData?.notes || 'No additional notes'}
                </div>
              </div>
              <div>
                <div className="font-bold mb-2 text-gray-700 text-sm">Terms & Conditions:</div>
                <div className="text-gray-500 text-xs leading-relaxed">
                  {invoiceData?.terms_and_conditions || 'No terms and conditions provided'}
                </div>
              </div>
            </div>

            {/* Right Column - Totals */}
            <div className="border rounded-lg p-4 md:p-6 shadow-sm bg-gray-50">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-900">{summary?.summary || ""}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Tax {getTaxDisplay()}</span>
                  <span className="font-semibold text-red-700">{summary?.tax_amount || ""}</span>
                </div>
                <div className="border-t pt-3 mt-2 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total Due</span>
                  <span className="font-bold text-lg text-blue-700">{summary?.total || ""}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="bg-gray-600 text-white font-bold py-2 px-6 rounded shadow hover:bg-gray-700"
            type="button"
            onClick={handleDownloadPDF}
          >
            Download PDF
          </button>
          {invoice?.status !== 1 && (
            <button
              className="theme-btn-org-color text-white font-bold py-2 px-6 rounded shadow"
              type="button"
              onClick={() => setModalOpen(true)}
            >
              Make a Payment
            </button>
          )}
        </div>
        <PaymentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          invoiceNumber={invoiceDisplay}
          totalAmount={summary?.total || ""}
          onSubmit={handleModalSubmit}
        />
      </div>
  );
};

export default InvoicePage;
