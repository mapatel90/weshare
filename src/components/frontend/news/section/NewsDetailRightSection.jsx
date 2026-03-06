'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { buildUploadUrl } from '@/utils/common';

const getYoutubeVideoId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return match ? match[1] : null;
};

const NewsDetailRightSection = ({ relatedNews, currentNewsSlug }) => {
  const { lang } = useLanguage();

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredRelatedNews = React.useMemo(
    () => relatedNews?.filter((news) => news.slug !== currentNewsSlug) || [],
    [relatedNews, currentNewsSlug]
  );

  return (
    <div className="col-md-4">
      <div className="related-posts">
        <h3 className="fw-bold mb-3 related-title">{lang("news.relatedPosts")}</h3>

        {filteredRelatedNews.length > 0 ? (
          filteredRelatedNews.slice(0, 4).map((news, index) => (
            <Link
              key={news.id || index}
              href={`/frontend/newsDetail/${news.slug}`}
              className="text-decoration-none"
            >
              <div
                className="related-post d-flex p-2 mb-3"
                data-aos="fade-up"
                data-aos-duration="1000"
                data-aos-delay={index * 100}
              >
                {(() => {
                  const videoId = getYoutubeVideoId(news?.url);
                  if (videoId) {
                    return (
                      <div className="rounded me-3 position-relative flex-shrink-0" style={{ width: 80, height: 80, overflow: 'hidden' }}>
                        <img
                          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                          alt={news.title || 'Related News'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
                          <svg width="28" height="20" viewBox="0 0 68 48" fill="none">
                            <rect width="68" height="48" rx="12" fill="#FF0000" fillOpacity="0.9" />
                            <polygon points="27,14 27,34 47,24" fill="white" />
                          </svg>
                        </div>
                      </div>
                    );
                  }
                  if (news?.image) {
                    return (
                      <Image
                        src={buildUploadUrl(news?.image)}
                        alt={news.title || 'Related News'}
                        className="rounded me-3 flex-shrink-0"
                        width={80}
                        height={80}
                        style={{ objectFit: 'cover' }}
                      />
                    );
                  }
                  return null;
                })()}
                <div>
                  <h4 className="fw-semibold mb-1 title">{news.title}</h4>
                  <p className="post-date mb-0">
                    <FontAwesomeIcon icon={faCalendar} className="me-1" />
                    {formatDate(news.date)}
                  </p>
                  <p className="post-excerpt text-muted mb-0 mt-2">
                    {news.title}
                  </p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-muted">{lang("news.noRelatedPosts")}</p>
        )}
      </div>
    </div>
  );
};

export default NewsDetailRightSection;
