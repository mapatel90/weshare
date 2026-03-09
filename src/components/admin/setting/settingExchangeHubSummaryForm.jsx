'use client'
import React, { useState, useEffect } from 'react'
import PageHeaderSetting from '@/components/shared/pageHeader/PageHeaderSetting'
import Footer from '@/components/shared/Footer'
import PerfectScrollbar from 'react-perfect-scrollbar'
import useSettings from '@/hooks/useSettings'
import { useLanguage } from '@/contexts/LanguageContext'
import { TextField, FormControl } from '@mui/material'

const SettingsExchangeHubSummaryForm = () => {
  const { lang } = useLanguage()
  const { settings, updateSettings, getSetting } = useSettings()

  const [formData, setFormData] = useState({
    exchange_hub_total_projects: '',
    exchange_hub_total_capacity: '',
    exchange_hub_average_roi: '',
    exchange_hub_active_investors: '',
    exchange_hub_if_you_invest: '',
    exchange_hub_you_can_earn: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormInitialized, setIsFormInitialized] = useState(false)

  // Initialize form from settings
  useEffect(() => {
    if (settings && !isFormInitialized && Object.keys(settings).length > 0) {
      setFormData({
        exchange_hub_total_projects: getSetting('exchange_hub_total_projects', ''),
        exchange_hub_total_capacity: getSetting('exchange_hub_total_capacity', ''),
        exchange_hub_average_roi: getSetting('exchange_hub_average_roi', ''),
        exchange_hub_active_investors: getSetting('exchange_hub_active_investors', ''),
        exchange_hub_if_you_invest: getSetting('exchange_hub_if_you_invest', ''),
        exchange_hub_you_can_earn: getSetting('exchange_hub_you_can_earn', ''),
      })
      setIsFormInitialized(true)
    }
  }, [settings, isFormInitialized, getSetting])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      await updateSettings({
        exchange_hub_total_projects: formData.exchange_hub_total_projects || '',
        exchange_hub_total_capacity: formData.exchange_hub_total_capacity || '',
        exchange_hub_average_roi: formData.exchange_hub_average_roi || '',
        exchange_hub_active_investors: formData.exchange_hub_active_investors || '',
        exchange_hub_if_you_invest: formData.exchange_hub_if_you_invest || '',
        exchange_hub_you_can_earn: formData.exchange_hub_you_can_earn || '',
      })
    } catch (error) {
      console.error('Error saving Exchange Hub Summary settings:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reusable field rows: [fieldKey, labelKey, fallbackLabel, helperKey, helperFallback]
  const fields = [
    {
      key: 'exchange_hub_total_projects',
      labelKey: 'exchangeHubSummary.totalProjects',
      labelFallback: 'Total Projects',
      helperKey: 'exchangeHubSummary.totalProjectsInfo',
      helperFallback: 'Value shown for Total Projects in Exchange Hub Summary',
    },
    {
      key: 'exchange_hub_total_capacity',
      labelKey: 'exchangeHubSummary.totalCapacity',
      labelFallback: 'Total Capacity',
      helperKey: 'exchangeHubSummary.totalCapacityInfo',
      helperFallback: 'Value shown for Total Capacity in Exchange Hub Summary (e.g. 500 kWp)',
    },
    {
      key: 'exchange_hub_average_roi',
      labelKey: 'exchangeHubSummary.averageROI',
      labelFallback: 'Average ROI',
      helperKey: 'exchangeHubSummary.averageROIInfo',
      helperFallback: 'Value shown for Average ROI in Exchange Hub Summary (e.g. 20%)',
    },
    {
      key: 'exchange_hub_active_investors',
      labelKey: 'exchangeHubSummary.activeInvestors',
      labelFallback: 'Active Investors',
      helperKey: 'exchangeHubSummary.activeInvestorsInfo',
      helperFallback: 'Value shown for Active Investors count in Exchange Hub Summary',
    },
    {
      key: 'exchange_hub_if_you_invest',
      labelKey: 'exchangeHubSummary.ifYouInvest',
      labelFallback: 'If You Invest',
      helperKey: 'exchangeHubSummary.ifYouInvestInfo',
      helperFallback: 'Example investment amount displayed in Quick Simulation (e.g. $10,000)',
    },
    {
      key: 'exchange_hub_you_can_earn',
      labelKey: 'exchangeHubSummary.youCanEarn',
      labelFallback: 'You Can Earn Approx.',
      helperKey: 'exchangeHubSummary.youCanEarnInfo',
      helperFallback: 'Approximate earnings shown in Quick Simulation (e.g. $2,000/year)',
    },
  ]

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

              {/* Section Header */}
              <div className="mb-4">
                <h4 className="fw-bold">
                  {lang('exchangeHubSummary.title', 'Exchange Hub Summary Settings')}
                </h4>
                <div className="fs-12 text-muted">
                  {lang('exchangeHubSummary.subtitle', 'Configure the values displayed in the Exchange Hub market summary and quick simulation sections.')}
                </div>
              </div>

              {/* Fields */}
              {fields.map(({ key, labelKey, labelFallback, helperKey, helperFallback }, index) => (
                <React.Fragment key={key}>
                  {index > 0 && <hr className="my-4" />}
                  <div className="mb-3">
                    <FormControl fullWidth>
                      <TextField
                        fullWidth
                        label={lang(labelKey, labelFallback)}
                        placeholder={lang(labelKey, labelFallback)}
                        value={formData[key]}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        helperText={lang(helperKey, helperFallback)}
                      />
                    </FormControl>
                  </div>
                </React.Fragment>
              ))}

            </div>
          </div>
        </div>
        <Footer />
      </PerfectScrollbar>
    </div>
  )
}

export default SettingsExchangeHubSummaryForm

