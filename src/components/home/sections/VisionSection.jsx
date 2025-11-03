'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import AOS from 'aos'
import { useLanguage } from '@/contexts/LanguageContext'

const VisionSection = () => {
  const { lang } = useLanguage()
  
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  return (
    <section className="vision-section">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-6" data-aos="fade-right">
            <div className="mission-card bg-grey cardPading">
              <h2 className="section-title fw-600 fs-32">{lang('home.vision.cardTitle1')}</h2>
              <h3 className="section-title fw-600 mb-4 fs-32">{lang('home.vision.cardTitle2')}</h3>
              <p className="fs-18 fw-500 pe-4">
                {lang('home.vision.cardDescription1')}
              </p>
              <p className="fs-18 fw-500">
                {lang('home.vision.cardDescription2')}
              </p>
              <ul className="checkmark-list bg-white">
                <li>{lang('home.vision.point1')}</li>
                <li>{lang('home.vision.point2')}</li>
                <li>{lang('home.vision.point3')}</li>
              </ul>
              <button className="btn btn-primary-custom mt-3">
                {lang('home.vision.visitHub')}
                <Image className="ms-2" src="/images/icons/right-white.svg" alt="arrow" width={20} height={20} />
              </button>
            </div>
          </div>
          <div className="col-lg-6" data-aos="fade-left">
            <div className="mission-card text-end">
              <h2 className="section-title mb-2">{lang('home.vision.title')}</h2>
              <h3 className="section-subtitle mb-0 fs-34">{lang('home.vision.subtitle1')}</h3>
              <h3 className="section-subtitle mb-4 fs-34">{lang('home.vision.subtitle2')}</h3>
              <p className="fs-18 fw-500 mb-3">
                {lang('home.vision.description')}
              </p>
              <Image src="/images/general/vision.png" alt="Solar Vision" className="vision-image img-thubnail" width={600} height={300} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default VisionSection
