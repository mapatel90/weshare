'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import AOS from 'aos'

const SubmitSection = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  return (
    <section className="submit">
      <div className="container">
        <div className="innerBox">
          <div className="row mx-0">
            <div className="col-0 d-none d-md-block col-md-6" data-aos="fade-right">
              <Image src="/images/general/home.png" alt="home" className="home-img img-thubnail" width={600} height={500} />
            </div>
            <div className="col-12 col-md-6" data-aos="fade-left">
              <div className="contentBox me-2">
                <h2 className="fw-bold fs-48 text-white mb-40">Have a Property for Solar?</h2>
                <p className="fs-24 mb-40">Submit your lease request and connect with investors looking to fund your solar installation.</p>
                <button className="btn btn-primary-custom mt-0">Submit Lease Request</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SubmitSection
