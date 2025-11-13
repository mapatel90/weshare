"use client";

import React, { useEffect } from "react";
import HomeNavbar from "@/components/home/HomeNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import BlogsHeroSection from "@/components/blog/section/BlogHeroSection";
import BlogSection from "@/components/blog/section/BlogSection";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/components/news/styles/news.css";
import "@/styles/css/home.css";
import "@/styles/css/responsive.css";
import DynamicTitle from "@/components/common/DynamicTitle";

const BlogPage = () => {
  useEffect(() => {
    // Dynamically import Bootstrap JS only on client side
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return (
    <>

      <DynamicTitle titleKey="blog.blog" />

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

export default BlogPage;
