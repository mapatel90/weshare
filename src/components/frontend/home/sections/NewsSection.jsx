"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AOS from "aos";
import { apiGet } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { getFullImageUrl } from "@/utils/common";

const NewsSection = () => {
  const { lang } = useLanguage();
  const [newsData, setNewsData] = useState([]);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const res = await apiGet("/api/news/");
      if (res && res.success && Array.isArray(res.data)) {
        setNewsData(res.data);
      } else {
        console.error("Invalid news response", res);
      }
    } catch (err) {
      console.error("Error fetching news", err);
    }
  };

  // fallback static items (same shape used in original component)
  const staticNews = [
    {
      image: "/images/news/news1.png",
      date: "Sep 19, 2024",
      title: lang("home.news.news1Title"),
    },
    {
      image: "/images/news/news2.png",
      date: "Sep 19, 2024",
      title: lang("home.news.news2Title"),
    },
    {
      image: "/images/news/news3.png",
      date: "Sep 19, 2024",
      title: lang("home.news.news3Title"),
    },
  ];

  return (
    <section className="news-section section-bg-color">
      <div className="container">
        <div
          className="d-flex justify-content-between align-items-center headSection"
          data-aos="fade-up"
        >
          <div className="headerSection text-start">
            <h2>
              {lang("home.news.title")}{" "}
              <span>{lang("home.news.titleSpan")}</span>
            </h2>
            <p className="fs-18 fw-500 mb-0">{lang("home.news.subtitle")}</p>
          </div>
          <Link
            href="/frontend/news"
            className="btn btn-primary-custom bg-102C41 shadow-0 d-inline-flex align-items-center justify-content-center py-2 px-3"
          >
            {lang("home.news.viewAll")} →
          </Link>
        </div>
        <div className="row">
          {(Array.isArray(newsData) && newsData.length > 0
            ? newsData.slice(0, 3) // show only 3 dynamic items
            : staticNews
          ).map((item, index) => {
            const isDynamic = !!item.news_title;
            const key = isDynamic ? item.id || item.news_slug || index : index;
            return (
              <div
                key={key}
                className="col-12 col-md-6 col-lg-4 mb-4 mb-lg-0"
                data-aos="fade-up"
                data-aos-duration={1000 + index * 200}
              >
                <div className="newsBox">
                  <span style={{ height: '200px' }}>
                    {isDynamic ? (
                      // use normal img for external/dynamic urls to avoid next/image domain config issues
                      // adjust className if needed
                      <img
                        src={getFullImageUrl(item?.news_image)}
                        alt={item.news_title || "news"}
                        className="img-thubnail"
                        width={400}
                        height={250}
                        style={{ height: '200px' }}
                      />
                    ) : (
                      <Image
                        src={item?.image}
                        alt="news"
                        className="img-thubnail"
                        width={400}
                        height={250}
                      />
                    )}
                  </span>
                  <div className="newsTextBox">
                    <div className="date">
                      <Image
                        src="/images/icons/calender.svg"
                        alt="calendar"
                        width={16}
                        height={16}
                      />
                      {isDynamic
                        ? item.news_date
                          ? new Date(item.news_date).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                          : ""
                        : item.date}
                    </div>
                    <h4 className="tc-102C41 fw-600 fs-20 mb-3"
                      style={{
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        textOverflow: 'ellipsis',
                        minHeight: '25px',
                        lineHeight: '1.4'
                      }}>
                      {isDynamic ? item.news_title : item.title}
                    </h4>
                    {isDynamic ? (
                      <Link
                        href={`/frontend/newsDetail/${item.news_slug || ""}`}
                        className="readMore"
                      >
                        {lang("home.news.readMore")} →
                      </Link>
                    ) : (
                      <a href="#" className="readMore">
                        {lang("home.news.readMore")} →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
