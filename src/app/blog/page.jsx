"use client";

import React from "react";
import HomeNavbar from "@/components/home/HomeNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import BlogsHeroSection from "@/components/blog/section/BlogHeroSection";
import BlogSection from "@/components/blog/section/BlogSection";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@/components/news/styles/news.css";
import "@/styles/css/home.css";
import "@/styles/css/responsive.css";

const NewsPage = () => {
  return (
    <>
      {/* Navbar */}
      <HomeNavbar />

      {/* Hero Section */}
      <BlogsHeroSection />

      {/* Blog Section */}
      <BlogSection />

      {/* Footer */}
      <HomeFooter />
    </>
  );
};

export default NewsPage;
