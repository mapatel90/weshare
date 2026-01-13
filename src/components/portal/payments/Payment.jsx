"use client";

import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiUpload } from "@/lib/api";
import { useRouter } from "next/navigation";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";
import { FiImage } from "react-icons/fi";
import PaymentModal from "../billings/PaymentModal";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccessToast } from "@/utils/topTost";

const statusColors = {
  Paid: "bg-green-100 text-green-700",
  Pending: "bg-gray-200 text-gray-700",
  Unfunded: "bg-orange-100 text-orange-700",
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const priceWithCurrency = usePriceWithCurrency();
  const { user } = useAuth();

  // Fetch payments from API
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await apiGet("/api/payments", { includeAuth: true });

        if (response?.success && Array.isArray(response?.data)) {
          const formattedPayments = response.data.map((payment) => ({
            id: payment.id,
            projectName: payment.invoices?.projects?.project_name || "N/A",
            invoiceNumber: payment.invoices?.invoice_number || "N/A",
            invoicePrefix: payment.invoices?.invoice_prefix || "",
            paymentDate: payment.created_at
              ? new Date(payment.created_at).toLocaleDateString("en-US")
              : "N/A",
            invoiceDate: payment.invoices?.invoice_date
              ? new Date(payment.invoices.invoice_date).toLocaleDateString(
                  "en-US"
                )
              : "N/A",
            dueDate: payment.invoices?.due_date
              ? new Date(payment.invoices.due_date).toLocaleDateString("en-US")
              : "N/A",
            amount: payment.amount || 0,
            status: payment.status === 1 ? "Paid" : "Pending",
            ss_url: payment.ss_url || "",
            download: true,
          }));
          setPayments(formattedPayments);
        } else {
          setError("Failed to load payments");
        }
      } catch (err) {
        console.error("Error fetching payments:", err);
        setError("Unable to fetch payments");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchPayments();
  }, []);

  // No custom event listeners needed. Use backdrop for outside click.

  const filteredPayments = payments.filter(
    (p) =>
      p.projectName.toLowerCase().includes(search.toLowerCase()) ||
      `${p.invoicePrefix}-${p.invoiceNumber}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const handleDownload = (number) => {
    // Example: window.open(`/api/payment/download/${number}`);
    router.push("/portal/payments/invoice");
  };

  const openScreenshot = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handlePaymentSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError("");

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
      const paymentData = {
        invoice_id: data.invoice_id,
        offtaker_id: user?.id,
        amount: parseFloat(data.amount) || 0,
        ss_url: ss_url,
        status: 1, // Paid status
      };

      const response = await apiPost("/api/payments", paymentData);
      if (!response?.success || !response?.data) {
        throw new Error("Payment creation failed");
      } else {
        // Show success message
        showSuccessToast("Payment submitted successfully!");
        setModalOpen(false);
      }

      
      // Refresh payments list
      await fetchPayments();
    } catch (err) {
      console.error("Payment submission error:", err);
      setError(err.message || "Failed to submit payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading payments...</p>
        </div>
      )}

      {!loading && (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search User or Invoice..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <button
              className="theme-btn-org-color text-white px-4 py-2 rounded shadow hover:bg-orange-500"
              onClick={() => setModalOpen(true)}
              disabled={submitting}
            >
              Add Payment
            </button>
          </div>

          <div className="overflow border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">
                    Project Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">INVOICE</th>
                  <th className="px-2 py-3 text-left font-semibold">AMOUNT</th>
                  <th className="px-2 py-3 text-left font-semibold">
                    INVOICE DATE
                  </th>
                  <th className="px-2 py-3 text-left font-semibold">
                    DUE DATE
                  </th>
                  <th className="px-2 py-3 text-left font-semibold">
                    PAYMENT DATE
                  </th>
                  <th className="px-2 py-3 text-left font-semibold">STATUS</th>
                  <th className="px-2 py-3 text-center">SCREENSHOT</th>
                  <th className="px-2 py-3 text-left font-semibold">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment, idx) => (
                    <tr
                      key={payment.id}
                      className={idx % 2 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-4 py-2 font-medium whitespace-nowrap">
                        {payment.projectName}
                      </td>
                      <td className="px-4 py-2 font-medium whitespace-nowrap">{`${payment.invoicePrefix}-${payment.invoiceNumber}`}</td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {priceWithCurrency(payment.amount)}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {payment.invoiceDate}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {payment.dueDate}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {payment.paymentDate}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            statusColors[payment.status]
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => openScreenshot(payment.ss_url)}
                          disabled={!payment.ss_url}
                          title={
                            payment.ss_url ? "View Screenshot" : "No Screenshot"
                          }
                          className={`text-xl ${
                            payment.ss_url
                              ? "text-blue-600 hover:text-blue-800"
                              : "text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <FiImage />
                        </button>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {payment.download ? (
                          <div className="relative inline-block text-left">
                            <button
                              className="bg-transparent border-none cursor-pointer px-2 py-1 dropdown-action-btn"
                              onClick={() => setDropdownOpen(idx)}
                            >
                              <span className="text-2xl">&#8942;</span>
                            </button>
                            {dropdownOpen === idx && (
                              <>
                                {/* Backdrop for outside click */}
                                <div
                                  className="fixed inset-0 z-10"
                                  style={{ background: "transparent" }}
                                  onClick={() => setDropdownOpen(null)}
                                />
                                <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-20 dropdown-action-menu">
                                  <button
                                    className="block w-full text-left px-4 py-2 text-blue-600 hover:bg-gray-100"
                                    onClick={() => {
                                      handleDownload(payment.number);
                                      setDropdownOpen(null);
                                    }}
                                  >
                                    Download
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Download</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="10"
                      className="px-4 py-4 text-center text-gray-500"
                    >
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              1 - {filteredPayments.length} of {payments.length} entries
            </div>
            <div className="flex gap-1">
              <button className="w-8 h-8 rounded bg-blue-600 text-white font-bold">
                1
              </button>
              <button className="w-8 h-8 rounded bg-gray-100 text-gray-700">
                2
              </button>
              <button className="w-8 h-8 rounded bg-gray-100 text-gray-700">
                3
              </button>
              <button className="w-8 h-8 rounded bg-gray-100 text-gray-700">
                4
              </button>
              <button className="w-8 h-8 rounded bg-gray-100 text-gray-700">
                5
              </button>
            </div>
          </div>
        </>
      )}

      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  );
};

export default Payments;
