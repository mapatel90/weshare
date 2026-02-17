"use client";

import React, { useEffect } from "react";
import HomeNavbar from "@/components/frontend/home/HomeNavbar";
import HomeFooter from "@/components/frontend/home/HomeFooter";
import "@/components/frontend/privacy_policy/styles/PrivacyPolicy.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/css/home.css";
import "@/styles/css/responsive.css";
import DynamicTitle from "@/components/common/DynamicTitle";
import ScrollToTopButton from "@/components/common/ScrollToTopButton";
import TermsOfServiceHeroSection from "@/components/frontend/terms_of_service/Herosection";
import TermsOfServiceSection from "@/components/frontend/terms_of_service/TermsOfSection";

const TermsOfServicePage = () => {

    return (
        <>
            <DynamicTitle titleKey="termsOfService.title" />

            {/* Navbar */}
            <HomeNavbar />

            {/* Hero Section */}
            <TermsOfServiceHeroSection />

            {/* Terms of Service Content */}
            <TermsOfServiceSection />

            {/* Footer */}
            <HomeFooter />


            {/* <ScrollToTopButton /> */}
        </>
    );
}

export default TermsOfServicePage;