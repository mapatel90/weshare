"use client";
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TermsOfServiceHeroSection() {
    const { lang } = useLanguage();

    return (
        <section className="hero banner-sec news-banner d-flex align-items-center" style={{ fontSize: "14px", backgroundImage: "url('/images/news/banner.jpg')" }}>
            <div className="container">
                <div className="title-info col-md-4">
                    <h1 className="news-title hero-title">
                        <span className="yellow-txt" style={{ color: "#F6A623" }}>{lang("termsOfService.terms")}</span>{" "}
                        <span style={{ color: "#fff" }}>{lang("termsOfService.service")}</span>
                    </h1>
                    <p className="hero-text" style={{ color: "#fff" }}>{lang("termsOfService.message2")}</p>
                </div>
            </div>
        </section>
    );
}