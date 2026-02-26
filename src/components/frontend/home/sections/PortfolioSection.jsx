'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import AOS from 'aos'
import { useLanguage } from '@/contexts/LanguageContext'
import useSettings from '@/hooks/useSettings'

const PortfolioSection = () => {
  const { lang } = useLanguage()
  const { settings, getSetting } = useSettings()
  const [portfolioData, setPortfolioData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Format large numbers with K, M, B suffixes
  const formatNumber = (num, decimals = 1) => {
    if (!num || num === 0) return '0'
    if (num >= 1000000000) return (num / 1000000000).toFixed(decimals) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(decimals) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(decimals) + 'K'
    return num.toFixed(decimals)
  }

  // Format currency
  const formatCurrency = (num) => {
    if (!num || num === 0) return '$0'
    return '$' + formatNumber(num)
  }

  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  // Load portfolio data from settings
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      const data = {
        totalKwh: {
          value: parseFloat(getSetting("portfolio_kwh_generated_value", "0")) || 0,
          growth: `+${getSetting("portfolio_kwh_generated_percentage", "0")}%`
        },
        totalIncome: {
          value: parseFloat(getSetting("portfolio_income_value", "0")) || 0,
          growth: `+${getSetting("portfolio_income_percentage", "0")}%`
        },
        totalSavings: {
          value: parseFloat(getSetting("portfolio_saving_value", "0")) || 0,
          growth: `+${getSetting("portfolio_saving_percentage", "0")}%`
        },
        averageROI: {
          value: parseFloat(getSetting("portfolio_roi_value", "0")) || 0,
          growth: `+${getSetting("portfolio_roi_percentage", "0")}%`
        },
        co2Avoided: {
          value: parseFloat(getSetting("portfolio_co2_avoided_value", "0")) || 0,
          growth: `+${getSetting("portfolio_co2_avoided_percentage", "0")}%`
        }
      }
      setPortfolioData(data)
      setLoading(false)
    }
  }, [settings, getSetting])

  const stats = [
    {
      icon: '/images/icons/port-icon1.svg',
      value: portfolioData ? formatNumber(portfolioData.totalKwh.value) : '0',
      label: lang('home.portfolio.totalKwh'),
      growth: portfolioData?.totalKwh?.growth || '+0%'
    },
    {
      icon: '/images/icons/port-icon2.svg',
      value: portfolioData ? formatCurrency(portfolioData.totalIncome.value) : '$0',
      label: lang('home.portfolio.totalIncome'),
      growth: portfolioData?.totalIncome?.growth || '+0%'
    },
    {
      icon: '/images/icons/port-icon3.svg',
      value: portfolioData ? formatCurrency(portfolioData.totalSavings.value) : '$0',
      label: lang('home.portfolio.totalSavings'),
      growth: portfolioData?.totalSavings?.growth || '+0%'
    },
    {
      icon: '/images/icons/port-icon4.svg',
      value: portfolioData ? `${(portfolioData.averageROI.value || 0).toFixed(1)}%` : '0%',
      label: lang('home.portfolio.averageROI'),
      growth: portfolioData?.averageROI?.growth || '+0%'
    },
    {
      icon: '/images/icons/port-icon5.svg',
      value: portfolioData ? `${formatNumber(portfolioData.co2Avoided.value)} tons` : '0 tons',
      label: lang('home.portfolio.co2Avoided'),
      growth: portfolioData?.co2Avoided?.growth || '+0%'
    }
  ]

  return (
    <section className="portfolio blockSpacing" data-aos="fade-up">
      <div className="container">
        <div className="row mb-5">
          <div className="col-12 col-md-6 d-flex">
            <Image src="/images/icons/port-icon.svg" alt="portfolio" width={40} height={40} />
            <h3 className="subTitle ms-3 mb-0">{lang('home.portfolio.title')}</h3>
          </div>
        </div>
        <div className="elementBlockGroup portfolio-grid">
          {stats.map((stat, index) => (
            <div key={index} className="elementBlock">
              <div className="energy-card shadow-sm">
                <div className="d-flex align-items-start justify-content-between w-100 gap-3 mb-4">
                  <div className="icon-box d-flex align-items-center justify-content-center rounded-3">
                    <span>
                      <Image src={stat.icon} alt="icon" width={24} height={24} />
                    </span>
                  </div>
                  <div className="badge-box position-relative">
                    <span className="growth-badge">{stat.growth}</span>
                    <span className="dot"></span>
                  </div>
                </div>
                <div>
                  {loading ? (
                    <h3 className="mb-0 placeholder-glow">
                      <span className="placeholder col-6"></span>
                    </h3>
                  ) : (
                    <h3 className="mb-0">{stat.value}</h3>
                  )}
                  <small className="tw-300">{stat.label}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PortfolioSection
