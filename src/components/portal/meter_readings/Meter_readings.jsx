"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiUpload, apiDelete } from "@/lib/api";
import { buildUploadUrl } from "@/utils/common";
import { showErrorToast, showSuccessToast } from "@/utils/topTost";
import { confirmDelete } from "@/utils/confirmDelete";
import {
  Plus,
  X,
  Search,
  ChevronDown,
  Calendar,
  Edit3,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

const formatDateInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const formatDisplayDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const MeterReadings = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [readings, setReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectPage, setProjectPage] = useState(1);
  const [projectHasMore, setProjectHasMore] = useState(false);

  const [listSearch, setListSearch] = useState("");
  const [debouncedListSearch, setDebouncedListSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);

  const [selectedProject, setSelectedProject] = useState(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [debouncedProjectSearch, setDebouncedProjectSearch] = useState("");
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

  const [readingDate, setReadingDate] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  const loadProjects = async ({ page = 1, search = "", append = false } = {}) => {
    if (!user?.id) return;
    setProjectsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "20");
      params.append("offtaker_id", user.id);
      if (search && search.trim()) {
        params.append("search", search.trim());
      }

      const res = await apiGet(`/api/projects?${params.toString()}`);
      if (res?.success && Array.isArray(res.data)) {
        setProjects((prev) => (append ? [...prev, ...res.data] : res.data));
        setProjectPage(page);
        setProjectHasMore(res.data.length === 20);
      } else {
        if (!append) {
          setProjects([]);
        }
        setProjectHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load projects for meter readings:", error);
      if (!append) {
        setProjects([]);
      }
      setProjectHasMore(false);
    } finally {
      setProjectsLoading(false);
    }
  };

  const loadReadings = async ({
    page = 1,
    limit = entriesPerPage,
    search = "",
  } = {}) => {
    if (!user?.id) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (search && search.trim()) {
        params.append("search", search.trim());
      }

      const res = await apiGet(`/api/meter-reading?${params.toString()}`);
      if (res?.success && Array.isArray(res.data)) {
        setReadings(res.data);
        const total =
          typeof res.pagination?.total === "number"
            ? res.pagination.total
            : res.data.length;
        setTotalCount(total);
        setCurrentPage(page);
      } else {
        setReadings([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch meter readings:", error);
      setFetchError(
        error?.message ||
        lang(
          "meter.fetchError",
          "Unable to fetch meter readings. Please try again."
        )
      );
      setReadings([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    loadProjects({ page: 1, search: "" });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    loadReadings({
      page: currentPage,
      limit: entriesPerPage,
      search: debouncedListSearch,
    });
  }, [user?.id, currentPage, entriesPerPage, debouncedListSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedListSearch(listSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [listSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProjectSearch(projectSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [projectSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        projectDropdownOpen &&
        !event.target.closest(".meter-project-dropdown")
      ) {
        setProjectDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [projectDropdownOpen]);

  useEffect(() => {
    if (!projectDropdownOpen) return;
    loadProjects({ page: 1, search: debouncedProjectSearch });
  }, [projectDropdownOpen, debouncedProjectSearch]);

  const openAddModal = () => {
    setEditingReading(null);
    setSelectedProject(null);
    setProjectSearch("");
    setReadingDate(new Date().toISOString().slice(0, 10));
    setScreenshotFile(null);
    setExistingImageUrl(null);
    setIsModalOpen(true);
  };

  const openEditModal = (reading) => {
    setEditingReading(reading);
    const relatedProject = projects.find(
      (p) => p.id === reading.project_id || p.id === reading?.projects?.id
    );
    setSelectedProject(relatedProject || reading.projects || null);
    setProjectSearch("");
    setReadingDate(formatDateInput(reading.meter_reading_date));
    setScreenshotFile(null);
    setExistingImageUrl(buildUploadUrl(reading.image));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingReading(null);
    setSelectedProject(null);
    setProjectSearch("");
    setScreenshotFile(null);
    setExistingImageUrl(null);
  };

  const handleSave = async () => {
    if (!selectedProject?.id) {
      showErrorToast?.(
        lang("meter.projectRequired", "Please select a project first")
      );
      return;
    }

    const isEdit = !!editingReading?.id;

    if (!isEdit && !screenshotFile) {
      showErrorToast?.(
        lang(
          "meter.imageRequired",
          "Please upload meter screen image before saving"
        )
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      if (screenshotFile) {
        formData.append("file", screenshotFile);
      }
      formData.append("project_id", String(selectedProject.id));
      if (user?.id) {
        formData.append("offtaker_id", String(user.id));
      }
      if (readingDate) {
        formData.append("meter_reading_date", readingDate);
      }

      let res;
      if (isEdit) {
        res = await apiUpload(
          `/api/meter-reading/${editingReading.id}`,
          formData,
          { method: "PUT" }
        );
      } else {
        res = await apiUpload("/api/meter-reading", formData);
      }

      if (res?.success) {
        showSuccessToast?.(
          isEdit
            ? lang(
              "meter.updatedSuccessfully",
              "Meter reading updated successfully"
            )
            : lang(
              "meter.savedSuccessfully",
              "Meter reading saved successfully"
            )
        );
        closeModal();
        loadReadings({
          page: currentPage,
          limit: entriesPerPage,
          search: debouncedListSearch,
        });
      } else {
        showErrorToast?.(
          res?.message ||
          lang("meter.saveFailed", "Failed to save meter reading")
        );
      }
    } catch (error) {
      console.error("Save meter reading error:", error);
      showErrorToast?.(
        error?.message ||
        lang("meter.saveFailed", "Failed to save meter reading")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reading) => {
    const confirmed = await confirmDelete(
      lang("meter.deleteConfirmTitle", "Delete meter reading?"),
      lang(
        "meter.deleteConfirm",
        "Are you sure you want to delete this meter reading?"
      ),
      lang("meter.deleteConfirmButton", "Yes, delete it")
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);
      const res = await apiDelete(`/api/meter-reading/${reading.id}`);
      if (res?.success) {
        showSuccessToast?.(
          lang(
            "meter.deletedSuccessfullyReading",
            "Meter reading deleted successfully"
          )
        );
        loadReadings({
          page: currentPage,
          limit: entriesPerPage,
          search: debouncedListSearch,
        });
      } else {
        showErrorToast?.(
          res?.message ||
          lang("meter.deleteFailed", "Failed to delete meter reading")
        );
      }
    } catch (error) {
      console.error("Delete meter reading error:", error);
      showErrorToast?.(
        error?.message ||
        lang("meter.deleteFailed", "Failed to delete meter reading")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openImagePreview = (url) => {
    if (!url) return;
    setPreviewImageUrl(url);
    setIsImagePreviewOpen(true);
  };

  const closeImagePreview = () => {
    setIsImagePreviewOpen(false);
    setPreviewImageUrl(null);
  };

  return (
    <div className="col-12">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-200">
          <div>
            {/* <h2 className="text-lg font-semibold text-slate-900">
              {lang("meter.meterReadings", "Meter Readings")}
            </h2> */}
            {/* <p className="text-xs text-gray-500 mt-0.5">
              {lang(
                "meter.subtitle",
                "View, add, edit and delete your project meter readings."
              )}
            </p> */}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder={lang(
                  "meter.searchByProject",
                  "Search by project name..."
                )}
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {lang("meter.addReading", "Add Reading")}
            </button>
          </div>
        </div>

        {fetchError && (
          <div className="mx-4 mt-3 mb-1 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
            {fetchError}
          </div>
        )}

        <div className="px-4 py-3 overflow-x-auto">
          {isLoading ? (
            <div className="text-center text-sm text-gray-500 py-8">
              {lang("meter.loading", "Loading meter readings...")}
            </div>
          ) : readings.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-8">
              {lang("meter.noData", "No meter readings found.")}
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-gray-600">
                  <th className="px-3 py-2">
                    {lang("projects.projectName", "Project Name")}
                  </th>
                  <th className="px-3 py-2">
                    {lang("meter.readingDate", "Meter Reading Date")}
                  </th>
                  <th className="px-3 py-2">
                    {lang("meter.screenImage", "Screen Image")}
                  </th>
                  <th className="px-3 py-2 text-right rounded-tr-lg">
                    {lang("common.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {readings.map((item, index) => {
                  const projectName =
                    item?.projects?.project_name || lang("common.na", "N/A");
                  const imageUrl = buildUploadUrl(item.image);

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-3 py-2 text-sm font-medium text-slate-900">
                        {projectName}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {formatDisplayDate(item.meter_reading_date)}
                      </td>
                      <td className="px-3 py-2">
                        {imageUrl ? (
                          <button
                            type="button"
                            onClick={() => openImagePreview(imageUrl)}
                            className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900"
                          >
                            <ImageIcon className="w-4 h-4" />
                            {lang("meter.viewImage", "View image")}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {lang("common.na", "N/A")}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-full border border-gray-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            title={lang("common.edit", "Edit")}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-full border border-gray-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                            title={lang("common.delete", "Delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 pb-4 border-t border-gray-200 pt-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{lang("common.show", "Show")}</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setEntriesPerPage(next);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>{lang("common.entries", "entries")}</span>
              <span className="ml-2">
                ({lang("common.showing", "Showing")}{" "}
                {totalCount === 0
                  ? 0
                  : (currentPage - 1) * entriesPerPage + 1}
                -
                {Math.min(currentPage * entriesPerPage, totalCount)}{" "}
                {lang("common.of", "of")} {totalCount})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                &lt;
              </button>

              <div className="flex items-center gap-1 text-sm">
                <span>
                  {lang("common.page", "Page")} {currentPage}
                </span>
                <span>/</span>
                <span>
                  {Math.max(1, Math.ceil(totalCount / entriesPerPage))}
                </span>
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    p < Math.ceil(totalCount / entriesPerPage) ? p + 1 : p
                  )
                }
                disabled={
                  currentPage >= Math.ceil(totalCount / entriesPerPage)
                }
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {isImagePreviewOpen && previewImageUrl && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div
            className="absolute inset-0"
            onClick={closeImagePreview}
          />
          <div className="relative z-10 max-w-3xl w-full px-4">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  {lang("meter.screenImage", "Screen Image")}
                </h2>
                <button
                  type="button"
                  onClick={closeImagePreview}
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-black flex items-center justify-center max-h-[80vh]">
                <img
                  src={previewImageUrl}
                  alt={lang("meter.screenImage", "Screen Image")}
                  className="max-h-[80vh] w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="absolute inset-0"
            onClick={closeModal}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingReading
                  ? lang("meter.editReading", "Edit Meter Reading")
                  : lang("meter.addReading", "Add Meter Reading")}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="space-y-1 meter-project-dropdown relative">
                <label className="block text-sm font-medium text-slate-700">
                  {lang("projects.projectName", "Project Name")}
                </label>

                <button
                  type="button"
                  onClick={() => setProjectDropdownOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-gray-300 text-sm bg-white hover:bg-slate-50"
                >
                  <span className="truncate text-left">
                    {selectedProject?.project_name ||
                      lang(
                        "meter.selectProjectPlaceholder",
                        "Select project..."
                      )}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {projectDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-64 overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-500"
                          placeholder={lang(
                            "meter.searchProject",
                            "Search project..."
                          )}
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="max-h-52 overflow-auto text-sm">
                      {projectsLoading && projects.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-500">
                          {lang("meter.loadingProjects", "Loading projects...")}
                        </div>
                      ) : projects.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-500">
                          {lang(
                            "meter.noProjectsFound",
                            "No matching projects found."
                          )}
                        </div>
                      ) : (
                        projects.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedProject(p);
                              setProjectDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-1.5 text-left hover:bg-slate-50 ${selectedProject?.id === p.id
                                ? "bg-slate-100 font-medium"
                                : ""
                              }`}
                          >
                            {p.project_name}
                          </button>
                        ))
                      )}

                      {projectHasMore && !projectsLoading && (
                        <button
                          type="button"
                          onClick={() =>
                            loadProjects({
                              page: projectPage + 1,
                              search: debouncedProjectSearch,
                              append: true,
                            })
                          }
                          className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 border-t border-gray-100 text-center"
                        >
                          {lang("common.loadMore", "Load more")}
                        </button>
                      )}

                      {projectsLoading && projects.length > 0 && (
                        <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100">
                          {lang("meter.loadingProjects", "Loading projects...")}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  {lang("meter.screenImage", "Screen Image")}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setScreenshotFile(e.target.files?.[0] ?? null)
                  }
                  className="block w-full text-sm text-slate-700 file:mr-3 border border-gray-200 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
                />
                {screenshotFile ? (
                  <p className="text-xs text-slate-500 mt-1">
                    {screenshotFile.name}
                  </p>
                ) : existingImageUrl ? (
                  <div className="w-full h-auto object-contain">
                    <img
                      src={existingImageUrl}
                      height={50}
                      width={100}
                      alt={lang("meter.viewCurrentImage", "View current uploaded image")}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                ) : null}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  {lang("meter.readingDate", "Meter Reading Date")}
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={readingDate}
                    onChange={(e) => setReadingDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t px-5 py-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-gray-100"
                disabled={isSubmitting}
              >
                {lang("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {isSubmitting
                  ? lang("common.saving", "Saving...")
                  : lang("common.save", "Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeterReadings;

