'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import AOS from 'aos'

const VisionSection = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  return (
    <section className="vision-section">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-6" data-aos="fade-right">
            <div className="mission-card bg-grey cardPading">
              <h2 className="section-title fw-600 fs-32">Building a Brighter, Greener</h2>
              <h3 className="section-title fw-600 mb-4 fs-32">Future — Together</h3>
              <p className="fs-18 fw-500 pe-4">
                At WeShare, we envision a world where every rooftop becomes a source of clean power and shared prosperity.
              </p>
              <p className="fs-18 fw-500">
                Through innovation, collaboration, and conscious investment, we're driving the transition toward a sustainable energy future that benefits both people and the planet.
              </p>
              <ul className="checkmark-list bg-white">
                <li>Democratizing access to clean energy investments</li>
                <li>Delivering measurable returns with real-world impact</li>
                <li>Reducing carbon footprints through solar adoption</li>
              </ul>
              <button className="btn btn-primary-custom mt-3">
                Visit Exchange Hub 
                <Image className="ms-2" src="/images/icons/right-white.svg" alt="arrow" width={20} height={20} />
              </button>
            </div>
          </div>
          <div className="col-lg-6" data-aos="fade-left">
            <div className="mission-card text-end">
              <h2 className="section-title mb-2">Our Vision</h2>
              <h3 className="section-subtitle mb-0 fs-34">Transforming Energy.</h3>
              <h3 className="section-subtitle mb-4 fs-34">Empowering Lives.</h3>
              <p className="fs-18 fw-500 mb-3">
                At WeShare, our vision is to reshape the energy future through solar innovation and shared opportunity — creating a world where every rooftop powers prosperity and every investment drives sustainability.
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
