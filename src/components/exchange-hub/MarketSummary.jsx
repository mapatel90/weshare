import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

const MarketSummary = () => {
  const { lang } = useLanguage()

  return (
    <div className="p-4 mb-4" style={{ 
      backgroundColor: '#FFF9ED',
      borderRadius: '12px',
      border: '1px solid #FFE8C5'
    }}>
      <h5 className="fw-bold mb-3" style={{ fontSize: '14px', color: '#1a1a2e', letterSpacing: '0.5px' }}>
        {lang('home.exchangeHub.marketSummary')}
      </h5>
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <small style={{ fontSize: '13px', color: '#666' }}>{lang('home.exchangeHub.totalProjects')}</small>
          <strong style={{ fontSize: '15px', color: '#1a1a2e' }}>250</strong>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <small style={{ fontSize: '13px', color: '#666' }}>{lang('home.exchangeHub.totalCapacity')}</small>
          <strong style={{ fontSize: '15px', color: '#1a1a2e' }}>27,500 kWp</strong>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <small style={{ fontSize: '13px', color: '#666' }}>{lang('home.exchangeHub.averageROI')}</small>
          <strong style={{ fontSize: '15px', color: '#1a1a2e' }}>10.8%</strong>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <small style={{ fontSize: '13px', color: '#666' }}>{lang('home.exchangeHub.activeInvestors')}</small>
          <strong style={{ fontSize: '15px', color: '#1a1a2e' }}>320+</strong>
        </div>
      </div>
    </div>
  )
}

export default MarketSummary
