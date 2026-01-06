'use client'
import React, { useState, useEffect, useMemo } from 'react'
import PageHeaderSetting from '@/components/shared/pageHeader/PageHeaderSetting'
import Footer from '@/components/shared/Footer'
import { FiCalendar, FiCamera, FiX } from 'react-icons/fi'
import PerfectScrollbar from 'react-perfect-scrollbar'
import useSettings from '@/hooks/useSettings'
import { useLanguage } from '@/contexts/LanguageContext'
import { TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Box, Avatar, IconButton } from '@mui/material'
import useImageUpload from '@/hooks/useImageUpload'
import { apiPost, apiGet } from '@/lib/api'

const SettingsFinanceForm = () => {
  const { lang, currentLanguage } = useLanguage()
  const { settings, loading: settingsLoading, updateSettings, getSetting } = useSettings()
  const { handleImageUpload, uploadedImage, setUploadedImage } = useImageUpload()
  const [taxes, setTaxes] = useState([])

  // Yes/No options with translations - memoized to update when language changes
  const yesNoOptions = useMemo(() => [
    {
      value: "yes",
      label: lang("common.yes"),
      icon: "feather-check",
      iconClassName: "text-success",
    },
    {
      value: "no",
      label: lang("common.no"),
      icon: "feather-x",
      iconClassName: "text-danger"
    }
  ], [lang, currentLanguage])

  // Initialize options with translations - memoized to update when language changes
  const decimalSeparator = useMemo(() => [
    { value: "dot", label: lang("finance.options.dot") },
    { value: "clone", label: lang("finance.options.comma") },
  ], [lang, currentLanguage])

  const thousandSeparator = useMemo(() => [
    { value: "dot", label: lang("finance.options.dot") },
    { value: "clone", label: lang("finance.options.comma") },
    { value: "apostrophe", label: lang("finance.options.apostrophe") },
    { value: "none", label: lang("finance.options.none") },
    { value: "space", label: lang("finance.options.space") },
  ], [lang, currentLanguage])

  const taxOptions = useMemo(() => {
    const options = [
      { value: "", label: lang("finance.options.noTax") || "No Tax", color: "#283c50" }
    ];
    taxes.forEach(tax => {
      options.push({
        value: tax?.value,
        label: tax?.name,
        id: tax?.id,
        color: "#3454d1"
      });
    });
    return options;
  }, [taxes, lang, currentLanguage])

  // Form state - Finance General
  const [formData, setFormData] = useState({
    finance_currency: '',
    // Finance General
    finance_decimal_separator: "dot",
    finance_thousand_separator: "clone",
    finance_default_tax: "no-tax",
    finance_qr_code: "",
    // Invoice Settings
    invoice_number_prefix: "",
    next_invoice_number: "",
    invoice_due_after_days: "",
    invoice_predefined_client_note: "",
    invoice_predefined_terms_conditions: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormInitialized, setIsFormInitialized] = useState(false)
  const [qrCodeLoadError, setQrCodeLoadError] = useState(false)

  // Selected options for dropdowns (for proper display)
  const [selectedOptions, setSelectedOptions] = useState({})

  // Fetch taxes on component mount
  useEffect(() => {
    const fetchTaxes = async () => {
      try {
        const response = await apiGet('/api/settings/taxes')
        if (response?.success && Array.isArray(response.data)) {
          setTaxes(response.data)
        }
      } catch (error) {
        console.error('Error fetching taxes:', error)
      }
    }
    fetchTaxes()
  }, [])

  // Initialize form from settings
  useEffect(() => {
    if (settings && !isFormInitialized && Object.keys(settings).length > 0) {
      const invoicePrefix = getSetting("invoice_number_prefix", "")
      // Remove INV- prefix if it exists when loading from settings
      const cleanedInvoicePrefix = invoicePrefix.startsWith("INV-") ? invoicePrefix.substring(4) : invoicePrefix
      
      const loaded = {
        finance_currency: getSetting("finance_currency", ""),
        finance_decimal_separator: getSetting("finance_decimal_separator", "dot"),
        finance_thousand_separator: getSetting("finance_thousand_separator", "clone"),
        finance_default_tax: getSetting("finance_default_tax", "no-tax"),
        finance_qr_code: getSetting("finance_qr_code", ""),
        invoice_number_prefix: cleanedInvoicePrefix,
        next_invoice_number: getSetting("next_invoice_number", ""),
        invoice_due_after_days: getSetting("invoice_due_after_days", ""),
        invoice_predefined_client_note: getSetting("invoice_predefined_client_note", ""),
        invoice_predefined_terms_conditions: getSetting("invoice_predefined_terms_conditions", "")
      }
      setFormData(loaded)

      // Initialize selected options for dropdowns
      // No dropdown for finance_currency
      const opts = {}
      const decimalOpt = decimalSeparator.find(o => o.value === loaded.finance_decimal_separator) || decimalSeparator[0]
      opts.finance_decimal_separator = decimalOpt

      const thousandOpt = thousandSeparator.find(o => o.value === loaded.finance_thousand_separator) || thousandSeparator[1]
      opts.finance_thousand_separator = thousandOpt

      const taxOpt = taxOptions.find(o => o.value === loaded.finance_default_tax) || taxOptions[0]
      opts.finance_default_tax = taxOpt

      // Initialize yes/no dropdowns
      Object.keys(loaded).forEach(key => {
        if (key.startsWith('finance_') || key.startsWith('invoice_')) {
          if (['finance_decimal_separator', 'finance_thousand_separator', 'finance_default_tax', 'finance_qr_code',
            'invoice_number_prefix', 'next_invoice_number', 'invoice_due_after_days', 'invoice_predefined_client_note',
            'invoice_predefined_terms_conditions'].includes(key)) {
            return // Skip these as they have custom options
          }
          const yesNoOpt = yesNoOptions.find(o => o.value === loaded[key]) || yesNoOptions[0]
          if (!opts[key]) {
            opts[key] = yesNoOpt
          }
        }
      })

      setSelectedOptions(opts)
      setIsFormInitialized(true)

      // Set QR code image if exists
      if (loaded.finance_qr_code) {
        setUploadedImage(loaded.finance_qr_code)
      }
    }
  }, [settings, isFormInitialized, getSetting, yesNoOptions, decimalSeparator, thousandSeparator, taxOptions, currentLanguage])

  // Update selectedOptions when language changes
  useEffect(() => {
    if (isFormInitialized && formData) {
      const opts = {}
      const decimalOpt = decimalSeparator.find(o => o.value === formData.finance_decimal_separator) || decimalSeparator[0]
      opts.finance_decimal_separator = decimalOpt

      const thousandOpt = thousandSeparator.find(o => o.value === formData.finance_thousand_separator) || thousandSeparator[1]
      opts.finance_thousand_separator = thousandOpt

      const taxOpt = taxOptions.find(o => o.value === formData.finance_default_tax) || taxOptions[0]
      opts.finance_default_tax = taxOpt

      // Update yes/no options for all yes/no fields
      // No dropdown for finance_currency
      Object.keys(formData).forEach(key => {
        if (key.startsWith('finance_') || key.startsWith('invoice_')) {
          if (['finance_decimal_separator', 'finance_thousand_separator', 'finance_default_tax', 'finance_qr_code',
            'invoice_number_prefix', 'next_invoice_number', 'invoice_due_after_days', 'invoice_predefined_client_note',
            'invoice_predefined_terms_conditions', 'invoice_proposal_info_format'].includes(key)) {
            return // Skip these as they have custom options
          }
          const yesNoOpt = yesNoOptions.find(o => o.value === formData[key]) || yesNoOptions[0]
          if (yesNoOpt) {
            opts[key] = yesNoOpt
          }
        }
      })

      setSelectedOptions(prev => ({ ...prev, ...opts }))
    }
  }, [currentLanguage, isFormInitialized, formData, decimalSeparator, thousandSeparator, taxOptions, yesNoOptions])

  // Handle dropdown selection
  const handleDropdownChange = (field, option) => {
    setFormData(prev => ({
      ...prev,
      [field]: option?.value || ""
    }))
    setSelectedOptions(prev => ({
      ...prev,
      [field]: option
    }))
  }

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle textarea change
  const handleTextareaChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  // Handle QR code upload
  const handleQRCodeChange = (e) => {
    handleImageUpload(e)
  }

  // Remove QR code
  const handleRemoveQRCode = async () => {
    try {
      const qrCodePath = formData.finance_qr_code
      if (qrCodePath) {
        try {
          await apiPost('/api/settings/delete-qrcode', { path: qrCodePath })
        } catch (err) {
          console.error('Failed to delete QR code on server:', err)
        }
      }
      setUploadedImage(null)
      setFormData(prev => ({ ...prev, finance_qr_code: '' }))
      setQrCodeLoadError(false)
      try {
        await updateSettings({ finance_qr_code: '' })
      } catch (e) {
        console.warn('Failed to update settings after QR code deletion', e)
      }
    } catch (error) {
      console.error('Error removing QR code:', error)
    }
  }

  // Handle form submission
  const handleSave = async () => {
    try {
      setIsSubmitting(true)

      let newQRCodePath = formData.finance_qr_code
      // If a new QR code was selected (data URL), upload it now and delete old on server
      if (uploadedImage && typeof uploadedImage === 'string' && uploadedImage.startsWith('data:')) {
        const resp = await apiPost('/api/settings/upload-qrcode', {
          dataUrl: uploadedImage,
          oldImagePath: formData.finance_qr_code || null
        })
        if (resp?.success && resp?.data?.path) {
          newQRCodePath = resp.data.path
        }
      }

      // Include uploaded QR code path in form data
      // Prepend INV- to invoice_number_prefix when sending to API
      const settingsToUpdate = {
        ...formData,
        finance_qr_code: newQRCodePath,
        finance_currency: formData.finance_currency || '',
        invoice_number_prefix: formData.invoice_number_prefix ? `INV-${formData.invoice_number_prefix}` : '',
      }

      await updateSettings(settingsToUpdate)
      // Make sure local form state reflects the saved QR code and clear temp preview
      setFormData(prev => ({
        ...prev,
        finance_qr_code: newQRCodePath,
        finance_currency: formData.finance_currency || '',
      }))
      setUploadedImage(null)
    } catch (error) {
      console.error('Error saving finance settings:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="content-area">
      <PerfectScrollbar>
        <PageHeaderSetting
          onSave={handleSave}
          isSubmitting={isSubmitting}
          showSaveButton={true}
        />
        <div className="content-area-body">
          <div className="card mb-0">
            <div className="card-body">
              <div className="mb-5">
                <h4 className="fw-bold">{lang("finance.title")}</h4>
                <div className="fs-12 text-muted">{lang("finance.subtitle")}</div>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.decimalSeparator")}</label> */}
                <FormControl fullWidth>
                  {/* <InputLabel id="finance-decimal-label">{lang("finance.currency")}</InputLabel> */}
                  <TextField
                    label={lang("finance.currency")}
                    fullWidth
                    placeholder={lang("finance.currency")}
                    value={formData.finance_currency}
                    onChange={(e) => handleInputChange('finance_currency', e.target.value)}
                  />
                </FormControl>
                <small className="form-text text-muted">{lang("finance.currencyInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.decimalSeparator")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="finance-decimal-label">{lang("finance.decimalSeparator")}</InputLabel>
                  <Select
                    labelId="finance-decimal-label"
                    value={formData.finance_decimal_separator}
                    label={lang("finance.decimalSeparator")}
                    onChange={(e) => handleDropdownChange('finance_decimal_separator', { value: e.target.value })}
                  >
                    {decimalSeparator.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.decimalSeparatorInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.thousandSeparator")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="finance-thousand-label">{lang("finance.thousandSeparator")}</InputLabel>
                  <Select
                    labelId="finance-thousand-label"
                    value={formData.finance_thousand_separator}
                    label={lang("finance.thousandSeparator")}
                    onChange={(e) => handleDropdownChange('finance_thousand_separator', { value: e.target.value })}
                  >
                    {thousandSeparator.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.thousandSeparatorInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.defaultTax")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="finance-default-tax-label">{lang("finance.defaultTax")}</InputLabel>
                  <Select
                    labelId="finance-default-tax-label"
                    value={formData.finance_default_tax}
                    label={lang("finance.defaultTax")}
                    onChange={(e) => handleDropdownChange('finance_default_tax', { value: e.target.value })}
                  >
                    {taxOptions.map(opt => (
                      <MenuItem key={opt.id} value={opt.id}>{opt.value ? `${opt.label} - ${opt.value}%` : opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.defaultTaxInfo")}</small>
              </div>

              {/* QR Code Upload */}
              <div className="mb-5">
                <label className="form-label fw-bold">Payment QR Code</label>
                {uploadedImage || (formData.finance_qr_code && !qrCodeLoadError) ? (
                  <Box
                    sx={{
                      position: 'relative',
                      width: 200,
                      height: 200,
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      overflow: 'hidden',
                      mt: 2
                    }}
                  >
                    {/* QR Code Preview */}
                    <Avatar
                      src={uploadedImage || formData.finance_qr_code}
                      alt="Payment QR Code"
                      variant="rounded"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      imgProps={{
                        onError: () => {
                          setQrCodeLoadError(true)
                          setFormData(prev => ({ ...prev, finance_qr_code: '' }))
                        }
                      }}
                    />

                    {/* Upload Overlay (click to change) */}
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(0,0,0,0.4)',
                        opacity: 0,
                        transition: 'opacity 0.3s',
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                      onClick={() => document.getElementById('upload-qrcode').click()}
                    >
                      <IconButton sx={{ color: '#fff' }}>
                        <FiCamera size={24} />
                      </IconButton>
                    </Box>

                    {/* Remove Icon (top-right) */}
                    <IconButton
                      onClick={handleRemoveQRCode}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                      }}
                      aria-label="remove-qrcode"
                    >
                      <FiX size={16} />
                    </IconButton>

                    {/* Hidden File Input */}
                    <input
                      id="upload-qrcode"
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleQRCodeChange}
                    />
                  </Box>
                ) : (
                  <div className="mt-2">
                    <TextField
                      fullWidth
                      type="file"
                      inputProps={{ accept: 'image/*' }}
                      label="Upload QR Code"
                      onChange={handleQRCodeChange}
                      helperText="Upload payment QR code for invoices and payments"
                      InputLabelProps={{ shrink: true }}
                    />
                  </div>
                )}
                <small className="form-text text-muted d-block mt-2">Upload a QR code image for payment purposes. This will be displayed on invoices.</small>
              </div>

              <hr className="my-5" />
              <div className="mb-5">
                <h4 className="fw-bold">{lang("finance.invoiceTitle")}</h4>
                <div className="fs-12 text-muted">{lang("finance.invoiceSubtitle")}</div>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.invoiceNumberPrefix")}</label> */}
                <TextField
                  label={lang("finance.invoiceNumberPrefix")}
                  fullWidth
                  placeholder={lang("finance.invoiceNumberPrefix")}
                  value={formData.invoice_number_prefix}
                  onChange={(e) => handleInputChange('invoice_number_prefix', e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">INV-</InputAdornment> }}
                />
                <small className="form-text text-muted">{lang("finance.invoiceNumberPrefixInfo")}</small>
              </div>
              <div className="mb-5">
                <FormControl fullWidth>
                  <TextField
                    label={lang("finance.next_invoice_number")}
                    fullWidth
                    placeholder={lang("finance.next_invoice_number")}
                    value={formData.next_invoice_number}
                    onChange={(e) => handleInputChange('next_invoice_number', e.target.value)}
                  />
                </FormControl>
                <small className="form-text text-muted">{lang("finance.currencyInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.invoiceDueAfterDays")}</label> */}
                <TextField
                  label={lang("finance.invoiceDueAfterDays")}
                  fullWidth
                  type="number"
                  placeholder={lang("finance.invoiceDueAfterDays")}
                  value={formData.invoice_due_after_days}
                  onChange={(e) => handleInputChange('invoice_due_after_days', e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><FiCalendar size={16} /></InputAdornment> }}
                />
                <small className="form-text text-muted">{lang("finance.invoiceDueAfterDaysInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.predefinedClientNote")}</label> */}
                <TextField
                  label={lang("finance.predefinedClientNote")}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder={lang("finance.predefinedClientNote")}
                  value={formData.invoice_predefined_client_note}
                  onChange={(e) => handleTextareaChange('invoice_predefined_client_note')({ target: { value: e.target.value } })}
                />
                <small className="form-text text-muted">{lang("finance.predefinedClientNoteInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.predefinedTermsConditions")}</label> */}
                <TextField
                  label={lang("finance.predefinedTermsConditions")}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder={lang("finance.predefinedTermsConditions")}
                  value={formData.invoice_predefined_terms_conditions}
                  onChange={(e) => handleTextareaChange('invoice_predefined_terms_conditions')({ target: { value: e.target.value } })}
                />
                <small className="form-text text-muted">{lang("finance.predefinedTermsConditionsInfo")}</small>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </PerfectScrollbar>
    </div>
  )
}

export default SettingsFinanceForm
