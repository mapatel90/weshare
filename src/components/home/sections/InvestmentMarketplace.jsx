'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import AOS from 'aos'

const InvestmentMarketplace = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  return (
    <section className="Investment-Marketplace">
      <div className="container">
        <div className="row">
          <div className="col-12 text-center">
            <div className="contentBox" data-aos="fade-up">
              <h2 className="fw-600">Investment Marketplace</h2>
              <p>Browse live solar projects, discover new opportunities, and trade existing investments in our dynamic marketplace.</p>
              
              <div className="groupBtn" data-aos="fade-up" data-aos-duration="1500">
                <button className="btn btn-primary-custom mt-3">
                  Become an Investor 
                  <Image className="ms-2" src="/images/icons/w-row.svg" alt="arrow" width={20} height={20} />
                </button>
                <button className="btn btn-primary-custom mt-3 transparentBtn text-white border-1 shadow-0">
                  <Image className="me-2" src="/images/icons/login-icon.svg" alt="login" width={20} height={20} />
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default InvestmentMarketplace
