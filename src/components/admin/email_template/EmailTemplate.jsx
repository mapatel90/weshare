"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  Grid,
  TextField,
  CircularProgress,
  Chip,
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  TextareaAutosize,
} from "@mui/material";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { showErrorToast, showSuccessToast } from "@/utils/topTost";
import { useAuth } from "@/contexts/AuthContext";
import { EMAIL_PLACEHOLDERS } from "@/utils/emailPlaceholders";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { getDarkModeColors, useDarkMode } from "@/utils/common";

const SettingsEmailTemplate = ({ Id }) => {
  const { user } = useAuth();
  const isDark = useDarkMode();
  const colors = getDarkModeColors(isDark);
  const router = useRouter();
  const [loading, setLoading] = useState(false); // saving state
  const [fetching, setFetching] = useState(false); // loading existing template
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null); // track which field has focus
  const { lang } = useLanguage();
  const [fieldErrors, setFieldErrors] = useState({
    title: "",
    slug: "",
    subject: "",
  });

  const subjectInputRef = useRef(null);
  const editorEnRef = useRef(null);
  const editorViRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    subject: "",
    content_en: "",
    content_vi: "",
  });

  // Editor mode states (visual or html)
  const [editorModeEn, setEditorModeEn] = useState("visual"); // "visual" or "html"
  const [editorModeVi, setEditorModeVi] = useState("visual"); // "visual" or "html"

  const resetForm = (data = {}) => {
    setFormData({
      title: data?.title || "",
      slug: data?.slug || "",
      subject: data?.subject || "",
      content_en: data?.content_en || "",
      content_vi: data?.content_vi || "",
    });
    setError("");
    setFieldErrors({ title: "", slug: "", subject: "" });
  };

  const fetchTemplate = async (id) => {
    try {
      setFetching(true);
      const res = await apiGet(`/api/email-templates/${id}`);
      if (res?.success && res?.data) {
        resetForm(res.data);
      }
    } catch (err) {
      console.error("Failed to load template", err);
      showErrorToast(err?.message || "Failed to load template");
    } finally {
      setFetching(false);
    }
  };

  const handleLoadTemplate = (data = {}) => {
    if (data?.id) {
      setIsEdit(true);
      setEditingId(data.id);
      resetForm(data);
      fetchTemplate(data.id);
    } else {
      setIsEdit(false);
      setEditingId(null);
      resetForm();
    }
  };

  const handleReset = () => {
    if (!loading) {
      setIsEdit(false);
      setEditingId(null);
      resetForm();
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;

    if (field === "title") {
      const slugified = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s_]/g, "")
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");

      setFormData((prev) => ({
        ...prev,
        title: value,
        slug: slugified,
      }));
      if (fieldErrors.title && value.trim() !== "") {
        setFieldErrors((prev) => ({ ...prev, title: "" }));
      }
      if (fieldErrors.slug && slugified.trim() !== "") {
        setFieldErrors((prev) => ({ ...prev, slug: "" }));
      }
      return;
    }

    if (field === "slug") {
      const slugified = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s_]/g, "")
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");

      setFormData((prev) => ({
        ...prev,
        slug: slugified,
      }));
      if (fieldErrors.slug && slugified.trim() !== "") {
        setFieldErrors((prev) => ({ ...prev, slug: "" }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (field === "subject" && fieldErrors.subject && value.trim() !== "") {
      setFieldErrors((prev) => ({ ...prev, subject: "" }));
    }
  };

  // Unified insert placeholder function based on focused field
  const insertPlaceholder = (placeholder) => {
    if (!focusedField) {
      showErrorToast("Please click on a field first");
      return;
    }

    if (focusedField === "subject") {
      insertPlaceholderInSubject(placeholder);
    } else if (focusedField === "content_en") {
      insertPlaceholderInEnglish(placeholder);
    } else if (focusedField === "content_vi") {
      insertPlaceholderInVietnamese(placeholder);
    }
  };

  // Insert placeholder into subject field
  const insertPlaceholderInSubject = (placeholder) => {
    const input = subjectInputRef.current?.querySelector("input");
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const text = formData.subject;
      const newText =
        text.substring(0, start) + placeholder + text.substring(end);

      setFormData((prev) => ({ ...prev, subject: newText }));

      setTimeout(() => {
        input.focus();
        const newPos = start + placeholder.length;
        input.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      setFormData((prev) => ({ ...prev, subject: prev.subject + placeholder }));
    }
  };

  // Insert placeholder into CKEditor (English)
  const insertPlaceholderInEnglish = (placeholder) => {
    if (editorModeEn === "html") {
      // Insert into HTML textarea
      setFormData((prev) => ({
        ...prev,
        content_en: prev.content_en + placeholder,
      }));
    } else if (editorEnRef.current) {
      // Insert into CKEditor
      const viewFragment =
        editorEnRef.current.data.processor.toView(placeholder);
      const modelFragment = editorEnRef.current.data.toModel(viewFragment);
      editorEnRef.current.model.insertContent(modelFragment);
      editorEnRef.current.editing.view.focus();
    }
  };

  // Insert placeholder into CKEditor (Vietnamese)
  const insertPlaceholderInVietnamese = (placeholder) => {
    if (editorModeVi === "html") {
      // Insert into HTML textarea
      setFormData((prev) => ({
        ...prev,
        content_vi: prev.content_vi + placeholder,
      }));
    } else if (editorViRef.current) {
      // Insert into CKEditor
      const viewFragment =
        editorViRef.current.data.processor.toView(placeholder);
      const modelFragment = editorViRef.current.data.toModel(viewFragment);
      editorViRef.current.model.insertContent(modelFragment);
      editorViRef.current.editing.view.focus();
    }
  };

  const handleSave = async () => {
    const nextErrors = {
      title: "",
      slug: "",
      subject: "",
    };

    if (!formData.title || formData.title.trim() === "") {
      nextErrors.title = lang("email.titleRequired", "Title is required");
    }

    if (!formData.slug || formData.slug.trim() === "") {
      nextErrors.slug = lang("email.slugRequired", "Slug is required");
    }

    if (!formData.subject || formData.subject.trim() === "") {
      nextErrors.subject = lang("email.subjectRequired", "Subject is required");
    }

    setFieldErrors(nextErrors);

    if (nextErrors.title || nextErrors.slug || nextErrors.subject) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        ...formData,
        created_by: user?.id || null,
      };

      const res =
        isEdit && editingId
          ? await apiPut(`/api/email-templates/${editingId}`, payload)
          : await apiPost("/api/email-templates", payload);

      if (!res?.success) {
        throw new Error(res?.message || "Failed to save template");
      }

      showSuccessToast(
        isEdit ? "Email template updated" : "Email template created",
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("emailTemplate:saved"));
      }
      router.push("/admin/email_template/list");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to save template");
      showErrorToast(err?.message || "Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  // Load template when Id prop is provided (from route params)
  useEffect(() => {
    if (Id) {
      setIsEdit(true);
      setEditingId(Id);
      fetchTemplate(Id);
    }
  }, [Id]);

  useEffect(() => {
    const handleExternalOpen = (event) => {
      handleLoadTemplate(event?.detail?.item || {});
    };

    window.addEventListener("emailTemplate:open-edit", handleExternalOpen);
    return () => {
      window.removeEventListener("emailTemplate:open-edit", handleExternalOpen);
    };
  }, []);

  return (
    <Box sx={{ p: 3, backgroundColor: isDark ? "#0f172a" : "#fff" }}>
      <Grid container spacing={3}>
        {/* Left Side - Form */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, backgroundColor: isDark ? "#121a2d" : "#fff" }}>
            <Typography variant="h5" gutterBottom>
              {isEdit ? lang("common.editEmailTemplate") : lang("common.addEmailTemplate")}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={lang("common.title") || "Title"}
                  value={formData.title}
                  onChange={handleChange("title")}
                  error={!!fieldErrors.title}
                  helperText={fieldErrors.title}
                  fullWidth
                  disabled={loading || fetching}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label={lang("news.slug") || "Slug"}
                  value={formData.slug}
                  onChange={handleChange("slug")}
                  error={!!fieldErrors.slug}
                  helperText={fieldErrors.slug}
                  fullWidth
                  disabled={loading || fetching}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" className="mb-1 fw-semibold" color={isDark ? "white" : "black"}>
                  {lang("contactUs.subject") || "Subject"} <span style={{ color: "red" }}>*</span>
                </Typography>
                <TextField
                  ref={subjectInputRef}
                  value={formData.subject}
                  onChange={handleChange("subject")}
                  onFocus={() => setFocusedField("subject")}
                  error={!!fieldErrors.subject}
                  helperText={fieldErrors.subject}
                  fullWidth
                  disabled={loading || fetching}
                  placeholder={lang("email.subjectPlaceholder") || "Enter email subject"}
                />
              </Grid>

              {/* Content EN */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" className="fw-semibold">
                    {lang("email.content") || "Content (English)"}
                  </Typography>
                  <ToggleButtonGroup
                    value={editorModeEn}
                    exclusive
                    onChange={(e, newMode) => {
                      if (newMode !== null) {
                        setEditorModeEn(newMode);
                      }
                    }}
                    size="small"
                  >
                    <ToggleButton value="visual">Visual</ToggleButton>
                    <ToggleButton value="html">HTML</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {editorModeEn === "visual" ? (
                  <CKEditor
                    editor={ClassicEditor}
                    data={formData.content_en}
                    disabled={loading || fetching}
                    onReady={(editor) => {
                      editorEnRef.current = editor;
                    }}
                    onFocus={() => setFocusedField("content_en")}
                    onChange={(event, editor) => {
                      setFormData((prev) => ({
                        ...prev,
                        content_en: editor.getData(),
                      }));
                    }}
                  />
                ) : (
                  <TextField
                    multiline
                    rows={15}
                    value={formData.content_en}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        content_en: e.target.value,
                      }));
                    }}
                    onFocus={() => setFocusedField("content_en")}
                    fullWidth
                    disabled={loading || fetching}
                    placeholder="Enter HTML code here..."
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: 'monospace',
                        fontSize: '14px',
                      }
                    }}
                  />
                )}
              </Grid>

              {/* Content VI */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" className="fw-semibold">
                    {lang("email.content_vi") || "Content (Vietnamese)"}
                  </Typography>
                  <ToggleButtonGroup
                    value={editorModeVi}
                    exclusive
                    onChange={(e, newMode) => {
                      if (newMode !== null) {
                        setEditorModeVi(newMode);
                      }
                    }}
                    size="small"
                  >
                    <ToggleButton value="visual">Visual</ToggleButton>
                    <ToggleButton value="html">HTML</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {editorModeVi === "visual" ? (
                  <CKEditor
                    editor={ClassicEditor}
                    data={formData.content_vi}
                    disabled={loading || fetching}
                    onReady={(editor) => {
                      editorViRef.current = editor;
                    }}
                    onFocus={() => setFocusedField("content_vi")}
                    onChange={(event, editor) => {
                      setFormData((prev) => ({
                        ...prev,
                        content_vi: editor.getData(),
                      }));
                    }}
                  />
                ) : (
                  <TextField
                    multiline
                    rows={15}
                    value={formData.content_vi}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        content_vi: e.target.value,
                      }));
                    }}
                    onFocus={() => setFocusedField("content_vi")}
                    fullWidth
                    disabled={loading || fetching}
                    placeholder="Enter HTML code here..."
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: 'monospace',
                        fontSize: '14px',
                      }
                    }}
                  />
                )}
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}
                >
                  <Button
                    onClick={handleReset}
                    disabled={loading}
                    variant="outlined"
                  >
                    {lang("common.reset") || "Reset"}
                  </Button>
                  {isEdit && formData.slug && (
                    <Button
                      variant="outlined"
                      color="info"
                      onClick={() => {
                        const previewUrl = `/api/email-templates/view/template/${formData.slug}`;
                        window.open(previewUrl, '_blank');
                      }}
                      disabled={loading || !formData.slug}
                    >
                      Preview Template
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} /> : null}
                  >
                    {loading ? "Saving..." : (lang("email.saveTemplate") || "Save Template")}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Right Side - Merge Fields */}
        <Grid item xs={12} md={4} sx={{ backgroundColor: isDark ? "#121a2d" : "#fff" }}>
          <Card elevation={2} sx={{ backgroundColor: isDark ? "#121a2d" : "#fff" }}>
            <CardHeader
              title={lang("email.mergeFields") || "Merge Fields"}
              titleTypographyProps={{ variant: "h6", color: isDark ? "white" : "primary" }}
            />
            <Divider />
            <CardContent sx={{ backgroundColor: isDark ? "#121a2d" : "#fff" }}>
              <Grid container spacing={1} sx={{ backgroundColor: isDark ? "#121a2d" : "#fff" }}>
                {EMAIL_PLACEHOLDERS.map((placeholder) => (
                  <Grid item xs={6} sm={6} key={placeholder.key}>
                    <Box
                      onClick={() => insertPlaceholder(placeholder.key)}
                      sx={{
                        p: 1.5,
                        border: "1px solid " + (isDark ? "#1b2436" : "#e5e7eb"),
                        borderRadius: 1,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        backgroundColor: focusedField ? (isDark ? "#1b2436" : "#f9f9f9") : (isDark ? "#1b2436" : "#f5f5f5"),
                        "&:hover": {
                          bgcolor: isDark ? "#1b2436" : "#e3f2fd",
                          borderColor: "primary.main",
                          boxShadow: 1,
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        color="primary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        {placeholder.key}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsEmailTemplate;
