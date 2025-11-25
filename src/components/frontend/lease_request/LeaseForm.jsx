import React, { useState } from "react";
import { showSuccessToast, showErrorToast } from "@/utils/topTost";
import { apiPost } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import useLocationData from '@/hooks/useLocationData';

export default function LeaseFormSection() {
  const { lang } = useLanguage();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    subject: "",
    message: "",
    address: "",
    countryId: "",
    stateId: "",
    cityId: ""
  });

  const [errors, setErrors] = useState({});

  // location hook (same pattern as TabProjectBasicDetails)
  const {
    countries,
    states,
    cities,
    loadingCountries,
    loadingStates,
    loadingCities,
    handleCountryChange,
    handleStateChange
  } = useLocationData();

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

  const handleLocationChange = (type, value) => {
    if (type === 'country') {
      setFormData(prev => ({ ...prev, countryId: value, stateId: '', cityId: '' }));
      handleCountryChange(value);
    } else if (type === 'state') {
      setFormData(prev => ({ ...prev, stateId: value, cityId: '' }));
      handleStateChange(value);
    } else if (type === 'city') {
      setFormData(prev => ({ ...prev, cityId: value }));
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
      const payload = {
        ...formData,
        countryId: formData.countryId || null,
        stateId: formData.stateId || null,
        cityId: formData.cityId || null
      };

      const data = await apiPost("/api/lease", payload);

      if (data.success) {
        setFormData({
          fullName: "",
          email: "",
          phoneNumber: "",
          subject: "",
          message: "",
          address: "",
          countryId: "",
          stateId: "",
          cityId: ""
        });
        setErrors({});
        showSuccessToast(lang("leaseRequest.message3"));
      } else {
        showErrorToast(data.message || "Failed to send message.");
      }
    } catch (err) {
      showErrorToast("Failed to send message: " + (err.message || err));
    }
  };

  return (
    <div className="col-lg-8 col-md-8 col-sm-12 contact-form-col">
      <div
        className="contact-box"
        style={{
          backgroundImage: "url('/images/contact_us/contactform-bg.jpg')",
        }}
      >
        <h3 className="mb-4 contact-title">{lang("getinTouch.message")}</h3>
        <p className="sub-text">{lang("getinTouch.subText")}</p>

        <form className="mt-5" onSubmit={handleSubmit} noValidate>
          <div className="row g-3">
            <div className="col-md-12">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`form-control ${errors.fullName ? "is-invalid" : ""}`}
                placeholder={lang("contactUs.fullName")}
              />
              {errors.fullName && (
                <div className="text-danger small mt-1">{errors.fullName}</div>
              )}
            </div>

            <div className="col-md-6">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                placeholder={lang("contactUs.email")}
              />
              {errors.email && (
                <div className="text-danger small mt-1">{errors.email}</div>
              )}
            </div>

            <div className="col-md-6">
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`form-control ${errors.phoneNumber ? "is-invalid" : ""}`}
                placeholder={lang("contactUs.phoneNumber")}
              />
              {errors.phoneNumber && (
                <div className="text-danger small mt-1">{errors.phoneNumber}</div>
              )}
            </div>

            {/* Country / State / City selects */}
            <div className="col-md-4">
              <select
                name="countryId"
                value={formData.countryId}
                onChange={(e) => handleLocationChange('country', e.target.value)}
                className={`form-control form-select ${errors.countryId ? "is-invalid" : ""}`}
                disabled={loadingCountries}
              >
                <option value="">{lang('common.selectCountry', 'Select Country')}</option>
                {countries.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <select
                name="stateId"
                value={formData.stateId}
                onChange={(e) => handleLocationChange('state', e.target.value)}
                className={`form-control form-select ${errors.stateId ? "is-invalid" : ""}`}
                disabled={loadingStates || !formData.countryId}
              >
                <option value="">{lang('common.selectState', 'Select State')}</option>
                {states.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <select
                name="cityId"
                value={formData.cityId}
                onChange={(e) => handleLocationChange('city', e.target.value)}
                className={`form-control form-select ${errors.cityId ? "is-invalid" : ""}`}
                disabled={loadingCities || !formData.stateId}
              >
                <option value="">{lang('common.selectCity', 'Select City')}</option>
                {cities.map(ci => (
                  <option key={ci.id} value={ci.id}>{ci.name}</option>
                ))}
              </select>
            </div>

            <div className="col-12">
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`form-control ${errors.address ? "is-invalid" : ""}`}
                placeholder={lang("leaseRequest.Address")}
              />
              {errors.address && (
                <div className="text-danger small mt-1">{errors.address}</div>
              )}
            </div>

            <div className="col-12">
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className={`form-control ${errors.subject ? "is-invalid" : ""}`}
                placeholder={lang("contactUs.subject")}
              />
              {errors.subject && (
                <div className="text-danger small mt-1">{errors.subject}</div>
              )}
            </div>

            <div className="col-12">
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className={`form-control ${errors.message ? "is-invalid" : ""}`}
                rows="7"
                placeholder={lang("contactUs.message")}
              ></textarea>
              {errors.message && (
                <div className="text-danger small mt-1">{errors.message}</div>
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
}
