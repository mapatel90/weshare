'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import AOS from 'aos'

const MissionSection = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  return (
    <section className="mission-section">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-6" data-aos="fade-right">
            <div className="mission-card">
              <h2 className="section-title mb-2">Our Mission</h2>
              <h3 className="section-subtitle mb-4 fs-34">Empowering Communities Through Solar Leasing</h3>
              <p className="fs-18 fw-500 mb-3">
                At WeShare, our mission is to make clean energy affordable, profitable, and accessible for everyone.
              </p>
              <p className="fs-18 fw-500 mb-3">
                We connect investors and offtakers through solar leasing — turning rooftops into renewable assets that deliver real savings and sustainable returns.
              </p>
              <Image 
                src="/images/general/mission.png" 
                alt="Solar Mission" 
                className="mission-image img-thubnail" 
                width={600} 
                height={300} 
              />
            </div>
          </div>
          <div className="col-lg-6" data-aos="fade-left">
            <div className="mission-card bg-grey cardPading">
              <h2 className="section-title fw-600 fs-32">Driving Sustainable Growth —</h2>
              <h3 className="section-title fw-600 fs-32 mb-4">One Solar Lease at a Time</h3>
              <p className="fs-18 fw-500 pe-4">
                At WeShare, we turn clean energy into shared opportunity.
              </p>
              <p className="fs-18 fw-500">
                Through innovation and transparency, we ensure every solar lease delivers not only strong financial returns but also lasting environmental and social impact.
              </p>
              <ul className="checkmark-list bg-white">
                <li>Democratizing access to clean energy investments</li>
                <li>Delivering measurable returns with real-world impact</li>
                <li>Reducing carbon footprints through solar adoption</li>
              </ul>
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
      </div>
    </section>
  )
}

export default MissionSection
