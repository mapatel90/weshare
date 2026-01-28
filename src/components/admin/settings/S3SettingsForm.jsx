'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const S3SettingsForm = () => {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    aws_access_key_id: '',
    aws_secret_access_key: '',
    aws_region: 'us-east-1',
    s3_bucket_name: '',
    s3_folder_path: 'uploads',
    s3_public_url: '',
    file_visibility: 'private',
    signed_url_expiry: 3600,
  });

  const AWS_REGIONS = [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-east-2', label: 'US East (Ohio)' },
    { value: 'us-west-1', label: 'US West (N. California)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
    { value: 'eu-west-1', label: 'Europe (Ireland)' },
  ];

  // Fetch existing settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/s3-settings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const settings = response.data.data;
        setFormData({
          aws_access_key_id: settings.s3_aws_access_key_id || '',
          aws_secret_access_key: settings.s3_aws_secret_access_key || '',
          aws_region: settings.s3_aws_region || 'us-east-1',
          s3_bucket_name: settings.s3_bucket_name || '',
          s3_folder_path: settings.s3_folder_path || 'uploads',
          s3_public_url: settings.s3_public_url || '',
          file_visibility: settings.s3_file_visibility || 'private',
          signed_url_expiry: parseInt(settings.s3_signed_url_expiry) || 3600,
        });
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching settings:', error);
      }
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleValidate = async () => {
    try {
      setValidating(true);
      setMessage({ type: '', text: '' });

      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/s3-settings/validate`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'Credentials validated successfully!',
        });
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Validation failed',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Validation failed',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/s3-settings`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'S3 settings saved successfully!',
        });
        // Refresh settings to get masked secret key
        setTimeout(() => fetchSettings(), 1000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save settings',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          AWS S3 Configuration
        </h2>
        <p className="text-gray-600 mt-2">
          Configure AWS S3 integration for file storage. All credentials are
          encrypted before storage.
        </p>
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* AWS Access Key ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AWS Access Key ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="aws_access_key_id"
            value={formData.aws_access_key_id}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="AKIAIOSFODNN7EXAMPLE"
          />
        </div>

        {/* AWS Secret Access Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AWS Secret Access Key <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="aws_secret_access_key"
            value={formData.aws_secret_access_key}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
          />
          <p className="text-sm text-gray-500 mt-1">
            Secret key will be encrypted before storing in database
          </p>
        </div>

        {/* AWS Region */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AWS Region <span className="text-red-500">*</span>
          </label>
          <select
            name="aws_region"
            value={formData.aws_region}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {AWS_REGIONS.map((region) => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
        </div>

        {/* S3 Bucket Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            S3 Bucket Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="s3_bucket_name"
            value={formData.s3_bucket_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="my-bucket-name"
          />
        </div>

        {/* S3 Folder Path */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            S3 Folder Path (Optional)
          </label>
          <input
            type="text"
            name="s3_folder_path"
            value={formData.s3_folder_path}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="uploads"
          />
          <p className="text-sm text-gray-500 mt-1">
            Default folder for uploads (default: uploads)
          </p>
        </div>

        {/* S3 Public URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            S3 Public URL (Optional)
          </label>
          <input
            type="url"
            name="s3_public_url"
            value={formData.s3_public_url}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://my-bucket.s3.amazonaws.com"
          />
          <p className="text-sm text-gray-500 mt-1">
            CloudFront or custom domain URL (leave empty to use default S3 URL)
          </p>
        </div>

        {/* File Visibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File Visibility
          </label>
          <div className="flex gap-6">
            <label className="flex items-center">
              <input
                type="radio"
                name="file_visibility"
                value="public"
                checked={formData.file_visibility === 'public'}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-gray-700">
                Public (files accessible to anyone with URL)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="file_visibility"
                value="private"
                checked={formData.file_visibility === 'private'}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-gray-700">
                Private (requires signed URLs)
              </span>
            </label>
          </div>
        </div>

        {/* Signed URL Expiry */}
        {formData.file_visibility === 'private' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signed URL Expiry (seconds)
            </label>
            <input
              type="number"
              name="signed_url_expiry"
              value={formData.signed_url_expiry}
              onChange={handleChange}
              min="60"
              max="604800"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Time before signed URLs expire (3600 = 1 hour, max: 7 days)
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={handleValidate}
            disabled={validating || loading}
            className="px-6 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {validating ? 'Validating...' : 'Test Connection'}
          </button>

          <button
            type="submit"
            disabled={loading || validating}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default S3SettingsForm;
