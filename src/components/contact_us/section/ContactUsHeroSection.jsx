"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const ContactUsHeroSection = () => {

  const { lang } = useLanguage();

  return (
    <section className="hero banner-sec d-flex align-items-center" style={{ backgroundImage: "url(images/contact_us/Contact-banner.jpg)" }}>
      <div className="container">
        <div className="title-info">
          <h1 className="hero-title">
            <span className="yellow-txt" style={{ color: "#F6A623" }}>
              {lang("contactUs.contact")}
            </span>{" "}
            <span style={{ color: "#fff" }}>{lang("contactUs.us")}</span>
          </h1>
        </div>
      </div>
    </section>
  );
};

export default ContactUsHeroSection;