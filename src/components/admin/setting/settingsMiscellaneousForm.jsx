'use client'
import React, { useState, useEffect } from 'react'
import Footer from '@/components/shared/Footer'
import PageHeaderSetting from '@/components/shared/pageHeader/PageHeaderSetting'
import PerfectScrollbar from 'react-perfect-scrollbar'
import SelectDropdown from '@/components/shared/SelectDropdown'
import InputTopLabel from '@/components/shared/InputTopLabel'
import SelectTopLabel from '@/components/shared/SelectTopLabel'
import { settingOptions } from './settingsEmailForm'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiGet, apiPost } from '@/lib/api'
import { showSuccessToast, showErrorToast } from '@/utils/topTost'

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

const SettingsMiscellaneousForm = () => {
    const { lang } = useLanguage()
    const [selectedOption, setSelectedOption] = useState(null)
    const options = settingOptions
    const [loading, setLoading] = useState(false)
    const [validating, setValidating] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [hasExistingSecretKey, setHasExistingSecretKey] = useState(false)

    const [s3FormData, setS3FormData] = useState({
        aws_access_key_id: '',
        aws_secret_access_key: '',
        aws_region: 'us-east-1',
        s3_bucket_name: '',
        s3_folder_path: 'uploads',
        s3_public_url: '',
        file_visibility: 'private',
        signed_url_expiry: 3600,
    })

    // Fetch existing S3 settings on mount
    useEffect(() => {
        fetchS3Settings()
    }, [])

    const fetchS3Settings = async () => {
        try {
            setFetching(true)
            const response = await apiGet('/api/s3-settings')

            if (response.success) {
                const settings = response.data
                // Check if secret key exists (will be encrypted in DB)
                const hasSecret = !!settings.s3_aws_secret_access_key
                setHasExistingSecretKey(hasSecret)

                setS3FormData({
                    aws_access_key_id: settings.s3_aws_access_key_id || '',
                    aws_secret_access_key: '', // Always keep blank - only update if user enters new value
                    aws_region: settings.s3_aws_region || 'us-east-1',
                    s3_bucket_name: settings.s3_bucket_name || '',
                    s3_folder_path: settings.s3_folder_path || 'uploads',
                    s3_public_url: settings.s3_public_url || '',
                    file_visibility: settings.s3_file_visibility || 'private',
                    signed_url_expiry: parseInt(settings.s3_signed_url_expiry) || 3600,
                })
            }
        } catch (error) {
            if (error.response?.status !== 404) {
                console.error('Error fetching S3 settings:', error)
            }
        } finally {
            setFetching(false)
        }
    }

    const handleS3Change = (e) => {
        const { name, value } = e.target
        setS3FormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleValidateS3 = async () => {
        try {
            setValidating(true)

            const response = await apiPost('/api/s3-settings/validate', s3FormData)

            if (response.success) {
                showSuccessToast('S3 credentials validated successfully!')
            } else {
                showErrorToast(response.message || 'Validation failed')
            }
        } catch (error) {
            showErrorToast(error.response?.data?.message || 'Validation failed')
        } finally {
            setValidating(false)
        }
    }

    const handleS3Submit = async () => {
        setLoading(true)

        try {
            // Prepare data to send - only include secret key if it has been changed
            const dataToSend = { ...s3FormData }

            // If secret key is blank and we have an existing one, don't send it (keep existing)
            // If secret key has a value, send it (will be encrypted on server)
            if (!dataToSend.aws_secret_access_key && hasExistingSecretKey) {
                // Don't include empty secret key in update - keep existing
                delete dataToSend.aws_secret_access_key
            }

            const response = await apiPost('/api/s3-settings', dataToSend)

            if (response.success) {
                showSuccessToast('S3 settings saved successfully!')
                setTimeout(() => fetchS3Settings(), 1000)
            }
        } catch (error) {
            showErrorToast(error.response?.data?.message || 'Failed to save S3 settings')
        } finally {
            setLoading(false)
        }
    }
    return (
        <div className="content-area" data-scrollbar-target="#psScrollbarInit">
            <PerfectScrollbar>
                <PageHeaderSetting
                    onSave={handleS3Submit}
                    isSubmitting={loading}
                    showSaveButton={true}
                />
                <div className="content-area-body">
                    <div className="mb-0 card">
                        <div className="card-body">
                            {/* AWS S3 Storage Settings */}
                            {/* <hr className="my-5" /> */}
                            <div className="mb-4">
                                <h4 className="fw-bold">{lang("s3settings.title", "AWS S3 Storage")}</h4>
                                <div className="fs-12 text-muted">
                                    {lang("s3settings.description", "Configure AWS S3 integration for file storage. All credentials are encrypted before storage.")}
                                </div>
                            </div>

                            {fetching ? (
                                <div className="py-4 text-center">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="row">
                                        {/* AWS Access Key ID */}
                                        <div className="mb-4 col-lg-6">
                                            <InputTopLabel
                                                label={lang("s3settings.awsAccessKeyId", "AWS Access Key ID")}
                                                type="text"
                                                name="aws_access_key_id"
                                                value={s3FormData.aws_access_key_id}
                                                onChange={handleS3Change}
                                                placeholder="AKIAIOSFODNN7EXAMPLE"
                                                required
                                                star="*"
                                            />
                                        </div>

                                        {/* AWS Secret Access Key */}
                                        <div className="mb-4 col-lg-6">
                                            <InputTopLabel
                                                label={lang("s3settings.awsSecretAccessKey", "AWS Secret Access Key")}
                                                type="password"
                                                name="aws_secret_access_key"
                                                value={s3FormData.aws_secret_access_key}
                                                onChange={handleS3Change}
                                                placeholder={hasExistingSecretKey ? lang("s3settings.leaveBlankToKeepExisting", "Leave blank to keep existing") : "wJalrXUtnFEMI/K7MDENG/bPxRfiCY"}
                                                required={!hasExistingSecretKey}
                                                star={!hasExistingSecretKey ? "*" : ""}
                                            />
                                            <small className="text-muted">
                                                {hasExistingSecretKey
                                                    ? lang("s3settings.secretKeyAlreadySet", "Secret key is already set. Leave blank to keep existing, or enter new value to update.")
                                                    : lang("s3settings.secretKeyWillBeEncrypted", "Secret key will be encrypted before storing in database")}
                                            </small>
                                        </div>

                                        {/* AWS Region */}
                                        <div className="mb-4 col-lg-6">
                                            <SelectTopLabel
                                                label={lang("s3settings.awsRegion", "AWS Region")}
                                                name="aws_region"
                                                value={s3FormData.aws_region}
                                                onChange={handleS3Change}
                                                star="*"
                                                required
                                                options={AWS_REGIONS}
                                            />
                                        </div>

                                        {/* S3 Bucket Name */}
                                        <div className="mb-4 col-lg-6">
                                            <InputTopLabel
                                                label={lang("s3settings.s3BucketName", "S3 Bucket Name")}
                                                type="text"
                                                name="s3_bucket_name"
                                                value={s3FormData.s3_bucket_name}
                                                onChange={handleS3Change}
                                                placeholder="my-bucket-name"
                                                required
                                                star="*"
                                            />
                                        </div>

                                        {/* S3 Folder Path */}
                                        <div className="mb-4 col-lg-6">
                                            <InputTopLabel
                                                label={lang("s3settings.s3FolderPath", "S3 Folder Path")}
                                                type="text"
                                                name="s3_folder_path"
                                                value={s3FormData.s3_folder_path}
                                                onChange={handleS3Change}
                                                placeholder="uploads"
                                            />
                                            <small className="text-muted">
                                                {lang("s3settings.defaultFolderForUploads", "Default folder for uploads")} (default: uploads)
                                            </small>
                                        </div>

                                        {/* S3 Public URL */}
                                        <div className="mb-4 col-lg-6">
                                            <InputTopLabel
                                                label={lang("s3settings.s3PublicUrl", "S3 Public URL")}
                                                type="url"
                                                name="s3_public_url"
                                                value={s3FormData.s3_public_url}
                                                onChange={handleS3Change}
                                                placeholder="https://my-bucket.s3.amazonaws.com"
                                            />
                                            <small className="text-muted">
                                                {lang("s3settings.cloudFrontOrCustomDomainUrl", "CloudFront or custom domain URL")} (optional)
                                            </small>
                                        </div>

                                        {/* File Visibility */}
                                        <div className="mb-4 col-lg-6">
                                            <label className="form-label fw-semibold">
                                                {lang("s3settings.s3FileVisibility", "File Visibility")}
                                            </label>
                                            <div className="gap-4 d-flex">
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="file_visibility"
                                                        id="visibility_public"
                                                        value="public"
                                                        checked={s3FormData.file_visibility === 'public'}
                                                        onChange={handleS3Change}
                                                    />
                                                    <label
                                                        className="form-check-label"
                                                        htmlFor="visibility_public"
                                                    >
                                                        {lang("s3settings.public", "Public")}
                                                    </label>
                                                </div>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="file_visibility"
                                                        id="visibility_private"
                                                        value="private"
                                                        checked={s3FormData.file_visibility === 'private'}
                                                        onChange={handleS3Change}
                                                    />
                                                    <label
                                                        className="form-check-label"
                                                        htmlFor="visibility_private"
                                                    >
                                                        {lang("s3settings.private", "Private")} (Signed URLs)
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Signed URL Expiry */}
                                        {s3FormData.file_visibility === 'private' && (
                                            <div className="mb-4 col-lg-6">
                                                <InputTopLabel
                                                    label={lang("s3settings.s3SignedUrlExpiry", "Signed URL Expiry")} 
                                                    type="number"
                                                    name="signed_url_expiry"
                                                    value={s3FormData.signed_url_expiry}
                                                    onChange={handleS3Change}
                                                    min="60"
                                                    max="604800"
                                                />
                                                <small className="text-muted">
                                                    {lang("s3settings.timeBeforeSignedUrlsExpire", "Time before signed URLs expire")} (3600 = 1 hour)
                                                </small>
                                            </div>
                                        )}
                                    </div>

                                    {/* Test Connection Button */}
                                    <div className="gap-2 pt-3 d-flex">
                                        <button
                                            type="button"
                                            onClick={handleValidateS3}
                                            disabled={validating || loading}
                                            className="btn btn-outline-primary"
                                        >
                                            {validating ? (
                                                <>
                                                    <span
                                                        className="spinner-border spinner-border-sm me-2"
                                                        role="status"
                                                    ></span>
                                                    {lang("s3settings.validating", "Validating")}...
                                                </>
                                            ) : (
                                                lang("s3settings.testS3Connection", "Test S3 Connection")
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <Footer />
            </PerfectScrollbar>
        </div>

    )
}

export default SettingsMiscellaneousForm