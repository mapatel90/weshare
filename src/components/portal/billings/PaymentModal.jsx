"use client";

import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const PaymentModal = ({
  isOpen,
  onClose,
  invoiceNumber,
  onSubmit,
  totalAmount,
  lang,
  payments = [],
  roles = {},
}) => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(invoiceNumber || "");
  const [invoiceOptions, setInvoiceOptions] = useState([]);
  const [errors, setErrors] = useState({}); // ✅ NEW
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setImage(null);
      setImagePreview(null);
      setErrors({}); // reset errors
      if (invoiceNumber) {
        const matchingOption = invoiceOptions.find(
          (opt) => opt.label === invoiceNumber,
        );
        setSelectedInvoice(matchingOption ? matchingOption.value : "");
      } else {
        setSelectedInvoice("");
      }
    }
  }, [isOpen, invoiceNumber, invoiceOptions]);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!isOpen) return;

      try {
        let url = "/api/invoice?status=0";
        
        // Filter invoices by offtaker if user is an offtaker
        if (user?.role === roles.OFFTAKER && user?.id) {
          url += `&offtaker_id=${user.id}`;
        }
        
        const response = await apiGet(url);
        const list = response?.data;

        const paidInvoiceIds = Array.isArray(payments)
          ? payments.map((p) => String(p.invoice_id))
          : [];

        if (response?.success && Array.isArray(list)) {
          const opts = list
            .filter((inv) => !paidInvoiceIds.includes(String(inv.id)))
            .map((inv, idx) => {
              const id = inv?.id ?? idx;
              const label = `${inv?.invoice_prefix || ""}-${inv?.invoice_number || ""}`;
              const amount = Number(inv?.total_amount ?? inv?.sub_amount ?? 0);

              return { value: String(id), label, amount };
            });
          setInvoiceOptions(opts);
        } else {
          setInvoiceOptions([]);
        }
      } catch (err) {
        console.error("Error fetching invoice options", err);
        setInvoiceOptions([]);
      }
    };

    fetchInvoices();
  }, [isOpen, user?.id, user?.role]);

  if (!isOpen) return null;

  const selectedOption = invoiceOptions.find(
    (opt) => opt.value === selectedInvoice,
  );
  const displayAmount = totalAmount ?? selectedOption?.amount ?? "";

  const handleImageChange = (file) => {
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const invoiceVal = invoiceNumber || selectedInvoice;
    let newErrors = {};

    if (!invoiceVal) newErrors.invoice = "Please select an invoice";
    if (!displayAmount) newErrors.amount = "Amount is missing";
    if (!image) newErrors.image = "Payment screenshot is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    onSubmit({ invoice_id: invoiceVal, image, amount: displayAmount });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow p-4"
        style={{ width: "100%", maxWidth: "500px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="h4 fw-bold mb-3">
          {lang("payments.makePayment", "Make a Payment")}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Invoice */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              {lang("invoice.invoiceNumber", "Invoice Number")}
            </label>
            <select
              value={selectedInvoice}
              onChange={(e) => {
                setSelectedInvoice(e.target.value);
                setErrors((prev) => ({ ...prev, invoice: "" }));
              }}
              className={`form-select ${errors.invoice ? "is-invalid" : ""}`}
              disabled={!!invoiceNumber}
            >
              <option value="" disabled>
                {lang("payments.selectInvoice", "Select Invoice")}
              </option>
              {invoiceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.invoice && (
              <div className="text-danger small mt-1">{errors.invoice}</div>
            )}
          </div>

          {/* Amount */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              {lang("payments.totalAmount", "Total Amount")}
            </label>
            <input
              type="text"
              value={displayAmount}
              readOnly
              className={`form-control ${errors.amount ? "is-invalid" : ""}`}
            />
            {errors.amount && (
              <div className="text-danger small mt-1">{errors.amount}</div>
            )}
          </div>

          {/* Image Upload */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              {lang("payments.uploadScreenshot", "Upload Screenshot")}
            </label>
            <div
              style={{
                width: "100%",
                border: dragActive
                  ? "2px dashed #ff8c00"
                  : "2px dashed #d1d5db",
                borderRadius: "4px",
                padding: "2rem 1rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                backgroundColor: dragActive ? "#fff5e6" : "#f3f4f6",
              }}
              onClick={() =>
                document.getElementById("file-upload-input").click()
              }
            >
              <span className="text-muted">
                {lang("payments.dragUploadOrClick", "Drag & Upload or Click to select")}
              </span>
              <input
                id="file-upload-input"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files && handleImageChange(e.target.files[0])
                }
                style={{ display: "none" }}
              />
              {image && (
                <small className="text-success mt-2">
                  File selected: {image.name}
                </small>
              )}
            </div>

            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="border rounded"
                  style={{ maxHeight: "160px" }}
                />
              </div>
            )}

            {errors.image && (
              <div className="text-danger small mt-1 text-center">
                {errors.image}
              </div>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary px-4 py-2"
              onClick={onClose}
            >
              {lang("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              className="btn text-white fw-bold px-4 py-2 common-orange-color"
            >
              {lang("payments.submitPayment", "Submit Payment")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
