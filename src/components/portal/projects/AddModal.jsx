"use client";
import React, { useEffect, useState, useRef } from "react";
import { apiPost, apiGet, apiUpload } from "@/lib/api";
import { showSuccessToast, showErrorToast } from "@/utils/topTost";
import { generateSlug, checkProjectNameExists } from "@/utils/projectUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AddModal({ open, onClose }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : internalOpen;
  const { user } = useAuth() || {};
  const { lang } = useLanguage();
  const fileInputRef = useRef(null);

  // form state (match TabProjectBasicDetails / API fields)
  const [name, setName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [projectTypesList, setProjectTypesList] = useState([]); // list of all project types
  const [selectedProjectTypeId, setSelectedProjectTypeId] = useState(""); // selected project type ID
  const [offtakerId, setOfftakerId] = useState(
    // try to default to logged-in user id if available
    (user && (user.id ?? user.user?.id)) ? String(user.id ?? user.user?.id) : ""
  );
  const [address_1, setaddress_1] = useState("");
  const [address_2, setaddress_2] = useState("");
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [leaseTerm, setLeaseTerm] = useState("");
  const [productCode, setProductCode] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [imagePreviews, setImagePreviews] = useState([]);
  const [queuedImageFiles, setQueuedImageFiles] = useState([]);
  const [projectSize, setProjectSize] = useState("");
  const [projectCloseDate, setProjectCloseDate] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [status, setStatus] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({}); // field-level validation errors
  
  // Dropdown lists for address
  const [countryList, setCountryList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [cityList, setCityList] = useState([]);

  const openModal = () => {
    if (!isControlled) setInternalOpen(true);
  };
  const closeModal = () => {
    if (!isControlled) setInternalOpen(false);
    // clear errors when modal closes
    setFieldErrors({});
    setError("");
    onClose?.();
    imagePreviews.forEach((preview) => {
      URL.revokeObjectURL(preview);
    });
    setImagePreviews([]);
    setQueuedImageFiles([]);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // auto-generate slug from name
  useEffect(() => {
    if (name) {
      const slug = name
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setProjectSlug(slug);
    } else {
      setProjectSlug("");
    }
  }, [name]);
  
  // check project name uniqueness on blur
  async function handleProjectNameBlur() {
    if (!name || name.trim() === "") return;
    try {
      const exists = await checkProjectNameExists(name);
      if (exists) {
        setFieldErrors((prev) => ({ ...prev, name: "Project name already exists" }));
      } else {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.name;
          return newErrors;
        });
      }
    } catch (err) {
      // noop - don't block user, but log for debugging
      console.error("Error checking project name:", err);
    }
  }

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const res = await apiGet("/api/project-types");
        if (res?.success) setProjectTypesList(res.data || []);
      } catch (e) {
        // noop
      }
    };
    loadTypes();
  }, []);

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await apiGet("/api/locations/countries");
        if (res?.success) setCountryList(res.data || []);
      } catch (e) {
        console.error("Failed to fetch countries:", e);
      }
    };
    fetchCountries();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    const fetchStates = async () => {
      if (!countryId) {
        setStateList([]);
        setStateId("");
        setCityList([]);
        setCityId("");
        return;
      }
      try {
        const res = await apiGet(`/api/locations/countries/${countryId}/states`);
        if (res?.success) setStateList(res.data || []);
      } catch (e) {
        console.error("Failed to fetch states:", e);
      }
    };
    fetchStates();
  }, [countryId]);

  // Fetch cities when state changes
  useEffect(() => {
    const fetchCities = async () => {
      if (!stateId) {
        setCityList([]);
        setCityId("");
        return;
      }
      try {
        const res = await apiGet(`/api/locations/states/${stateId}/cities`);
        if (res?.success) setCityList(res.data || []);
      } catch (e) {
        console.error("Failed to fetch cities:", e);
      }
    };
    fetchCities();
  }, [stateId]);

  // Pre-fill user address when user is loaded
  useEffect(() => {
    if (!user) return;
    
    try {
      const userData = user?.user || user;
      if (userData.address_1) setaddress_1(userData.address_1);
      if (userData.address_2) setaddress_2(userData.address_2);
      if (userData.country_id) setCountryId(String(userData.country_id));
      if (userData.state_id) setStateId(String(userData.state_id));
      if (userData.city_id) setCityId(String(userData.city_id));
      if (userData.zipcode) setZipcode(userData.zipcode);
    } catch (err) {
      console.error("Error pre-filling user address:", err);
    }
  }, [user]);

  // If logged-in user is an offtaker (role 3), default offtakerId to their id and keep it in sync
  useEffect(() => {
    try {
      const uid = user?.id ?? user?.user?.id ?? user?.userId ?? null;
      const role = user?.role ?? user?.user?.role;
      if (uid && role === 3) {
        setOfftakerId(String(uid));
      }
    } catch (err) {
      // noop
    }
  }, [user]);

  function handleImageFileChange(e) {
    const files = e?.target?.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const newPreviews = [];
    const validFiles = [];

    for (const file of newFiles) {
      if (!file.type.startsWith("image/")) {
        showErrorToast(`${file.name} is not a valid image file`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast(`${file.name} must be less than 5MB`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newPreviews.push(previewUrl);
      validFiles.push(file);
    }

    // Append to existing files and previews
    setQueuedImageFiles((prevFiles) => [...prevFiles, ...validFiles]);
    setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
  }

  // Function to remove a specific image
  function handleRemoveImage(index) {
    setImagePreviews((prevPreviews) => {
      const newPreviews = [...prevPreviews];
      URL.revokeObjectURL(newPreviews[index]);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    setQueuedImageFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      newFiles.splice(index, 1);
      return newFiles;
    });
  }

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [imagePreviews]);

  // single source of validation — returns errors object and updates state
  function validateBeforeSubmit() {
    const errors = {};

    // Required fields
    if (!name || name.trim() === "") errors.name = "Project name is required";
    if (!selectedProjectTypeId || selectedProjectTypeId === "")
      errors.selectedProjectTypeId = "Project type is required";
    if (!projectDescription || projectDescription.trim() === "") errors.projectDescription = "Description is required";
    if (!askingPrice || askingPrice.trim() === "") errors.askingPrice = "Target Investment Amount is required";
    if (!leaseTerm || leaseTerm.trim() === "") errors.leaseTerm = "Lease Term is required";
    if (!projectSize || projectSize.trim() === "") errors.projectSize = "Installed Capacity is required";
    if (!projectLocation || projectLocation.trim() === "") errors.projectLocation = "Location is required";
    if (!startDate || startDate.trim() === "") errors.startDate = "Project Start Date is required";
    if (!projectCloseDate || projectCloseDate.trim() === "") errors.projectCloseDate = "Project End Date is required";

    // Numeric validation
    const numberRegex = /^[0-9]*\.?[0-9]*$/;
    if (askingPrice && askingPrice.trim() !== "" && !numberRegex.test(askingPrice))
      errors.askingPrice = "Target Investment Amount must be a valid number";
    if (leaseTerm && leaseTerm.trim() !== "" && !numberRegex.test(leaseTerm))
      errors.leaseTerm = "Lease Term must be a valid number";
    if (projectSize && projectSize.trim() !== "" && !numberRegex.test(projectSize))
      errors.projectSize = "Installed Capacity must be a valid number";

    // Date validation - check if end date is after start date
    if (startDate && projectCloseDate) {
      const start = new Date(startDate);
      const end = new Date(projectCloseDate);
      if (end < start) errors.projectCloseDate = "Project End Date must be after Start Date";
    }

    setFieldErrors(errors);
    return errors;
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    setError("");
    
    const errors = validateBeforeSubmit();
    if (Object.keys(errors).length > 0) {
      // Scroll to first error
      setTimeout(() => {
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
          const element = document.querySelector(`[data-field="${firstErrorField}"]`);
          if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        project_slug:
          projectSlug || (name || "").toLowerCase().replace(/\s+/g, "-"),
        project_type_id: Number(selectedProjectTypeId || 1),
        ...(offtakerId ? { offtaker_id: Number(offtakerId) } : {}),
        address_1: address_1 || "",
        address_2: address_2 || "",
        ...(countryId ? { country_id: Number(countryId) } : {}),
        ...(stateId ? { state_id: Number(stateId) } : {}),
        ...(cityId ? { city_id: Number(cityId) } : {}),
        zipcode: zipcode || "",
        asking_price: askingPrice || "",
        lease_term: leaseTerm !== "" ? Number(leaseTerm) : null,
        product_code: productCode || "",
        project_description: projectDescription || "",
        project_size: projectSize || "",
        project_close_date: projectCloseDate || null,
        project_location: projectLocation || "",
        start_date: startDate || null,
        created_by: Number(user?.id),
        status: Number(1),
      };

      const res = await apiPost("/api/projects/AddProject", payload);

      if (!res || !res.success) {
        throw new Error(res?.message || "Failed to create project");
      }

      if (queuedImageFiles.length > 0 && res?.data?.id) {
        try {
          const formData = new FormData();
          queuedImageFiles.forEach((file) => {
            formData.append("images", file);
          });
          await apiUpload(`/api/projects/${res.data.id}/images`, formData);
        } catch (uploadErr) {
          console.error("Project image upload error:", uploadErr);
          showErrorToast(
            uploadErr.message ||
              "Project created but image upload failed. Please add images from the gallery."
          );
        }
      }

      showSuccessToast("Project created successfully");
      window.dispatchEvent(new Event("projectCreated"));
      closeModal();

      // reset
      setName("");
      setProjectSlug("");
      setSelectedProjectTypeId("");
      setOfftakerId("");
      setaddress_1("");
      setaddress_2("");
      setCountryId("");
      setStateId("");
      setCityId("");
      setZipcode("");
      setAskingPrice("");
      setLeaseTerm("");
      setProductCode("");
      setProjectDescription("");
      setQueuedImageFiles([]);
      setImagePreviews([]);
      setProjectSize("");
      setProjectCloseDate("");
      setProjectLocation("");
      setStartDate("");
      setStatus(1);
      setFieldErrors({});
    } catch (err) {
      console.error("Add project error:", err);
      setError(err.message || "Error creating project");
      showErrorToast(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!isControlled && (
        <div className="w-full flex justify-end">
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-3 py-2 mb-3 text-white rounded-lg text-sm"
            style={{ backgroundColor: "#F6A623" }}
          >
            <span className="text-lg leading-none">+</span> {lang("modal.add", "Add")}
          </button>
        </div>
      )}

      {/* MODAL */}
      <div
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-50 flex pointer-events-none`}
      >
        <div
          onClick={closeModal}
          className={`absolute inset-0 bg-black duration-300 ${
            isOpen ? "opacity-40 pointer-events-auto" : "opacity-0"
          }`}
        />

        <aside
          className={`ml-auto h-full w-full max-w-2xl bg-white shadow-xl transform transition-transform duration-300 pointer-events-auto ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ display: "flex", flexDirection: "column" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-black text-xl font-semibold">
              {lang("projects.projectdetails", "Project Details")}
            </h2>
            <button
              onClick={closeModal}
              className="text-gray-500 hover:text-gray-800 text-xl"
            >
              ✕
            </button>
          </div>

          {/* SCROLL AREA */}
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-6"
            style={{ flex: 1, overflow: "auto" }}
          >
            <div className="border rounded-lg p-4 shadow-sm bg-white">
              <h3 className="font-semibold mb-2 text-lg text-black">
                {lang("projects.basicinformation", "Basic Information")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="flex flex-col" data-field="name">
                  <label className="mb-1 font-medium text-sm text-black">
                    {lang("projects.projectName", "Project Name")}
                  </label>
                  <input
                    value={name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setName(v);
                      // Clear error when user types
                      if (fieldErrors.name) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.name;
                          return newErrors;
                        });
                      }
                      // also generate slug immediately using shared util
                      try {
                        const s = generateSlug(v);
                        setProjectSlug(s);
                      } catch (e) {
                        // fallback to previous logic if util fails
                      }
                    }}
                    onBlur={handleProjectNameBlur}
                    className={`input-field ${fieldErrors.name ? "border-red-500" : ""}`}
                    placeholder={lang("projects.projectNamePlaceholder", "Enter Project Name")}
                  />
                  {fieldErrors.name && <div className="text-red-600 text-sm mt-1">{fieldErrors.name}</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-sm text-black">
                    {lang("projects.projectslug", "Project Slug")}
                  </label>
                  <input
                    value={projectSlug}
                    onChange={(e) => setProjectSlug(e.target.value)}
                    className="input-field"
                    placeholder={lang("projects.projectslug", "Project Slug")}
                    disabled
                  />
                </div>

                <div className="flex flex-col" data-field="selectedProjectTypeId">
                  <label className="mb-1 font-medium text-sm text-black">
                    {lang("projects.projectType", "Project Type")}
                  </label>
                  <select
                    value={selectedProjectTypeId}
                    onChange={(e) => {
                      setSelectedProjectTypeId(e.target.value);
                      // Clear error when user selects
                      if (fieldErrors.selectedProjectTypeId) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.selectedProjectTypeId;
                          return newErrors;
                        });
                      }
                    }}
                    className={`input-field ${fieldErrors.selectedProjectTypeId ? "border-red-500" : ""}`}
                  >
                    <option value="">{lang("projects.selectProjectType", "Select Project Type")}</option>
                    {projectTypesList && Array.isArray(projectTypesList) && projectTypesList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.type_name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.selectedProjectTypeId && <div className="text-red-600 text-sm mt-1">{fieldErrors.selectedProjectTypeId}</div>}
                </div>
              </div>

              <div className="flex flex-col mt-4" data-field="projectDescription">
                <label className="mb-1 font-medium text-sm text-black">
                  {lang("news.description", "Description")}
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => {
                    setProjectDescription(e.target.value);
                    if (fieldErrors.projectDescription) {
                      setFieldErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.projectDescription;
                        return newErrors;
                      });
                    }
                  }}
                  className={`input-field ${fieldErrors.projectDescription ? "border-red-500" : ""}`}
                  rows="4"
                  placeholder={lang("projects.projectDescriptionPlaceholder", "Enter project description")}
                ></textarea>
                {fieldErrors.projectDescription && <div className="text-red-600 text-sm mt-1">{fieldErrors.projectDescription}</div>}
              </div>
            </div>

            {/* Address Information Section */}
            <div className="border rounded-lg p-4 shadow-sm bg-white">
              <h3 className="font-semibold mb-2 text-lg text-black">
                {lang("projects.addressInformation", "Address Information")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-sm text-black">
                    {lang("projects.addressLine1", "Address Line 1")}
                  </label>
                  <input
                    value={address_1}
                    onChange={(e) => setaddress_1(e.target.value)}
                    className="input-field"
                    placeholder={lang("projects.addressLine1", "Address Line 1")}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-sm text-black">
                    {lang("projects.addressLine2", "Address Line 2")}
                  </label>
                  <input
                    value={address_2}
                    onChange={(e) => setaddress_2(e.target.value)}
                    className="input-field"
                    placeholder={lang("projects.addressLine2", "Address Line 2")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-sm text-black">
                    {lang("projects.country", "Country")}
                  </label>
                  <select
                    value={countryId}
                    onChange={(e) => setCountryId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">{lang("projects.selectCountry", "Select Country")}</option>
                    {countryList.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-sm text-black">
                    {lang("projects.state", "State")}
                  </label>
                  <select
                    value={stateId}
                    onChange={(e) => setStateId(e.target.value)}
                    className="input-field"
                    disabled={!countryId}
                  >
                    <option value="">{lang("projects.selectState", "Select State")}</option>
                    {stateList.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-sm text-black">
                    {lang("projects.city", "City")}
                  </label>
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    className="input-field"
                    disabled={!stateId}
                  >
                    <option value="">{lang("projects.selectCity", "Select City")}</option>
                    {cityList.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-sm text-black">
                    {lang("projects.zipcode", "Zipcode")}
                  </label>
                  <input
                    value={zipcode}
                    onChange={(e) => setZipcode(e.target.value)}
                    className="input-field"
                    placeholder={lang("projects.zipcode", "Zipcode")}
                  />
                </div>
              </div>
            </div>

            {/* Financial / energy / summary sections (connected to state) */}
            <div className="border rounded-lg p-4 shadow-sm bg-white">
              <h3 className="font-semibold mb-2 text-lg text-black">
                {lang("projects.financialdetails", "Financial Details")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* <div className="flex flex-col">
                  <label className="mb-1 font-medium text-sm">Expected ROI (%)</label>
                  <input value={investorProfit} onChange={(e) => setInvestorProfit(e.target.value)} className="input-field" placeholder="Enter Number" />
                </div> */}
                <div className="flex flex-col" data-field="askingPrice">
                  <label className="mb-1 font-medium text-sm">
                    {lang("projects.targetInvestmentAmount", "Target Investment Amount ($)")}
                  </label>
                  <input
                    value={askingPrice}
                    onChange={(e) => {
                      setAskingPrice(e.target.value);
                      if (fieldErrors.askingPrice) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.askingPrice;
                          return newErrors;
                        });
                      }
                    }}
                    className={`input-field ${fieldErrors.askingPrice ? "border-red-500" : ""}`}
                    placeholder={lang("projects.enterNumber", "Enter Number")}
                  />
                  {fieldErrors.askingPrice && <div className="text-red-600 text-sm mt-1">{fieldErrors.askingPrice}</div>}
                </div>

                <div className="flex flex-col" data-field="leaseTerm">
                  <label className="mb-1 font-medium text-sm">
                    {lang("projects.leaseterm", "Lease Term (years)")}
                  </label>
                  <input
                    value={leaseTerm}
                    onChange={(e) => {
                      setLeaseTerm(e.target.value);
                      if (fieldErrors.leaseTerm) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.leaseTerm;
                          return newErrors;
                        });
                      }
                    }}
                    className={`input-field ${fieldErrors.leaseTerm ? "border-red-500" : ""}`}
                    placeholder={lang("projects.enterNumber", "Enter Number")}
                  />
                  {fieldErrors.leaseTerm && <div className="text-red-600 text-sm mt-1">{fieldErrors.leaseTerm}</div>}
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 shadow-sm bg-white">
              <h3 className="font-semibold mb-2 text-lg text-black">
                {lang("projects.energyGenerationDetails", "Energy Generation Details")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="flex flex-col" data-field="projectSize">
                  <label className="mb-1 font-medium text-sm">
                    {lang("projects.installedCapacity", "Installed Capacity (kWp)")}
                  </label>
                  <input
                    value={projectSize}
                    onChange={(e) => {
                      setProjectSize(e.target.value);
                      if (fieldErrors.projectSize) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.projectSize;
                          return newErrors;
                        });
                      }
                    }}
                    className={`input-field ${fieldErrors.projectSize ? "border-red-500" : ""}`}
                    placeholder={lang("projects.enterNumber", "Enter Number")}
                  />
                  {fieldErrors.projectSize && <div className="text-red-600 text-sm mt-1">{fieldErrors.projectSize}</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
                <div className="flex flex-col" data-field="projectLocation">
                  <label className="mb-1 font-medium text-sm">{lang("common.location", "Location")}</label>
                  <input
                    value={projectLocation}
                    onChange={(e) => {
                      setProjectLocation(e.target.value);
                      if (fieldErrors.projectLocation) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.projectLocation;
                          return newErrors;
                        });
                      }
                    }}
                    className={`input-field ${fieldErrors.projectLocation ? "border-red-500" : ""}`}
                    placeholder={lang("projects.enterLocation", "Enter Location")}
                  />
                  {fieldErrors.projectLocation && <div className="text-red-600 text-sm mt-1">{fieldErrors.projectLocation}</div>}
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 shadow-sm bg-white">
              <h3 className="font-semibold mb-2 text-lg text-black">
                {lang("dashboard.projectSummary", "Project Summary")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col" data-field="startDate">
                  <label className="mb-1 font-medium text-sm">
                    {lang("dashboard.projectStartDate", "Project Start Date")}
                  </label>
                  <input
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (fieldErrors.startDate) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.startDate;
                          return newErrors;
                        });
                      }
                    }}
                    type="date"
                    className={`input-field ${fieldErrors.startDate ? "border-red-500" : ""}`}
                  />
                  {fieldErrors.startDate && <div className="text-red-600 text-sm mt-1">{fieldErrors.startDate}</div>}
                </div>
                <div className="flex flex-col" data-field="projectCloseDate">
                  <label className="mb-1 font-medium text-sm">
                    {lang("projects.projectEndDate", "Project End Date")}
                  </label>
                  <input
                    value={projectCloseDate}
                    onChange={(e) => {
                      setProjectCloseDate(e.target.value);
                      if (fieldErrors.projectCloseDate) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.projectCloseDate;
                          return newErrors;
                        });
                      }
                    }}
                    type="date"
                    className={`input-field ${fieldErrors.projectCloseDate ? "border-red-500" : ""}`}
                  />
                  {fieldErrors.projectCloseDate && <div className="text-red-600 text-sm mt-1">{fieldErrors.projectCloseDate}</div>}
                </div>
              </div>

              <label className="mb-1 font-medium text-sm mt-4 text-black">
                {lang("dashboard.uploadDocuments", "Upload Documents / Image")}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 text-sm">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageFileChange}
                />
                <div className="mt-2 text-xs text-gray-600">
                  {lang("projects.optionalProjectImageUpload", "Optional project image upload (multiple files allowed)")}
                </div>
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`preview-${index}`}
                          style={{
                            width: "100%",
                            height: "100px",
                            objectFit: "cover",
                            borderRadius: "4px",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* optional extra field that API expects */}
              {/* <div className="mt-4">
                <label className="mb-1 font-medium text-sm">Project Manager (project_manage)</label>
                <input value={projectManage} onChange={(e) => setProjectManage(e.target.value)} className="input-field" placeholder="Project Manager" />
              </div> */}
            </div>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-white">
            <button
              onClick={closeModal}
              className="cancel-btn"
              disabled={loading}
            >
              {lang("common.cancel", "Cancel")}
            </button>
            <button
              onClick={handleSubmit}
              className="next-btn"
              disabled={loading}
            >
              {loading ? lang("common.saving", "Saving...") : lang("common.save", "Save")}
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
