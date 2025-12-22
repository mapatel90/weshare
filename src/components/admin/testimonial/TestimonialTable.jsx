"use client";
import React, { useEffect, useMemo, useState } from "react";
import Table from "@/components/shared/table/Table";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiGet, apiDelete, apiUpload } from "@/lib/api";
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
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { getFullImageUrl } from "@/utils/common";

const TestimonialTable = () => {
    const { lang } = useLanguage();

    const [data, setData] = useState([]);

    // Modal/form state
    const [modalMode, setModalMode] = useState(null); // "add" | "edit" | null
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Fields
    const [projectOptions, setProjectOptions] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [offtakerOptions, setOfftakerOptions] = useState([]);
    const [selectedOfftaker, setSelectedOfftaker] = useState(null);
    const [reviewStatus, setReviewStatus] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState("");

    const clearError = (key) =>
        setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));

    const applyImageSelection = (file) => {
        setImageFile(file || null);
        if (file) {
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
            const url = URL.createObjectURL(file);
            setImagePreviewUrl(url);
            setImage("");
        } else {
            setImagePreviewUrl(image || "");
        }
    };

    const buildFormData = () => {
        const form = new FormData();
        form.append("project", selectedProject?.value || "");
        form.append("offtaker", selectedOfftaker?.value || "");
        form.append("description", description);
        form.append("review_status", reviewStatus);
        if (imageFile) form.append("image", imageFile);
        else if (!editingId && image) form.append("image", image);
        return form;
    };

    const resetForm = () => {
        setEditingId(null);
        setSelectedProject(null);
        setSelectedOfftaker(null);
        setReviewStatus("");
        setDescription("");
        setImage("");
        setImageFile(null);
        setImagePreviewUrl("");
        setErrors({});
    };

    const fetchProjects = async () => {
        try {
            const res = await apiGet("/api/projects?status=1&limit=1000");
            const items = Array.isArray(res?.projectList) ? res.projectList : [];
            const active = items.filter((p) => String(p?.status) === "1");
            const mapped = active.map((p) => ({ label: p.project_name, value: String(p.id) }));
            setProjectOptions([{ label: lang("invoice.selectProject"), value: "" }, ...mapped]);
        } catch (_) {
            setProjectOptions([]);
        }
    };

    const fetchProjectOfftaker = async (projectId) => {
        try {
            const res = await apiGet(`/api/projects/${projectId}`);
            const proj = res?.data;
            const ot = proj?.offtaker;
            if (ot?.id) {
                const option = { label: (ot.full_name || ot.email || ""), value: String(ot.id) };
                setOfftakerOptions([option]);
                setSelectedOfftaker(option);
                if (errors.offtaker) setErrors((prev) => ({ ...prev, offtaker: "" }));
            } else {
                setOfftakerOptions([]);
                setSelectedOfftaker(null);
            }
        } catch (_) {
            setOfftakerOptions([]);
            setSelectedOfftaker(null);
        }
    };

    const fetchTestimonials = async () => {
        try {
            const res = await apiGet("/api/testimonials");
            // This endpoint returns array directly
            if (Array.isArray(res)) setData(res);
            else if (res?.data && Array.isArray(res.data)) setData(res.data);
        } catch (e) {
            // noop
        }
    };

    useEffect(() => {
        fetchTestimonials();
        fetchProjects();

        const onSaved = () => fetchTestimonials();
        if (typeof window !== "undefined") {
            window.addEventListener("testimonial:saved", onSaved);
            window.addEventListener("testimonial:open-edit", (e) => {
                const item = e?.detail?.item;
                if (!item) {
                    setModalMode("add");
                    resetForm();
                    return;
                }
                setModalMode("edit");
                setEditingId(item?.id ?? null);
                const projId = item?.project_id || item?.project?.id;
                const projLabel = item?.project?.project_name || "";
                setSelectedProject(projId ? { label: projLabel, value: String(projId) } : null);
                const otId = item?.offtaker_id || item?.users?.id;
                const otLabel = item?.users ? (item.users.full_name || item.users.email || "") : "";
                const editOfftaker = otId ? { label: otLabel, value: String(otId) } : null;
                setSelectedOfftaker(editOfftaker);
                setOfftakerOptions(editOfftaker ? [editOfftaker] : []);
                setReviewStatus(item?.review_status?.toString?.() || "");
                setDescription(item?.description || "");
                setImage(item?.image || "");
                setImageFile(null);
                setImagePreviewUrl(getFullImageUrl(item?.image) || "");
                setErrors({});
            });
        }
        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("testimonial:saved", onSaved);
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
            const res = await apiDelete(`/api/testimonials/${id}`);
            if (res?.message || res?.success || res?.status === 200) {
                showSuccessToast(
                    lang("testimonial.testimonialDeletedSuccessfully") || "Deleted successfully"
                );
                fetchTestimonials();
            }
        } catch (e) {
            // noop
        }
    };

    const validate = () => {
        const required = (v, fallback) => (v ? "" : fallback);
        const newErrors = {
            project: required(
                selectedProject?.value,
                lang("validation.projectRequired") || "Project is required"
            ),
            offtaker: required(
                selectedOfftaker?.value,
                lang("validation.offtakerRequired") || "Offtaker is required"
            ),
            reviewStatus: required(
                reviewStatus,
                lang("validation.reviewStatusRequired") || "Review status is required"
            ),
            image:
                !editingId && !(imageFile || image)
                    ? lang("validation.imageRequired") || "Image is required"
                    : "",
            description: required(
                description,
                lang("validation.descriptionRequired") || "Description is required"
            ),
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(Boolean);
    };

    const handleSave = async () => {
        if (!validate()) return;
        try {
            setSubmitting(true);
            const form = buildFormData();
            const res = editingId
                ? await apiUpload(`/api/testimonials/${editingId}`, form, { method: "PUT" })
                : await apiUpload("/api/testimonials", form);

            if (res?.id || res?.data || res?.success) {
                showSuccessToast(
                    editingId
                        ? lang("testimonial.testimonialUpdatedSuccessfully") || "Updated successfully"
                        : lang("testimonial.testimonialCreatedSuccessfully") || "Created successfully"
                );
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("testimonial:saved"));
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
                accessorKey: "project.project_name",
                header: () => lang("testimonial.project") || "Project",
                cell: ({ row }) => row.original?.projects?.project_name || row.original?.project_name || "",
            },
            {
                accessorKey: "offtaker.fullName",
                header: () => lang("testimonial.offtaker") || "Offtaker",
                cell: ({ row }) => row.original?.users?.full_name || "",
            },
            {
                accessorKey: "image",
                header: () => lang("testimonial.image") || "Image",
                cell: ({ row }) => {
                    const src = row.original.image;
                    if (!src) return "";
                    return (
                        <img
                            src={getFullImageUrl(src)}
                            alt="testimonial"
                            style={{
                                width: 48,
                                height: 48,
                                objectFit: "cover",
                                borderRadius: 4,
                            }}
                        />
                    );
                },
            },
            {
                accessorKey: "review_status",
                header: () => lang("testimonial.rating") || "Rating",
            },
            {
                accessorKey: "description",
                header: () => lang("testimonial.description") || "Description",
                cell: ({ row }) => {
                    const t = row.original.description || "";
                    return t.length > 80 ? `${t.slice(0, 80)}…` : t;
                },
            },
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
                                        new CustomEvent("testimonial:open-edit", { detail: { item } })
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
            <Table data={data} columns={columns} />

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
                            ? lang("testimonial.edit") || "Edit Testimonial"
                            : lang("testimonial.add") || "Add Testimonial"}
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
                        <FormControl fullWidth error={!!errors.project}>
                            <InputLabel id="testimonial-project-select">{lang("invoice.project") || "Project"}</InputLabel>
                            <Select
                                labelId="testimonial-project-select"
                                value={selectedProject?.value || ""}
                                label={lang("invoice.project") || "Project"}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const option = projectOptions.find((opt) => opt.value === value) || null;
                                    setSelectedProject(option);
                                    if (errors.project) setErrors((prev) => ({ ...prev, project: "" }));
                                    if (option?.value) {
                                        fetchProjectOfftaker(option.value);
                                    } else {
                                        setOfftakerOptions([]);
                                        setSelectedOfftaker(null);
                                    }
                                }}
                            >
                                <MenuItem value="">{lang("invoice.selectProject") || "Select Project"}</MenuItem>
                                {projectOptions
                                    .filter((opt) => opt.value !== "")
                                    .map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                            </Select>
                            {errors.project && <FormHelperText>{errors.project}</FormHelperText>}
                        </FormControl>

                        <FormControl fullWidth error={!!errors.offtaker}>
                            <InputLabel id="testimonial-offtaker-select">{lang("testimonial.offtaker") || "Offtaker"}</InputLabel>
                            <Select
                                labelId="testimonial-offtaker-select"
                                value={selectedOfftaker?.value || ""}
                                label={lang("testimonial.offtaker") || "Offtaker"}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const option = offtakerOptions.find((opt) => opt.value === value) || null;
                                    setSelectedOfftaker(option);
                                    if (errors.offtaker) setErrors((prev) => ({ ...prev, offtaker: "" }));
                                }}
                            >
                                <MenuItem value="">{lang("testimonial.selectOfftaker") || "Select Offtaker"}</MenuItem>
                                {console.log("offtakerOptions",offtakerOptions)}
                                {offtakerOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.offtaker && <FormHelperText>{errors.offtaker}</FormHelperText>}
                        </FormControl>

                        <Box>
                            <TextField
                                fullWidth
                                type="file"
                                inputProps={{ accept: "image/*" }}
                                label={lang("testimonial.image") || "Upload Image"}
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) => {
                                    const file = (e.target.files && e.target.files[0]) || null;
                                    applyImageSelection(file);
                                    clearError("image");
                                }}
                                error={!!errors.image}
                                helperText={errors.image}
                            />

                            {(imagePreviewUrl || image) && (
                                <Box sx={{ mt: 1 }}>
                                    <img
                                        src={imagePreviewUrl || image}
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

                        <TextField
                            label={lang("testimonial.description") || "Description"}
                            value={description}
                            onChange={(e) => { setDescription(e.target.value); clearError("description"); }}
                            error={!!errors.description}
                            helperText={errors.description}
                            fullWidth
                            multiline
                            minRows={3}
                        />

                        <FormControl fullWidth error={!!errors.reviewStatus}>
                            <InputLabel id="testimonial-rating-select">{lang("testimonial.rating") || "Rating"}</InputLabel>
                            <Select
                                labelId="testimonial-rating-select"
                                value={reviewStatus}
                                label={lang("testimonial.rating") || "Rating"}
                                onChange={(e) => { setReviewStatus(e.target.value); clearError("reviewStatus"); }}
                            >
                                <MenuItem value="1">{lang("testimonial.one") || "One"}</MenuItem>
                                <MenuItem value="2">{lang("testimonial.two") || "Two"}</MenuItem>
                                <MenuItem value="3">{lang("testimonial.three") || "Three"}</MenuItem>
                                <MenuItem value="4">{lang("testimonial.four") || "Four"}</MenuItem>
                                <MenuItem value="5">{lang("testimonial.five") || "Five"}</MenuItem>
                            </Select>
                            {errors.reviewStatus && <FormHelperText>{errors.reviewStatus}</FormHelperText>}
                        </FormControl>

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

export default TestimonialTable;
