 "use client";
import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiUpload } from "@/lib/api";
import { showSuccessToast, showErrorToast } from "@/utils/topTost";
import { useAuth } from "@/contexts/AuthContext";

const MeterReading = ({ isOpen, onClose, project }) => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [readingDate, setReadingDate] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReadingDate(new Date().toISOString().slice(0, 10));
      setScreenshotFile(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!project?.id) {
      showErrorToast?.(lang("meter.projectRequired", "Project not found"));
      return;
    }

    if (!screenshotFile) {
      showErrorToast?.(lang("meter.imageRequired", "Please upload meter screen image"));
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("file", screenshotFile);
      formData.append("project_id", String(project.id));
      formData.append("offtaker_id", String(user?.id));
      formData.append("meter_reading_date", readingDate);

      const res = await apiUpload("/api/meter-reading", formData);

      if (res?.success) {
        showSuccessToast?.(lang("meter.savedSuccessfully", "Meter reading saved successfully"));
        onClose?.();
      } else {
        showErrorToast?.(
          res?.message || lang("meter.saveFailed", "Failed to save meter reading")
        );
      }
    } catch (error) {
      showErrorToast?.(
        error?.message || lang("meter.saveFailed", "Failed to save meter reading")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {lang("meter.meterReading", "Meter Reading")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {project?.project_name && (
            <div className="text-sm text-slate-600 ">
              <span className="font-medium">
                {lang("projects.projectName", "Project Name")}:
              </span>{" "}
              {project.project_name}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              {lang("meter.screenImage", "Screen Image")}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setScreenshotFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-700 file:mr-3 border border-gray-200 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
            />
            {screenshotFile && (
              <p className="text-xs text-slate-500 mt-1">
                {screenshotFile.name}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              {lang("meter.readingDate", "Meter Reading Date")}
            </label>
            <input
              type="date"
              value={readingDate}
              onChange={(e) => setReadingDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button
            type="button"
            onClick={onClose}
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
  );
};

export default MeterReading;

