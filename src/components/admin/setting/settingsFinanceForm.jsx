'use client'
import React, { useState, useEffect, useMemo } from 'react'
import PageHeaderSetting from '@/components/shared/pageHeader/PageHeaderSetting'
import Footer from '@/components/shared/Footer'
import SelectDropdown from '@/components/shared/SelectDropdown'
import { FiCalendar, FiCamera, FiX } from 'react-icons/fi'
import PerfectScrollbar from 'react-perfect-scrollbar'
import TextAreaTopLabel from '@/components/shared/TextAreaTopLabel'
import useSettings from '@/hooks/useSettings'
import { useLanguage } from '@/contexts/LanguageContext'
import { TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Box, Avatar, IconButton } from '@mui/material'
import useImageUpload from '@/hooks/useImageUpload'
import { apiPost } from '@/lib/api'

const SettingsFinanceForm = () => {
  const { lang, currentLanguage } = useLanguage()
  const { settings, loading: settingsLoading, updateSettings, getSetting } = useSettings()
  const { handleImageUpload, uploadedImage, setUploadedImage } = useImageUpload()

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

  const taxOptions = useMemo(() => [
    { value: "no-tax", label: lang("finance.options.noTax"), color: "#283c50" },
    { value: "5-percent", label: lang("finance.options.tax5"), color: "#3454d1" },
    { value: "10-percent", label: lang("finance.options.tax10"), color: "#17c666" },
    { value: "15-percent", label: lang("finance.options.tax15"), color: "#6610f2" },
    { value: "20-percent", label: lang("finance.options.tax20"), color: "#ffa21d" },
    { value: "25-percent", label: lang("finance.options.tax25"), color: "#ea4d4d" }
  ], [lang, currentLanguage])

  // Form state - Finance General
  const [formData, setFormData] = useState({
    // Finance General
    finance_decimal_separator: "dot",
    finance_thousand_separator: "clone",
    finance_default_tax: "no-tax",
    finance_show_tax_per_item: "yes",
    finance_remove_tax_name_from_item: "no",
    finance_exclude_currency_symbol: "yes",
    finance_remove_zero_decimals: "no",
    finance_output_amount_to_words: "yes",
    finance_number_words_lowercase: "no",
    finance_qr_code: "",
    // Invoice Settings
    invoice_number_prefix: "",
    invoice_due_after_days: "",
    invoice_allow_staff_view_assigned: "yes",
    invoice_require_client_login: "no",
    invoice_delete_only_last: "yes",
    invoice_decrement_on_delete: "no",
    invoice_exclude_draft_from_customer: "yes",
    invoice_show_sale_agent: "no",
    invoice_show_project_name: "yes",
    invoice_show_total_paid: "no",
    invoice_show_credits_applied: "yes",
    invoice_show_amount_due: "no",
    invoice_attach_pdf_on_receipt: "yes",
    invoice_predefined_client_note: "",
    invoice_predefined_terms_conditions: "",
    invoice_proposal_info_format: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormInitialized, setIsFormInitialized] = useState(false)
  const [qrCodeLoadError, setQrCodeLoadError] = useState(false)

  // Selected options for dropdowns (for proper display)
  const [selectedOptions, setSelectedOptions] = useState({})

  // Initialize form from settings
  useEffect(() => {
    if (settings && !isFormInitialized && Object.keys(settings).length > 0) {
      const loaded = {
        finance_decimal_separator: getSetting("finance_decimal_separator", "dot"),
        finance_thousand_separator: getSetting("finance_thousand_separator", "clone"),
        finance_default_tax: getSetting("finance_default_tax", "no-tax"),
        finance_show_tax_per_item: getSetting("finance_show_tax_per_item", "yes"),
        finance_remove_tax_name_from_item: getSetting("finance_remove_tax_name_from_item", "no"),
        finance_exclude_currency_symbol: getSetting("finance_exclude_currency_symbol", "yes"),
        finance_remove_zero_decimals: getSetting("finance_remove_zero_decimals", "no"),
        finance_output_amount_to_words: getSetting("finance_output_amount_to_words", "yes"),
        finance_number_words_lowercase: getSetting("finance_number_words_lowercase", "no"),
        finance_qr_code: getSetting("finance_qr_code", ""),
        invoice_number_prefix: getSetting("invoice_number_prefix", ""),
        invoice_due_after_days: getSetting("invoice_due_after_days", ""),
        invoice_allow_staff_view_assigned: getSetting("invoice_allow_staff_view_assigned", "yes"),
        invoice_require_client_login: getSetting("invoice_require_client_login", "no"),
        invoice_delete_only_last: getSetting("invoice_delete_only_last", "yes"),
        invoice_decrement_on_delete: getSetting("invoice_decrement_on_delete", "no"),
        invoice_exclude_draft_from_customer: getSetting("invoice_exclude_draft_from_customer", "yes"),
        invoice_show_sale_agent: getSetting("invoice_show_sale_agent", "no"),
        invoice_show_project_name: getSetting("invoice_show_project_name", "yes"),
        invoice_show_total_paid: getSetting("invoice_show_total_paid", "no"),
        invoice_show_credits_applied: getSetting("invoice_show_credits_applied", "yes"),
        invoice_show_amount_due: getSetting("invoice_show_amount_due", "no"),
        invoice_attach_pdf_on_receipt: getSetting("invoice_attach_pdf_on_receipt", "yes"),
        invoice_predefined_client_note: getSetting("invoice_predefined_client_note", ""),
        invoice_predefined_terms_conditions: getSetting("invoice_predefined_terms_conditions", ""),
        invoice_proposal_info_format: getSetting("invoice_proposal_info_format", "")
      }
      setFormData(loaded)

      // Initialize selected options for dropdowns
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
            'invoice_number_prefix', 'invoice_due_after_days', 'invoice_predefined_client_note',
            'invoice_predefined_terms_conditions', 'invoice_proposal_info_format'].includes(key)) {
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
      Object.keys(formData).forEach(key => {
        if (key.startsWith('finance_') || key.startsWith('invoice_')) {
          if (['finance_decimal_separator', 'finance_thousand_separator', 'finance_default_tax', 'finance_qr_code',
            'invoice_number_prefix', 'invoice_due_after_days', 'invoice_predefined_client_note',
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
      const settingsToUpdate = {
        ...formData,
        finance_qr_code: newQRCodePath
      }

      await updateSettings(settingsToUpdate)
      // Make sure local form state reflects the saved QR code and clear temp preview
      setFormData(prev => ({ 
        ...prev, 
        finance_qr_code: newQRCodePath
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
                  <InputLabel id="finance-decimal-label">{lang("finance.decimalSeparator")}</InputLabel>
                  <Select
                    labelId="finance-decimal-label"
                    value={formData.finance_decimal_separator}
                    label={lang("finance.decimalSeparator")}
                    onChange={(e)=> handleDropdownChange('finance_decimal_separator', { value: e.target.value })}
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
                    onChange={(e)=> handleDropdownChange('finance_thousand_separator', { value: e.target.value })}
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
                    onChange={(e)=> handleDropdownChange('finance_default_tax', { value: e.target.value })}
                  >
                    {taxOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.defaultTaxInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.showTaxPerItem")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="finance-show-tax-label">{lang("finance.showTaxPerItem")}</InputLabel>
                  <Select
                    labelId="finance-show-tax-label"
                    value={formData.finance_show_tax_per_item}
                    label={lang("finance.showTaxPerItem")}
                    onChange={(e)=> handleDropdownChange('finance_show_tax_per_item', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.showTaxPerItemInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.removeTaxNameFromItem")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="finance-remove-tax-name-label">{lang("finance.removeTaxNameFromItem")}</InputLabel>
                  <Select
                    labelId="finance-remove-tax-name-label"
                    value={formData.finance_remove_tax_name_from_item}
                    label={lang("finance.removeTaxNameFromItem")}
                    onChange={(e)=> handleDropdownChange('finance_remove_tax_name_from_item', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.removeTaxNameFromItemInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.excludeCurrencySymbol")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="finance-exclude-currency-label">{lang("finance.excludeCurrencySymbol")}</InputLabel>
                  <Select
                    labelId="finance-exclude-currency-label"
                    value={formData.finance_exclude_currency_symbol}
                    label={lang("finance.excludeCurrencySymbol")}
                    onChange={(e)=> handleDropdownChange('finance_exclude_currency_symbol', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.excludeCurrencySymbolInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.removeZeroDecimals")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="finance-remove-zero-label">{lang("finance.removeZeroDecimals")}</InputLabel>
                  <Select
                    labelId="finance-remove-zero-label"
                    value={formData.finance_remove_zero_decimals}
                    label={lang("finance.removeZeroDecimals")}
                    onChange={(e)=> handleDropdownChange('finance_remove_zero_decimals', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.removeZeroDecimalsInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.outputAmountToWords")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="finance-amount-words-label">{lang("finance.outputAmountToWords")}</InputLabel>
                  <Select
                    labelId="finance-amount-words-label"
                    value={formData.finance_output_amount_to_words}
                    label={lang("finance.outputAmountToWords")}
                    onChange={(e)=> handleDropdownChange('finance_output_amount_to_words', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.outputAmountToWordsInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.numberWordsLowercase")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="finance-words-lowercase-label">{lang("finance.numberWordsLowercase")}</InputLabel>
                  <Select
                    labelId="finance-words-lowercase-label"
                    value={formData.finance_number_words_lowercase}
                    label={lang("finance.numberWordsLowercase")}
                    onChange={(e)=> handleDropdownChange('finance_number_words_lowercase', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.numberWordsLowercaseInfo")}</small>
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
                  onChange={(e)=>handleInputChange('invoice_number_prefix', e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">INV-</InputAdornment> }}
                />
                <small className="form-text text-muted">{lang("finance.invoiceNumberPrefixInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.invoiceDueAfterDays")}</label> */}
                <TextField
                  label={lang("finance.invoiceDueAfterDays")}
                  fullWidth
                  type="number"
                  placeholder={lang("finance.invoiceDueAfterDays")}
                  value={formData.invoice_due_after_days}
                  onChange={(e)=>handleInputChange('invoice_due_after_days', e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><FiCalendar size={16} /></InputAdornment> }}
                />
                <small className="form-text text-muted">{lang("finance.invoiceDueAfterDaysInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.allowStaffViewAssigned")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="invoice-allow-staff-label">{lang("finance.allowStaffViewAssigned")}</InputLabel>
                  <Select
                    labelId="invoice-allow-staff-label"
                    value={formData.invoice_allow_staff_view_assigned}
                    label={lang("finance.allowStaffViewAssigned")}
                    onChange={(e)=> handleDropdownChange('invoice_allow_staff_view_assigned', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.allowStaffViewAssignedInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.requireClientLogin")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="invoice-require-login-label">{lang("finance.requireClientLogin")}</InputLabel>
                  <Select
                    labelId="invoice-require-login-label"
                    value={formData.invoice_require_client_login}
                    label={lang("finance.requireClientLogin")}
                    onChange={(e)=> handleDropdownChange('invoice_require_client_login', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.requireClientLoginInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.deleteOnlyLast")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="invoice-delete-only-last-label">{lang("finance.deleteOnlyLast")}</InputLabel>
                  <Select
                    labelId="invoice-delete-only-last-label"
                    value={formData.invoice_delete_only_last}
                    label={lang("finance.deleteOnlyLast")}
                    onChange={(e)=> handleDropdownChange('invoice_delete_only_last', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.deleteOnlyLastInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.decrementOnDelete")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="invoice-decrement-delete-label">{lang("finance.decrementOnDelete")}</InputLabel>
                  <Select
                    labelId="invoice-decrement-delete-label"
                    value={formData.invoice_decrement_on_delete}
                    label={lang("finance.decrementOnDelete")}
                    onChange={(e)=> handleDropdownChange('invoice_decrement_on_delete', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.decrementOnDeleteInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.excludeDraftFromCustomer")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="invoice-exclude-draft-label">{lang("finance.excludeDraftFromCustomer")}</InputLabel>
                  <Select
                    labelId="invoice-exclude-draft-label"
                    value={formData.invoice_exclude_draft_from_customer}
                    label={lang("finance.excludeDraftFromCustomer")}
                    onChange={(e)=> handleDropdownChange('invoice_exclude_draft_from_customer', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.excludeDraftFromCustomerInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.showSaleAgent")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="invoice-show-agent-label">{lang("finance.showSaleAgent")}</InputLabel>
                  <Select
                    labelId="invoice-show-agent-label"
                    value={formData.invoice_show_sale_agent}
                    label={lang("finance.showSaleAgent")}
                    onChange={(e)=> handleDropdownChange('invoice_show_sale_agent', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.showSaleAgentInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.showProjectName")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="invoice-show-project-label">{lang("finance.showProjectName")}</InputLabel>
                  <Select
                    labelId="invoice-show-project-label"
                    value={formData.invoice_show_project_name}
                    label={lang("finance.showProjectName")}
                    onChange={(e)=> handleDropdownChange('invoice_show_project_name', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.showProjectNameInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.showTotalPaid")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="invoice-show-total-paid-label">{lang("finance.showTotalPaid")}</InputLabel>
                  <Select
                    labelId="invoice-show-total-paid-label"
                    value={formData.invoice_show_total_paid}
                    label={lang("finance.showTotalPaid")}
                    onChange={(e)=> handleDropdownChange('invoice_show_total_paid', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.showTotalPaidInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.showCreditsApplied")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="invoice-show-credits-label">{lang("finance.showCreditsApplied")}</InputLabel>
                  <Select
                    labelId="invoice-show-credits-label"
                    value={formData.invoice_show_credits_applied}
                    label={lang("finance.showCreditsApplied")}
                    onChange={(e)=> handleDropdownChange('invoice_show_credits_applied', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.showCreditsAppliedInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.showAmountDue")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="invoice-show-amount-due-label">{lang("finance.showAmountDue")}</InputLabel>
                  <Select
                    labelId="invoice-show-amount-due-label"
                    value={formData.invoice_show_amount_due}
                    label={lang("finance.showAmountDue")}
                    onChange={(e)=> handleDropdownChange('invoice_show_amount_due', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.showAmountDueInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.attachPdfOnReceipt")}</label> */}
                <FormControl fullWidth>
                  <InputLabel id="invoice-attach-pdf-label">{lang("finance.attachPdfOnReceipt")}</InputLabel>
                  <Select
                    labelId="invoice-attach-pdf-label"
                    value={formData.invoice_attach_pdf_on_receipt}
                    label={lang("finance.attachPdfOnReceipt")}
                    onChange={(e)=> handleDropdownChange('invoice_attach_pdf_on_receipt', { value: e.target.value })}
                  >
                    {yesNoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <small className="form-text text-muted">{lang("finance.attachPdfOnReceiptInfo")}</small>
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
                  onChange={(e)=> handleTextareaChange('invoice_predefined_client_note')({ target: { value: e.target.value } })}
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
                  onChange={(e)=> handleTextareaChange('invoice_predefined_terms_conditions')({ target: { value: e.target.value } })}
                />
                <small className="form-text text-muted">{lang("finance.predefinedTermsConditionsInfo")}</small>
              </div>
              <div className="mb-5">
                {/* <label className="form-label">{lang("finance.proposalInfoFormat")}</label> */}
                <TextField
                  label={lang("finance.proposalInfoFormat")}
                  fullWidth
                  multiline
                  rows={6}
                  placeholder={`{proposal_to}\n{address}\n{city} {state}\n{country_code} {zip_code}\n{phone}\n{email}`}
                  value={formData.invoice_proposal_info_format}
                  onChange={(e)=> handleTextareaChange('invoice_proposal_info_format')({ target: { value: e.target.value } })}
                />
                <small className="form-text text-muted">{lang("finance.proposalInfoFormatInfo")}</small>
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
