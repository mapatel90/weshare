'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiGet } from '@/lib/api';
import NewsDetailHeroSection from './section/NewsDetailHeroSection';
import NewsDetailLeftSection from './section/NewsDetailLeftSection';
import NewsDetailRightSection from './section/NewsDetailRightSection';
import '@/components/news/styles/newsDetails.css';

const NewsDetail = ({ newsSlug }) => {
  const [news, setNews] = useState(null);
  const [allNews, setAllNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNewsDetail = useCallback(async () => {
    if (!newsSlug) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch the specific news item by slug
      const newsResponse = await apiGet(`/api/news/${newsSlug}`, {
        showLoader: false,
        includeAuth: false,
      });

      if (newsResponse.success && newsResponse.data) {
        setNews(newsResponse.data);
      } else {
        setError('News not found');
      }
    } catch (err) {
      setError(err.message || 'Error fetching news details');
      console.error('Error fetching news details:', err);
    } finally {
      setLoading(false);
    }
  }, [newsSlug]);

  const fetchAllNews = useCallback(async () => {
    try {
      const response = await apiGet('/api/news/', {
        showLoader: false,
        includeAuth: false,
      });

      if (response.success && Array.isArray(response.data)) {
        setAllNews(response.data);
      }
    } catch (err) {
      console.error('Error fetching all news:', err);
    }
  }, []);

  useEffect(() => {
    fetchNewsDetail();
    fetchAllNews();
  }, [fetchNewsDetail, fetchAllNews]);

  // Find previous and next news
  const currentIndex = allNews.findIndex((n) => n.news_slug === newsSlug);
  const previousNews = currentIndex > 0 ? allNews[currentIndex - 1] : null;
  const nextNews =
    currentIndex >= 0 && currentIndex < allNews.length - 1
      ? allNews[currentIndex + 1]
      : null;

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <p>{error || 'News not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <NewsDetailHeroSection />

      {/* Main Content */}
      <div className="container py-5">
        <div className="row article-row g-4">
          {/* Main Article */}
          <NewsDetailLeftSection
            news={news}
            previousNews={previousNews}
            nextNews={nextNews}
          />

          {/* Related Posts Sidebar */}
          <NewsDetailRightSection
            relatedNews={allNews}
            currentNewsSlug={newsSlug}
          />
        </div>
      </div>
    </>
  );
};

export default NewsDetail;

