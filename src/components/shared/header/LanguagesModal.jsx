'use client'
import React, { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

const LanguagesModal = () => {
  const { currentLanguageInfo, languages, changeLanguage, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null); // added hover state
  const wrapperRef = useRef(null);

  const handleToggle = (e) => {
    e && e.preventDefault();
    setOpen(prev => !prev);
  };

  const handleLanguageChange = (e, languageCode) => {
    e && e.preventDefault();
    changeLanguage(languageCode);
    setOpen(false);
    setHovered(null);
  };

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setHovered(null);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  return (
    <div className="dropdown nxl-h-item nxl-header-language d-flex" ref={wrapperRef}>
      <button
        type="button"
        className="nxl-head-link me-0 nxl-language-link"
        onClick={handleToggle}
        aria-expanded={open}
        style={{ borderRadius: 0, border: 'none', background: 'transparent' }}
      >
        <img src={currentLanguageInfo.flag} alt={currentLanguageInfo.name} className="img-fluid wd-20" />
      </button>

      <div className={`dropdown-menu dropdown-menu-end nxl-h-dropdown nxl-language-dropdown ${open ? 'show' : ''}`}>
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
                const active = currentLanguageInfo.code === language.code;
                const isHovered = hovered === language.code;
                return (
                  <div key={language.code} className="col-sm-6 col-12 language_select mb-2">
                    <button
                      type="button"
                      className={`d-flex align-items-center w-100 gap-2 p-2 rounded ${active ? 'bg-primary text-white' : isHovered ? 'bg-light text-dark' : 'text-dark'}`}
                      style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
                      onClick={(e) => handleLanguageChange(e, language.code)}
                      onMouseEnter={() => setHovered(language.code)}
                      onMouseLeave={() => setHovered(null)}
                      onTouchStart={() => setHovered(language.code)}
                      onTouchEnd={() => setHovered(null)}
                    >
                      <div className="avatar-image avatar-sm">
                        <img src={language.flag} alt={language.name} className="img-fluid" />
                      </div>
                      <span>{language.name}</span>
                    </button>
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