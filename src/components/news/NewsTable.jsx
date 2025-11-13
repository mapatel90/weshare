"use client";
import React, { useEffect, useMemo, useState } from "react";
import Table from "@/components/shared/table/Table";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from "@/lib/api";
import { showSuccessToast } from "@/utils/topTost";
import Swal from "sweetalert2";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Typography,
  Stack,
  Box,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { getFullImageUrl } from "@/utils/common";

const NewsTable = () => {
  const { lang } = useLanguage();

  const [newsData, setNewsData] = useState([]);

  // Modal/form state
  const [modalMode, setModalMode] = useState(null); // "add" | "edit" | null
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // fields required by API
  const [newsTitle, setNewsTitle] = useState("");
  const [newsDate, setNewsDate] = useState(""); // yyyy-mm-dd
  const [newsImage, setNewsImage] = useState("");
  const [newsImageFile, setNewsImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [newsDescription, setNewsDescription] = useState("");
  const [newsSlug, setNewsSlug] = useState("");
  const [slugChecking, setSlugChecking] = useState(false);

  // ---------- simple helpers ----------
  const clearError = (key) =>
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));

  const slugify = (value) =>
    (value || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const toDateInput = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
  };

  const applyImageSelection = (file) => {
    setNewsImageFile(file || null);
    if (file) {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      setNewsImage("");
    } else {
      setImagePreviewUrl(getFullImageUrl(newsImage) || "");
    }
  };

  const buildFormData = () => {
    const form = new FormData();
    form.append("news_title", newsTitle);
    form.append("news_date", newsDate);
    form.append("news_description", newsDescription);
    form.append("news_slug", newsSlug);
    if (newsImageFile) form.append("news_image", newsImageFile);
    else if (!editingId && newsImage) form.append("news_image", newsImage);
    return form;
  };

  const resetForm = () => {
    setEditingId(null);
    setNewsTitle("");
    setNewsDate("");
    setNewsImage("");
    setNewsImageFile(null);
    setImagePreviewUrl("");
    setNewsDescription("");
    setNewsSlug("");
    setErrors({});
  };

  const checkSlugUnique = async (slug) => {
    if (!slug) return true;
    setSlugChecking(true);
    try {
      const qs = new URLSearchParams({ slug, ...(editingId ? { excludeId: editingId } : {}) }).toString();
      const res = await apiGet(`/api/news/check-slug?${qs}`);
      if (res && res.success && res.data && typeof res.data.exists !== "undefined") {
        return !res.data.exists;
      }
      if (res && typeof res.exists !== "undefined") return !res.exists;
    } catch (err) {
      // treat as unique on failure
    } finally {
      setSlugChecking(false);
    }
    return true;
  };

  const fetchNews = async () => {
    try {
      const response = await apiGet("/api/news");
      if (response?.success && Array.isArray(response?.data)) {
        setNewsData(response.data);
      }
    } catch (e) {
      // noop
    }
  };

  useEffect(() => {
    fetchNews();

    const onSaved = () => fetchNews();
    if (typeof window !== "undefined") {
      window.addEventListener("news:saved", onSaved);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("news:saved", onSaved);
      }
    };
  }, []);

  // Open modal listener (both add and edit)
  useEffect(() => {
    const openEdit = (e) => {
      const item = e?.detail?.item;
      if (!item) {
        setModalMode("add");
        resetForm();
        return;
      }
      setModalMode("edit");
      setEditingId(item?.id ?? null);
      setNewsTitle(item?.news_title || "");
      setNewsDate(toDateInput(item?.news_date));
      setNewsImage(item?.news_image || "");
      setNewsImageFile(null);
      setImagePreviewUrl(getFullImageUrl(item?.news_image) || "");
      setNewsDescription(item?.news_description || "");
      setNewsSlug(item?.news_slug || "");
      setErrors({});
    };
    if (typeof window !== "undefined") {
      window.addEventListener("news:open-edit", openEdit);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("news:open-edit", openEdit);
      }
    };
  }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: lang("messages.confirmDelete"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: lang("common.yesDelete") || "Yes, delete it!",
      cancelButtonText: lang("common.cancel") || "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await apiDelete(`/api/news/${id}`);
      if (res?.success) {
        showSuccessToast(
          lang("news.newsDeletedSuccessfully") || "Deleted successfully"
        );
        fetchNews();
      }
    } catch (e) {
      // noop
    }
  };

  const validate = () => {
    const required = (v, fallback) => (v ? "" : fallback);
    const newErrors = {
      newsTitle: required(
        newsTitle,
        lang("validation.newsTitleRequired") || "Title is required"
      ),
      newsDate: required(
        newsDate,
        lang("validation.newsDateRequired") || "Date is required"
      ),
      newsImage:
        !editingId && !(newsImageFile || newsImage)
          ? lang("validation.newsImageRequired") || "Image is required"
          : "",
      newsDescription: required(
        newsDescription,
        lang("validation.newsDescriptionRequired") || "Description is required"
      ),
      newsSlug: required(
        newsSlug,
        lang("validation.newsSlugRequired") || "Slug is required"
      ),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const unique = await checkSlugUnique(newsSlug);
      if (!unique) {
        setErrors((prev) => ({ ...prev, newsSlug: lang("validation.newsSlugExists") || "Slug already exists" }));
        return;
      }
      const form = buildFormData();
      const res = editingId
        ? await apiUpload(`/api/news/${editingId}`, form, { method: "PUT" })
        : await apiUpload("/api/news", form);

      if (res?.success) {
        showSuccessToast(
          editingId
            ? lang("news.newsUpdatedSuccessfully") || "Updated successfully"
            : lang("news.newsCreatedSuccessfully") || "Created successfully"
        );
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("news:saved"));
        }
        handleCloseModal();
      }
    } catch (e) {
      // noop
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setModalMode(null);
    resetForm();
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "news_title",
        header: () => lang("news.title") || "Title",
      },
      {
        accessorKey: "news_date",
        header: () => lang("news.date") || "Date",
        cell: ({ row }) => {
          const d = row.original.news_date
            ? new Date(row.original.news_date)
            : null;
          return d ? d.toLocaleDateString() : "";
        },
      },
      {
        accessorKey: "news_image",
        header: () => lang("news.image") || "Image",
        cell: ({ row }) => {
          const src = row.original.news_image;
          if (!src) return "";
          return (
            <img
              src={getFullImageUrl(src)}
              alt="news"
              style={{
                width: 48,
                height: 32,
                objectFit: "cover",
                borderRadius: 4,
              }}
            />
          );
        },
      },
      // { accessorKey: "news_slug", header: () => lang("news.slug") || "Slug" },
      // {
      //   accessorKey: "news_description",
      //   header: () => lang("news.description") || "Description",
      //   cell: ({ row }) => {
      //     const t = row.original.news_description || "";
      //     return t.length > 80 ? `${t.slice(0, 80)}…` : t;
      //   },
      // },
      {
        accessorKey: "actions",
        header: () => lang("common.actions"),
        meta: { disableSort: true },
        cell: ({ row }) => (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap" }}>
            <IconButton
              size="small"
              onClick={() => {
                const item = row.original;
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("news:open-edit", { detail: { item } })
                  );
                }
              }}
              sx={{
                color: "#1976d2",
                transition: "transform 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                  transform: "scale(1.1)",
                },
              }}
            >
              <FiEdit3 size={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDelete(row.original.id)}
              sx={{
                color: "#d32f2f",
                transition: "transform 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(211, 47, 47, 0.08)",
                  transform: "scale(1.1)",
                },
              }}
            >
              <FiTrash2 size={18} />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [lang]
  );

  return (
    <>
      <Table data={newsData} columns={columns} />

      <Dialog
        open={!!modalMode}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Typography variant="h6" component="span">
            {modalMode === "edit"
              ? lang("news.editNews") || "Edit News"
              : lang("news.addNews") || "Add News"}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
            <TextField
              label={lang("news.title") || "Title"}
              value={newsTitle}
              onChange={(e) => {
                const val = e.target.value;
                const newSlug = slugify(val);
                setNewsTitle(val);
                setNewsSlug(newSlug);
                clearError("newsTitle");

                setErrors((prev) => (prev && prev.newsSlug ? { ...prev, newsSlug: "" } : prev));
              }}
              onBlur={async () => {
                if (!newsSlug) return;
                const unique = await checkSlugUnique(newsSlug);
                if (!unique) {
                  setErrors((prev) => ({ ...prev, newsSlug: lang("validation.newsSlugExists") || "Slug already exists" }));
                }
              }}
              error={!!errors.newsTitle}
              helperText={errors.newsTitle}
              fullWidth
            />

            <TextField
              label={lang("news.slug") || "Slug"}
              value={newsSlug}
              disabled
              error={!!errors.newsSlug}
              helperText={errors.newsSlug || (slugChecking ? (lang("common.checking") || "Checking availability...") : "")}
              fullWidth
            />

            <TextField
              label={lang("news.date") || "Date"}
              type="date"
              InputLabelProps={{ shrink: true }}
              value={newsDate}
              onChange={(e) => {
                setNewsDate(e.target.value);
                clearError("newsDate");
              }}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              error={!!errors.newsDate}
              helperText={errors.newsDate}
              fullWidth
            />

            <Box>
              {/* <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 500, color: "text.secondary" }}
              >
                {lang("news.image") || "Image"}
              </Typography> */}

              <TextField
                fullWidth
                type="file"
                inputProps={{ accept: "image/*" }}
                label={lang("news.image") || "Upload Image"}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => {
                  const file = (e.target.files && e.target.files[0]) || null;
                  applyImageSelection(file);
                  clearError("newsImage");
                }}
                error={!!errors.newsImage}
                helperText={errors.newsImage}
              />

              {(imagePreviewUrl || newsImage) && (
                <Box sx={{ mt: 1 }}>
                  <img
                    src={imagePreviewUrl || newsImage}
                    alt="preview"
                    style={{
                      width: 160,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "1px solid #eee",
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* <TextField
              label={lang("news.description") || "Description"}
              value={newsDescription}
              onChange={(e) => {
                setNewsDescription(e.target.value);
                if (errors.newsDescription) setErrors((p) => ({ ...p, newsDescription: "" }));
              }}
              error={!!errors.newsDescription}
              helperText={errors.newsDescription}
              fullWidth
              multiline
              minRows={3}
            /> */}

            <Box
              sx={{
                '& .ck-editor__editable_inline': {
                  minHeight: 360,
                },
                '& .ck-editor__editable_inline:focus': {
                  minHeight: 360,
                },
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 500, color: "text.secondary" }}
              >
                {lang("news.description") || "Description"}
              </Typography>

              <CKEditor
                editor={
                  typeof window !== "undefined" && window.ClassicEditor
                    ? window.ClassicEditor
                    : ClassicEditor
                }
                data={newsDescription}
                onChange={(event, editor) => {
                  setNewsDescription(editor.getData());
                  clearError("newsDescription");
                }}
                config={{
                  toolbar: {
                    items: [
                      "heading",
                      "|",
                      "bold",
                      "italic",
                      "underline",
                      "strikethrough",
                      "fontSize",
                      "fontFamily",
                      "fontColor",
                      "fontBackgroundColor",
                      "highlight",
                      "removeFormat",
                      "|",
                      "link",
                      "blockQuote",
                      "code",
                      "codeBlock",
                      "insertTable",
                      "imageUpload",
                      "mediaEmbed",
                      "horizontalLine",
                      "|",
                      "alignment",
                      "bulletedList",
                      "numberedList",
                      "outdent",
                      "indent",
                      "|",
                      "undo",
                      "redo",
                    ],
                    shouldNotGroupWhenFull: true,
                  },
                }}
              />

              {errors.newsDescription && (
                <Typography
                  color="error"
                  variant="caption"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  {errors.newsDescription}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={handleCloseModal}
            color="error"
            variant="outlined"
            className="custom-orange-outline"
          >
            {lang("common.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={submitting}
            className="common-grey-color"
          >
            {submitting ? lang("common.loading") : lang("common.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NewsTable;
