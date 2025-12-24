"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import HomeNavbar from "@/components/frontend/home/HomeNavbar";
import HomeFooter from "@/components/frontend/home/HomeFooter";
import NewsDetail from "@/components/frontend/news/NewsDetail";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/components/frontend/news/styles/news.css";
import "@/styles/css/home.css";
import "@/styles/css/responsive.css";
import DynamicTitle from "@/components/common/DynamicTitle";

const NewsDetailPage = () => {
  const params = useParams();
  const slug = params?.slug;

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

      <DynamicTitle titleKey="newsDetail.title" />

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

