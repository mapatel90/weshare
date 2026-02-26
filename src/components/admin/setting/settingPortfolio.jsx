'use client'
import React, { useState, useEffect } from 'react'
import PageHeaderSetting from '@/components/shared/pageHeader/PageHeaderSetting'
import Footer from '@/components/shared/Footer'
import PerfectScrollbar from 'react-perfect-scrollbar'
import useSettings from '@/hooks/useSettings'
import { useLanguage } from '@/contexts/LanguageContext'
import { TextField, FormControl, InputAdornment } from '@mui/material'

const SettingPortfolio = () => {
  const { lang } = useLanguage()
  const { settings, loading: settingsLoading, updateSettings, getSetting } = useSettings()
  
  // Form state
  const [formData, setFormData] = useState({
    portfolio_kwh_generated_value: '',
    portfolio_kwh_generated_percentage: '',
    portfolio_income_value: '',
    portfolio_income_percentage: '',
    portfolio_saving_value: '',
    portfolio_saving_percentage: '',
    portfolio_roi_value: '',
    portfolio_roi_percentage: '',
    portfolio_co2_avoided_value: '',
    portfolio_co2_avoided_percentage: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormInitialized, setIsFormInitialized] = useState(false)

  // Initialize form from settings
  useEffect(() => {
    if (settings && !isFormInitialized && Object.keys(settings).length > 0) {
      const loaded = {
        portfolio_kwh_generated_value: getSetting("portfolio_kwh_generated_value", ""),
        portfolio_kwh_generated_percentage: getSetting("portfolio_kwh_generated_percentage", ""),
        portfolio_income_value: getSetting("portfolio_income_value", ""),
        portfolio_income_percentage: getSetting("portfolio_income_percentage", ""),
        portfolio_saving_value: getSetting("portfolio_saving_value", ""),
        portfolio_saving_percentage: getSetting("portfolio_saving_percentage", ""),
        portfolio_roi_value: getSetting("portfolio_roi_value", ""),
        portfolio_roi_percentage: getSetting("portfolio_roi_percentage", ""),
        portfolio_co2_avoided_value: getSetting("portfolio_co2_avoided_value", ""),
        portfolio_co2_avoided_percentage: getSetting("portfolio_co2_avoided_percentage", ""),
      }
      setFormData(loaded)
      setIsFormInitialized(true)
    }
  }, [settings, isFormInitialized, getSetting])

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle form submission
  const handleSave = async () => {
    try {
      setIsSubmitting(true)

      const settingsToUpdate = {
        portfolio_kwh_generated_value: formData.portfolio_kwh_generated_value || '',
        portfolio_kwh_generated_percentage: formData.portfolio_kwh_generated_percentage || '',
        portfolio_income_value: formData.portfolio_income_value || '',
        portfolio_income_percentage: formData.portfolio_income_percentage || '',
        portfolio_saving_value: formData.portfolio_saving_value || '',
        portfolio_saving_percentage: formData.portfolio_saving_percentage || '',
        portfolio_roi_value: formData.portfolio_roi_value || '',
        portfolio_roi_percentage: formData.portfolio_roi_percentage || '',
        portfolio_co2_avoided_value: formData.portfolio_co2_avoided_value || '',
        portfolio_co2_avoided_percentage: formData.portfolio_co2_avoided_percentage || '',
      }

      await updateSettings(settingsToUpdate)
    } catch (error) {
      console.error('Error saving portfolio settings:', error)
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
          <div className="mb-0 card">
            <div className="card-body">
              {/* Portfolio Settings Header */}
              <div className="mb-5">
                <h4 className="fw-bold">{lang("portfolio.title", "Portfolio Settings")}</h4>
                <div className="fs-12 text-muted">{lang("portfolio.subtitle", "Configure portfolio settings")}</div>
              </div>

              {/* KWH Generated Section */}
              <div className="mb-3">
                <h4 className="fw-bold">{lang("portfolio.kwhGenerated", "KWH Generated")}</h4>
                <div className="fs-12 text-muted">{lang("portfolio.kwhGeneratedInfo", "Configure KWH generation metrics")}</div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6 mb-3">
                  <FormControl fullWidth>
                    <TextField
                      label={lang("portfolio.kwhValue", "Value")}
                      fullWidth
                      type="number"
                      placeholder={lang("portfolio.kwhValue", "Value")}
                      value={formData.portfolio_kwh_generated_value}
                      onChange={(e) => handleInputChange('portfolio_kwh_generated_value', e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">kWh</InputAdornment>
                      }}
                    />
                  </FormControl>
                  <small className="form-text text-muted">{lang("portfolio.kwhValueInfo", "Enter the KWH generated value")}</small>
                </div>

                <div className="col-md-6 mb-3">
                  <FormControl fullWidth>
                    <TextField
                      label={lang("portfolio.kwhPercentage", "Percentage")}
                      fullWidth
                      type="number"
                      placeholder={lang("portfolio.kwhPercentage", "Percentage")}
                      value={formData.portfolio_kwh_generated_percentage}
                      onChange={(e) => handleInputChange('portfolio_kwh_generated_percentage', e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                      }}
                    />
                  </FormControl>
                  <small className="form-text text-muted">{lang("portfolio.kwhPercentageInfo", "Enter the percentage value")}</small>
                </div>
              </div>

              {/* Income Section */}
              <hr className="my-4" />
              <div className="mb-3">
                <h4 className="fw-bold">{lang("portfolio.income", "Income")}</h4>
                <div className="fs-12 text-muted">{lang("portfolio.incomeInfo", "Configure income metrics")}</div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6 mb-3">
                  <FormControl fullWidth>
                    <TextField
                      label={lang("portfolio.incomeValue", "Value")}
                      fullWidth
                      type="number"
                      placeholder={lang("portfolio.incomeValue", "Value")}
                      value={formData.portfolio_income_value}
                      onChange={(e) => handleInputChange('portfolio_income_value', e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">$</InputAdornment>
                      }}
                    />
                  </FormControl>
                  <small className="form-text text-muted">{lang("portfolio.incomeValueInfo", "Enter the income value")}</small>
                </div>

                <div className="col-md-6 mb-3">
                  <FormControl fullWidth>
                    <TextField
                      label={lang("portfolio.incomePercentage", "Percentage")}
                      fullWidth
                      type="number"
                      placeholder={lang("portfolio.incomePercentage", "Percentage")}
                      value={formData.portfolio_income_percentage}
                      onChange={(e) => handleInputChange('portfolio_income_percentage', e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                      }}
                    />
                  </FormControl>
                  <small className="form-text text-muted">{lang("portfolio.incomePercentageInfo", "Enter the percentage value")}</small>
                </div>
              </div>

              {/* Saving Section */}
              <hr className="my-4" />
              <div className="mb-3">
                <h4 className="fw-bold">{lang("portfolio.saving", "Saving")}</h4>
                <div className="fs-12 text-muted">{lang("portfolio.savingInfo", "Configure saving metrics")}</div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6 mb-3">
                  <FormControl fullWidth>
                    <TextField
                      label={lang("portfolio.savingValue", "Value")}
                      fullWidth
                      type="number"
                      placeholder={lang("portfolio.savingValue", "Value")}
                      value={formData.portfolio_saving_value}
                      onChange={(e) => handleInputChange('portfolio_saving_value', e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">$</InputAdornment>
                      }}
                    />
                  </FormControl>
                  <small className="form-text text-muted">{lang("portfolio.savingValueInfo", "Enter the saving value")}</small>
                </div>

                <div className="col-md-6 mb-3">
                  <FormControl fullWidth>
                    <TextField
                      label={lang("portfolio.savingPercentage", "Percentage")}
                      fullWidth
                      type="number"
                      placeholder={lang("portfolio.savingPercentage", "Percentage")}
                      value={formData.portfolio_saving_percentage}
                      onChange={(e) => handleInputChange('portfolio_saving_percentage', e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                      }}
                    />
                  </FormControl>
                  <small className="form-text text-muted">{lang("portfolio.savingPercentageInfo", "Enter the percentage value")}</small>
                </div>
              </div>

              {/* ROI Section */}
              <hr className="my-4" />
              <div className="mb-3">
                <h4 className="fw-bold">{lang("portfolio.roi", "ROI")}</h4>
                <div className="fs-12 text-muted">{lang("portfolio.roiInfo", "Configure ROI metrics")}</div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6 mb-3">
                  <FormControl fullWidth>
                    <TextField
                      label={lang("portfolio.roiValue", "Value")}
                      fullWidth
                      type="number"
                      placeholder={lang("portfolio.roiValue", "Value")}
                      value={formData.portfolio_roi_value}
                      onChange={(e) => handleInputChange('portfolio_roi_value', e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">$</InputAdornment>
                      }}
                    />
                  </FormControl>
                  <small className="form-text text-muted">{lang("portfolio.roiValueInfo", "Enter the ROI value")}</small>
                </div>

                <div className="col-md-6 mb-3">
                  <FormControl fullWidth>
                    <TextField
                      label={lang("portfolio.roiPercentage", "Percentage")}
                      fullWidth
                      type="number"
                      placeholder={lang("portfolio.roiPercentage", "Percentage")}
                      value={formData.portfolio_roi_percentage}
                      onChange={(e) => handleInputChange('portfolio_roi_percentage', e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                      }}
                    />
                  </FormControl>
                  <small className="form-text text-muted">{lang("portfolio.roiPercentageInfo", "Enter the percentage value")}</small>
                </div>
              </div>

              {/* CO2 Avoided Section */}
              <hr className="my-4" />
              <div className="mb-3">
                <h4 className="fw-bold">{lang("portfolio.co2Avoided", "CO2 Avoided")}</h4>
                <div className="fs-12 text-muted">{lang("portfolio.co2AvoidedInfo", "Configure CO2 avoided metrics")}</div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6 mb-3">
                  <FormControl fullWidth>
                    <TextField
                      label={lang("portfolio.co2Value", "Value")}
                      fullWidth
                      type="number"
                      placeholder={lang("portfolio.co2Value", "Value")}
                      value={formData.portfolio_co2_avoided_value}
                      onChange={(e) => handleInputChange('portfolio_co2_avoided_value', e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">tons</InputAdornment>
                      }}
                    />
                  </FormControl>
                  <small className="form-text text-muted">{lang("portfolio.co2ValueInfo", "Enter the CO2 avoided value")}</small>
                </div>

                <div className="col-md-6 mb-3">
                  <FormControl fullWidth>
                    <TextField
                      label={lang("portfolio.co2Percentage", "Percentage")}
                      fullWidth
                      type="number"
                      placeholder={lang("portfolio.co2Percentage", "Percentage")}
                      value={formData.portfolio_co2_avoided_percentage}
                      onChange={(e) => handleInputChange('portfolio_co2_avoided_percentage', e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                      }}
                    />
                  </FormControl>
                  <small className="form-text text-muted">{lang("portfolio.co2PercentageInfo", "Enter the percentage value")}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </PerfectScrollbar>
    </div>
  )
}

export default SettingPortfolio
