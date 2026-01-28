import { useState } from 'react';
import axios from 'axios';

/**
 * Custom hook for S3 file uploads
 * @returns {Object} Upload state and methods
 */
export const useS3Upload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  /**
   * Upload single file to S3
   * @param {File} file - File to upload
   * @param {Object} options - Upload options (folder)
   * @returns {Promise<Object>} Upload result
   */
  const uploadFile = async (file, options = {}) => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('file', file);

      if (options.folder) {
        formData.append('folder', options.folder);
      }

      const response = await axios.post(
        `${API_URL}/api/s3-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );

      if (response.data.success) {
        setProgress(100);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Upload failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Upload multiple files to S3
   * @param {File[]} files - Files to upload
   * @param {Object} options - Upload options (folder)
   * @returns {Promise<Array>} Upload results
   */
  const uploadMultipleFiles = async (files, options = {}) => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      const token = localStorage.getItem('accessToken');
      const formData = new FormData();

      files.forEach((file) => {
        formData.append('files', file);
      });

      if (options.folder) {
        formData.append('folder', options.folder);
      }

      const response = await axios.post(
        `${API_URL}/api/s3-upload/multiple`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );

      if (response.data.success) {
        setProgress(100);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Upload failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Delete file from S3
   * @param {string} fileKey - S3 file key
   * @returns {Promise<Object>} Delete result
   */
  const deleteFile = async (fileKey) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/api/s3-upload/delete`,
        { fileKey },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Delete failed';
      throw new Error(errorMessage);
    }
  };

  /**
   * Generate signed URL for private file
   * @param {string} fileKey - S3 file key
   * @param {number} expiresIn - Expiry in seconds
   * @returns {Promise<string>} Signed URL
   */
  const getSignedUrl = async (fileKey, expiresIn = null) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/api/s3-upload/signed-url`,
        { fileKey, expiresIn },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        return response.data.data.signedUrl;
      } else {
        throw new Error(response.data.message || 'Failed to generate URL');
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to generate signed URL';
      throw new Error(errorMessage);
    }
  };

  /**
   * Check S3 status
   * @returns {Promise<Object>} Status
   */
  const checkS3Status = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/s3-upload/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (err) {
      return { enabled: false, message: 'S3 is not configured' };
    }
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    getSignedUrl,
    checkS3Status,
    uploading,
    progress,
    error,
  };
};

export default useS3Upload;
