"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiGet } from "@/lib/api";

const HomeFooter = () => {
  const { lang, language, changeLanguage } = useLanguage();
  const pathname = usePathname();
  const isNews = pathname?.startsWith("/news");
  const [footerData, setFooterData] = useState(null);
  const [locationNames, setLocationNames] = useState({
    country: "",
    state: "",
    city: "",
  });

  const fetchFooter = async () => {
    try {
      const response = await apiGet("/api/settings/");
      if (response?.data) {
        setFooterData(response.data);
        const countryId = response.data?.site_country;
        const stateId = response.data?.site_state;
        const cityId = response.data?.site_city;
        resolveLocationNames({ countryId, stateId, cityId });
      }
    } catch (error) {
      console.error("Error fetching footer settings:", error);
    }
  };

  const resolveLocationNames = async ({ countryId, stateId, cityId }) => {
    try {
      const names = { country: "", state: "", city: "" };

      // Country name
      if (countryId) {
        const countriesRes = await apiGet("/api/locations/countries");
        if (countriesRes?.success && Array.isArray(countriesRes.data)) {
          const match = countriesRes.data.find(
            (c) => String(c.id) === String(countryId)
          );
          if (match?.name) names.country = match.name;
        }
      }

      // State name (requires country)
      if (countryId && stateId) {
        const statesRes = await apiGet(
          `/api/locations/countries/${countryId}/states`
        );
        if (statesRes?.success && Array.isArray(statesRes.data)) {
          const match = statesRes.data.find(
            (s) => String(s.id) === String(stateId)
          );
          if (match?.name) names.state = match.name;
        }
      }

      // City name (requires state)
      if (stateId && cityId) {
        const citiesRes = await apiGet(
          `/api/locations/states/${stateId}/cities`
        );
        if (citiesRes?.success && Array.isArray(citiesRes.data)) {
          const match = citiesRes.data.find(
            (ci) => String(ci.id) === String(cityId)
          );
          if (match?.name) names.city = match.name;
        }
      }

      setLocationNames(names);
    } catch (error) {
      console.error("Error resolving location names:", error);
      setLocationNames({ country: "", state: "", city: "" });
    }
  };

  useEffect(() => {
    fetchFooter();
  }, []);

  return (
    <footer className={isNews ? "footer mt-0 newsletter-footer" : "footer"}>
      <div className="container">
        <div className="row gy-4">
          {/* Company Info */}
          <div className="col-lg-4 col-md-12">
            <div className="footer-logo mb-3">
              <Image
                src="/images/logo/Logo-White.svg"
                alt="WeShare Logo"
                width={150}
                height={50}
                className="mb-2"
              />
            </div>
            <p className="text-white fw-300 fs-18 mb-4">
              {lang("home.footer.tagline")}
              <br />
              {lang("home.footer.description")}
            </p>
            <div className="social-icons d-flex gap-4">
              <Link href="https://x.com/" target="_blank" rel="noopener noreferrer">
                <Image
                  src="/images/icons/twitter.svg"
                  alt="Twitter"
                  width={24}
                  height={24}
                />
              </Link>
              <Link href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer">
                <Image
                  src="/images/icons/linkedin.svg"
                  alt="LinkedIn"
                  width={24}
                  height={24}
                />
              </Link>
              <Link href="https://github.com/" target="_blank" rel="noopener noreferrer">
                <Image
                  src="/images/icons/cat.svg"
                  alt="Social"
                  width={24}
                  height={24}
                />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-4 col-md-6">
            <div className="linkBox">
              <h6 className="fs-24 text-secondary-color fw-600">
                {lang("home.footer.quickLinks")}
              </h6>
              <ul className="list-unstyled text-white quickLinks">
                <li>
                  <Link href="/">{lang("home.footer.home")}</Link>
                </li>
                <li>
                  <Link href="/#about-us">{lang("home.footer.aboutUs")}</Link>
                </li>
                <li>
                  <Link href="/frontend/exchange-hub">{lang("home.footer.exchangeHub")}</Link>
                </li>
                <li>
                  <Link href="/#how-it-works">{lang("home.footer.howItWorks")}</Link>
                </li>
                <li>
                  <Link href="/frontend/news">{lang("home.footer.news")}</Link>
                </li>
                <li>
                  <Link href="/frontend/blog">{lang("home.footer.blog")}</Link>
                </li>
                <li>
                  <Link href="/frontend/contact_us">{lang("home.footer.contactUs")}</Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact & Settings */}
          <div className="col-md-6 col-lg-3">
            <div className="contactBox">
              <h6 className="fs-24 text-secondary-color fw-600 mb-3">
                {lang("home.footer.contactSettings")}
              </h6>
              <ul className="list-unstyled text-white-50 small mb-4">
                <li className="mb-4 fs-18 fw-300 text-white">
                  <span className="me-3">
                    <Image
                      src="/images/icons/email.svg"
                      alt="email"
                      width={20}
                      height={20}
                    />
                  </span>
                  {footerData?.site_email ? footerData.site_email : ""}
                </li>
                <li className="mb-4 fs-18 fw-300 text-white">
                  <span className="me-3">
                    <Image
                      src="/images/icons/phone-w.svg"
                      alt="phone"
                      width={20}
                      height={20}
                    />
                  </span>
                  {footerData?.site_phone ? footerData.site_phone : ""}
                </li>
                <li className="fs-18 fw-300 text-white">
                  <span className="me-3">
                    <Image
                      src="/images/icons/location-w.svg"
                      alt="location"
                      width={20}
                      height={20}
                    />
                  </span>
                  {locationNames.city ||
                  locationNames.state ||
                  locationNames.country
                    ? `${locationNames.city || ""}${
                        locationNames.state ? `, ${locationNames.state}` : ""
                      }${
                        locationNames.country
                          ? `, ${locationNames.country}`
                          : ""
                      }`
                    : ""}
                </li>
              </ul>

              <div className="footer-dropdown mb-3">
                <label className="fs-18 fw-300 text-secondary-color d-block mb-1">
                  {lang("home.footer.language")}
                </label>
                <select
                  className="form-select form-select-sm"
                  value={language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  style={{
                    color: "#fff",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                >
                  <option
                    value="en"
                    style={{ color: "#000", backgroundColor: "#fff" }}
                  >
                    English
                  </option>
                  <option
                    value="vi"
                    style={{ color: "#000", backgroundColor: "#fff" }}
                  >
                    Tiếng Việt
                  </option>
                </select>
              </div>

              <div className="footer-dropdown">
                <label className="fs-18 fw-300 text-secondary-color d-block mb-1">
                  {lang("home.footer.country")}
                </label>
                <select
                  className="form-select form-select-sm"
                  style={{
                    color: "#fff",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                >
                  <option
                    value="US"
                    style={{ color: "#000", backgroundColor: "#fff" }}
                  >
                    US United States
                  </option>
                  <option
                    value="CA"
                    style={{ color: "#000", backgroundColor: "#fff" }}
                  >
                    CA Canada
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <hr />

        <div className="copyRightSection d-flex flex-sm-column flex-md-row gap-sm-3 gap-5 align-items-center">
          <p className="mb-2 mb-md-0 fs-18 fw-500 text-white">
            {lang("home.footer.copyright")}
          </p>
          <div className="footer-links d-flex gap-3">
            <Link href="/frontend/privacy_policy">{lang("home.footer.privacyPolicy")}</Link>
            <Link href="#">{lang("home.footer.termsOfService")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
