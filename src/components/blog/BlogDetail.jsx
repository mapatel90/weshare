'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiGet } from '@/lib/api';
import BlogDetailHeroSection from './section/BlogDetailHeroSection';
import BlogDetailLeftSection from './section/BlogDetailLeftSection';
import BlogDetailRightSection from './section/BlogDetailRightSection';
import '@/components/news/styles/newsDetails.css';

const BlogDetail = ({ blogSlug }) => {
  const [blog, setBlog] = useState(null);
  const [allBlogs, setAllBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBlogDetail = useCallback(async () => {
    if (!blogSlug) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch the specific blog item by slug
      const blogResponse = await apiGet(`/api/blog/${blogSlug}`, {
        showLoader: false,
        includeAuth: false,
      });

      if (blogResponse.success && blogResponse.data) {
        setBlog(blogResponse.data);
      } else {
        setError('Blog not found');
      }
    } catch (err) {
      setError(err.message || 'Error fetching blog details');
      console.error('Error fetching blog details:', err);
    } finally {
      setLoading(false);
    }
  }, [blogSlug]);

  const fetchAllBlogs = useCallback(async () => {
    try {
      const response = await apiGet('/api/blog/', {
        showLoader: false,
        includeAuth: false,
      });

      if (response.success && Array.isArray(response.data)) {
        setAllBlogs(response.data);
      }
    } catch (err) {
      console.error('Error fetching all blogs:', err);
    }
  }, []);

  useEffect(() => {
    fetchBlogDetail();
    fetchAllBlogs();
  }, [fetchBlogDetail, fetchAllBlogs]);

  // Find previous and next blog
  const currentIndex = allBlogs.findIndex((n) => n.blog_slug === blogSlug);
  const previousBlog = currentIndex > 0 ? allBlogs[currentIndex - 1] : null;
  const nextBlog =
    currentIndex >= 0 && currentIndex < allBlogs.length - 1
      ? allBlogs[currentIndex + 1]
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

  if (error || !blog) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <p>{error || 'blog not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <BlogDetailHeroSection />

      {/* Main Content */}
      <div className="container py-5">
        <div className="row article-row g-4">
          {/* Main Article */}
          <BlogDetailLeftSection
            blog={blog}
            previousBlog={previousBlog}
            nextBlog={nextBlog}
          />

          {/* Related Posts Sidebar */}
          <BlogDetailRightSection
            relatedBlogs={allBlogs}
            currentBlogSlug={blogSlug}
          />
        </div>
      </div>
    </>
  );
};

export default BlogDetail;

