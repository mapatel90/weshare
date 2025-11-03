'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import AOS from 'aos'
import { useLanguage } from '@/contexts/LanguageContext'

const HowItWorksSection = () => {
  const [activeTab, setActiveTab] = useState('investor')
  const { lang } = useLanguage()

  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  const steps = {
    investor: [
      {
        number: 1,
        icon: '/images/icons/Illustration1.svg',
        title: lang('home.howItWorks.investor.step1Title'),
        points: [
          lang('home.howItWorks.investor.step1Point1'),
          lang('home.howItWorks.investor.step1Point2')
        ]
      },
      {
        number: 2,
        icon: '/images/icons/Illustration2.svg',
        title: lang('home.howItWorks.investor.step2Title'),
        points: [
          lang('home.howItWorks.investor.step2Point1'),
          lang('home.howItWorks.investor.step2Point2')
        ]
      },
      {
        number: 3,
        icon: '/images/icons/Illustration3.svg',
        title: lang('home.howItWorks.investor.step3Title'),
        points: [
          lang('home.howItWorks.investor.step3Point1')
        ]
      }
    ],
    offtaker: [
      {
        number: 1,
        icon: '/images/icons/Illustration1.svg',
        title: lang('home.howItWorks.offtaker.step1Title'),
        points: [
          lang('home.howItWorks.offtaker.step1Point1'),
          lang('home.howItWorks.offtaker.step1Point2')
        ]
      },
      {
        number: 2,
        icon: '/images/icons/Illustration2.svg',
        title: lang('home.howItWorks.offtaker.step2Title'),
        points: [
          lang('home.howItWorks.offtaker.step2Point1'),
          lang('home.howItWorks.offtaker.step2Point2')
        ]
      },
      {
        number: 3,
        icon: '/images/icons/Illustration3.svg',
        title: lang('home.howItWorks.offtaker.step3Title'),
        points: [
          lang('home.howItWorks.offtaker.step3Point1')
        ]
      }
    ]
  }

  return (
    <section className="how-to-work tabing">
      <div className="container">
        <div className="headerSection" data-aos="fade-up">
          <h2>{lang('home.howItWorks.title')} <span>{lang('home.howItWorks.titleSpan')}</span></h2>
          <p>{lang('home.howItWorks.subtitle')}</p>
        </div>

        <div className="text-center" data-aos="fade-up" data-aos-duration="1200">
          <ul className="nav nav-tabs howToWorkTab" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'investor' ? 'active' : ''}`}
                onClick={() => setActiveTab('investor')}
                type="button"
              >
                <span className="circle"></span> {lang('home.howItWorks.investorTab')}
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'offtaker' ? 'active' : ''}`}
                onClick={() => setActiveTab('offtaker')}
                type="button"
              >
                <span className="circle"></span> {lang('home.howItWorks.offtakerTab')}
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
