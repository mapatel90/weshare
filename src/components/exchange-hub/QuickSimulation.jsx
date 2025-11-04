import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

const QuickSimulation = () => {
  const { lang } = useLanguage()

  return (
    <div className="p-4" style={{ 
      backgroundColor: '#FFF9ED',
      borderRadius: '12px',
      border: '1px solid #FFE8C5'
    }}>
      <h5 className="fw-bold mb-3" style={{ fontSize: '14px', color: '#1a1a2e', letterSpacing: '0.5px' }}>
        {lang('home.exchangeHub.quickSimulation')}
      </h5>
      <div className="mb-3">
        <div className="mb-3">
          <small className="d-block mb-2" style={{ fontSize: '12px', color: '#666' }}>{lang('home.exchangeHub.ifYouInvest')}</small>
          <strong className="d-block" style={{ fontSize: '26px', color: '#1a1a2e' }}>$5,000 →</strong>
        </div>
        <div className="mb-3">
          <small className="d-block mb-2" style={{ fontSize: '12px', color: '#666' }}>{lang('home.exchangeHub.youCanEarn')}</small>
          <strong className="d-block" style={{ fontSize: '26px', color: '#1a1a2e' }}>$500{lang('home.exchangeHub.perYear')}</strong>
          <small style={{ fontSize: '11px', color: '#999' }}>{lang('home.exchangeHub.basedOnROI')}</small>
        </div>
      </div>
      <button className="btn text-white w-100 mb-2" style={{ 
        backgroundColor: '#FFA500', 
        border: 'none',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        {lang('home.exchangeHub.signUpToInvest')}
      </button>
      <button className="btn w-100 d-flex align-items-center justify-content-center" style={{
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '14px',
        color: '#1a1a2e'
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="me-2" viewBox="0 0 16 16">
          <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5M5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1z"/>
          <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1"/>
        </svg>
        {lang('home.exchangeHub.listYourProject')}
      </button>
    </div>
  )
}

export default QuickSimulation
