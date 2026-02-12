"use client";
import React, { useEffect, useMemo, useState } from "react";
import Table from "@/components/shared/table/Table";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiGet, apiPost, apiDelete, apiPut } from "@/lib/api";
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
    Autocomplete,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormLabel,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { PROJECT_STATUS } from "@/constants/project_status";
import usePermissions from "@/hooks/usePermissions";
import { ROLES } from "@/constants/roles";
import { useDarkMode } from "@/utils/common";

const TestimonialTable = () => {
    const { lang } = useLanguage();
    const isDarkMode = useDarkMode();
    const [data, setData] = useState([]);
    const [modalMode, setModalMode] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [projectOptions, setProjectOptions] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [userType, setUserType] = useState("offtaker"); // "offtaker" or "investor"
    const [offtakerOptions, setOfftakerOptions] = useState([]);
    const [selectedOfftaker, setSelectedOfftaker] = useState(null);
    const [investorOptions, setInvestorOptions] = useState([]);
    const [selectedInvestor, setSelectedInvestor] = useState(null);
    const [reviewStatus, setReviewStatus] = useState("");
    const [description, setDescription] = useState("");
    const { user } = useAuth();
    const { canEdit, canDelete } = usePermissions();
    const showActionColumn = canEdit("testimonials") || canDelete("testimonials");

    const clearError = (key) =>
        setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));

    const buildFormData = () => {
        const selectedUser = userType === "investor" ? selectedInvestor : selectedOfftaker;
        return {
            project: selectedProject?.id || "",
            user: selectedUser?.id || "",
            description: description,
            review_status: reviewStatus,
        };
    };

    const resetForm = () => {
        setEditingId(null);
        setSelectedProject(null);
        setUserType("offtaker");
        setSelectedOfftaker(null);
        setOfftakerOptions([]);
        setSelectedInvestor(null);
        setReviewStatus("");
        setDescription("");
        setErrors({});
    };

    const fetchProjects = async () => {
        try {
            const res = await apiPost("/api/projects/dropdown/project", { project_status_id: PROJECT_STATUS.RUNNING });
            const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            setProjectOptions(items);
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
                setOfftakerOptions([ot]);
                setSelectedOfftaker(ot);
                if (errors.user) setErrors((prev) => ({ ...prev, user: "" }));
            } else {
                setOfftakerOptions([]);
                setSelectedOfftaker(null);
            }
        } catch (_) {
            setOfftakerOptions([]);
            setSelectedOfftaker(null);
        }
    };

    const fetchInvestors = async () => {
        try {
            const res = await apiGet(`/api/users?role=${ROLES.INVESTOR}`);
            const items = res?.data?.users || res?.data || [];
            setInvestorOptions(Array.isArray(items) ? items : []);
        } catch (_) {
            setInvestorOptions([]);
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
        fetchInvestors();

        const onSaved = () => fetchTestimonials();
        const onOpenEdit = (e) => {
            const item = e?.detail?.item;
            if (!item) {
                setModalMode("add");
                resetForm();
                return;
            }
            setModalMode("edit");
            setEditingId(item?.id ?? null);

            // Set project
            const projId = item?.project_id || item?.projects?.id;
            const projName = item?.projects?.project_name || "";
            setSelectedProject(projId ? { id: projId, project_name: projName } : null);

            // Determine user type based on the user's role
            const userData = item?.users;
            if (userData) {
                // Check if user is investor (role_id = 4) or offtaker (role_id = 3)
                const isInvestor = userData.role_id === ROLES.INVESTOR;
                setUserType(isInvestor ? "investor" : "offtaker");

                if (isInvestor) {
                    setSelectedInvestor(userData);
                    setSelectedOfftaker(null);
                    // Fetch project offtaker for reference
                    if (projId) fetchProjectOfftaker(projId);
                } else {
                    setSelectedOfftaker(userData);
                    setOfftakerOptions([userData]);
                    setSelectedInvestor(null);
                }
            } else {
                setUserType("offtaker");
                setSelectedOfftaker(null);
                setSelectedInvestor(null);
            }

            setReviewStatus(item?.review_status?.toString?.() || "");
            setDescription(item?.description || "");
            setErrors({});
        };

        if (typeof window !== "undefined") {
            window.addEventListener("testimonial:saved", onSaved);
            window.addEventListener("testimonial:open-edit", onOpenEdit);
        }
        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("testimonial:saved", onSaved);
                window.removeEventListener("testimonial:open-edit", onOpenEdit);
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
        const selectedUser = userType === "investor" ? selectedInvestor : selectedOfftaker;
        const newErrors = {
            project: required(
                selectedProject?.id,
                lang("validation.projectRequired") || "Project is required"
            ),
            user: required(
                selectedUser?.id,
                userType === "investor"
                    ? (lang("validation.investorRequired") || "Investor is required")
                    : (lang("validation.offtakerRequired") || "Offtaker is required")
            ),
            reviewStatus: required(
                reviewStatus,
                lang("validation.reviewStatusRequired") || "Review status is required"
            ),
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
                ? await apiPut(`/api/testimonials/${editingId}`, form)
                : await apiPost("/api/testimonials", form);
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
                accessorKey: "user.fullName",
                header: () => lang("page_title.users") || "User",
                cell: ({ row }) => row.original?.users?.full_name || "",
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
            ...(showActionColumn ? [
                {
                    accessorKey: "actions",
                    header: () => lang("common.actions"),
                    meta: { disableSort: true },
                    cell: ({ row }) => (
                        <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap" }}>
                            {canEdit("testimonials") && (
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
                            )}
                            {canDelete("testimonials") && (
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
                            )}
                        </Stack>
                    ),
                },
            ] : [])
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
                        {/* Project Searchable Autocomplete */}
                        <Autocomplete
                            options={projectOptions}
                            value={selectedProject}
                            onChange={(e, newValue) => {
                                setSelectedProject(newValue);
                                if (errors.project) setErrors((prev) => ({ ...prev, project: "" }));
                                if (newValue?.id) {
                                    fetchProjectOfftaker(newValue.id);
                                } else {
                                    setOfftakerOptions([]);
                                    setSelectedOfftaker(null);
                                }
                            }}
                            getOptionLabel={(option) => option?.project_name || ""}
                            isOptionEqualToValue={(option, value) => option?.id === value?.id}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={lang("invoice.project") || "Project"}
                                    placeholder={lang("invoice.searchProject") || "Search project..."}
                                    error={!!errors.project}
                                    helperText={errors.project}
                                />
                            )}
                            fullWidth
                        />

                        {/* User Type Radio Buttons */}
                        {selectedProject && (
                            <FormControl component="fieldset">
                                <FormLabel component="legend">{lang("testimonial.userType") || "User Type"}</FormLabel>
                                <RadioGroup
                                    row
                                    value={userType}
                                    onChange={(e) => {
                                        setUserType(e.target.value);
                                        // Clear the user error when switching
                                        if (errors.user) setErrors((prev) => ({ ...prev, user: "" }));
                                    }}
                                >
                                    <FormControlLabel
                                        value="offtaker"
                                        control={<Radio />}
                                        label={lang("testimonial.offtaker") || "Offtaker"}
                                    />
                                    <FormControlLabel
                                        value="investor"
                                        control={<Radio />}
                                        label={lang("authentication.becomeInvestor") || "Investor"}
                                    />
                                </RadioGroup>
                            </FormControl>
                        )}

                        {/* Offtaker Field - Disabled, auto-selected based on project */}
                        {selectedProject && userType === "offtaker" && (
                            <TextField
                                label={lang("testimonial.offtaker") || "Offtaker"}
                                className={isDarkMode ? "text-white" : "text-black"}
                                value={selectedOfftaker?.full_name || selectedOfftaker?.email || ""}
                                disabled={isDarkMode ? false : true}
                                fullWidth
                                error={!!errors.user}
                                helperText={
                                    errors.user ||
                                    (lang("testimonial.offtakerAutoSelectHint") || "Offtaker will be auto-selected according to the project")
                                }
                                InputProps={{
                                    readOnly: true
                                }}
                            />
                        )}

                        {/* Investor Searchable Autocomplete - shown when userType is "investor" */}
                        {selectedProject && userType === "investor" && (
                            <Autocomplete
                                options={investorOptions}
                                value={selectedInvestor}
                                onChange={(e, newValue) => {
                                    setSelectedInvestor(newValue);
                                    if (errors.user) setErrors((prev) => ({ ...prev, user: "" }));
                                }}
                                getOptionLabel={(option) => option?.full_name || option?.email || ""}
                                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={lang("authentication.becomeInvestor") || "Investor"}
                                        placeholder={lang("testimonial.searchInvestor") || "Search investor..."}
                                        error={!!errors.user}
                                        helperText={errors.user}
                                    />
                                )}
                                fullWidth
                            />
                        )}

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
