"use client";

import React, { useEffect } from "react";
import HomeNavbar from "@/components/home/HomeNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import NewsSection from "@/components/news/section/NewsSection";
import NewsHeroSection from "@/components/news/section/NewsHeroSection";
import NewsLetterSection from "@/components/news/section/NewsLetterSection";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/components/news/styles/news.css";
import "@/styles/css/home.css";
import "@/styles/css/responsive.css";
import DynamicTitle from "@/components/common/DynamicTitle";

const NewsPage = () => {
  useEffect(() => {
    // Dynamically import Bootstrap JS only on client side
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return (
    <>
      <DynamicTitle titleKey="news.news" />

      {/* Navbar */}
      <HomeNavbar />

      {/* Hero Section */}
      <NewsHeroSection />

      {/* News Section */}
      <NewsSection />

      {/* Newsletter Section */}
      <NewsLetterSection />

      {/* Footer */}
      <HomeFooter />
    </>
  );
};

export default NewsPage;
