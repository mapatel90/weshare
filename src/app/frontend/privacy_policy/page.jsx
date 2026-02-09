"use client";

import React, { useEffect } from "react";
import HomeNavbar from "@/components/frontend/home/HomeNavbar";
import HomeFooter from "@/components/frontend/home/HomeFooter";
import PrivacyPolicyHeroSection from "@/components/frontend/privacy_policy/Herosection";
import PrivacyPolicy from "@/components/frontend/privacy_policy/PrivacyPolicy";
import "@/components/frontend/privacy_policy/styles/PrivacyPolicy.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/css/home.css";
import "@/styles/css/responsive.css";
import DynamicTitle from "@/components/common/DynamicTitle";

const PrivacyPolicyPage = () => {
    useEffect(() => {
    // Dynamically import Bootstrap JS only on client side
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
    }, []);

  return (
    <>
        <DynamicTitle titleKey="privacyPolicy.title" />

      {/* Navbar */}
      <HomeNavbar />

        {/* Hero Section */}
        <PrivacyPolicyHeroSection />

        {/* Privacy Policy Content */}
        <PrivacyPolicy />

        {/* Footer */}
        <HomeFooter />
    </>
  );
}

export default PrivacyPolicyPage;