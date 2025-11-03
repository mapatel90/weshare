'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import AOS from 'aos'

const FeatureSection = () => {
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
            <h2 className="section-title">WeShare —</h2>
            <h3 className="section-subtitle">Power With Purpose</h3>
            <p className="mb-0 fs-18 fw-500">
              WeShare is your marketplace for clean efficient — driving clean energy accessibility to a sustainable economy.
            </p>
            <ul className="checkmark-list my-30">
              <li>Sustainable and impact-driven investment model</li>
              <li>Earn measurable returns from solar generation</li>
              <li className="mb-0">Empower communities with clean, affordable energy</li>
            </ul>
            <p className="fw-500 fs-18">
              Together we're building a transparent, sustainable, and profitable clean energy ecosystem.
            </p>
            <button className="btn btn-primary-custom mt-3">
              Visit Exchange Hub 
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
