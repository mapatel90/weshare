'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import AOS from 'aos'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'

const InvestmentMarketplace = () => {
  const { lang } = useLanguage()
  const router = useRouter()
  
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  return (
    <section className="Investment-Marketplace">
      <div className="container">
        <div className="row">
          <div className="col-12 text-center">
            <div className="contentBox" data-aos="fade-up">
              <h2 className="fw-600">{lang('home.marketplace.title')}</h2>
              <p>{lang('home.marketplace.description')}</p>
              
              <div className="groupBtn" data-aos="fade-up" data-aos-duration="1500">
                <button className="btn btn-primary-custom mt-3">
                  {lang('home.marketplace.becomeInvestor')}
                  <Image className="ms-2" src="/images/icons/w-row.svg" alt="arrow" width={20} height={20} />
                </button>
                <button className="btn btn-primary-custom mt-3 transparentBtn text-white border-1 shadow-0" onClick={() => router.push('/login')}>
                  <Image className="me-2" src="/images/icons/login-icon.svg" alt="login" width={20} height={20} />
                  {lang('home.marketplace.signIn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default InvestmentMarketplace
