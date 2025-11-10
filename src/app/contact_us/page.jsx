"use client";

import React from "react";
import HomeNavbar from "@/components/home/HomeNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import ContactUsHeroSection from "@/components/contact_us/section/ContactUsHeroSection";
import ContactUsForm from "@/components/contact_us/section/ContactUsForm";
import ContactUsHelp from "@/components/contact_us/section/ContactUsHelp";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@/styles/css/home.css";
import "@/styles/css/responsive.css";

const ContactUsPage = () => {
  return (
    <>
      {/* Navbar */}
      <HomeNavbar />

      {/* Hero Section */}
      <ContactUsHeroSection />

    <section class="contact-section">
    <div class="container">
    <div class="row g-4">

      {/* Form Section */}
      <ContactUsForm />

      {/* Help Section */}
      <ContactUsHelp />
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

export default ContactUsPage;
