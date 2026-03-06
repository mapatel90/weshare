'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import "aos/dist/aos.css";
import { apiGet } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildUploadUrl, getFullImageUrl } from "@/utils/common";

const getYoutubeVideoId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return match ? match[1] : null;
};

const BlogSection = () => {
  const { lang } = useLanguage();

  useEffect(() => {
    // Dynamically import AOS only on client side
    import('aos').then((AOS) => {
      AOS.init({ duration: 1000 });
    });
    fetchBlog();
  }, []);

  const [blogData, setBlogData] = useState([]);
   const [visibleCount, setVisibleCount] = useState(3);

 const fetchBlog = async () => {
    try {
      // ✅ apiGet already returns JSON
      const result = await apiGet("/api/blog/");

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
                <div className="card h-100 border-0 shadow-0 position-relative">
                  {(() => {
                    const videoId = getYoutubeVideoId(blog.url);
                    const src = videoId
                      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                      : buildUploadUrl(blog?.image);
                    return (
                      <>
                        <img
                          src={src}
                          className="card-img-top"
                          alt={blog.title || "Blog Image"}
                        />
                        {videoId && (
                          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 255, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.22)", pointerEvents: "none", zIndex: 1 }}>
                            <svg width="56" height="40" viewBox="0 0 68 48" fill="none">
                              <rect width="68" height="48" rx="12" fill="#FF0000" fillOpacity="0.9" />
                              <polygon points="27,14 27,34 47,24" fill="white" />
                            </svg>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <div className="card-body news-info">
                    <span className="date d-block mb-3">
                      <FontAwesomeIcon icon={faCalendar} className="me-1" />
                      {new Date(blog.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <h5 className="card-title news-title mb-3">{blog.title}</h5>
                    <Link
                      href={`/frontend/blogDetail/${blog.slug}`}
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
            <p className="text-center">{lang("news.noBlogAvailable")}</p>
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
