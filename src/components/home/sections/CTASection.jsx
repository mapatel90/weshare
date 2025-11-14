'use client'

import React, { useEffect } from 'react'
import AOS from 'aos'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'

const CTASection = () => {
  const { lang } = useLanguage()
  const router = useRouter()
  
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  return (
    <section className="solar-cta" data-aos="fade-up">
      <div className="container">
        <div className="row">
          <div className="col-12 col-md-12 col-lg-10 mx-auto">
            <div className="cta-box d-flex flex-column flex-md-row align-items-center justify-content-between p-4 p-md-5 rounded-4">
              <div className="text-center text-md-start mb-3 mb-md-0">
                <h3 className="fw-bold text-white mb-40">{lang('home.cta.title')}</h3>
                <p className="text-white fw-300 fs-18 w-60 mb-0">
                  {lang('home.cta.description')}
                </p>
              </div>
              <button className="btn btn-primary-custom bg-white tc-102C41" onClick={() => router.push('/register')}>{lang('home.cta.becomeOfftaker')} →</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTASection
