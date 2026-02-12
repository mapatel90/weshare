"use client";
import React, { useEffect, useState, useRef } from "react";
import { apiPost, apiGet, apiUpload } from "@/lib/api";
import { showSuccessToast, showErrorToast } from "@/utils/topTost";
import { generateSlug, checkProjectNameExists } from "@/utils/projectUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ROLES } from "@/constants/roles";

export default function AddModal({ open, onClose }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : internalOpen;
  const { user } = useAuth() || {};
  const { lang } = useLanguage();
  const fileInputRef = useRef(null);
  // console.log("user", user);

  // Helper function to get date + 1 year in YYYY-MM-DD format
  const getDefaultCloseDate = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() + 1);
    return today.toISOString().split('T')[0];
  };

  const [project, setProjects] = useState({
    name : '',
    project_slug : '',
    project_type_id : '',
    offtaker_id : (user && (user.id ?? user.user?.id)) ? String(user.id ?? user.user?.id) : "",
    address_1 : '',
    address_2 : '',
    country_id : '',
    state_id : '',
    city_id : '',
    zipcode : '',
    lease_term : '',
    project_description : '',
    project_size : '',
    project_close_date : getDefaultCloseDate(),
    project_location : '',
    start_date : '',
    created_by : (user && (user.id ?? user.user?.id)) ? String(user.id ?? user.user?.id) : "",
    status : '1'
  });

  // form state (match TabProjectBasicDetails / API fields)
  const [projectTypesList, setProjectTypesList] = useState([]); // list of all project types
  const [imagePreviews, setImagePreviews] = useState([]);
  const [queuedImageFiles, setQueuedImageFiles] = useState([]);

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
    if (project?.name) {
      const slug = project.name
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setProjects(prev => ({
          ...prev,
          project_slug : slug
      }));
    } else {
      setProjects(prev => ({
          ...prev,
          project_slug : ""
      }));
    }
  }, [project?.name]);

  async function handleChange(e) {
    
    const { name, value } = e.target;
    console.log("Name", name);
    console.log("Value", value);
    setProjects(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  }
  
  // check project name uniqueness on blur
  async function handleProjectNameBlur() {
    if (!project?.name || project.name.trim() === "") return;
    try {
      const exists = await checkProjectNameExists(project.name);
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
      if (!project.country_id) {
        setStateList([]);
        setProjects(prev => ({ ...prev, state_id: "", city_id: "" }));
        setCityList([]);
        return;
      }
      try {
        const res = await apiGet(`/api/locations/countries/${project.country_id}/states`);
        if (res?.success) setStateList(res.data || []);
      } catch (e) {
        console.error("Failed to fetch states:", e);
      }
    };
    fetchStates();
  }, [project.country_id]);

  // Fetch cities when state changes
  useEffect(() => {
    const fetchCities = async () => {
      if (!project.state_id) {
        setCityList([]);
        setProjects(prev => ({ ...prev, city_id: "" }));
        return;
      }
      try {
        const res = await apiGet(`/api/locations/states/${project.state_id}/cities`);
        if (res?.success) setCityList(res.data || []);
      } catch (e) {
        console.error("Failed to fetch cities:", e);
      }
    };
    fetchCities();
  }, [project.state_id]);

  // Pre-fill user address when user is loaded
  useEffect(() => {
    if (!user) return;

    try {
      const userData = user?.user || user;
      const uid = user?.id ?? user?.user?.id ?? user?.userId ?? null;
      const role = user?.role ?? user?.user?.role;

      setProjects(prev => ({
          ...prev,
          address_1 : userData.address_1 || prev.address_1,
          address_2 : userData.address_2 || prev.address_2,
          country_id : userData.country_id || prev.country_id,
          state_id : userData.state_id || prev.state_id,
          city_id : userData.city_id || prev.city_id,
          zipcode : userData.zipcode || prev.zipcode,
          offtaker_id : uid ? String(uid) : prev.offtaker_id
      }));
    } catch (err) {
      console.error("Error pre-filling user address:", err);
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
    if (!project?.name || project?.name.trim() === "")
      errors.name = "Project name is required";
    if (!project?.project_type_id || project?.project_type_id === "")
      errors.project_type_id = "Project type is required";
    if (!project?.project_description || project?.project_description.trim() === "")
      errors.project_description = "Description is required";
    if (!project?.lease_term || project?.lease_term.trim() === "")
      errors.lease_term = "Lease Term is required";
    if (!project?.project_size || project?.project_size.trim() === "")
      errors.project_size = "Installed Capacity is required";
    if (!project?.project_location || project?.project_location.trim() === "")
      errors.project_location = "Location is required";
    if (!project?.start_date || project?.start_date.trim() === "")
      errors.start_date = "Project Start Date is required";
    if (!project?.project_close_date || project?.project_close_date.trim() === "")
      errors.project_close_date = "Project End Date is required";

    // Numeric validation
    const numberRegex = /^[0-9]*\.?[0-9]*$/;
    if (project?.lease_term && project.lease_term.trim() !== "" && !numberRegex.test(project.lease_term))
      errors.lease_term = "Lease Term must be a valid number";
    if (project?.project_size && project.project_size.trim() !== "" && !numberRegex.test(project.project_size))
      errors.project_size = "Installed Capacity must be a valid number";

    // Date validation - check if end date is after start date
    if (project?.start_date && project?.project_close_date) {
      const start = new Date(project.start_date);
      const end = new Date(project.project_close_date);
      if (end < start) errors.project_close_date = "Project End Date must be after Start Date";
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
      
      const res = await apiPost("/api/projects/AddProject", project);

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
      setProjects({
        name: "",
        project_slug: "",
        project_type_id: "",
        offtaker_id: (user && (user.id ?? user.user?.id)) ? String(user.id ?? user.user?.id) : "",
        address_1: "",
        address_2: "",
        country_id: "",
        state_id: "",
        city_id: "",
        zipcode: "",
        lease_term: "",
        project_description: "",
        project_size: "",
        project_close_date: getDefaultCloseDate(),
        project_location: "",
        start_date: "",
        created_by: "",
        status: "1"
      });
      setQueuedImageFiles([]);
      setImagePreviews([]);
      setFieldErrors({});
    } catch (err) {
      setError(err.message || "Error creating project");
      showErrorToast(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  console.log("project", project);

  return (
    <>
      {!isControlled && (
        <div className="flex justify-end w-full">
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-3 py-2 mb-3 text-sm text-white rounded-lg"
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
            <h2 className="text-xl font-semibold text-black">
              {lang("projects.projectdetails", "Project Details")}
            </h2>
            <button
              onClick={closeModal}
              className="text-xl text-gray-500 hover:text-gray-800"
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
            <div className="p-4 bg-white border rounded-lg shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-black">
                {lang("projects.basicinformation", "Basic Information")}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                <div className="flex flex-col" data-field="name">
                  <label className="mb-1 text-sm font-medium text-black">
                    {lang("projects.projectName", "Project Name")}
                  </label>
                  <input
                    name="name"
                    value={project?.name}
                    onChange={(e) => handleChange(e)}
                    onBlur={handleProjectNameBlur}
                    className={`input-field ${fieldErrors.name ? "border-red-500" : ""}`}
                    placeholder={lang("projects.projectNamePlaceholder", "Enter Project Name")}
                  />
                  {fieldErrors.name && <div className="mt-1 text-sm text-red-600">{fieldErrors.name}</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-black">
                    {lang("projects.projectslug", "Project Slug")}
                  </label>
                  <input
                    name="project_slug"
                    value={project?.project_slug}
                    onChange={(e) => handleChange(e)}
                    className="input-field"
                    placeholder={lang("projects.projectslug", "Project Slug")}
                    disabled
                  />
                </div>

                <div className="flex flex-col" data-field="project_type_id">
                  <label className="mb-1 text-sm font-medium text-black">
                    {lang("projects.projectType", "Project Type")}
                  </label>
                  <select
                    name="project_type_id"
                    value={project?.project_type_id}
                    onChange={(e) => handleChange(e)}
                    className={`input-field ${fieldErrors.project_type_id ? "border-red-500" : ""}`}
                  >
                    <option value="">{lang("projects.selectProjectType", "Select Project Type")}</option>
                    {projectTypesList && Array.isArray(projectTypesList) && projectTypesList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.type_name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.project_type_id && <div className="mt-1 text-sm text-red-600">{fieldErrors.project_type_id}</div>}
                </div>
              </div>

              <div className="flex flex-col mt-4" data-field="project_description">
                <label className="mb-1 text-sm font-medium text-black">
                  {lang("news.description", "Description")}
                </label>
                <textarea
                  name="project_description"
                  value={project?.project_description}
                  onChange={(e) => handleChange(e)}
                  className={`input-field ${fieldErrors.project_description ? "border-red-500" : ""}`}
                  rows="4"
                  placeholder={lang("projects.projectDescriptionPlaceholder", "Enter project description")}
                ></textarea>
                {fieldErrors.project_description && <div className="mt-1 text-sm text-red-600">{fieldErrors.project_description}</div>}
              </div>
            </div>

            {/* Address Information Section */}
            <div className="p-4 bg-white border rounded-lg shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-black">
                {lang("projects.addressInformation", "Address Information")}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-black">
                    {lang("projects.addressLine1", "Address Line 1")}
                  </label>
                  <input
                    name="address_1"
                    value={project?.address_1}
                    onChange={(e) => handleChange(e)}
                    className="input-field"
                    placeholder={lang("projects.addressLine1", "Address Line 1")}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-black">
                    {lang("projects.addressLine2", "Address Line 2")}
                  </label>
                  <input
                    name="address_2"
                    value={project?.address_2}
                    onChange={(e) => handleChange(e)}
                    className="input-field"
                    placeholder={lang("projects.addressLine2", "Address Line 2")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-black">
                    {lang("projects.country", "Country")}
                  </label>
                  <select
                    name="country_id"
                    value={project?.country_id}
                    onChange={(e) => handleChange(e)}
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
                  <label className="mb-1 text-sm font-medium text-black">
                    {lang("projects.state", "State")}
                  </label>
                  <select
                    name="state_id"
                    value={project?.state_id}
                    onChange={(e) => handleChange(e)}
                    className="input-field"
                    disabled={!project?.country_id}
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
                  <label className="mb-1 text-sm font-medium text-black">
                    {lang("projects.city", "City")}
                  </label>
                  <select
                    name="city_id"
                    value={project?.city_id}
                    onChange={(e) => handleChange(e)}
                    className="input-field"
                    disabled={!project?.state_id}
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
                  <label className="mb-1 text-sm font-medium text-black">
                    {lang("projects.zipcode", "Zipcode")}
                  </label>
                  <input
                    name="zipcode"
                    value={project?.zipcode}
                    onChange={(e) => handleChange(e)}
                    className="input-field"
                    placeholder={lang("projects.zipcode", "Zipcode")}
                  />
                </div>
              </div>
            </div>

            {/* Financial / energy / summary sections (connected to state) */}
            <div className="p-4 bg-white border rounded-lg shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-black">
                {lang("projects.financialdetails", "Financial Details")}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col" data-field="lease_term">
                  <label className="mb-1 text-sm font-medium">
                    {lang("projects.leaseterm", "Lease Term (years)")}
                  </label>
                  <input
                    name="lease_term"
                    value={project?.lease_term}
                    onChange={(e) => handleChange(e)}
                    className={`input-field ${fieldErrors.lease_term ? "border-red-500" : ""}`}
                    placeholder={lang("projects.enterNumber", "Enter Number")}
                  />
                  {fieldErrors.lease_term && <div className="mt-1 text-sm text-red-600">{fieldErrors.lease_term}</div>}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border rounded-lg shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-black">
                {lang("projects.energyGenerationDetails", "Energy Generation Details")}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                <div className="flex flex-col" data-field="project_size">
                  <label className="mb-1 text-sm font-medium">
                    {lang("projects.installedCapacity", "Installed Capacity (kWp)")}
                  </label>
                  <input
                    name="project_size"
                    value={project?.project_size}
                    onChange={(e) => handleChange(e)}
                    className={`input-field ${fieldErrors.project_size ? "border-red-500" : ""}`}
                    placeholder={lang("projects.enterNumber", "Enter Number")}
                  />
                  {fieldErrors.project_size && <div className="mt-1 text-sm text-red-600">{fieldErrors.project_size}</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-1">
                <div className="flex flex-col" data-field="project_location">
                  <label className="mb-1 text-sm font-medium">{lang("common.location", "Location")}</label>
                  <input
                    name="project_location"
                    value={project?.project_location}
                    onChange={(e) => handleChange(e)}
                    className={`input-field ${fieldErrors.project_location ? "border-red-500" : ""}`}
                    placeholder={lang("projects.enterLocation", "Enter Location")}
                  />
                  {fieldErrors.project_location && <div className="mt-1 text-sm text-red-600">{fieldErrors.project_location}</div>}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border rounded-lg shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-black">
                {lang("dashboard.projectSummary", "Project Summary")}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col" data-field="start_date">
                  <label className="mb-1 text-sm font-medium">
                    {lang("dashboard.projectStartDate", "Project Start Date")}
                  </label>
                  <input
                    name="start_date"
                    value={project?.start_date}
                    onChange={(e) => handleChange(e)}
                    type="date"
                    className={`input-field ${fieldErrors.start_date ? "border-red-500" : ""}`}
                  />
                  {fieldErrors.start_date && <div className="mt-1 text-sm text-red-600">{fieldErrors.start_date}</div>}
                </div>
                {/* Hide this field from user but still send it to API not show in form  */}
                <div className="flex flex-col" data-field="project_close_date" style={{ display: "none" }}>
                  <label className="mb-1 text-sm font-medium">
                    {lang("projects.projectEndDate", "Project End Date")}
                  </label>
                  <input
                    name="project_close_date"
                    value={project?.project_close_date}
                    onChange={(e) => handleChange(e)}
                    type="date"
                    className={`input-field ${fieldErrors.project_close_date ? "border-red-500" : ""}`}
                    disabled
                  />
                  {fieldErrors.project_close_date && <div className="mt-1 text-sm text-red-600">{fieldErrors.project_close_date}</div>}
                </div>
              </div>

              <label className="mt-4 mb-1 text-sm font-medium text-black">
                {lang("dashboard.uploadDocuments", "Upload Documents / Image")}
              </label>
              <div className="p-4 text-sm text-center text-gray-500 border-2 border-gray-300 border-dashed rounded-lg">
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
                  <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-3">
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
                          className="absolute flex items-center justify-center w-6 h-6 text-white transition-colors bg-red-500 rounded-full top-1 right-1 hover:bg-red-600"
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
                <label className="mb-1 text-sm font-medium">Project Manager (project_manage)</label>
                <input value={projectManage} onChange={(e) => setProjectManage(e.target.value)} className="input-field" placeholder="Project Manager" />
              </div> */}
            </div>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-white border-t">
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
