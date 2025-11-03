'use client'

import React, { useEffect } from 'react'
import AOS from 'aos'

const EnergySection = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  return (
    <section className="energy-section">
      <div className="container">
        <div className="row innerBox mx-0">
          <div className="col-12 col-md-7 col-lg-6" data-aos="fade-right">
            <div className="contentBox py-5 pe-4">
              <h2 className="fw-bold fs-40 text-black mb-40">Ready to invest<br />in clean energy?</h2>
              <p className="text-black mb-40 fs-24">Start small, earn steady — grow your portfolio with verified solar Lease projects.</p>
              
              <div className="groupBtn gap-4 mt-0 justify-content-start">
                <button className="btn btn-primary-custom">Become an Investor →</button>
                <button className="btn btn-primary-custom transparentBtn tc-102C41 border-1">Sign In</button>
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
