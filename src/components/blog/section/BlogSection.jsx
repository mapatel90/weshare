'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";
import { apiGet } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/contexts/LanguageContext";

const BlogSection = () => {
  const { lang } = useLanguage();

  useEffect(() => {
    AOS.init({ duration: 1000 });
    fetchBlog();
  }, []);

  const [blogData, setBlogData] = useState([]);
   const [visibleCount, setVisibleCount] = useState(3);

 const fetchBlog = async () => {
    try {
      // ✅ apiGet already returns JSON
      const result = await apiGet("/api/blog/");

      console.log("Fetched blog data:", result);

      if (result.success && Array.isArray(result.data)) {
        setBlogData(result.data);
      } else {
        console.error("Invalid data format from API:", result);
      }
    } catch (error) {
      console.error("Error fetching blog:", error);
    }
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 3);
  };
  
  
  return (
    <section className="news-section py-5">
      <div className="container">
        <div className="row g-4">
          {Array.isArray(blogData) && blogData.length > 0 ? (
            blogData.slice(0, visibleCount).map((blog, index) => (
              <div
                key={blog.id || index}
                className="col-md-6 col-lg-4 news-card"
                data-aos="fade-up"
                data-aos-delay={index * 150}
              >
                <div className="card h-100 border-0 shadow-0">
                  <img
                    src={blog.blog_image || "https://via.placeholder.com/400x250"}
                    className="card-img-top"
                    alt={blog.title || "Blog Image"}
                  />
                  <div className="card-body news-info">
                    <span className="date d-block mb-3">
                      <FontAwesomeIcon icon={faCalendar} className="me-1" />
                      {new Date(blog.blog_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <h5 className="card-title news-title mb-3">{blog.blog_title}</h5>
                    <Link
                      href={`/blogDetail/${blog.blog_slug}`}
                      className="btn btn-outline-dark readMore px-4 py-2 fw-semibold"
                    >
                      {lang("news.readMore")}{" "}
                      <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center">No Blog available.</p>
          )}
        </div>

        {/* ✅ Load More button (only show if more news exist) */}
        {blogData.length > 3 && visibleCount < blogData.length && (
          <div className="text-center mt-5">
            <button
              onClick={handleLoadMore}
              className="btn load-more-btn btn-primary-custom d-inline-flex justify-content-center align-items-center"
            >
              {lang("news.loadMore")}
              <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogSection;
