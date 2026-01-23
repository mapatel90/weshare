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
} from "@mui/material";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { showErrorToast, showSuccessToast } from "@/utils/topTost";
import { useAuth } from "@/contexts/AuthContext";
import { EMAIL_PLACEHOLDERS } from "@/utils/emailPlaceholders";

const SettingsEmailTemplate = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false); // saving state
  const [fetching, setFetching] = useState(false); // loading existing template
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null); // track which field has focus

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

  const resetForm = (data = {}) => {
    setFormData({
      title: data?.title || "",
      slug: data?.slug || "",
      subject: data?.subject || "",
      content_en: data?.content_en || "",
      content_vi: data?.content_vi || "",
    });
    setError("");
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
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      setFormData((prev) => ({
        ...prev,
        title: value,
        slug: slugified,
      }));
      return;
    }

    if (field === "slug") {
      const slugified = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      setFormData((prev) => ({
        ...prev,
        slug: slugified,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
    if (editorEnRef.current) {
      const viewFragment =
        editorEnRef.current.data.processor.toView(placeholder);
      const modelFragment = editorEnRef.current.data.toModel(viewFragment);
      editorEnRef.current.model.insertContent(modelFragment);
      editorEnRef.current.editing.view.focus();
    }
  };

  // Insert placeholder into CKEditor (Vietnamese)
  const insertPlaceholderInVietnamese = (placeholder) => {
    if (editorViRef.current) {
      const viewFragment =
        editorViRef.current.data.processor.toView(placeholder);
      const modelFragment = editorViRef.current.data.toModel(viewFragment);
      editorViRef.current.model.insertContent(modelFragment);
      editorViRef.current.editing.view.focus();
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug || !formData.subject) {
      setError("Title, Slug and Subject are required");
      showErrorToast("Title, Slug and Subject are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        ...formData,
        created_by: user?.id || null,
      };

      const res = isEdit && editingId
        ? await apiPut(`/api/email-templates/${editingId}`, payload)
        : await apiPost("/api/email-templates", payload);

      if (!res?.success) {
        throw new Error(res?.message || "Failed to save template");
      }

      showSuccessToast(
        isEdit ? "Email template updated" : "Email template created"
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("emailTemplate:saved"));
      }
handleReset();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to save template");
      showErrorToast(err?.message || "Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleExternalOpen = (event) => {
      handleLoadTemplate(event?.detail?.item || {});
    };

    window.addEventListener("emailTemplate:open-edit", handleExternalOpen);
    return () => {
      window.removeEventListener(
        "emailTemplate:open-edit",
        handleExternalOpen
      );
    };
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Left Side - Form */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              {isEdit ? "Edit Email Template" : "Add Email Template"}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {error && (
                <Grid item xs={12}>
                  <div style={{ color: "red", fontSize: 14 }}>{error}</div>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Title"
                  value={formData.title}
                  onChange={handleChange("title")}
                  fullWidth
                  disabled={loading || fetching}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Slug"
                  value={formData.slug}
                  onChange={handleChange("slug")}
                  fullWidth
                  disabled={loading || fetching}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" className="mb-1 fw-semibold">
                  Subject <span style={{ color: "red" }}>*</span>
                </Typography>
                <TextField
                  ref={subjectInputRef}
                  value={formData.subject}
                  onChange={handleChange("subject")}
                  onFocus={() => setFocusedField("subject")}
                  fullWidth
                  disabled={loading || fetching}
                  placeholder="Enter email subject"
                />
              </Grid>

              {/* Content EN */}
              <Grid item xs={12}>
                <Typography variant="body2" className="mb-2 fw-semibold">
                  Content (English)
                </Typography>
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
              </Grid>

              {/* Content VI */}
              <Grid item xs={12}>
                <Typography variant="body2" className="mb-2 fw-semibold">
                  Content (Vietnamese)
                </Typography>
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
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                  <Button onClick={handleReset} disabled={loading} variant="outlined">
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} /> : null}
                  >
                    {loading ? "Saving..." : "Save Template"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Right Side - Merge Fields */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardHeader 
              title="Merge Fields" 
              titleTypographyProps={{ variant: "h6" }}
            />
            <Divider />
            <CardContent>
              
              <Grid container spacing={1}>
                {EMAIL_PLACEHOLDERS.map((placeholder) => (
                  <Grid item xs={6} sm={6} key={placeholder.key}>
                    <Box
                      onClick={() => insertPlaceholder(placeholder.key)}
                      sx={{
                        p: 1.5,
                        border: "1px solid #ddd",
                        borderRadius: 1,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        backgroundColor: focusedField ? "#f9f9f9" : "#f5f5f5",
                        "&:hover": {
                          bgcolor: "#e3f2fd",
                          borderColor: "primary.main",
                          boxShadow: 1,
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <Typography variant="caption" fontWeight="bold" color="primary" sx={{ display: "block", mb: 0.5 }}>
                        {placeholder.key}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.65rem" }}>
                        {placeholder.description}
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
