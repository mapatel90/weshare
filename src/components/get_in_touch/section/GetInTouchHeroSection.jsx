import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function GetInTouchHeroSection() {
    const { lang } = useLanguage();

    return (
        <section className="hero banner-sec d-flex align-items-center" style={{ backgroundImage: "url('images/contact_us/Contact-banner.jpg')" }}>
            <div className="container">
                <div className="title-info col-md-4">
                    <h1 className="hero-title">
                        <span className="yellow-txt" style={{ color: "#F6A623" }}>{lang("contactUs.contact")}</span>{" "}
                        <span style={{ color: "#fff" }}>{lang("contactUs.us")}</span>
                    </h1>
                    <p className="banner-text" style={{ color: "#fff" }}>{lang("getinTouch.message2")}</p>
                </div>
            </div>
        </section>
    );
}