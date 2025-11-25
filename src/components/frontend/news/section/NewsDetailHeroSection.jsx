'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const NewsDetailHeroSection = () => {
  const { lang } = useLanguage();

  return (
    <section
      className="hero banner-sec news-banner d-flex align-items-center"
      style={{ backgroundImage: "url('/images/news/banner.jpg')" }}
    >
      <div className="container">
        <div className="title-info">
          <h1 className="news-title hero-title">
            <span className="yellow-txt" style={{ color: '#F6A623' }}>{lang("news.news")}</span>{' '}
            <span style={{ color: '#fff' }}>{lang("news.details")}</span>
          </h1>
        </div>
      </div>
    </section>
  );
};

export default NewsDetailHeroSection;
