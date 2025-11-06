import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const NewsHeroSection = () => {
  const { lang } = useLanguage(); // ✅ destructure lang correctly

  return (
    <section
      className="hero banner-sec news-banner d-flex align-items-center"
      style={{ backgroundImage: "url('/images/news/banner.jpg')" }}
    >
      <div className="container">
        <div className="title-info">
          <h1 className="news-title hero-title">
            <span className="yellow-txt" style={{ color: '#F6A623' }}>
              {lang('news.latestNews')}
            </span>{' '}
            <span style={{ color: '#fff' }}>
              {lang('news.insights')}
            </span>
          </h1>
          <p className="hero-text" style={{ color: '#fff' }}>
            {lang('news.stayInformed')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default NewsHeroSection;