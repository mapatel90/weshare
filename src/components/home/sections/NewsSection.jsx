'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import AOS from 'aos'
import { useLanguage } from '@/contexts/LanguageContext'

const NewsSection = () => {
  const { lang } = useLanguage()
  
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  const news = [
    {
      image: '/images/news/news1.png',
      date: 'Sep 19, 2024',
      title: lang('home.news.news1Title')
    },
    {
      image: '/images/news/news2.png',
      date: 'Sep 19, 2024',
      title: lang('home.news.news2Title')
    },
    {
      image: '/images/news/news3.png',
      date: 'Sep 19, 2024',
      title: lang('home.news.news3Title')
    }
  ]

  return (
    <section className="news-section section-bg-color">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center headSection" data-aos="fade-up">
          <div className="headerSection text-start">
            <h2>{lang('home.news.title')} <span>{lang('home.news.titleSpan')}</span></h2>
            <p className="fs-18 fw-500 mb-0">{lang('home.news.subtitle')}</p>
          </div>
          <button className="btn btn-primary-custom mt-3 bg-102C41 shadow-0">{lang('home.news.viewAll')} →</button>
        </div>
        <div className="row">
          {news.map((item, index) => (
            <div key={index} className="col-12 col-md-6 col-lg-4 mb-4 mb-lg-0" data-aos="fade-up" data-aos-duration={1000 + index * 200}>
              <div className="newsBox">
                <span>
                  <Image src={item.image} alt="news" className="img-thubnail" width={400} height={250} />
                </span>
                <div className="newsTextBox">
                  <div className="date">
                    <Image src="/images/icons/calender.svg" alt="calendar" width={16} height={16} />
                    {item.date}
                  </div>
                  <h4 className="tc-102C41 fw-600 fs-20 mb-3">{item.title}</h4>
                  <a href="#" className="readMore">{lang('home.news.readMore')} →</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default NewsSection
