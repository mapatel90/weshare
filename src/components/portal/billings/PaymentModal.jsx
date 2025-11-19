'use client';

import React, { useState } from "react";

const PaymentModal = ({ isOpen, onClose, invoiceNumber, onSubmit, totalAmount }) => {
    const [transactionId, setTransactionId] = useState("");
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState("");

    const invoiceOptions = [
        { value: "INV001", label: "Invoice #INV001" },
        { value: "INV002", label: "Invoice #INV002" },
        { value: "INV003", label: "Invoice #INV003" }
    ];

    React.useEffect(() => {
        if (isOpen) {
            setImagePreview(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleImageChange = (file) => {
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleImageChange(e.target.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageChange(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ invoiceNumber: invoiceNumber || selectedInvoice, transactionId, image });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-30 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Make a Payment</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Invoice Number</label>
                        {invoiceNumber ? (
                            <input
                                type="text"
                                value={invoiceNumber}
                                readOnly
                                className="w-full border rounded px-3 py-2 bg-gray-100"
                            />
                        ) : (
                            <select
                                value={selectedInvoice}
                                onChange={e => setSelectedInvoice(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                required
                            >
                                <option value="" disabled>Select Invoice</option>
                                {invoiceOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Total Amount</label>
                        <input
                            type="text"
                            value={totalAmount}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Upload Screenshot</label>
                        <div
                            className={`w-full border-2 border-dashed rounded px-3 py-6 flex flex-col items-center justify-center cursor-pointer transition ${dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-100'}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('file-upload-input').click()}
                        >
                            <span className="text-gray-500">Drag &amp; Upload or Click to select</span>
                            <input
                                id="file-upload-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileInputChange}
                                className="hidden"
                                required
                            />
                        </div>
                        {imagePreview && (
                            <div className="mt-2">
                                <img src={imagePreview} alt="Preview" className="max-h-40 rounded border" />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="theme-btn-org-color px-4 py-2 rounded text-white font-bold"
                        >
                            Submit Payment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
