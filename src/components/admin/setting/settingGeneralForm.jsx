"use client";
import React, { useState, useEffect, useRef } from "react";
import PageHeaderSetting from "@/components/shared/pageHeader/PageHeaderSetting";
import Footer from "@/components/shared/Footer";
import TextAreaTopLabel from "@/components/shared/TextAreaTopLabel";
import { FiCamera } from "react-icons/fi";
import { FiX } from "react-icons/fi";
import useImageUpload from "@/hooks/useImageUpload";
import useSettings from "@/hooks/useSettings";
import useLocationData from "@/hooks/useLocationData";
import PerfectScrollbar from "react-perfect-scrollbar";
import InputTopLabel from "@/components/shared/InputTopLabel";
import SelectTopLabel from "@/components/shared/SelectTopLabel";
import { showErrorToast } from "@/utils/topTost";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiPost } from "@/lib/api";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Avatar,
  IconButton,
} from "@mui/material";

const SettingGeneralForm = () => {
  const { lang } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { handleImageUpload, uploadedImage, setUploadedImage } =
    useImageUpload();
  const { handleImageUpload: handleFaviconUpload, uploadedImage: uploadedFavicon, setUploadedImage: setUploadedFavicon } =
    useImageUpload();
  const {
    settings,
    loading: settingsLoading,
    updateSettings,
    getSetting,
  } = useSettings();
  const {
    countries,
    states,
    cities,
    loadingCountries,
    loadingStates,
    loadingCities,
    handleCountryChange,
    handleStateChange,
  } = useLocationData();

  // Form state
  const [formData, setFormData] = useState({
    site_name: "",
    site_address: "",
    site_country: "",
    site_state: "",
    site_city: "",
    site_zip: "",
    site_phone: "",
    site_image: "",
    site_favicon: "", 
    site_email: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [faviconLoadError, setFaviconLoadError] = useState(false);

  // Refs to track if we've already loaded initial data
  const hasLoadedInitialStates = useRef(false);
  const hasLoadedInitialCities = useRef(false);

  // Update document favicon dynamically
  const updateDocumentFavicon = (faviconPath) => {
    // Use default icon if no favicon path is provided
    const iconPath = faviconPath || '/images/default_icon.png';
    
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
    existingLinks.forEach(link => {
      link.remove();
    });

    // Detect image type from path
    const ext = iconPath.split('.').pop()?.toLowerCase();
    let type = 'image/x-icon';
    if (ext === 'png') type = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
    else if (ext === 'svg') type = 'image/svg+xml';
    else if (ext === 'gif') type = 'image/gif';

    // Create new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = type;
    link.href = iconPath;
    document.head.appendChild(link);

    // Also add as shortcut icon for better browser compatibility
    const shortcutLink = document.createElement('link');
    shortcutLink.rel = 'shortcut icon';
    shortcutLink.type = type;
    shortcutLink.href = iconPath;
    document.head.appendChild(shortcutLink);
  };

  // Debug: Log form data changes
  useEffect(() => {
  }, [formData]);

  // Load settings into form when available (only once)
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0 && !isFormInitialized) {
      const newFormData = {
        site_name: getSetting("site_name", "") || "",
        site_address: getSetting("site_address", "") || "",
        site_country: getSetting("site_country", "") || "",
        site_state: getSetting("site_state", "") || "",
        site_city: getSetting("site_city", "") || "",
        site_zip: getSetting("site_zip", "") || "",
        site_phone: getSetting("site_phone", "") || "",
        site_image: getSetting("site_image", "") || "",
        site_favicon: getSetting("site_favicon", "") || "",
        site_email: getSetting("site_email", "") || "",
      };

      setFormData(newFormData);

      // Set uploaded image if exists
      const siteImage = getSetting("site_image", "");
      if (siteImage) {
        setUploadedImage(siteImage);
      }

      // Set uploaded favicon if exists
      const siteFavicon = getSetting("site_favicon", "");
      if (siteFavicon) {
        setUploadedFavicon(siteFavicon);
      }
      // Update document favicon (will use default if no favicon is set)
      updateDocumentFavicon(siteFavicon);

      setIsFormInitialized(true);
    }
  }, [settings, getSetting, setUploadedImage, setUploadedFavicon, isFormInitialized]);

  // Load initial location data when form is initialized with existing settings
  useEffect(() => {
    if (
      isFormInitialized &&
      formData.site_country &&
      countries.length > 0 &&
      !hasLoadedInitialStates.current
    ) {
      handleCountryChange(formData.site_country);
      hasLoadedInitialStates.current = true;
    }
  }, [
    isFormInitialized,
    formData.site_country,
    countries.length,
    handleCountryChange,
  ]);

  // Load cities when states are loaded and we have a saved state
  useEffect(() => {
    if (
      isFormInitialized &&
      formData.site_state &&
      states.length > 0 &&
      !hasLoadedInitialCities.current
    ) {
      handleStateChange(formData.site_state);
      hasLoadedInitialCities.current = true;
    }
  }, [
    isFormInitialized,
    formData.site_state,
    states.length,
    handleStateChange,
  ]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };
      return newData;
    });
  };

  // Handle country selection
  const handleCountrySelect = (e) => {
    const countryId = e.target.value;
    // Update form data
    setFormData((prev) => ({
      ...prev,
      site_country: countryId,
      site_state: "", // Reset state
      site_city: "", // Reset city
    }));

    // Load states for selected country
    if (countryId) {
      handleCountryChange(countryId);
    }
  };

  // Handle state selection
  const handleStateSelect = (e) => {
    const stateId = e.target.value;

    // Update form data
    setFormData((prev) => ({
      ...prev,
      site_state: stateId,
      site_city: "", // Reset city
    }));

    // Load cities for selected state
    if (stateId) {
      handleStateChange(stateId);
    }
  };

  // Handle city selection
  const handleCitySelect = (e) => {
    const cityId = e.target.value;
    // Update form data
    setFormData((prev) => ({
      ...prev,
      site_city: cityId,
    }));
  };

  // Handle image upload
  const handleImageChange = (e) => {
    handleImageUpload(e);
  };

  // Handle favicon upload
  const handleFaviconChange = (e) => {
    handleFaviconUpload(e);
  };

  // Remove current image (client state) and attempt server-side deletion
  const handleRemoveImage = async () => {
    try {
      const imagePath = formData.site_image;
      if (imagePath) {
        try {
          await apiPost("/api/settings/delete-logo", { path: imagePath });
        } catch (err) {
          console.error("Failed to delete image on server:", err);
        }
      }
      setUploadedImage(null);
      setFormData((prev) => ({ ...prev, site_image: "" }));
      setImageLoadError(false);
      // Ensure global settings consumers (e.g., sidebar) update immediately
      try {
        await updateSettings({ site_image: "" });
      } catch (e) {
        console.warn("Failed to update settings after deletion", e);
      }
    } catch (error) {
      console.error("Error removing image:", error);
    }
  };

  // Remove current favicon (client state) and attempt server-side deletion
  const handleRemoveFavicon = async () => {
    try {
      const faviconPath = formData.site_favicon;
      if (faviconPath) {
        try {
          await apiPost("/api/settings/delete-favicon", { path: faviconPath });
        } catch (err) {
          console.error("Failed to delete favicon on server:", err);
        }
      }
      setUploadedFavicon(null);
      setFormData((prev) => ({ ...prev, site_favicon: "" }));
      setFaviconLoadError(false);
      // Ensure global settings consumers update immediately
      try {
        await updateSettings({ site_favicon: "" });
        // Update favicon in document head
        updateDocumentFavicon("");
      } catch (e) {
        console.warn("Failed to update settings after favicon deletion", e);
      }
    } catch (error) {
      console.error("Error removing favicon:", error);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validate email: allow empty, but if provided, must be valid
      const trimmedEmail = (formData.site_email || "").trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
        showErrorToast(
          (lang && lang("validation.invalidEmail")) ||
            "Please enter a valid email address"
        );
        setIsSubmitting(false);
        return;
      }

      let newImagePath = formData.site_image;
      // If a new image was selected (data URL), upload it now and delete old on server
      if (
        uploadedImage &&
        typeof uploadedImage === "string" &&
        uploadedImage.startsWith("data:")
      ) {
        const resp = await apiPost("/api/settings/upload-logo", {
          dataUrl: uploadedImage,
          oldImagePath: formData.site_image || null,
        });
        if (resp?.success && resp?.data?.path) {
          newImagePath = resp.data.path;
        }
      }

      let newFaviconPath = formData.site_favicon;
      // If a new favicon was selected (data URL), upload it now and delete old on server
      if (
        uploadedFavicon &&
        typeof uploadedFavicon === "string" &&
        uploadedFavicon.startsWith("data:")
      ) {
        const resp = await apiPost("/api/settings/upload-favicon", {
          dataUrl: uploadedFavicon,
          oldImagePath: formData.site_favicon || null,
        });
        if (resp?.success && resp?.data?.path) {
          newFaviconPath = resp.data.path;
        }
      }

      // Include uploaded image and favicon paths in form data
      const settingsToUpdate = {
        ...formData,
        site_image: newImagePath,
        site_favicon: newFaviconPath,
        site_email: trimmedEmail, // save trimmed value (possibly empty)
      };

      await updateSettings(settingsToUpdate);
      // Make sure local form state reflects the saved image and favicon and clear temp preview
      setFormData((prev) => ({ 
        ...prev, 
        site_image: newImagePath,
        site_favicon: newFaviconPath,
      }));
      setUploadedImage(null);
      setUploadedFavicon(null);
      
      // Update favicon in document head immediately without refresh
      updateDocumentFavicon(newFaviconPath);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Show loading while loading settings
  // Commented out - using global loader instead
  // if (settingsLoading) {
  //     return (
  //         <div className="content-area">
  //             <PerfectScrollbar>
  //                 <PageHeaderSetting />
  //                 <div className="content-area-body">
  //                     <div className="card mb-0">
  //                         <div className="card-body">
  //                             <div className="text-center py-5">
  //                                 <div className="spinner-border text-primary" role="status">
  //                                     <span className="visually-hidden">Loading...</span>
  //                                 </div>
  //                                 <p className="mt-2">Loading settings...</p>
  //                             </div>
  //                         </div>
  //                     </div>
  //                 </div>
  //                 <Footer />
  //             </PerfectScrollbar>
  //         </div>
  //     )
  // }

  return (
    <div className="content-area">
      <PerfectScrollbar>
        <PageHeaderSetting
          onSave={handleSubmit}
          isSubmitting={isSubmitting}
          showSaveButton={true}
        />
        <div className="content-area-body">
          <div className="card mb-0">
            <div className="card-body">
              {uploadedImage || (formData.site_image && !imageLoadError) ? (
                <Box
                  sx={{
                    mb: 3,
                    position: "relative",
                    width: 100,
                    height: 100,
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  {/* Image Preview */}
                  <Avatar
                    src={uploadedImage || formData.site_image}
                    alt="Logo"
                    variant="rounded"
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    imgProps={{
                      onError: () => {
                        setImageLoadError(true);
                        setFormData((prev) => ({ ...prev, site_image: "" }));
                      },
                    }}
                  />

                  {/* Upload Overlay (click to change) */}
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(0,0,0,0.4)",
                      opacity: 0,
                      transition: "opacity 0.3s",
                      cursor: "pointer",
                      "&:hover": {
                        opacity: 1,
                      },
                    }}
                    onClick={() =>
                      document.getElementById("upload-image").click()
                    }
                  >
                    <IconButton sx={{ color: "#fff" }}>
                      <FiCamera size={22} />
                    </IconButton>
                  </Box>

                  {/* Remove Icon (top-right) */}
                  <IconButton
                    onClick={handleRemoveImage}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      bgcolor: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                    }}
                    aria-label="remove-image"
                  >
                    <FiX size={16} />
                  </IconButton>

                  {/* Hidden File Input */}
                  <input
                    id="upload-image"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageChange}
                  />
                </Box>
              ) : (
                <div className="mb-3">
                  <TextField
                    fullWidth
                    type="file"
                    inputProps={{ accept: "image/*" }}
                    label={lang("common.logo")}
                    onChange={handleImageChange}
                    helperText={
                      (lang && lang("placeholders.upload_logo")) ||
                      "Upload company logo"
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </div>
              )}

              {/* Favicon Upload */}
              {uploadedFavicon || (formData.site_favicon && !faviconLoadError) ? (
                <Box
                  sx={{
                    mb: 3,
                    position: "relative",
                    width: 64,
                    height: 64,
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  {/* Favicon Preview */}
                  <Avatar
                    src={uploadedFavicon || formData.site_favicon}
                    alt="Favicon"
                    variant="rounded"
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    imgProps={{
                      onError: () => {
                        setFaviconLoadError(true);
                        setFormData((prev) => ({ ...prev, site_favicon: "" }));
                      },
                    }}
                  />

                  {/* Upload Overlay (click to change) */}
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(0,0,0,0.4)",
                      opacity: 0,
                      transition: "opacity 0.3s",
                      cursor: "pointer",
                      "&:hover": {
                        opacity: 1,
                      },
                    }}
                    onClick={() =>
                      document.getElementById("upload-favicon").click()
                    }
                  >
                    <IconButton sx={{ color: "#fff" }}>
                      <FiCamera size={18} />
                    </IconButton>
                  </Box>

                  {/* Remove Icon (top-right) */}
                  <IconButton
                    onClick={handleRemoveFavicon}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      bgcolor: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                    }}
                    aria-label="remove-favicon"
                  >
                    <FiX size={14} />
                  </IconButton>

                  {/* Hidden File Input */}
                  <input
                    id="upload-favicon"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFaviconChange}
                  />
                </Box>
              ) : (
                <div className="mb-3">
                  <TextField
                    fullWidth
                    type="file"
                    inputProps={{ accept: "image/*" }}
                    label={lang("common.icon")}
                    onChange={handleFaviconChange}
                    helperText={
                      (lang && lang("placeholders.upload_icon")) ||
                      "Upload favicon (site icon)"
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </div>
              )}

              <div className="mb-3">
                <TextField
                  fullWidth
                  label={lang("common.name")}
                  placeholder={lang("placeholders.your_company_name")}
                  value={formData.site_name}
                  onChange={(e) =>
                    handleInputChange("site_name", e.target.value)
                  }
                  helperText={lang("placeholders.your_company_name")}
                />
              </div>
              <div className="mb-3">
                <TextField
                  fullWidth
                  label={lang("common.address")}
                  placeholder={lang("placeholders.your_company_address")}
                  value={formData.site_address}
                  onChange={(e) =>
                    handleInputChange("site_address", e.target.value)
                  }
                  helperText={lang("placeholders.your_company_address")}
                />
              </div>
              <div className="mb-3">
                <FormControl fullWidth>
                  <InputLabel id="country-select-label">
                    {lang("common.country")}
                  </InputLabel>
                  <Select
                    labelId="country-select-label"
                    value={formData.site_country}
                    label={lang("common.country")}
                    onChange={handleCountrySelect}
                    disabled={loadingCountries}
                  >
                    <MenuItem value="">
                      {lang("placeholders.your_company_country")}
                    </MenuItem>
                    {countries.map((country) => (
                      <MenuItem key={country.id} value={country.id}>
                        {country.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {lang("placeholders.your_company_country")}
                  </FormHelperText>
                </FormControl>
              </div>
              <div className="mb-3">
                <FormControl fullWidth>
                  <InputLabel id="state-select-label">
                    {lang("common.state")}
                  </InputLabel>
                  <Select
                    labelId="state-select-label"
                    value={formData.site_state}
                    label={lang("common.state")}
                    onChange={handleStateSelect}
                    disabled={loadingStates || !formData.site_country}
                  >
                    <MenuItem value="">
                      {lang("placeholders.your_company_state")}
                    </MenuItem>
                    {states.map((state) => (
                      <MenuItem key={state.id} value={state.id}>
                        {state.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {lang("placeholders.your_company_state")}
                  </FormHelperText>
                </FormControl>
              </div>
              <div className="mb-3">
                <FormControl fullWidth>
                  <InputLabel id="city-select-label">
                    {lang("common.city")}
                  </InputLabel>
                  <Select
                    labelId="city-select-label"
                    value={formData.site_city}
                    label={lang("common.city")}
                    onChange={handleCitySelect}
                    disabled={loadingCities || !formData.site_state}
                  >
                    <MenuItem value="">
                      {lang("placeholders.your_company_city")}
                    </MenuItem>
                    {cities.map((city) => (
                      <MenuItem key={city.id} value={city.id}>
                        {city.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {lang("placeholders.your_company_city")}
                  </FormHelperText>
                </FormControl>
              </div>

              {/* Debug info - remove after testing */}
              {/* <div style={{ background: '#f8f9fa', padding: '10px', margin: '10px 0', fontSize: '12px' }}>
                                <strong>Debug Info:</strong><br/>
                                Countries loaded: {countries.length}<br/>
                                States loaded: {states.length}<br/>
                                Cities loaded: {cities.length}<br/>
                                Selected Country: {formData.site_country}<br/>
                                Selected State: {formData.site_state}<br/>
                                Selected City: {formData.site_city}<br/>
                                Loading States: {loadingStates ? 'Yes' : 'No'}<br/>
                                Loading Cities: {loadingCities ? 'Yes' : 'No'}
                            </div> */}

              <div className="mb-3">
                <TextField
                  fullWidth
                  label={lang("common.zip")}
                  placeholder={lang("placeholders.your_company_zip")}
                  value={formData.site_zip}
                  onChange={(e) =>
                    handleInputChange("site_zip", e.target.value)
                  }
                  helperText={lang("placeholders.your_company_zip")}
                />
              </div>
              <div className="mb-3">
                <TextField
                  fullWidth
                  label={lang("common.phone")}
                  placeholder={lang("placeholders.your_company_phone")}
                  value={formData.site_phone}
                  onChange={(e) =>
                    handleInputChange("site_phone", e.target.value)
                  }
                  helperText={lang("placeholders.your_company_phone")}
                />
              </div>
              <div className="mb-3">
                <TextField
                  fullWidth
                  label={lang("common.email")}
                  placeholder={lang("placeholders.your_company_mail")}
                  value={formData.site_email}
                  onChange={(e) =>
                    handleInputChange("site_email", e.target.value)
                  }
                  helperText={lang("placeholders.your_company_mail")}
                />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </PerfectScrollbar>
    </div>
  );
};

export default SettingGeneralForm;
