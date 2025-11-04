import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

const QuickSimulation = () => {
  const { lang } = useLanguage()

  return (
    <div className="p-4" style={{ 
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
        {lang('home.exchangeHub.quickSimulation')}
      </h5>
      <div className="mb-4">
        <div className="mb-3">
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
            {lang('home.exchangeHub.ifYouInvest')}
          </div>
          <div style={{ fontSize: '32px', color: '#000', fontWeight: '700' }}>
            $5,000 <span style={{ fontSize: '24px' }}>→</span>
          </div>
        </div>
        <div className="mb-4">
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
            {lang('home.exchangeHub.youCanEarn')}
          </div>
          <div style={{ fontSize: '32px', color: '#000', fontWeight: '700', marginBottom: '4px' }}>
            $900{lang('home.exchangeHub.perYear')}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {lang('home.exchangeHub.basedOnROI')}
          </div>
        </div>
      </div>
      <button className="btn text-white w-100 mb-3" style={{ 
        backgroundColor: '#FFA500', 
        border: 'none',
        borderRadius: '8px',
        padding: '14px',
        fontSize: '15px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {lang('home.exchangeHub.signUpToInvest')}
      </button>
      <button className="btn w-100 d-flex align-items-center justify-content-center" style={{
        backgroundColor: 'white',
        border: '2px solid #1a1a2e',
        borderRadius: '8px',
        padding: '14px',
        fontSize: '15px',
        fontWeight: '600',
        color: '#1a1a2e',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="me-2" viewBox="0 0 16 16">
          <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5M5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1z"/>
          <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1"/>
        </svg>
        {lang('home.exchangeHub.listYourProject')}
      </button>
    </div>
  )
}

export default QuickSimulation
