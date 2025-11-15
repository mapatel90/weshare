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
          <div className="col-0 col-md-6"></div>
          <div className="col-12 col-md-6" data-aos="fade-left" data-aos-duration="1200">
            <div className="contentBox py-90 pe-md-0 pe-4">
              <h2 className="fw-bold fs-40 text-black mb-40">{lang('home.solarLease.title')}</h2>
              <p className="text-black mb-40 fs-24">{lang('home.solarLease.description')}</p>
              
              <div className="groupBtn gap-4 mt-0 justify-content-start">
                <button className="btn btn-primary-custom" onClick={() => router.push('/register')}>{lang('home.solarLease.becomeOfftaker')} →</button>
                <button className="btn btn-primary-custom transparentBtn tc-102C41 border-1" onClick={() => router.push('/offtaker/login')}>{lang('home.solarLease.signIn')}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SolarLeaseSection
