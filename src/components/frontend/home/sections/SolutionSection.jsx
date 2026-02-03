'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import AOS from 'aos'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'

const SolutionSection = () => {
  const { lang } = useLanguage()
  const router = useRouter()
  
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  return (
    <section className="solution-section blockSpacing">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-6" data-aos="fade-right">
            <div className="mission-card">
              <h2 className="section-title mb-2">{lang('home.solution.title')}</h2>
              <h3 className="section-subtitle mb-4 fs-34">{lang('home.solution.subtitle')}</h3>
              <p className="fs-18 fw-500 mb-3">
                {lang('home.solution.description1')}
              </p>
              <p className="fs-18 fw-500 mb-3">
                {lang('home.solution.description2')}
              </p>
              <Image src="/images/general/solution.png" alt="Solar Solution" className="mission-image img-thubnail" width={600} height={300} />
            </div>
          </div>
          <div className="col-lg-6" data-aos="fade-left">
            <div className="mission-card bg-grey cardPading">
              <h2 className="section-title fw-600 mb-3 fs-32">{lang('home.solution.cardTitle')}</h2>
              <p className="fs-18 fw-500 pe-4">
                {lang('home.solution.cardDescription1')}
              </p>
              <p className="fs-18 fw-500">
                {lang('home.solution.cardDescription2')}
              </p>
              <ul className="checkmark-list bg-white">
                <li>{lang('home.solution.point1')}</li>
                <li>{lang('home.solution.point2')}</li>
                <li>{lang('home.solution.point3')}</li>
              </ul>
              <button
                type="button"
                className="btn btn-primary-custom mt-3 d-inline-flex align-items-center"
                onClick={() => router.push('/frontend/exchange-hub')}
                style={{ backgroundColor: "#F6A623", borderColor: "#F6A623" }}
              >
                {lang('home.solution.visitHub')}
                <Image className="ms-2" src="/images/icons/right-white.svg" alt="arrow" width={20} height={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SolutionSection
