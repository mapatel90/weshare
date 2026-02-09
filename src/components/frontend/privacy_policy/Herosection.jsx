"use client";
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PrivacyPolicyHeroSection() {
    const { lang } = useLanguage();

    return (
        <section className="hero banner-sec news-banner d-flex align-items-center" style={{ backgroundImage: "url('/images/news/banner.jpg')" }}>
            <div className="container">
                <div className="title-info col-md-4">
                    <h1 className="news-title hero-title">
                        <span className="yellow-txt" style={{ color: "#F6A623" }}>{lang("privacyPolicy.privacy")}</span>{" "}
                        <span style={{ color: "#fff" }}>{lang("privacyPolicy.policy")}</span>
                    </h1>
                    <p className="hero-text" style={{ color: "#fff" }}>{lang("privacyPolicy.message2")}</p>
                </div>
            </div>
        </section>
    );
}