'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import AOS from 'aos'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'

const FeatureSection = () => {
  const { lang } = useLanguage()
  const router = useRouter()
  
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  return (
    <section className="feature-section">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6 mb-4 mb-lg-0" data-aos="fade-right">
            <Image 
              src="/images/general/perpose-img.png" 
              alt="Solar Installation" 
              className="img-fluid rounded img-thubnail" 
              width={600} 
              height={400} 
            />
          </div>
          <div className="col-lg-6" data-aos="fade-left">
            <h2 className="section-title">{lang('home.features.title')}</h2>
            <h3 className="section-subtitle">{lang('home.features.subtitle')}</h3>
            <p className="mb-0 fs-18 fw-500">
              {lang('home.features.description')}
            </p>
            <ul className="checkmark-list my-30">
              <li>{lang('home.features.feature1')}</li>
              <li>{lang('home.features.feature2')}</li>
              <li className="mb-0">{lang('home.features.feature3')}</li>
            </ul>
            <p className="fw-500 fs-18">
              {lang('home.features.closing')}
            </p>
            <button
              type="button"
              className="btn btn-primary-custom mt-3 text-white d-inline-flex align-items-center"
              onClick={() => router.push('/frontend/exchange-hub')}
              style={{ backgroundColor: "#F6A623", borderColor: "#F6A623" }}
            >
              {lang('home.features.visitHub')}
              <Image
                className="ms-2"
                src="/images/icons/right-white.svg"
                alt="arrow"
                width={20}
                height={20}
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeatureSection
