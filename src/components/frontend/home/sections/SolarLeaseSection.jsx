'use client'

import React, { useEffect } from 'react'
import AOS from 'aos'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'

const SolarLeaseSection = () => {
  const { lang } = useLanguage()
  const router = useRouter()
  
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  return (
    <section className="solor-lease-section">
      <div className="container">
        <div className="row innerBox mx-0">
          <div className="col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6 col-custom-left"></div>
          <div className="col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6 col-custom-right" data-aos="fade-left" data-aos-duration="1200">
            <div className="contentBox py-90 pe-md-0 pe-4">
              <h2 className="fw-bold fs-40 text-black mb-40">{lang('home.solarLease.title')}</h2>
              <p className="text-black mb-40 fs-24">{lang('home.solarLease.description')}</p>
              
              <div className="groupBtn gap-4 mt-0">
                <button className="btn btn-primary-custom btn-solar" onClick={() => router.push('/register')}>{lang('home.solarLease.becomeOfftaker')} →</button>
                <button className="btn btn-primary-custom btn-solar transparentBtn tc-102C41 border-1" onClick={() => router.push('/offtaker/login')}>{lang('home.solarLease.signIn')}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SolarLeaseSection
