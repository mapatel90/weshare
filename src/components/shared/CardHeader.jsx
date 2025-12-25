"use client";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import React, { useState } from "react";

const CardHeader = ({ title, viewHref }) => {
  const [hover, setHover] = useState(false);
  const { lang } = useLanguage();

  return (
    <div className="card-header d-flex align-items-center justify-content-between mb-0">
      <h5 className="card-title mb-0">{title}</h5>
      {viewHref && (
        <Link
          href={viewHref}
          className="text-decoration-none"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#1d4ed8",
              // backgroundColor: hover ? "#bfdbfe" : "#dbeafe",
              // padding: "6px 12px",
              // borderRadius: "9999px",
              // boxShadow: hover ? "0 2px 12px rgba(59, 130, 246, 0.25)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {lang('common.viewAll', 'View All')}
          </div>
        </Link>
      )}
    </div>
  );
};

export default CardHeader;
