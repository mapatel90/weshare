"use client";

import React, { useState } from "react";
import "@/components/contact_us/styles/contact_us.css";
import { showSuccessToast, showErrorToast } from "@/utils/topTost";
import { apiPost } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

const ContactUsForm = () => {
  const { lang } = useLanguage();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else {
      // simple email check
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(formData.email))
        newErrors.email = "Enter a valid email address.";
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required.";
    } else {
      const digits = formData.phoneNumber.replace(/\D/g, "");
      if (digits.length < 7)
        newErrors.phoneNumber = "Enter a valid phone number.";
    }
    if (!formData.message.trim()) {
      newErrors.message = "Message cannot be empty.";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const data = await apiPost("/api/contactus", formData);

      if (data.success) {
        // Clear form after successful submission
        setFormData({
          fullName: "",
          email: "",
          phoneNumber: "",
          subject: "",
          message: "",
        });
        setErrors({});
        showSuccessToast("Message sent successfully");
      } else {
        showErrorToast(data.message || "Failed to send message.");
      }
    } catch (err) {
      showErrorToast("Failed to send message: " + (err.message || err));
    }
  };

  return (
    <div className="col-lg-8">
      <div
        className="contact-box"
        style={{ backgroundImage: "url(images/contact_us/contactform-bg.jpg)" }}
      >
        <h3 className="mb-4 contact-title">{lang("contactUs.title")}</h3>
        <p className="sub-text">
          {lang("contactUs.subText")}
        </p>

        <form className="mt-5" onSubmit={handleSubmit} noValidate>
          <div className="row g-3">
            <div className="col-md-12">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`form-control ${
                  errors.fullName ? "is-invalid" : ""
                }`}
                placeholder={lang("contactUs.fullName")}
              />
              {errors.fullName && (
                <div className="text-danger small mt-1">
                  {errors.fullName}
                </div>
              )}
            </div>
            <div className="col-md-6">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-control ${
                  errors.email ? "is-invalid" : ""
                }`}
                placeholder={lang("contactUs.email")}
              />
              {errors.email && (
                <div className="text-danger small mt-1">
                  {errors.email}
                </div>
              )}
            </div>
            <div className="col-md-6">
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`form-control ${
                  errors.phoneNumber ? "is-invalid" : ""
                }`}
                placeholder={lang("contactUs.phoneNumber")}
              />
              {errors.phoneNumber && (
                <div className="text-danger small mt-1">
                  {errors.phoneNumber}
                </div>
              )}
            </div>
            <div className="col-12">
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="form-control"
                placeholder={lang("contactUs.subject")}
              />
            </div>
            <div className="col-12">
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className={`form-control ${
                  errors.message ? "is-invalid" : ""
                }`}
                rows="7"
                placeholder={lang("contactUs.message")}
              ></textarea>
              {errors.message && (
                <div className="text-danger small mt-1">
                  {errors.message}
                </div>
              )}
            </div>
            <div className="col-12 mt-5 mb-2">
              <button
                type="submit"
                className="btn btn-custom contact-btn w-100"
              >
                {lang("contactUs.sendMessage")}
                <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactUsForm;
