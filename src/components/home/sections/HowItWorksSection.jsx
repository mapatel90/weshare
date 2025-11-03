'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import AOS from 'aos'

const HowItWorksSection = () => {
  const [activeTab, setActiveTab] = useState('investor')

  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  const steps = {
    investor: [
      {
        number: 1,
        icon: '/images/icons/Illustration1.svg',
        title: 'Sign Up & Select a Project',
        points: [
          'Explore trusted projects on WeShare and invest in the one that matches your goals.',
          'Each comes with clear details on performance and reliability.'
        ]
      },
      {
        number: 2,
        icon: '/images/icons/Illustration2.svg',
        title: 'System Runs Automatically',
        points: [
          'We take care of installation, operation, and maintenance.',
          'You invest once and enjoy effortless ownership.'
        ]
      },
      {
        number: 3,
        icon: '/images/icons/Illustration3.svg',
        title: 'Earn & Track in Real Time',
        points: [
          'Track your earnings and project performance in real time through the WeShare Web App.'
        ]
      }
    ],
    offtaker: [
      {
        number: 1,
        icon: '/images/icons/Illustration1.svg',
        title: 'Apply for Solar Lease',
        points: [
          'Submit your property details and energy requirements.',
          'Get matched with the right solar solution for your needs.'
        ]
      },
      {
        number: 2,
        icon: '/images/icons/Illustration2.svg',
        title: 'Installation & Setup',
        points: [
          'Professional installation at no upfront cost.',
          'Start generating clean energy immediately.'
        ]
      },
      {
        number: 3,
        icon: '/images/icons/Illustration3.svg',
        title: 'Save & Monitor',
        points: [
          'Track your energy savings and environmental impact in real-time.'
        ]
      }
    ]
  }

  return (
    <section className="how-to-work tabing">
      <div className="container">
        <div className="headerSection" data-aos="fade-up">
          <h2>How <span>it works</span></h2>
          <p>Seamlessly connecting investors and offtakers for a greener tomorrow.</p>
        </div>

        <div className="text-center" data-aos="fade-up" data-aos-duration="1200">
          <ul className="nav nav-tabs howToWorkTab" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'investor' ? 'active' : ''}`}
                onClick={() => setActiveTab('investor')}
                type="button"
              >
                <span className="circle"></span> Investor
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'offtaker' ? 'active' : ''}`}
                onClick={() => setActiveTab('offtaker')}
                type="button"
              >
                <span className="circle"></span> Offtaker
              </button>
            </li>
          </ul>
        </div>

        <div className="tab-content vectorStyle" data-aos="fade-up" data-aos-duration="1200">
          <div className="row">
            {steps[activeTab].map((step, index) => (
              <div key={index} className="col-12 col-md-6 col-lg-4 mb-5 mb-lg-0">
                <a href="#" className={`cardBoxBlock ${index === 0 ? 'active' : ''}`}>
                  <div className="numberColumn">{step.number}</div>
                  <div className="cardBox">
                    <span className="vector-img">
                      <Image src={step.icon} alt="illustration" width={150} height={150} />
                    </span>
                    <div className="cardTitle">{step.title}</div>
                    <ul>
                      {step.points.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
