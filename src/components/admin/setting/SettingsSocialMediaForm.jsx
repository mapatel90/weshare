"use client";
import React, { useState, useEffect } from "react";
import PageHeaderSetting from "@/components/shared/pageHeader/PageHeaderSetting";
import Footer from "@/components/shared/Footer";
import useSettings from "@/hooks/useSettings";
import PerfectScrollbar from "react-perfect-scrollbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { TextField, InputAdornment } from "@mui/material";
import { FaFacebook, FaInstagram, FaGithub, FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const SOCIAL_FIELDS = [
  {
    key: "facebook_url",
    labelKey: "settings.facebookUrl",
    placeholderKey: "placeholders.facebook_url",
    icon: <FaFacebook size={18} color="#1877F2" />,
  },
  {
    key: "instagram_url",
    labelKey: "settings.instagramUrl",
    placeholderKey: "placeholders.instagram_url",
    icon: <FaInstagram size={18} color="#E1306C" />,
  },
  {
    key: "x_url",
    labelKey: "settings.xUrl",
    placeholderKey: "placeholders.x_url",
    icon: <FaXTwitter size={18} />,
  },
  {
    key: "github_url",
    labelKey: "settings.githubUrl",
    placeholderKey: "placeholders.github_url",
    icon: <FaGithub size={18} />,
  },
  {
    key: "linkedin_url",
    labelKey: "settings.linkedinUrl",
    placeholderKey: "placeholders.linkedin_url",
    icon: <FaLinkedin size={18} color="#0A66C2" />,
  },
];

const SettingsSocialMediaForm = () => {
  const { lang } = useLanguage();
  const { settings, loading: settingsLoading, updateSettings, getSetting } = useSettings();

  const [formData, setFormData] = useState({
    facebook_url: "",
    instagram_url: "",
    x_url: "",
    github_url: "",
    linkedin_url: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0 && !isFormInitialized) {
      setFormData({
        facebook_url: getSetting("facebook_url", "") || "",
        instagram_url: getSetting("instagram_url", "") || "",
        x_url: getSetting("x_url", "") || "",
        github_url: getSetting("github_url", "") || "",
        linkedin_url: getSetting("linkedin_url", "") || "",
      });
      setIsFormInitialized(true);
    }
  }, [settings, getSetting, isFormInitialized]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await updateSettings(formData);
    } catch (error) {
      console.error("Error saving social media settings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="content-area">
      <PerfectScrollbar>
        <PageHeaderSetting
          onSave={handleSubmit}
          isSubmitting={isSubmitting}
          showSaveButton={true}
        />
        <div className="content-area-body">
          <div className="mb-0 card">
            <div className="card-body">
              {SOCIAL_FIELDS.map((field) => (
                <div className="mb-3" key={field.key}>
                  <TextField
                    fullWidth
                    label={lang(field.labelKey)}
                    placeholder={lang(field.placeholderKey)}
                    value={formData[field.key]}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    helperText={lang(field.placeholderKey)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {field.icon}
                        </InputAdornment>
                      ),
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </PerfectScrollbar>
    </div>
  );
};

export default SettingsSocialMediaForm;
