'use client';

import React, { useState } from 'react';
import { useS3Upload } from '@/hooks/useS3Upload';

/**
 * Example component: Upload invoice PDF to S3
 * @param {Object} props
 * @param {number} props.invoiceId - Invoice ID
 * @param {function} props.onUploadSuccess - Callback after successful upload
 */
const InvoicePDFUpload = ({ invoiceId, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const { uploadFile, deleteFile, uploading, progress, error } = useS3Upload();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadFile(selectedFile, {
        folder: 'invoices',
      });

      setUploadedFile(result);
      setSelectedFile(null);

      // Call parent callback with upload result
      if (onUploadSuccess) {
        onUploadSuccess({
          invoiceId,
          fileKey: result.fileKey,
          fileUrl: result.fileUrl,
          fileName: result.fileName,
        });
      }

      alert('Invoice PDF uploaded successfully!');
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!uploadedFile) return;

    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await deleteFile(uploadedFile.fileKey);
      setUploadedFile(null);
      alert('File deleted successfully!');
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Invoice PDF Upload</h3>

      {/* File Selection */}
      {!uploadedFile && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Invoice PDF
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              disabled={uploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {selectedFile.name} (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Upload Button */}
          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? `Uploading... ${progress}%` : 'Upload to S3'}
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {/* Uploaded File Display */}
      {uploadedFile && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  File Uploaded Successfully
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {uploadedFile.fileName}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Key: {uploadedFile.fileKey}
                </p>
              </div>
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href={uploadedFile.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View PDF
            </a>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
            <button
              onClick={() => setUploadedFile(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Upload New
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicePDFUpload;
