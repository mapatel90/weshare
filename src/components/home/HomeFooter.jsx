'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

const HomeFooter = () => {
  const { lang } = useLanguage()
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="row gy-4">
          {/* Company Info */}
          <div className="col-lg-4 col-md-12">
            <div className="footer-logo mb-3">
              <Image 
                src="/images/logo/Logo-White.svg" 
                alt="WeShare Logo" 
                width={150} 
                height={50} 
                className="mb-2" 
              />
            </div>
            <p className="text-white fw-300 fs-18 mb-4">
              {lang('home.footer.tagline')}
              <br />
              {lang('home.footer.description')}
            </p>
            <div className="social-icons d-flex gap-4">
              <Link href="#">
                <Image src="/images/icons/twitter.svg" alt="Twitter" width={24} height={24} />
              </Link>
              <Link href="#">
                <Image src="/images/icons/linkedin.svg" alt="LinkedIn" width={24} height={24} />
              </Link>
              <Link href="#">
                <Image src="/images/icons/cat.svg" alt="Social" width={24} height={24} />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-4 col-md-6">
            <div className="linkBox">
              <h6 className="fs-24 text-secondary-color fw-600 mb-40">{lang('home.footer.quickLinks')}</h6>
              <ul className="list-unstyled text-white quickLinks">
                <li><Link href="#">{lang('home.footer.home')}</Link></li>
                <li><Link href="#">{lang('home.footer.aboutUs')}</Link></li>
                <li><Link href="#">{lang('home.footer.exchangeHub')}</Link></li>
                <li><Link href="#">{lang('home.footer.howItWorks')}</Link></li>
                <li><Link href="#">{lang('home.footer.news')}</Link></li>
              </ul>
            </div>
          </div>

          {/* Contact & Settings */}
          <div className="col-md-6 col-lg-3">
            <div className="contactBox">
              <h6 className="fs-24 text-secondary-color fw-600 mb-40">{lang('home.footer.contactSettings')}</h6>
              <ul className="list-unstyled text-white-50 small mb-4">
                <li className="mb-4 fs-18 fw-300 text-white">
                  <span className="me-3">
                    <Image src="/images/icons/email.svg" alt="email" width={20} height={20} />
                  </span>
                  support@wechain.solar
                </li>
                <li className="mb-4 fs-18 fw-300 text-white">
                  <span className="me-3">
                    <Image src="/images/icons/phone-w.svg" alt="phone" width={20} height={20} />
                  </span>
                  +1 (555) 123-4567
                </li>
                <li className="fs-18 fw-300 text-white">
                  <span className="me-3">
                    <Image src="/images/icons/location-w.svg" alt="location" width={20} height={20} />
                  </span>
                  Austin, TX, USA
                </li>
              </ul>

              <div className="footer-dropdown mb-3">
                <label className="fs-18 fw-300 text-secondary-color d-block mb-1">{lang('home.footer.language')}</label>
                <select 
                  className="form-select form-select-sm" 
                  style={{
                    color: '#fff', 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                >
                  <option value="en" style={{color: '#000', backgroundColor: '#fff'}}>English</option>
                  <option value="es" style={{color: '#000', backgroundColor: '#fff'}}>Spanish</option>
                </select>
              </div>

              <div className="footer-dropdown">
                <label className="fs-18 fw-300 text-secondary-color d-block mb-1">{lang('home.footer.country')}</label>
                <select 
                  className="form-select form-select-sm" 
                  style={{
                    color: '#fff', 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                >
                  <option value="US" style={{color: '#000', backgroundColor: '#fff'}}>US United States</option>
                  <option value="CA" style={{color: '#000', backgroundColor: '#fff'}}>CA Canada</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <hr />

        <div className="copyRightSection d-flex flex-sm-column flex-md-row gap-sm-3 gap-5 align-items-center">
          <p className="mb-2 mb-md-0 fs-18 fw-500 text-white">{lang('home.footer.copyright')}</p>
          <div className="footer-links d-flex gap-3">
            <Link href="#">{lang('home.footer.privacyPolicy')}</Link>
            <Link href="#">{lang('home.footer.termsOfService')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default HomeFooter
