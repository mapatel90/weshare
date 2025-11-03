"use client";
import React, { useEffect, useState } from "react";
import Footer from "@/components/shared/Footer";
import PageHeaderSetting from "@/components/shared/pageHeader/PageHeaderSetting";
import SelectDropdown from "@/components/shared/SelectDropdown";
import InputTopLabel from "@/components/shared/InputTopLabel";
import PerfectScrollbar from "react-perfect-scrollbar";
import useSettings from "@/hooks/useSettings";
import { showErrorToast, showSuccessToast } from "@/utils/topTost";
import { apiPost } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export const settingOptions = [
  {
    value: "yes",
    label: "Yes",
    icon: "feather-check",
    iconClassName: "text-success",
  },
  { value: "no", label: "No", icon: "feather-x", iconClassName: "text-danger" },
];

const SettingsEmailForm = () => {
    const { lang } = useLanguage();
    
    const SMTP = [
      { value: "", label: lang("smtp.protocolOptionSelect") },
      { value: "SSL", label: lang("smtp.protocolOptionSSL") },
      { value: "TSL", label: lang("smtp.protocolOptionTSL") },
    ];


  const {
    settings,
    loading: settingsLoading,
    updateSettings,
    getSetting,
  } = useSettings();

  const [formData, setFormData] = useState({
    smtp_email: "SSL",
    smtp_email_from_address: "",
    smtp_email_from_name: "",
    smtp_email_host: "",
    smtp_email_user: "",
    smtp_email_password: "",
    smtp_email_port: "",
    smtp_email_security_type: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Initialize form from settings once
  useEffect(() => {
    if (settings && !isFormInitialized && Object.keys(settings).length > 0) {
      const loaded = {
        smtp_email: getSetting("smtp_email", "SSL") || "SSL",
        smtp_email_from_address:
          getSetting("smtp_email_from_address", "") || "",
        smtp_email_from_name: getSetting("smtp_email_from_name", "") || "",
        smtp_email_host: getSetting("smtp_email_host", "") || "",
        smtp_email_user: getSetting("smtp_email_user", "") || "",
        smtp_email_password: getSetting("smtp_email_password", "") || "",
        smtp_email_port: getSetting("smtp_email_port", "") || "",
        smtp_email_security_type:
          getSetting("smtp_email_security_type", "") || "",
      };
      setFormData(loaded);

      // Initialize dropdown selection for SMTP (SSL/TSL)
      const match =
        SMTP.find((opt) => opt.value === loaded.smtp_email) || SMTP[0];
      setSelectedOption(match);

      setIsFormInitialized(true);
    }
  }, [settings, isFormInitialized, getSetting]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isEmail = (val) => {
    if (!val) return false;
    // Simple email regex for validation
    return /^(?:[a-zA-Z0-9_'^&\/+-])+(?:\.(?:[a-zA-Z0-9_'^&\/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(
      val
    );
  };

  const normalize = (obj) => {
    const out = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (typeof v === "string") {
        const trimmed = v.trim();
        out[k] = trimmed === "" ? "" : trimmed; // backend stores String(value); keep empty string to represent null
      } else {
        out[k] = v ?? null; // convert undefined to null
      }
    });
    return out;
  };

  const hasAnySmtpInput = () => {
    const {
      smtp_email_from_address,
      smtp_email_from_name,
      smtp_email_host,
      smtp_email_user,
      smtp_email_password,
      smtp_email_port,
      smtp_email_security_type,
    } = formData;
    return [
      smtp_email_from_address,
      smtp_email_from_name,
      smtp_email_host,
      smtp_email_user,
      smtp_email_password,
      smtp_email_port,
      smtp_email_security_type,
    ].some((v) =>
      typeof v === "string" ? v.trim() !== "" : v !== undefined && v !== null
    );
  };

  const validateSmtpPayload = () => {
    const protocol =
      selectedOption?.value || formData.smtp_email || "Select SMTP";
    const email = (formData.smtp_email_from_address || "").trim();
    const host = (formData.smtp_email_host || "").trim();
    const user = (formData.smtp_email_user || "").trim();
    const pass = (formData.smtp_email_password || "").trim();
    const portStr = (formData.smtp_email_port || "").trim();
    console.log(email);

    if (protocol !== "SSL" && protocol !== "TSL") {
      showErrorToast(lang("smtp.messages.selectValidProtocol"));
      return false;
    }

    if (email && !isEmail(email)) {
      showErrorToast(lang("validation.emailInvalid"));
      return false;
    }
    // if (host) {
    //   showErrorToast("Please enter SMTP host.");
    //   return false;
    // }
    // if (user) {
    //   showErrorToast("Please enter SMTP user.");
    //   return false;
    // }
    // if (pass) {
    //   showErrorToast("Please enter SMTP password.");
    //   return false;
    // }
    if (portStr) {
      const port = Number(portStr);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        showErrorToast(lang("smtp.messages.invalidPort"));
        return false;
      }
    }

    // ✅ Don’t force all fields — partial entries allowed
    return true;
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);

      // If user entered any SMTP-related input, enforce full validation
      if (hasAnySmtpInput()) {
        if (!validateSmtpPayload()) {
          return; // stop save on validation error
        }
      }

      const payload = normalize({
        ...formData,
        smtp_email: selectedOption?.value || formData.smtp_email || "SSL",
      });

      await updateSettings(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendTest = async () => {
    const value = (testEmail || "").trim();
    if (!value) {
      showErrorToast(lang("smtp.messages.enterTestEmail"));
      return;
    }
    const emailRegex =
      /^(?:[a-zA-Z0-9_'^&\/+-])+(?:\.(?:[a-zA-Z0-9_'^&\/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      showErrorToast(lang("smtp.messages.enterValidEmail"));
      return;
    }
    try {
      setIsSendingTest(true);
      await apiPost("/api/settings/test-email", { to: value });
      showSuccessToast(lang("smtp.messages.testSent"));
    } catch (err) {
      showErrorToast(err?.message || lang("messages.error"));
    } finally {
      setIsSendingTest(false);
    }
  };

  // Commented out - using global loader instead
  // if (settingsLoading && !isFormInitialized) {
  //   return (
  //     <div className="content-area">
  //       <PerfectScrollbar>
  //         <PageHeaderSetting />
  //         <div className="content-area-body">
  //           <div className="card mb-0">
  //             <div className="card-body">
  //               <div className="text-center py-5">
  //                 <div className="spinner-border text-primary" role="status">
  //                   <span className="visually-hidden">
  //                     {lang("common.loading")}
  //                   </span>
  //                 </div>
  //                 <p className="mt-2">{lang("common.loading")}</p>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //         <Footer />
  //       </PerfectScrollbar>
  //     </div>
  //   );
  // }

  return (
    <div className="content-area">
      <PerfectScrollbar>
        <PageHeaderSetting
          onSave={handleSave}
          isSubmitting={isSubmitting}
          showSaveButton={true}
        />
        <div className="content-area-body">
          <div className="card mb-0">
            <div className="card-body">
              <div className="mb-5">
                <h4 className="fw-bold">{lang("smtp.title")}</h4>
                <div className="fs-12 text-muted">{lang("smtp.subtitle")}</div>
              </div>

              <div className="mb-5">
                <label className="form-label">
                  {lang("smtp.protocolLabel")}{" "}
                  <span className="text-danger">*</span>
                </label>
                <SelectDropdown
                    options={SMTP}
                  defaultSelect={
                    formData.smtp_email || lang("smtp.protocolOptionSelect")
                  }
                  selectedOption={selectedOption}
                  onSelectOption={(option) => {
                    setSelectedOption(option);
                    handleChange(
                      "smtp_email",
                      option?.value || lang("smtp.protocolOptionSelect")
                    );
                  }}
                />
                <small className="form-text text-muted">
                  {lang("smtp.protocolHelp")}
                </small>
              </div>

              <InputTopLabel
                label={lang("smtp.fromAddressLabel")}
                placeholder={"example@domain.com"}
                info={lang("smtp.fromAddressInfo")}
                value={formData.smtp_email_from_address}
                onChange={(e) =>
                  handleChange("smtp_email_from_address", e.target.value)
                }
              />

              <InputTopLabel
                label={lang("smtp.fromNameLabel")}
                placeholder={"Your Company Name"}
                info={lang("smtp.fromNameInfo")}
                value={formData.smtp_email_from_name}
                onChange={(e) =>
                  handleChange("smtp_email_from_name", e.target.value)
                }
              />

              <InputTopLabel
                label={lang("smtp.hostLabel")}
                placeholder={"smtp.gmail.com"}
                info={lang("smtp.hostInfo")}
                value={formData.smtp_email_host}
                onChange={(e) =>
                  handleChange("smtp_email_host", e.target.value)
                }
              />

              <InputTopLabel
                label={lang("smtp.userLabel")}
                placeholder={"example@domain.com"}
                info={lang("smtp.userInfo")}
                value={formData.smtp_email_user}
                onChange={(e) =>
                  handleChange("smtp_email_user", e.target.value)
                }
              />

              <InputTopLabel
                label={lang("smtp.passwordLabel")}
                placeholder={"Enter your SMTP password"}
                type="password"
                info={lang("smtp.passwordInfo")}
                value={formData.smtp_email_password}
                onChange={(e) =>
                  handleChange("smtp_email_password", e.target.value)
                }
              />

              <InputTopLabel
                label={lang("smtp.portLabel")}
                placeholder={"465"}
                info={lang("smtp.portInfo")}
                value={formData.smtp_email_port}
                onChange={(e) =>
                  handleChange("smtp_email_port", e.target.value)
                }
              />

              <InputTopLabel
                label={lang("smtp.securityTypeLabel")}
                placeholder={lang("smtp.securityTypeLabel")}
                info={lang("smtp.securityTypeInfo")}
                value={formData.smtp_email_security_type}
                onChange={(e) =>
                  handleChange("smtp_email_security_type", e.target.value)
                }
              />

              <hr className="my-5" />
              <div className="mb-5">
                <h4 className="fw-bold">{lang("smtp.testTitle")}</h4>
                <div className="fs-12 text-muted">
                  {lang("smtp.testSubtitle")}
                </div>
              </div>
              <div className="mb-0">
                <label className="form-label">
                  {lang("smtp.testFieldLabel")}
                </label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={lang("smtp.testPlaceholder")}
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <button
                    type="button"
                    className="input-group-text"
                    onClick={handleSendTest}
                    disabled={isSendingTest}
                  >
                    {isSendingTest
                      ? lang("common.loading")
                      : lang("smtp.testButton")}
                  </button>
                </div>
                <small className="form-text text-muted">
                  {lang("smtp.testPlaceholder")} [Ex: test_1@email.com,
                  test_2@email.com, test_3@email.com]
                </small>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </PerfectScrollbar>
    </div>
  );
};

export default SettingsEmailForm;
