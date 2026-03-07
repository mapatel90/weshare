
"use client";

import React, { useEffect } from "react";
import HomeNavbar from "@/components/frontend/home/HomeNavbar";
import HomeFooter from "@/components/frontend/home/HomeFooter";
import GetInTouchFormSection from "@/components/frontend/get_in_touch/section/GetInTouchFormSection";
import GetInTouchHelpSection from "@/components/frontend/get_in_touch/section/GetInTouchHelpSection";
import GetInTouchHeroSection from "@/components/frontend/get_in_touch/section/GetInTouchHeroSection";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/components/frontend/get_in_touch/styles/getInTouch.css";
import "@/styles/css/home.css";
import "@/styles/css/responsive.css";
import DynamicTitle from "@/components/common/DynamicTitle";
import GoogleMapLocation from "@/components/frontend/get_in_touch/section/GoogleMapLocation";

const GetInTouchPage = () => {
  useEffect(() => {
    // Dynamically import Bootstrap JS only on client side
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return (
    <>

      <DynamicTitle titleKey="contactUs.title" />

      {/* Navbar */}
      <HomeNavbar />

      {/* Hero Section */}
      <GetInTouchHeroSection />

      <section class="contact-section get-in-touch">
        <div class="container">
          <div class="row g-4">

            {/* Help Section */}
            <GetInTouchHelpSection />

            {/* Form Section */}
            <GetInTouchFormSection />

          </div>

          <GoogleMapLocation />

        </div>
      </section>

      {/* Footer */}
      <HomeFooter />
    </>
  );
};

export default GetInTouchPage;

