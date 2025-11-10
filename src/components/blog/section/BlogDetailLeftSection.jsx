'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faAnglesLeft, faAnglesRight } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/contexts/LanguageContext';

const BlogDetailLeftSection = ({ blog, previousBlog, nextBlog }) => {
  const { lang } = useLanguage();

  if (!blog) {
    return (
      <div className="col-md-8">
        <p>Loading...</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Parse HTML description if it exists
  const createMarkup = (html) => {
    return { __html: html || '' };
  };

  return (
    <div className="col-md-8">
      <h2 className="article-title mb-3">{blog.blog_title}</h2>
      <span className="date post-date d-block mb-3">
        <FontAwesomeIcon icon={faCalendar} className="me-2" />
        {formatDate(blog.blog_date)}
      </span>

      {blog.blog_image && (
        <Image
          src={blog.blog_image}
          alt={blog.blog_title || 'Blog Image'}
          className="img-fluid rounded mb-4 article-feature-img"
          width={800}
          height={400}
          style={{ objectFit: 'cover' }}
        />
      )}

      <div className="article-section">
        <div dangerouslySetInnerHTML={createMarkup(blog.blog_description)} />
      </div>

      <div className="d-flex justify-content-between align-items-center mt-4">
        {previousBlog ? (
          <Link
            href={`/blogDetail/${previousBlog.blog_slug}`}
            className="text-decoration-none text-dark next-pre-btn"
          >
            <FontAwesomeIcon icon={faAnglesLeft} className="me-2" />
            Previous
          </Link>
        ) : (
          <span className="text-muted next-pre-btn">
            <FontAwesomeIcon icon={faAnglesLeft} className="me-2" />
            {lang("news.previous")}
          </span>
        )}
        {nextBlog ? (
          <Link
            href={`/blogDetail/${nextBlog.blog_slug}`}
            className="text-decoration-none text-dark next-pre-btn"
          >
            {lang("news.next")}
            <FontAwesomeIcon icon={faAnglesRight} className="ms-2" />
          </Link>
        ) : (
          <span className="text-muted next-pre-btn">
            {lang("news.next")}
            <FontAwesomeIcon icon={faAnglesRight} className="ms-2" />
          </span>
        )}
      </div>
    </div>
  );
};

export default BlogDetailLeftSection;
