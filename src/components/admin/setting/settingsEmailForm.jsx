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
import { TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText, Button } from "@mui/material";

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
    smtp_email: "",
    smtp_email_from_address: "",
    // smtp_email_from_name: "",
    smtp_email_host: "",
    smtp_email_user: "",
    smtp_email_password: "",
    smtp_email_port: "",
    // smtp_email_security_type: "",
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
        smtp_email: getSetting("smtp_email", "") || "",
        smtp_email_from_address:
          getSetting("smtp_email_from_address", "") || "",
        // smtp_email_from_name: getSetting("smtp_email_from_name", "") || "",
        smtp_email_host: getSetting("smtp_email_host", "") || "",
        smtp_email_user: getSetting("smtp_email_user", "") || "",
        smtp_email_password: getSetting("smtp_email_password", "") || "",
        smtp_email_port: getSetting("smtp_email_port", "") || "",
        // smtp_email_security_type:
        //   getSetting("smtp_email_security_type", "") || "",
      };
      setFormData(loaded);

      // Initialize dropdown selection for SMTP (SSL/TSL)
      const match =
        SMTP.find((opt) => opt.value === loaded.smtp_email) || null;
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
      // smtp_email_from_name,
      smtp_email_host,
      smtp_email_user,
      smtp_email_password,
      smtp_email_port,
      // smtp_email_security_type,
    } = formData;
    return [
      smtp_email_from_address,
      // smtp_email_from_name,
      smtp_email_host,
      smtp_email_user,
      smtp_email_password,
      smtp_email_port,
      // smtp_email_security_type,
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
        smtp_email: selectedOption?.value || formData.smtp_email || "",
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
                <FormControl fullWidth>
                  <InputLabel id="smtp-protocol-label">{lang("smtp.protocolLabel")}</InputLabel>
                  <Select
                    labelId="smtp-protocol-label"
                    value={selectedOption?.value || formData.smtp_email || ""}
                    label={lang("smtp.protocolLabel")}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedOption(SMTP.find(o => o.value === val) || null);
                      handleChange("smtp_email", val);
                    }}
                  >
                    {SMTP.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{lang("smtp.protocolHelp")}</FormHelperText>
                </FormControl>
              </div>

              <div className="mb-4">
                <TextField fullWidth label={lang("smtp.fromAddressLabel")} placeholder={"example@domain.com"} value={formData.smtp_email_from_address} onChange={(e)=>handleChange("smtp_email_from_address", e.target.value)} helperText={lang("smtp.fromAddressInfo")} />
              </div>

              {/* <div className="mb-4">
                <TextField fullWidth label={lang("smtp.fromNameLabel")} placeholder={"Your Company Name"} value={formData.smtp_email_from_name} onChange={(e)=>handleChange("smtp_email_from_name", e.target.value)} helperText={lang("smtp.fromNameInfo")} />
              </div> */}

              <div className="mb-4">
                <TextField fullWidth label={lang("smtp.hostLabel")} placeholder={"smtp.gmail.com"} value={formData.smtp_email_host} onChange={(e)=>handleChange("smtp_email_host", e.target.value)} helperText={lang("smtp.hostInfo")} />
              </div>

              <div className="mb-4">
                <TextField fullWidth label={lang("smtp.userLabel")} placeholder={"example@domain.com"} value={formData.smtp_email_user} onChange={(e)=>handleChange("smtp_email_user", e.target.value)} helperText={lang("smtp.userInfo")} />
              </div>

              <div className="mb-4">
                <TextField fullWidth type="password" label={lang("smtp.passwordLabel")} placeholder={"Enter your SMTP password"} value={formData.smtp_email_password} onChange={(e)=>handleChange("smtp_email_password", e.target.value)} helperText={lang("smtp.passwordInfo")} />
              </div>

              <div className="mb-4">
                <TextField fullWidth label={lang("smtp.portLabel")} placeholder={"465"} value={formData.smtp_email_port} onChange={(e)=>handleChange("smtp_email_port", e.target.value)} helperText={lang("smtp.portInfo")} />
              </div>

              {/* <div className="mb-4">
                <TextField fullWidth label={lang("smtp.securityTypeLabel")} placeholder={lang("smtp.securityTypeLabel")} value={formData.smtp_email_security_type} onChange={(e)=>handleChange("smtp_email_security_type", e.target.value)} helperText={lang("smtp.securityTypeInfo")} />
              </div> */}

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
                {/* <div className="d-flex">
                  <TextField fullWidth placeholder={lang("smtp.testPlaceholder")} value={testEmail} onChange={(e)=>setTestEmail(e.target.value)} />
                  <Button variant="contained" onClick={handleSendTest} disabled={isSendingTest}>
                    {isSendingTest ? lang("common.loading") : lang("smtp.testButton")}
                  </Button>
                </div> */}
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
