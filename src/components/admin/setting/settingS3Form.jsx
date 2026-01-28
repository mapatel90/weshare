'use client';

import React, { useState, useEffect } from 'react';
import PageHeaderSetting from '@/components/shared/pageHeader/PageHeaderSetting';
import Footer from '@/components/shared/Footer';
import InputTopLabel from '@/components/shared/InputTopLabel';
import SelectTopLabel from '@/components/shared/SelectTopLabel';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiGet, apiPost } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/utils/topTost';

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-west-2', label: 'Europe (London)' },
  { value: 'sa-east-1', label: 'South America (São Paulo)' },
];

const SettingS3Form = () => {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [fetching, setFetching] = useState(true);

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

  // Fetch existing settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const response = await apiGet('/api/s3-settings');

      if (response.success) {
        const settings = response.data;
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

      const response = await apiPost('/api/s3-settings/validate', formData);

      if (response.success) {
        showSuccessToast('Credentials validated successfully!');
      } else {
        showErrorToast(response.message || 'Validation failed');
      }
    } catch (error) {
      showErrorToast(
        error.response?.data?.message || 'Validation failed'
      );
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiPost('/api/s3-settings', formData);

      if (response.success) {
        showSuccessToast('S3 settings saved successfully!');
        // Refresh settings to get masked secret key
        setTimeout(() => fetchSettings(), 1000);
      }
    } catch (error) {
      showErrorToast(
        error.response?.data?.message || 'Failed to save settings'
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="main-content">
        <PageHeaderSetting
          pageTitle={lang('settings.s3storage')}
          breadCrumbParent={lang('header.settings')}
          breadCrumbActive={lang('settings.s3storage')}
        />
        <div className="content-area">
          <div className="content-area-body">
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <PageHeaderSetting
        pageTitle={lang('settings.s3storage')}
        breadCrumbParent={lang('header.settings')}
        breadCrumbActive={lang('settings.s3storage')}
      />

      <div className="content-area">
        <div className="content-area-body">
          <form onSubmit={handleSubmit}>
            <div className="card mb-0">
              <div className="card-body">
                <div className="mb-4">
                  <h5 className="fw-bold mb-2">AWS S3 Configuration</h5>
                  <p className="fs-12 text-muted">
                    Configure AWS S3 integration for file storage. All
                    credentials are encrypted before storage.
                  </p>
                </div>

                <div className="row">
                  {/* AWS Access Key ID */}
                  <div className="col-lg-6 mb-4">
                    <InputTopLabel
                      label="AWS Access Key ID"
                      type="text"
                      name="aws_access_key_id"
                      value={formData.aws_access_key_id}
                      onChange={handleChange}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      required
                      star="*"
                    />
                  </div>

                  {/* AWS Secret Access Key */}
                  <div className="col-lg-6 mb-4">
                    <InputTopLabel
                      label="AWS Secret Access Key"
                      type="password"
                      name="aws_secret_access_key"
                      value={formData.aws_secret_access_key}
                      onChange={handleChange}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      required
                      star="*"
                    />
                    <small className="text-muted">
                      Secret key will be encrypted before storing in database
                    </small>
                  </div>

                  {/* AWS Region */}
                  <div className="col-lg-6 mb-4">
                    <SelectTopLabel
                      label="AWS Region"
                      name="aws_region"
                      value={formData.aws_region}
                      onChange={handleChange}
                      star="*"
                      required
                    >
                      {AWS_REGIONS.map((region) => (
                        <option key={region.value} value={region.value}>
                          {region.label}
                        </option>
                      ))}
                    </SelectTopLabel>
                  </div>

                  {/* S3 Bucket Name */}
                  <div className="col-lg-6 mb-4">
                    <InputTopLabel
                      label="S3 Bucket Name"
                      type="text"
                      name="s3_bucket_name"
                      value={formData.s3_bucket_name}
                      onChange={handleChange}
                      placeholder="my-bucket-name"
                      required
                      star="*"
                    />
                  </div>

                  {/* S3 Folder Path */}
                  <div className="col-lg-6 mb-4">
                    <InputTopLabel
                      label="S3 Folder Path"
                      type="text"
                      name="s3_folder_path"
                      value={formData.s3_folder_path}
                      onChange={handleChange}
                      placeholder="uploads"
                    />
                    <small className="text-muted">
                      Default folder for uploads (default: uploads)
                    </small>
                  </div>

                  {/* S3 Public URL */}
                  <div className="col-lg-6 mb-4">
                    <InputTopLabel
                      label="S3 Public URL"
                      type="url"
                      name="s3_public_url"
                      value={formData.s3_public_url}
                      onChange={handleChange}
                      placeholder="https://my-bucket.s3.amazonaws.com"
                    />
                    <small className="text-muted">
                      CloudFront or custom domain URL (leave empty to use
                      default S3 URL)
                    </small>
                  </div>

                  {/* File Visibility */}
                  <div className="col-lg-6 mb-4">
                    <label className="form-label fw-semibold">
                      File Visibility
                    </label>
                    <div className="d-flex gap-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="file_visibility"
                          id="visibility_public"
                          value="public"
                          checked={formData.file_visibility === 'public'}
                          onChange={handleChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="visibility_public"
                        >
                          Public
                        </label>
                        <small className="d-block text-muted">
                          Files accessible to anyone with URL
                        </small>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="file_visibility"
                          id="visibility_private"
                          value="private"
                          checked={formData.file_visibility === 'private'}
                          onChange={handleChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="visibility_private"
                        >
                          Private
                        </label>
                        <small className="d-block text-muted">
                          Requires signed URLs
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Signed URL Expiry */}
                  {formData.file_visibility === 'private' && (
                    <div className="col-lg-6 mb-4">
                      <InputTopLabel
                        label="Signed URL Expiry (seconds)"
                        type="number"
                        name="signed_url_expiry"
                        value={formData.signed_url_expiry}
                        onChange={handleChange}
                        min="60"
                        max="604800"
                      />
                      <small className="text-muted">
                        Time before signed URLs expire (3600 = 1 hour, max: 7
                        days)
                      </small>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={validating || loading}
                    className="btn btn-outline-primary"
                  >
                    {validating ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        Validating...
                      </>
                    ) : (
                      'Test Connection'
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={loading || validating}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        Saving...
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default SettingS3Form;
