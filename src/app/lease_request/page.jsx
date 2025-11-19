"use client";

import React, { useEffect } from "react";
import HomeNavbar from "@/components/home/HomeNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import LeaseFormSection from "@/components/lease_request/LeaseForm";
import LeaseHelpSection from "@/components/lease_request/LeaseHelp";
import LeaseHeroSection from "@/components/lease_request/LeaseHeroSection";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/components/get_in_touch/styles/getInTouch.css";
import "@/styles/css/home.css";
import "@/styles/css/responsive.css";
import DynamicTitle from "@/components/common/DynamicTitle";

const LeaseRequestPage = () => {
  useEffect(() => {
    // Dynamically import Bootstrap JS only on client side
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return (
    <>

      <DynamicTitle titleKey="leaseRequest.title" />

      {/* Navbar */}
      <HomeNavbar />

      {/* Hero Section */}
      <LeaseHeroSection />

    <section class="contact-section get-in-touch">
    <div class="container">
    <div class="row g-4">

      {/* Help Section */}
      <LeaseHelpSection />
      
      {/* Form Section */}
      <LeaseFormSection />

         </div>

            <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.8586176909443!2d-74.00601508459495!3d40.71277577933133!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQyJzQ2LjAiTiA3NMKwMDAnMTcuOSJX!5e0!3m2!1sen!2sus!4v1699452312312!5m2!1sen!2sus"
                allowfullscreen="" loading="lazy">
            </iframe>

        </div>
    </section>

      {/* Footer */}
      <HomeFooter />
    </>
  );
};

export default LeaseRequestPage;
