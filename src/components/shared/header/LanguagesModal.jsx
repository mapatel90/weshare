'use client'
import React from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

const LanguagesModal = () => {
  const { currentLanguageInfo, languages, changeLanguage, lang } = useLanguage();

  const handleLanguageChange = (e, languageCode) => {
    e.preventDefault();
    changeLanguage(languageCode);
  };

  return (
    <div className="dropdown nxl-h-item nxl-header-language d-flex">
      <div className="nxl-head-link me-0 nxl-language-link" data-bs-toggle="dropdown" data-bs-auto-close="outside">
        <img src={currentLanguageInfo.flag} alt={currentLanguageInfo.name} className="img-fluid wd-20" />
      </div>
      <div className="dropdown-menu dropdown-menu-end nxl-h-dropdown nxl-language-dropdown">
        <div className="dropdown-divider mt-0"></div>
        <div className="language-items-wrapper">
          <div className="select-language px-4 py-2 hstack justify-content-between gap-4">
            <div className="lh-lg">
              <h6 className="mb-0">{lang('header.selectLanguage')}</h6>
              <p className="fs-11 text-muted mb-0">{Object.keys(languages).length} {lang('header.languagesAvailable')}</p>
            </div>
          </div>
          <div className="dropdown-divider"></div>
          <div className="row px-4 pt-3">
            {
              Object.values(languages).map((language) => {
                return (
                  <div key={language.code} className="col-sm-6 col-12 language_select mb-2">
                    <Link 
                      href="#" 
                      className={`d-flex align-items-center gap-2 p-2 rounded ${
                        currentLanguageInfo.code === language.code ? 'bg-primary text-white' : 'text-dark'
                      }`}
                      onClick={(e) => handleLanguageChange(e, language.code)}
                    >
                      <div className="avatar-image avatar-sm">
                        <img src={language.flag} alt={language.name} className="img-fluid" />
                      </div>
                      <span>{language.name}</span>
                    </Link>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default LanguagesModal