import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

const MarketSummary = () => {
  const { lang } = useLanguage()

  return (
    <div className="p-4 mb-4" style={{ 
      backgroundColor: '#FFF5E6',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      <h5 className="fw-bold mb-4" style={{ 
        fontSize: '16px', 
        color: '#000', 
        letterSpacing: '0.5px',
        textTransform: 'uppercase'
      }}>
        {lang('home.exchangeHub.marketSummary')}
      </h5>
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span style={{ fontSize: '14px', color: '#666' }}>{lang('home.exchangeHub.totalProjects')}</span>
          <strong style={{ fontSize: '16px', color: '#000', fontWeight: '700' }}>250</strong>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span style={{ fontSize: '14px', color: '#666' }}>{lang('home.exchangeHub.totalCapacity')}</span>
          <strong style={{ fontSize: '16px', color: '#000', fontWeight: '700' }}>27,500 kWp</strong>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span style={{ fontSize: '14px', color: '#666' }}>{lang('home.exchangeHub.averageROI')}</span>
          <strong style={{ fontSize: '16px', color: '#000', fontWeight: '700' }}>10.8%</strong>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <span style={{ fontSize: '14px', color: '#666' }}>{lang('home.exchangeHub.activeInvestors')}</span>
          <strong style={{ fontSize: '16px', color: '#000', fontWeight: '700' }}>320+</strong>
        </div>
      </div>
    </div>
  )
}

export default MarketSummary
