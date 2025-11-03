'use client'
import React, { useState, useEffect, useMemo } from 'react'
import PageHeaderSetting from '@/components/shared/pageHeader/PageHeaderSetting'
import Footer from '@/components/shared/Footer'
import SelectDropdown from '@/components/shared/SelectDropdown'
import { FiCalendar } from 'react-icons/fi'
import PerfectScrollbar from 'react-perfect-scrollbar'
import TextAreaTopLabel from '@/components/shared/TextAreaTopLabel'
import useSettings from '@/hooks/useSettings'
import { useLanguage } from '@/contexts/LanguageContext'

const SettingsFinanceForm = () => {
  const { lang, currentLanguage } = useLanguage()
  const { settings, loading: settingsLoading, updateSettings, getSetting } = useSettings()

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
          if (['finance_decimal_separator', 'finance_thousand_separator', 'finance_default_tax',
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
          if (['finance_decimal_separator', 'finance_thousand_separator', 'finance_default_tax',
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

  // Handle form submission
  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      await updateSettings(formData)
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
                <label className="form-label">{lang("finance.decimalSeparator")}</label>
                <SelectDropdown
                  options={decimalSeparator}
                  defaultSelect={formData.finance_decimal_separator}
                  selectedOption={selectedOptions.finance_decimal_separator}
                  onSelectOption={(option) => handleDropdownChange('finance_decimal_separator', option)}
                />
                <small className="form-text text-muted">{lang("finance.decimalSeparatorInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.thousandSeparator")}</label>
                <SelectDropdown
                  options={thousandSeparator}
                  defaultSelect={formData.finance_thousand_separator}
                  selectedOption={selectedOptions.finance_thousand_separator}
                  onSelectOption={(option) => handleDropdownChange('finance_thousand_separator', option)}
                />
                <small className="form-text text-muted">{lang("finance.thousandSeparatorInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.defaultTax")}</label>
                <SelectDropdown
                  options={taxOptions}
                  defaultSelect={formData.finance_default_tax}
                  selectedOption={selectedOptions.finance_default_tax}
                  onSelectOption={(option) => handleDropdownChange('finance_default_tax', option)}
                />
                <small className="form-text text-muted">{lang("finance.defaultTaxInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.showTaxPerItem")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.finance_show_tax_per_item}
                  selectedOption={selectedOptions.finance_show_tax_per_item}
                  onSelectOption={(option) => handleDropdownChange('finance_show_tax_per_item', option)}
                />
                <small className="form-text text-muted">{lang("finance.showTaxPerItemInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.removeTaxNameFromItem")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.finance_remove_tax_name_from_item}
                  selectedOption={selectedOptions.finance_remove_tax_name_from_item}
                  onSelectOption={(option) => handleDropdownChange('finance_remove_tax_name_from_item', option)}
                />
                <small className="form-text text-muted">{lang("finance.removeTaxNameFromItemInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.excludeCurrencySymbol")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.finance_exclude_currency_symbol}
                  selectedOption={selectedOptions.finance_exclude_currency_symbol}
                  onSelectOption={(option) => handleDropdownChange('finance_exclude_currency_symbol', option)}
                />
                <small className="form-text text-muted">{lang("finance.excludeCurrencySymbolInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.removeZeroDecimals")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.finance_remove_zero_decimals}
                  selectedOption={selectedOptions.finance_remove_zero_decimals}
                  onSelectOption={(option) => handleDropdownChange('finance_remove_zero_decimals', option)}
                />
                <small className="form-text text-muted">{lang("finance.removeZeroDecimalsInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.outputAmountToWords")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.finance_output_amount_to_words}
                  selectedOption={selectedOptions.finance_output_amount_to_words}
                  onSelectOption={(option) => handleDropdownChange('finance_output_amount_to_words', option)}
                />
                <small className="form-text text-muted">{lang("finance.outputAmountToWordsInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.numberWordsLowercase")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.finance_number_words_lowercase}
                  selectedOption={selectedOptions.finance_number_words_lowercase}
                  onSelectOption={(option) => handleDropdownChange('finance_number_words_lowercase', option)}
                />
                <small className="form-text text-muted">{lang("finance.numberWordsLowercaseInfo")}</small>
              </div>
              <hr className="my-5" />
              <div className="mb-5">
                <h4 className="fw-bold">{lang("finance.invoiceTitle")}</h4>
                <div className="fs-12 text-muted">{lang("finance.invoiceSubtitle")}</div>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.invoiceNumberPrefix")}</label>
                <div className="input-group">
                  <span className="input-group-text">INV-</span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={lang("finance.invoiceNumberPrefix")}
                    value={formData.invoice_number_prefix}
                    onChange={(e) => handleInputChange('invoice_number_prefix', e.target.value)}
                  />
                </div>
                <small className="form-text text-muted">{lang("finance.invoiceNumberPrefixInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.invoiceDueAfterDays")}</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FiCalendar size={16} />
                  </span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder={lang("finance.invoiceDueAfterDays")}
                    value={formData.invoice_due_after_days}
                    onChange={(e) => handleInputChange('invoice_due_after_days', e.target.value)}
                  />
                </div>
                <small className="form-text text-muted">{lang("finance.invoiceDueAfterDaysInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.allowStaffViewAssigned")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.invoice_allow_staff_view_assigned}
                  selectedOption={selectedOptions.invoice_allow_staff_view_assigned}
                  onSelectOption={(option) => handleDropdownChange('invoice_allow_staff_view_assigned', option)}
                />
                <small className="form-text text-muted">{lang("finance.allowStaffViewAssignedInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.requireClientLogin")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.invoice_require_client_login}
                  selectedOption={selectedOptions.invoice_require_client_login}
                  onSelectOption={(option) => handleDropdownChange('invoice_require_client_login', option)}
                />
                <small className="form-text text-muted">{lang("finance.requireClientLoginInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.deleteOnlyLast")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.invoice_delete_only_last}
                  selectedOption={selectedOptions.invoice_delete_only_last}
                  onSelectOption={(option) => handleDropdownChange('invoice_delete_only_last', option)}
                />
                <small className="form-text text-muted">{lang("finance.deleteOnlyLastInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.decrementOnDelete")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.invoice_decrement_on_delete}
                  selectedOption={selectedOptions.invoice_decrement_on_delete}
                  onSelectOption={(option) => handleDropdownChange('invoice_decrement_on_delete', option)}
                />
                <small className="form-text text-muted">{lang("finance.decrementOnDeleteInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.excludeDraftFromCustomer")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.invoice_exclude_draft_from_customer}
                  selectedOption={selectedOptions.invoice_exclude_draft_from_customer}
                  onSelectOption={(option) => handleDropdownChange('invoice_exclude_draft_from_customer', option)}
                />
                <small className="form-text text-muted">{lang("finance.excludeDraftFromCustomerInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.showSaleAgent")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.invoice_show_sale_agent}
                  selectedOption={selectedOptions.invoice_show_sale_agent}
                  onSelectOption={(option) => handleDropdownChange('invoice_show_sale_agent', option)}
                />
                <small className="form-text text-muted">{lang("finance.showSaleAgentInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.showProjectName")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.invoice_show_project_name}
                  selectedOption={selectedOptions.invoice_show_project_name}
                  onSelectOption={(option) => handleDropdownChange('invoice_show_project_name', option)}
                />
                <small className="form-text text-muted">{lang("finance.showProjectNameInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.showTotalPaid")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.invoice_show_total_paid}
                  selectedOption={selectedOptions.invoice_show_total_paid}
                  onSelectOption={(option) => handleDropdownChange('invoice_show_total_paid', option)}
                />
                <small className="form-text text-muted">{lang("finance.showTotalPaidInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.showCreditsApplied")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.invoice_show_credits_applied}
                  selectedOption={selectedOptions.invoice_show_credits_applied}
                  onSelectOption={(option) => handleDropdownChange('invoice_show_credits_applied', option)}
                />
                <small className="form-text text-muted">{lang("finance.showCreditsAppliedInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.showAmountDue")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.invoice_show_amount_due}
                  selectedOption={selectedOptions.invoice_show_amount_due}
                  onSelectOption={(option) => handleDropdownChange('invoice_show_amount_due', option)}
                />
                <small className="form-text text-muted">{lang("finance.showAmountDueInfo")}</small>
              </div>
              <div className="mb-5">
                <label className="form-label">{lang("finance.attachPdfOnReceipt")}</label>
                <SelectDropdown
                  options={yesNoOptions}
                  defaultSelect={formData.invoice_attach_pdf_on_receipt}
                  selectedOption={selectedOptions.invoice_attach_pdf_on_receipt}
                  onSelectOption={(option) => handleDropdownChange('invoice_attach_pdf_on_receipt', option)}
                />
                <small className="form-text text-muted">{lang("finance.attachPdfOnReceiptInfo")}</small>
              </div>
              <TextAreaTopLabel
                label={lang("finance.predefinedClientNote")}
                placeholder={lang("finance.predefinedClientNote")}
                info={lang("finance.predefinedClientNoteInfo")}
                className={"mb-5"}
                value={formData.invoice_predefined_client_note}
                onChange={handleTextareaChange('invoice_predefined_client_note')}
              />
              <TextAreaTopLabel
                label={lang("finance.predefinedTermsConditions")}
                placeholder={lang("finance.predefinedTermsConditions")}
                info={lang("finance.predefinedTermsConditionsInfo")}
                className={"mb-5"}
                value={formData.invoice_predefined_terms_conditions}
                onChange={handleTextareaChange('invoice_predefined_terms_conditions')}
              />
              <TextAreaTopLabel
                label={lang("finance.proposalInfoFormat")}
                placeholder={`{proposal_to}
{address}
{city} {state}
{country_code} {zip_code}
{phone}
{email}`}
                info={lang("finance.proposalInfoFormatInfo")}
                value={formData.invoice_proposal_info_format}
                onChange={handleTextareaChange('invoice_proposal_info_format')}
              />
            </div>
          </div>
        </div>
        <Footer />
      </PerfectScrollbar>
    </div>
  )
}

export default SettingsFinanceForm
