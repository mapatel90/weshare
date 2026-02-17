"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import React from "react";

const TermsOfServiceSection = () => {
  const { currentLanguage } = useLanguage();

  const title =
    currentLanguage === "vi" ? "Đang phát triển" : "Coming Soon";

  const subtitle =
    currentLanguage === "vi"
      ? "Chúng tôi đang làm việc để mang đến trải nghiệm tốt nhất cho bạn."
      : "We’re working hard to bring you something amazing.";

  return (
    <section className="privacy-policy-section py-5 coming-soon-wrapper">
      <div className="container text-center">
        {/* Icon */}
        <div className="icon-wrapper mb-4">
          🚀
        </div>

        {/* Title */}
        <h2 className="title-text gradient-text mb-3">
          {title}
        </h2>

        {/* Subtitle */}
        {/* <p className="coming-soon-subtitle">
          {subtitle}
        </p> */}
      </div>

      {/* Styles */}
      <style jsx>{`
        .coming-soon-wrapper {
          min-height: 20vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-wrapper {
          font-size: 64px;
          animation: float 3s ease-in-out infinite;
        }

        .gradient-text {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(90deg, #ffb72e, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientMove 4s ease infinite;
        }

        .coming-soon-subtitle {
          font-size: 1.1rem;
          color: #6b7280;
          max-width: 500px;
          margin: 0 auto;
        }

        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </section>
  );
};

export default TermsOfServiceSection;
