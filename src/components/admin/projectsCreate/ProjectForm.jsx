import React, { useCallback, useMemo } from "react";
import { FiSave, FiUpload, FiX, FiStar } from "react-icons/fi";
import { useDropzone } from "react-dropzone";
import { getFullImageUrl } from "@/utils/common";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Button,
  CircularProgress,
  InputAdornment,
} from "@mui/material";

const ProjectForm = ({
  // data + errors + loading states
  formData,
  error = {},
  loading = { form: false },
  checkingName = false,
  projectTypes = [],
  offtakers = [],
  countries = [],
  states = [],
  cities = [],
  loadingOfftakers = false,
  loadingCountries = false,
  loadingStates = false,
  loadingCities = false,

  // handlers (provided by parent)
  handleInputChange,
  handleProjectNameBlur,
  handleOfftakerChange,
  handleLocationChange,
  handleSubmit,

  // gallery dropzone
  imageQueue = [],
  existingImages = [],
  onDropImages,
  onRemoveQueuedImage,
  onRemoveExistingImage,
  onSetDefaultImage, // <-- NEW prop: (id, 'existing'|'queued') => void
  maxProjectImages = 10,
  isImageSyncing = false,

  // i18n helper
  lang = (k, fallback) => fallback,
}) => {
  const totalImages = (existingImages?.length || 0) + (imageQueue?.length || 0);
  const availableSlots = Math.max(maxProjectImages - totalImages, 0);
  const isGalleryFull = availableSlots <= 0;
  const isTemporarilyDisabled = loading.form || isImageSyncing;
  const dropDisabled = isGalleryFull || isTemporarilyDisabled;

  const handleDrop = useCallback(
    (accepted, rejected) => {
      if (typeof onDropImages === "function") {
        onDropImages(accepted, rejected);
      }
    },
    [onDropImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { "image/*": [] },
    multiple: true,
    maxSize: 5 * 1024 * 1024,
    disabled: dropDisabled,
  });

  const galleryHasItems = useMemo(() => {
    return (
      (existingImages && existingImages.length > 0) ||
      (imageQueue && imageQueue.length > 0)
    );
  }, [existingImages, imageQueue]);

  const resolveExistingImageSrc = useCallback(
    (image) => {
      // debug: log resolved URL so you can inspect it in browser console on the live site
      const candidate = image?.path || image?.url || image?.image || image?.src || "";
      const full = getFullImageUrl(candidate);
      // eslint-disable-next-line no-console
      console.debug("[ProjectForm] resolved image url:", { candidate, full, image });
      return full;
    },
    []
  );
  return (
    <form id="project-form" onSubmit={handleSubmit}>
      <div className="card">
        <div className="card-header">
          <h6 className="card-title mb-0">
            {lang("projects.projectInformation", "Project Information")}
          </h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <FormControl fullWidth error={!!error.project_type_id}>
                <InputLabel id="project-type-select-label">
                  {lang("projects.projectType", "Project Type")} *
                </InputLabel>
                <Select
                  labelId="project-type-select-label"
                  name="project_type_id"
                  value={formData.project_type_id || ""}
                  label={`${lang("projects.projectType", "Project Type")} *`}
                  onChange={handleInputChange}
                >
                  <MenuItem value="">
                    {lang("projects.projectType", "Project Type")}
                  </MenuItem>
                  {projectTypes.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.type_name}
                    </MenuItem>
                  ))}
                </Select>
                {error.project_type_id && (
                  <FormHelperText>{error.project_type_id}</FormHelperText>
                )}
              </FormControl>
            </div>

            <div className="col-md-8 mb-3">
              <TextField
                fullWidth
                label={`${lang("projects.projectName", "Project Name")} *`}
                name="project_name"
                value={formData.project_name}
                onChange={handleInputChange}
                onBlur={handleProjectNameBlur}
                placeholder={lang(
                  "projects.projectNamePlaceholder",
                  "Enter project name"
                )}
                error={!!error.project_name}
                helperText={
                  error.project_name || (checkingName ? "Checking..." : "")
                }
                disabled={checkingName}
              />
            </div>

            <div className="col-md-8 mb-3">
              <TextField
                fullWidth
                label={`${lang("projects.projectSlug", "Project Slug")} *`}
                name="project_slug"
                value={formData.project_slug || ""}
                onChange={handleInputChange}
                placeholder={lang(
                  "projects.projectSlugPlaceholder",
                  "project-slug"
                )}
                error={!!error.project_slug}
                helperText={
                  error.project_slug ||
                  lang(
                    "projects.slugAutoGenerated",
                    "Auto-generated from project name"
                  )
                }
                disabled
              />
            </div>

            <div className="col-md-4 mb-3">
              <FormControl fullWidth error={!!error.offtaker}>
                <InputLabel id="offtaker-select-label">
                  {lang("projects.selectOfftaker", "Select Offtaker")}
                </InputLabel>
                <Select
                  labelId="offtaker-select-label"
                  name="offtaker"
                  value={formData.offtaker}
                  label={lang("projects.selectOfftaker", "Select Offtaker")}
                  onChange={handleOfftakerChange}
                  disabled={loadingOfftakers}
                >
                  <MenuItem value="">
                    {lang("projects.selectOfftaker", "Select Offtaker")}
                  </MenuItem>
                  {offtakers.map((offtaker) => (
                    <MenuItem key={offtaker.id} value={offtaker.id}>
                      {offtaker.fullName}
                    </MenuItem>
                  ))}
                </Select>
                {error.offtaker && (
                  <FormHelperText>{error.offtaker}</FormHelperText>
                )}
              </FormControl>
            </div>
          </div>

          {/* Row: asking_price, lease_term, product_code */}
          <div className="row mb-3">
            <div className="col-md-4">
              <TextField
                fullWidth
                label={lang("projects.askingPrice", "Asking Price")}
                name="asking_price"
                value={formData.asking_price || ""}
                onChange={handleInputChange}
                inputMode="decimal"
                error={!!error.asking_price}
                helperText={error.asking_price}
              />
            </div>
            <div className="col-md-4">
              <TextField
                fullWidth
                label={`${lang("projects.leaseTerm", "Lease Term")} ${lang(
                  "projects.year",
                  "year"
                )}`}
                name="lease_term"
                value={formData.lease_term || ""}
                onChange={handleInputChange}
                inputMode="numeric"
                error={!!error.lease_term}
                helperText={error.lease_term}
              />
            </div>
            <div className="col-md-4">
              <TextField
                fullWidth
                label={lang("projects.productCode", "Product Code")}
                name="product_code"
                value={formData.product_code || ""}
                onChange={handleInputChange}
                error={!!error.product_code}
                helperText={error.product_code}
              />
            </div>
          </div>

          {/* row: project_size, project_close_date, project_location */}
          <div className="row">
            <div className="col-md-3 mb-3">
              <TextField
                fullWidth
                label={lang("projects.projectSize", "Project Size (kW)")}
                name="project_size"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">kw</InputAdornment>
                  ),
                }}
                value={formData.project_size || ""}
                onChange={handleInputChange}
                inputMode="decimal"
                placeholder={lang(
                  "projects.projectSizePlaceholder",
                  "Enter project size"
                )}
                error={!!error.project_size}
                helperText={error.project_size}
              />
            </div>
            <div className="col-md-3 mb-3">
              <TextField
                fullWidth
                type="date"
                label={lang("projects.projectCloseDate", "Project Close Date")}
                name="project_close_date"
                value={formData.project_close_date || ""}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                error={!!error.project_close_date}
                helperText={error.project_close_date}
              />
            </div>
            <div className="col-md-6 mb-3">
              <TextField
                fullWidth
                label={lang("projects.projectLocation", "Project Location")}
                name="project_location"
                value={formData.project_location || ""}
                onChange={handleInputChange}
                placeholder={lang(
                  "projects.projectLocationPlaceholder",
                  "Enter location URL or address"
                )}
                error={!!error.project_location}
                helperText={
                  error.project_location ||
                  lang(
                    "projects.projectLocationHelp",
                    "Enter a URL (e.g., Google Maps link) or location name"
                  )
                }
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-12 mb-3">
              <TextField
                fullWidth
                label={lang(
                  "projects.projectDescription",
                  "Project Description"
                )}
                name="project_description"
                value={formData.project_description || ""}
                onChange={handleInputChange}
                multiline
                rows={4}
              />
            </div>
          </div>

          { /* Show Solis Plant ID only in edit mode (when formData.id exists) */ }
          {formData?.id ? (
            <div className="row">
              <div className="col-md-12 mb-3">
                <TextField
                  fullWidth
                  label={lang("projects.solisPlantId", "Solis Plant ID")}
                  name="solis_plant_id"
                  value={formData.solis_plant_id || ""}
                  onChange={handleInputChange}
                  placeholder={lang(
                    "projects.solisPlantIdPlaceholder",
                    "Enter Solis plant id"
                  )}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Project Gallery */}
      <div className="col-md-12 mt-3">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="card-title mb-0">
              {lang("projects.gallery", "Project Gallery")}
            </h6>
            <small className="text-muted">
              {lang("projects.galleryLimit", "Limit")}: {totalImages}/
              {maxProjectImages}
            </small>
          </div>
          <div className="card-body">
            <div
              {...getRootProps()}
              className={`border rounded text-center p-4 project-dropzone ${
                dropDisabled ? "dropzone-disabled" : ""
              } ${isDragActive ? "dropzone-active" : ""}`}
              style={{
                borderStyle: "dashed",
                cursor: dropDisabled ? "not-allowed" : "pointer",
                backgroundColor: isDragActive ? "#f3f6ff" : "transparent",
              }}
            >
              <input {...getInputProps()} />
              <FiUpload size={24} className="mb-2" />
              <p className="mb-1">
                {lang(
                  "projects.dropImages",
                  "Drag & drop images here, or click to browse"
                )}
              </p>
              <small className="text-muted d-block">
                {lang("projects.galleryHint", "PNG, JPG up to 5MB each")}
              </small>
              {dropDisabled && (
                <small className="text-danger d-block mt-2">
                  {isGalleryFull
                    ? lang(
                        "projects.galleryLimitReached",
                        "Maximum gallery size reached"
                      )
                    : lang(
                        "projects.galleryDisabledWhileSaving",
                        "Please wait, saving project images..."
                      )}
                </small>
              )}
            </div>

            {galleryHasItems ? (
              <div className="row mt-3">
                {existingImages?.map((image) => (
                  <div
                    className="col-md-3 col-sm-4 col-6 mb-3"
                    key={`existing-${image.id}`}
                  >
                    <div className="border rounded overflow-hidden project-image-thumb">
                      <img
                        src={resolveExistingImageSrc(image)}
                        alt="Project"
                        style={{
                          width: "100%",
                          height: 140,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />

                      {/* Action bar BELOW image */}
                      <div
                        className="p-2 d-flex justify-content-between align-items-center"
                        style={{ gap: 8 }}
                      >
                        <div
                          className="d-flex align-items-center"
                          style={{ gap: 8 }}
                        >
                          {image.default === 1 ? (
                            <span className="badge bg-primary">
                              {lang("projects.defaultImage", "Default")}
                            </span>
                          ) : null}
                        </div>

                        <div
                          className="d-flex align-items-center"
                          style={{ gap: 8 }}
                        >
                          {image.default !== 1 &&
                          typeof onSetDefaultImage === "function" ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={(e) => {
                                e.preventDefault();
                                onSetDefaultImage?.(image.id, "existing");
                              }}
                              title={lang(
                                "projects.setAsDefault",
                                "Set as default"
                              )}
                            >
                              <FiStar size={14} />{" "}
                              <span className="ms-1">
                                {lang("projects.setDefault", "Set default")}
                              </span>
                            </button>
                          ) : null}

                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => onRemoveExistingImage?.(image.id)}
                            title={lang("projects.removeImage", "Remove image")}
                          >
                            <FiX size={14} />{" "}
                            <span className="ms-1">
                              {lang("projects.remove", "Remove")}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {imageQueue?.map((file) => (
                  <div
                    className="col-md-3 col-sm-4 col-6 mb-3"
                    key={`queued-${file.id}`}
                  >
                    <div className="border rounded overflow-hidden project-image-thumb">
                      <img
                        src={file.preview}
                        alt={file.file?.name || "Project preview"}
                        style={{
                          width: "100%",
                          height: 140,
                          objectFit: "cover",
                          display: "block",
                          opacity: 0.95,
                        }}
                      />

                      {/* Action bar BELOW image */}
                      <div
                        className="p-2 d-flex justify-content-between align-items-center"
                        style={{ gap: 8 }}
                      >
                        <div
                          className="d-flex align-items-center"
                          style={{ gap: 8 }}
                        >
                          {file.default === 1 || file.isDefault ? (
                            <span className="badge bg-primary">
                              {lang("projects.defaultImage", "Default")}
                            </span>
                          ) : null}

                          <span className="badge bg-secondary">
                            {lang("projects.pendingUpload", "Pending")}
                          </span>
                        </div>

                        <div
                          className="d-flex align-items-center"
                          style={{ gap: 8 }}
                        >
                          {!(file.default === 1 || file.isDefault) &&
                          typeof onSetDefaultImage === "function" ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={(e) => {
                                e.preventDefault();
                                onSetDefaultImage?.(file.id, "queued");
                              }}
                              title={lang(
                                "projects.setAsDefault",
                                "Set as default"
                              )}
                            >
                              <FiStar size={14} />{" "}
                              <span className="ms-1">
                                {lang("projects.setDefault", "Set default")}
                              </span>
                            </button>
                          ) : null}

                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => onRemoveQueuedImage?.(file.id)}
                            title={lang("projects.removeImage", "Remove image")}
                          >
                            <FiX size={14} />{" "}
                            <span className="ms-1">
                              {lang("projects.remove", "Remove")}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="col-md-12">
        <div className="card">
          <div className="card-header">
            <h6 className="card-title mb-0">
              {lang("projects.addressInformation", "Address Information")}
            </h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <TextField
                  fullWidth
                  label={lang("projects.addressLine1", "Address Line 1")}
                  name="address1"
                  value={formData.address1}
                  onChange={handleInputChange}
                  placeholder={lang(
                    "projects.addressLine1Placeholder",
                    "Enter address line 1"
                  )}
                />
              </div>
              <div className="col-md-6 mb-3">
                <TextField
                  fullWidth
                  label={lang("projects.addressLine2", "Address Line 2")}
                  name="address2"
                  value={formData.address2}
                  onChange={handleInputChange}
                  placeholder={lang(
                    "projects.addressLine2Placeholder",
                    "Enter address line 2"
                  )}
                />
              </div>

              <div className="col-md-3 mb-3">
                <FormControl fullWidth error={!!error.countryId}>
                  <InputLabel id="country-select-label">
                    {lang("projects.country", "Country")}
                  </InputLabel>
                  <Select
                    labelId="country-select-label"
                    value={formData.countryId}
                    label={lang("projects.country", "Country")}
                    onChange={(e) =>
                      handleLocationChange("country", e.target.value)
                    }
                    disabled={loadingCountries}
                  >
                    <MenuItem value="">
                      {lang("projects.selectCountry", "Select Country")}
                    </MenuItem>
                    {countries.map((country) => (
                      <MenuItem key={country.id} value={country.id}>
                        {country.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {error.countryId && (
                    <FormHelperText>{error.countryId}</FormHelperText>
                  )}
                </FormControl>
              </div>

              <div className="col-md-3 mb-3">
                <FormControl fullWidth error={!!error.stateId}>
                  <InputLabel id="state-select-label">
                    {lang("projects.state", "State")}
                  </InputLabel>
                  <Select
                    labelId="state-select-label"
                    value={formData.stateId}
                    label={lang("projects.state", "State")}
                    onChange={(e) =>
                      handleLocationChange("state", e.target.value)
                    }
                    disabled={loadingStates || !formData.countryId}
                  >
                    <MenuItem value="">
                      {lang("projects.selectState", "Select State")}
                    </MenuItem>
                    {states.map((state) => (
                      <MenuItem key={state.id} value={state.id}>
                        {state.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {error.stateId && (
                    <FormHelperText>{error.stateId}</FormHelperText>
                  )}
                </FormControl>
              </div>

              <div className="col-md-3 mb-3">
                <FormControl fullWidth error={!!error.cityId}>
                  <InputLabel id="city-select-label">
                    {lang("projects.city", "City")}
                  </InputLabel>
                  <Select
                    labelId="city-select-label"
                    value={formData.cityId}
                    label={lang("projects.city", "City")}
                    onChange={(e) =>
                      handleLocationChange("city", e.target.value)
                    }
                    disabled={loadingCities || !formData.stateId}
                  >
                    <MenuItem value="">
                      {lang("projects.selectCity", "Select City")}
                    </MenuItem>
                    {cities.map((city) => (
                      <MenuItem key={city.id} value={city.id}>
                        {city.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {error.cityId && (
                    <FormHelperText>{error.cityId}</FormHelperText>
                  )}
                </FormControl>
              </div>

              <div className="col-md-3 mb-3">
                <TextField
                  fullWidth
                  label={lang("projects.zipcode", "Zip Code")}
                  name="zipcode"
                  value={formData.zipcode}
                  onChange={handleInputChange}
                  placeholder={lang(
                    "projects.zipcodePlaceholder",
                    "Enter zip code"
                  )}
                />
              </div>

              <div className="col-md-3 mb-3">
                <TextField
                  fullWidth
                  label={`${lang(
                    "projects.investorProfit",
                    "Investor Profit"
                  )} %`}
                  name="investorProfit"
                  value={formData.investorProfit}
                  onChange={handleInputChange}
                  error={!!error.investorProfit}
                  helperText={error.investorProfit}
                />
              </div>

              <div className="col-md-3 mb-3">
                <TextField
                  fullWidth
                  label={`${lang(
                    "projects.weshareprofite",
                    "Weshare profite"
                  )} %`}
                  name="weshareprofite"
                  value={formData.weshareprofite}
                  onChange={handleInputChange}
                  placeholder={lang(
                    "projects.weshareprofitePlaceholder",
                    "Enter weshare profite"
                  )}
                  error={!!error.weshareprofite}
                  helperText={error.weshareprofite}
                />
              </div>

              <div className="col-md-3 mb-3">
                <FormControl fullWidth error={!!error.status}>
                  <InputLabel id="status-select-label">
                    {lang("projects.status", "Status")}
                  </InputLabel>
                  <Select
                    labelId="status-select-label"
                    name="status"
                    value={formData.status}
                    label={lang("projects.status", "Status")}
                    onChange={handleInputChange}
                  >
                    <MenuItem value="">
                      {lang("projects.selectStatus", "Select Status")}
                    </MenuItem>
                    <MenuItem value="active">
                      {lang("projects.active", "Active")}
                    </MenuItem>
                    <MenuItem value="inactive">
                      {lang("projects.inactive", "Inactive")}
                    </MenuItem>
                  </Select>
                  {error.status && (
                    <FormHelperText>{error.status}</FormHelperText>
                  )}
                </FormControl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 d-flex justify-content-end">
        <Button
          type="submit"
          variant="contained"
          disabled={loading.form}
          startIcon={loading.form ? <CircularProgress size={16} /> : <FiSave />}
          className="common-grey-color"
          style={{
            marginTop: "2px",
            marginBottom: "2px",
            marginRight: 0,
            marginLeft: 0,
          }}
        >
          {loading.form
            ? lang("common.saving", "Saving")
            : lang("projects.saveProject", "Save Project")}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;
