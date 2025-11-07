'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AOS from 'aos'
import { useLanguage } from '@/contexts/LanguageContext'

const EnergySection = () => {
  const { lang } = useLanguage()
  const router = useRouter()
  
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  return (
    <section className="energy-section">
      <div className="container">
        <div className="row innerBox mx-0">
          <div className="col-12 col-md-7 col-lg-6" data-aos="fade-right">
            <div className="contentBox py-5 pe-4">
              <h2 className="fw-bold fs-40 text-black mb-40" dangerouslySetInnerHTML={{ __html: lang('home.energy.title') }}></h2>
              <p className="text-black mb-40 fs-24">{lang('home.energy.description')}</p>
              
              <div className="groupBtn gap-4 mt-0 justify-content-start">
                <button className="btn btn-primary-custom" onClick={() => router.push('/investor/login')}>{lang('home.energy.becomeInvestor')} →</button>
                <button className="btn btn-primary-custom transparentBtn tc-102C41 border-1" onClick={() => router.push('/login')}>{lang('home.energy.signIn')}</button>
              </div>
            </div>
          </div>
          <div className="col-0 col-md-5 col-lg-6"></div>
        </div>
      </div>
    </section>
  )
}

export default EnergySection
