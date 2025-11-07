"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import HomeNavbar from "@/components/home/HomeNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import NewsDetail from "@/components/news/NewsDetail";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/components/news/styles/news.css";
import "@/styles/css/home.css";
import "@/styles/css/responsive.css";

const NewsDetailPage = () => {
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

      {/* News Detail Content */}
      <NewsDetail newsSlug={slug} />

      {/* Footer */}
      <HomeFooter />
    </>
  );
};

export default NewsDetailPage;

