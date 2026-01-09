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
        <div 
            style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                zIndex: 1050,
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div 
                className="bg-white rounded shadow p-4" 
                style={{ width: '100%', maxWidth: '500px' }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="h4 fw-bold mb-3">Make a Payment</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Invoice Number</label>
                        <select
                            value={invoiceNumber ? invoiceNumber : selectedInvoice}
                            onChange={e => setSelectedInvoice(e.target.value)}
                            className="form-select"
                            style={{ backgroundColor: '#f3f4f6' }}
                            required
                            disabled={!!invoiceNumber}
                        >
                            <option value="" disabled>Select Invoice</option>
                            {invoiceOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Total Amount</label>
                        <input
                            type="text"
                            value={totalAmount}
                            readOnly
                            className="form-control"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Upload Screenshot</label>
                        <div
                            style={{
                                width: '100%',
                                border: dragActive ? '2px dashed #ff8c00' : '2px dashed #d1d5db',
                                borderRadius: '4px',
                                padding: '2rem 1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                backgroundColor: dragActive ? '#fff5e6' : '#f3f4f6',
                                transition: 'all 0.3s ease'
                            }}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('file-upload-input').click()}
                        >
                            <span className="text-muted">Drag & Upload or Click to select</span>
                            <input
                                id="file-upload-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileInputChange}
                                style={{ display: 'none' }}
                                required
                            />
                            {image && <small className="text-success mt-2">File selected: {image.name}</small>}
                        </div>
                        {imagePreview && (
                            <div className="mt-2">
                                <img 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    className="border rounded" 
                                    style={{ maxHeight: '160px', display: 'block' }} 
                                />
                            </div>
                        )}
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-secondary px-4 py-2"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn text-white fw-bold px-4 py-2 common-orange-color"
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
