import React from 'react';

const NewsHeroSection = () => {
  return (
    <section
      className="hero banner-sec news-banner d-flex align-items-center"
      style={{ backgroundImage: "url('/images/news/banner.jpg')" }}
    >
      <div className="container">
        <div className="title-info">
          <h1 className="news-title hero-title">
            <span className="yellow-txt" style={{ color: '#F6A623' }}>Latest News</span>{' '}
            <span style={{ color: '#fff' }}>& Insights</span>
          </h1>
          <p className="hero-text" style={{ color: '#fff' }}>
            Stay informed with the latest updates, project highlights, and industry insights shaping the future of clean energy.
          </p>
        </div>
      </div>
    </section>
  );
};

export default NewsHeroSection;