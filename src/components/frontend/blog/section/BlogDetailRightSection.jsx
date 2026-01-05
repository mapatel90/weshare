'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { getFullImageUrl } from '@/utils/common';

const BlogDetailRightSection = ({ relatedBlogs, currentBlogSlug }) => {
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

  // Filter out current blog from related posts
  const filteredRelatedBlogs = React.useMemo(() => {
    const filtered = relatedBlogs?.filter(
      (blog) => blog.slug !== currentBlogSlug
    ) || [];
    
    return filtered;
  }, [relatedBlogs, currentBlogSlug]);

  return (
    <div className="col-md-4 related-posts h-100">
      <h3 className="fw-bold mb-3 related-title">{lang("news.relatedPosts")}</h3>

      {filteredRelatedBlogs.length > 0 ? (
        filteredRelatedBlogs.slice(0, 4).map((blog, index) => (
          <Link
            key={blog.id || index}
            href={`/frontend/blogDetail/${blog.slug}`}
            className="text-decoration-none"
          >
            <div
              className="related-post d-flex p-2 mb-3"
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-delay={index * 100}
            >
              {blog?.image && (
                <Image
                  src={getFullImageUrl(blog?.image)}
                  alt={blog.title || 'Related Blog'}
                  className="rounded me-3"
                  width={80}
                  height={80}
                  style={{ objectFit: 'cover' }}
                />
              )}
              <div>
                <h4 className="fw-semibold mb-1 title">{blog.title}</h4>
                <p className="post-date mb-0"> 
                  <FontAwesomeIcon icon={faCalendar} className="me-1" />
                  {formatDate(blog.date)}
                </p>
                <p className="post-excerpt text-muted mb-0 mt-2">
                  {blog.title}
                </p>
              </div>
            </div>
          </Link>
        ))
      ) : (
        <p className="text-muted">{lang("news.noRelatedPosts")}</p>
      )}
    </div>
  );
};

export default BlogDetailRightSection;
