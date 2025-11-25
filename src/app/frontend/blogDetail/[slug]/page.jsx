"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import HomeNavbar from "@/components/frontend/home/HomeNavbar";
import HomeFooter from "@/components/frontend/home/HomeFooter";
import BlogDetail from "@/components/frontend/blog/BlogDetail";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/components/frontend/news/styles/news.css";
import "@/styles/css/home.css";
import "@/styles/css/responsive.css";

const BlogDetailPage = () => {
  const params = useParams();
  const slug = params?.slug;

  // Debug: Log params to console
//   useEffect(() => {
//     console.log('NewsDetailPage - params:', params);
//     console.log('NewsDetailPage - slug:', slug);
//   }, [params, slug]);

  if (!slug) {
    return (
      <>
        <HomeNavbar />
        <div className="container py-5">
          <div className="text-center">
            <p>Loading...</p>
          </div>
        </div>
        <HomeFooter />
      </>
    );
  }

  return (
    <>
      {/* Navbar */}
      <HomeNavbar />

      {/* Blog Detail Content */}
      <BlogDetail blogSlug={slug} />

      {/* Footer */}
      <HomeFooter />
    </>
  );
};

export default BlogDetailPage;

