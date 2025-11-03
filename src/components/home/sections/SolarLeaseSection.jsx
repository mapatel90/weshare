'use client'

import React, { useEffect } from 'react'
import AOS from 'aos'

const SolarLeaseSection = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  return (
    <section className="solor-lease-section">
      <div className="container">
        <div className="row innerBox mx-0">
          <div className="col-0 col-md-5"></div>
          <div className="col-12 col-md-7" data-aos="fade-left" data-aos-duration="1200">
            <div className="contentBox py-90 pe-md-0 pe-4">
              <h2 className="fw-bold fs-40 text-black mb-40">Turn your Property Into a Solar Lease</h2>
              <p className="text-black mb-40 fs-24">List your rooftop or land, partner with trusted investors, and earn long-term lease income.</p>
              
              <div className="groupBtn gap-4 mt-0 justify-content-start">
                <button className="btn btn-primary-custom">Become an Offtaker →</button>
                <button className="btn btn-primary-custom transparentBtn tc-102C41 border-1">Sign In</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SolarLeaseSection
