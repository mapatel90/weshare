"use client";
import React, { useEffect, useMemo, useState } from "react";
import Table from "@/components/shared/table/Table";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiUpload, apiDelete } from "@/lib/api";
import { showSuccessToast } from "@/utils/topTost";
import Swal from "sweetalert2";
import { FiEdit, FiEdit3, FiTrash2 } from "react-icons/fi";
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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { buildUploadUrl, getFullImageUrl } from "@/utils/common";
import usePermissions from "@/hooks/usePermissions";

const BlogTable = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [blogData, setBlogData] = useState([]);
  const [modalMode, setModalMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [blogTitle, setBlogTitle] = useState("");
  const [blogDate, setBlogDate] = useState("");
  const [blogImage, setBlogImage] = useState("");
  const [blogImageFile, setBlogImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [blogDescription, setBlogDescription] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [slugChecking, setSlugChecking] = useState(false);
  const [imageType, setImageType] = useState("image"); // "image" | "youtube"
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const { canEdit, canDelete } = usePermissions();
  const showActionColumn = canEdit("blog") || canDelete("blog");

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
    setBlogImageFile(file || null);
    if (file) {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      setBlogImage("");
    } else {
      setImagePreviewUrl(blogImage || "");
    }
  };

  const buildFormData = () => {
    const form = new FormData();
    form.append("blog_title", blogTitle);
    form.append("blog_date", blogDate);
    form.append("blog_description", blogDescription);
    form.append("blog_slug", blogSlug);
    form.append("image_type", imageType);
    if (user?.id) form.append("created_by", user.id);
    if (imageType === "youtube") {
      form.append("youtube_url", youtubeUrl);
    } else {
      if (blogImageFile) form.append("blog_image", blogImageFile);
      else if (!editingId && blogImage) form.append("blog_image", blogImage);
    }
    return form;
  };

  const resetForm = () => {
    setEditingId(null);
    setBlogTitle("");
    setBlogDate("");
    setBlogImage("");
    setBlogImageFile(null);
    setImagePreviewUrl("");
    setBlogDescription("");
    setBlogSlug("");
    setImageType("image");
    setYoutubeUrl("");
    setErrors({});
  };

  const checkSlugUnique = async (slug) => {
    if (!slug) return true;
    setSlugChecking(true);
    try {
      const qs = new URLSearchParams({ slug, ...(editingId ? { excludeId: editingId } : {}) }).toString();
      const res = await apiGet(`/api/blog/check-slug?${qs}`);
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

  const fetchBlogs = async () => {
    try {
      const response = await apiGet("/api/blog");
      if (response?.success && Array.isArray(response?.data)) {
        setBlogData(response.data);
      }
    } catch (e) {
      // noop
    }
  };

  useEffect(() => {
    fetchBlogs();

    const onSaved = () => fetchBlogs();
    if (typeof window !== "undefined") {
      window.addEventListener("blog:saved", onSaved);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("blog:saved", onSaved);
      }
    };
  }, []);

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
      setBlogTitle(item?.title || "");
      setBlogDate(toDateInput(item?.date));
      setBlogImage(item?.image || "");
      setBlogImageFile(null);
      setImagePreviewUrl(buildUploadUrl(item?.image) || "");
      setBlogDescription(item?.description || "");
      setBlogSlug(item?.slug || "");
      const hasYoutube = !!item?.url;
      setImageType(hasYoutube ? "youtube" : "image");
      setYoutubeUrl(item?.url || "");
      setErrors({});
    };
    if (typeof window !== "undefined") {
      window.addEventListener("blog:open-edit", openEdit);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("blog:open-edit", openEdit);
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
      const res = await apiDelete(`/api/blog/${id}`);
      if (res?.success) {
        showSuccessToast(lang("blog.blogDeletedSuccessfully") || "Deleted successfully");
        fetchBlogs();
      }
    } catch (e) {
      // noop
    }
  };

  const validate = () => {
    const required = (v, fallback) => (v ? "" : fallback);
    let mediaError = "";
    if (imageType === "youtube") {
      mediaError = youtubeUrl ? "" : (lang("validation.youtubeUrlRequired") || "YouTube URL is required");
    } else {
      mediaError = !editingId && !(blogImageFile || blogImage) ? (lang("validation.blogImageRequired") || "Image is required") : "";
    }
    const newErrors = {
      blogTitle: required(blogTitle, lang("validation.blogTitleRequired") || "Title is required"),
      blogDate: required(blogDate, lang("validation.blogDateRequired") || "Date is required"),
      blogImage: mediaError,
      blogDescription: required(blogDescription, lang("validation.blogDescriptionRequired") || "Description is required"),
      blogSlug: required(blogSlug, lang("validation.blogSlugRequired") || "Slug is required"),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const unique = await checkSlugUnique(blogSlug);
      if (!unique) {
        setErrors((prev) => ({ ...prev, blogSlug: lang("validation.blogSlugExists") || "Slug already exists" }));
        return;
      }
      const form = buildFormData();
      const res = editingId
        ? await apiUpload(`/api/blog/${editingId}`, form, { method: "PUT" })
        : await apiUpload("/api/blog", form);

      if (res?.success) {
        showSuccessToast(
          editingId
            ? (lang("blog.blogUpdatedSuccessfully") || "Updated successfully")
            : (lang("blog.blogCreatedSuccessfully") || "Created successfully")
        );
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("blog:saved"));
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
      { accessorKey: "title", header: () => lang("blog.title") || "Title",
        cell: ({ row }) => (
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                {row.original.title}
            </Typography>
            <Stack direction="row" spacing={0.5} mt={0.5}>
              {canEdit("blog") && (
                <button
                  type="button"
                  className="btn btn-link p-0 m-0 d-flex align-items-center gap-1 small"
                  style={{ textDecoration: "none", color: "#17c666" }}
                  onClick={() => window.dispatchEvent(new CustomEvent("blog:open-edit", { detail: { item: row.original } }))}
                >
                  <FiEdit size={14} />
                  {lang("common.edit", "Edit")}
                </button>
              )}
              <span className="text-muted">|</span>
              {canDelete("blog") && (
                <button
                  type="button"
                  className="btn btn-link p-0 m-0 d-flex align-items-center gap-1 small"
                  style={{ textDecoration: "none", color: "#dc3545" }}
                  onClick={() => handleDelete(row.original.id)}
                >
                  <FiTrash2 size={14} />
                  {lang("common.delete", "Delete")}
                </button>
              )}
            </Stack>
          </Box>
        ),
       },
      {
        accessorKey: "date",
        header: () => lang("blog.enddate") || "Date",
        cell: ({ row }) => {
          const d = row.original.date ? new Date(row.original.date) : null;
          return d ? d.toLocaleDateString() : "";
        },
      },
      {
        accessorKey: "image",
        header: () => lang("blog.image") || "Image",
        cell: ({ row }) => {
          const src = row.original.image;
          const ytUrl = row.original.url;
          if (ytUrl) {
            return (
              <a href={ytUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#d32f2f", fontWeight: 500, fontSize: 13, textDecoration: "none" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                YouTube
              </a>
            );
          }
          if (!src) return "";
          return (
            <img
              src={buildUploadUrl(src)}
              alt="blog"
              style={{ width: 48, height: 32, objectFit: "cover", borderRadius: 4 }}
            />
          );
        },
      },
      // ...(showActionColumn ? [
      //   {
      //     accessorKey: "actions",
      //     header: () => lang("common.actions"),
      //     meta: { disableSort: true },
      //     cell: ({ row }) => (
      //       <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap" }}>
      //         {canEdit("blog") && (
      //           <IconButton
      //             size="small"
      //             onClick={() => {
      //               const item = row.original;
      //               if (typeof window !== "undefined") {
      //                 window.dispatchEvent(new CustomEvent("blog:open-edit", { detail: { item } }));
      //               }
      //             }}
      //             sx={{
      //               color: "#1976d2",
      //               transition: "transform 0.2s ease",
      //               "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.08)", transform: "scale(1.1)" },
      //             }}
      //           >
      //             <FiEdit3 size={18} />
      //           </IconButton>
      //         )}
      //         {canDelete("blog") && (
      //           <IconButton
      //             size="small"
      //             onClick={() => handleDelete(row.original.id)}
      //             sx={{
      //               color: "#d32f2f",
      //               transition: "transform 0.2s ease",
      //               "&:hover": { backgroundColor: "rgba(211, 47, 47, 0.08)", transform: "scale(1.1)" },
      //             }}
      //           >
      //             <FiTrash2 size={18} />
      //           </IconButton>
      //         )}
      //       </Stack>
      //     ),
      //   }
      // ] : [])
    ],
    [lang]
  );

  return (
    <>
      <Table data={blogData} columns={columns} />

      <Dialog open={!!modalMode} onClose={handleCloseModal} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Typography variant="h6" component="span">
            {modalMode === "edit" ? (lang("blog.editBlog") || "Edit Blog") : (lang("blog.addBlog") || "Add Blog")}
          </Typography>
          <IconButton aria-label="close" onClick={handleCloseModal} sx={{ color: (theme) => theme.palette.grey[500] }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
            <TextField
              label={lang("blog.title") || "Title"}
              value={blogTitle}
              onChange={(e) => {
                const val = e.target.value;
                const newSlug = slugify(val);
                setBlogTitle(val);
                setBlogSlug(newSlug);
                clearError("blogTitle");

                setErrors((prev) => (prev && prev.blogSlug ? { ...prev, blogSlug: "" } : prev));
              }}
              onBlur={async () => {
                if (!blogSlug) return;
                const unique = await checkSlugUnique(blogSlug);
                if (!unique) {
                  setErrors((prev) => ({ ...prev, blogSlug: lang("validation.blogSlugExists") || "Slug already exists" }));
                }
              }}
              error={!!errors.blogTitle}
              helperText={errors.blogTitle}
              fullWidth
            />

            <TextField
              label={lang("blog.slug") || "Slug"}
              value={blogSlug}
              disabled
              error={!!errors.blogSlug}
              helperText={errors.blogSlug || (slugChecking ? (lang("common.checking") || "Checking availability...") : "")}
              fullWidth
            />

            <TextField
              label={lang("blog.enddate") || "Date"}
              type="date"
              InputLabelProps={{ shrink: true }}
              value={blogDate}
              onChange={(e) => { setBlogDate(e.target.value); clearError("blogDate"); }}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              error={!!errors.blogDate}
              helperText={errors.blogDate}
              fullWidth
            />

            <Box>
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ mb: 0.5, fontSize: 14 }}>
                  {lang("blog.mediaType") || "Media Type"}
                </FormLabel>
                <RadioGroup
                  row
                  value={imageType}
                  onChange={(e) => {
                    setImageType(e.target.value);
                    clearError("blogImage");
                  }}
                >
                  <FormControlLabel value="image" control={<Radio size="small" />} label={lang("blog.image") || "Image"} />
                  <FormControlLabel value="youtube" control={<Radio size="small" />} label={lang("blog.youtubeLink") || "YouTube Link"} />
                </RadioGroup>
              </FormControl>

              {imageType === "image" ? (
                <>
                  <TextField
                    fullWidth
                    type="file"
                    inputProps={{ accept: "image/*" }}
                    label={lang("blog.image") || "Upload Image"}
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) => {
                      const file = (e.target.files && e.target.files[0]) || null;
                      applyImageSelection(file);
                      clearError("blogImage");
                    }}
                    error={!!errors.blogImage}
                    helperText={errors.blogImage}
                    sx={{ mt: 1 }}
                  />
                  {(imagePreviewUrl || blogImage) && (
                    <Box sx={{ mt: 1 }}>
                      <img
                        src={imagePreviewUrl || blogImage}
                        alt="preview"
                        style={{ width: 160, height: 100, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }}
                      />
                    </Box>
                  )}
                </>
              ) : (
                <TextField
                  fullWidth
                  label={lang("blog.youtubeLink") || "YouTube URL"}
                  value={youtubeUrl}
                  onChange={(e) => { setYoutubeUrl(e.target.value); clearError("blogImage"); }}
                  placeholder={lang("blog.youtubeUrlPlaceholder") || "https://www.youtube.com/watch?v=..."}
                  error={!!errors.blogImage}
                  helperText={errors.blogImage}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>

            <Box
              sx={{
                '& .ck-editor__editable_inline': { minHeight: 360 },
                '& .ck-editor__editable_inline:focus': { minHeight: 360 },
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: "text.secondary" }}>
                {lang("blog.description") || "Description"}
              </Typography>

              <CKEditor
                editor={typeof window !== "undefined" && window.ClassicEditor ? window.ClassicEditor : ClassicEditor}
                data={blogDescription}
                onChange={(event, editor) => { setBlogDescription(editor.getData()); clearError("blogDescription"); }}
                config={{
                  toolbar: {
                    items: [
                      "heading", "|", "bold", "italic", "underline", "strikethrough", "fontSize", "fontFamily", "fontColor", "fontBackgroundColor", "highlight", "removeFormat", "|", "link", "blockQuote", "code", "codeBlock", "insertTable", "imageUpload", "mediaEmbed", "horizontalLine", "|", "alignment", "bulletedList", "numberedList", "outdent", "indent", "|", "undo", "redo"
                    ],
                    shouldNotGroupWhenFull: true,
                  },
                }}
              />

              {errors.blogDescription && (
                <Typography color="error" variant="caption" sx={{ mt: 0.5, display: "block" }}>
                  {errors.blogDescription}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCloseModal} color="error" variant="outlined" className="custom-orange-outline">
            {lang("common.cancel")}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={submitting} className="common-grey-color">
            {submitting ? lang("common.loading") : lang("common.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BlogTable;


