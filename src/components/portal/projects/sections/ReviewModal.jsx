"use client";
import React, { useState, useEffect } from "react";
import { apiUpload } from "@/lib/api";
import { showSuccessToast, showErrorToast } from "@/utils/topTost";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    IconButton,
    Typography,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
    Rating,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const ReviewModal = ({ open, onClose, selectedProject, existingReview, onReviewUpdated }) => {
    const { lang } = useLanguage();
    const { user } = useAuth();

    const [reviewDescription, setReviewDescription] = useState("");
    const [reviewStatus, setReviewStatus] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewErrors, setReviewErrors] = useState({});

    const isEditMode = !!existingReview?.id;

    // Pre-fill form when existing review is provided
    useEffect(() => {
        if (open && existingReview) {
            setReviewDescription(existingReview.description || "");
            setReviewStatus(existingReview.review_status?.toString() || "");
        } else if (open && !existingReview) {
            setReviewDescription("");
            setReviewStatus("");
        }
    }, [open, existingReview]);

    const resetForm = () => {
        setReviewDescription("");
        setReviewStatus("");
        setReviewErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const validateReview = () => {
        const newErrors = {};
        if (!reviewDescription.trim()) {
            newErrors.description = lang("validation.descriptionRequired", "Description is required");
        }
        if (!reviewStatus) {
            newErrors.reviewStatus = lang("validation.reviewStatusRequired", "Review status is required");
        }
        setReviewErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmitReview = async () => {
        if (!validateReview()) return;

        try {
            setReviewSubmitting(true);
            const form = new FormData();
            form.append("project", selectedProject?.id || "");
            form.append("user", user?.id || "");
            form.append("offtaker", user?.id || ""); // For update API compatibility
            form.append("description", reviewDescription);
            form.append("review_status", reviewStatus);
            if (user?.id) form.append("created_by", user.id);

            let res;
            if (isEditMode) {
                // Update existing review
                res = await apiUpload(`/api/testimonials/${existingReview.id}`, form, { method: "PUT" });
            } else {
                // Create new review
                res = await apiUpload("/api/testimonials", form);
            }

            if (res?.id || res?.data || res?.success) {
                showSuccessToast(
                    isEditMode
                        ? lang("testimonial.testimonialUpdatedSuccessfully", "Review updated successfully")
                        : lang("testimonial.testimonialCreatedSuccessfully", "Review submitted successfully")
                );
                if (onReviewUpdated) onReviewUpdated();
                handleClose();
            }
        } catch (error) {
            console.error("Failed to submit review:", error);
            showErrorToast(
                isEditMode
                    ? lang("testimonial.testimonialUpdateFailed", "Failed to update review")
                    : lang("testimonial.testimonialCreationFailed", "Failed to submit review")
            );
        } finally {
            setReviewSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
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
                    {isEditMode
                        ? lang("portal.changeReview", "Change Review")
                        : lang("portal.submitReview", "Submit Review")}
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={{ color: (theme) => theme.palette.grey[500] }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
                    {selectedProject && (
                        <Typography variant="body2" color="text.secondary">
                            {lang("portal.reviewingProject", "Reviewing Project")}: <strong>{selectedProject.project_name}</strong>
                        </Typography>
                    )}

                    <TextField
                        label={lang("testimonial.description", "Description")}
                        value={reviewDescription}
                        onChange={(e) => {
                            setReviewDescription(e.target.value);
                            if (reviewErrors.description) {
                                setReviewErrors((prev) => ({ ...prev, description: "" }));
                            }
                        }}
                        error={!!reviewErrors.description}
                        helperText={reviewErrors.description}
                        fullWidth
                        multiline
                        minRows={4}
                        placeholder={lang("portal.reviewDescriptionPlaceholder", "Share your experience with this project...")}
                    />

                    <FormControl fullWidth error={!!reviewErrors.reviewStatus}>
                        <InputLabel id="review-rating-select">
                            {lang("testimonial.rating", "Rating")}
                        </InputLabel>
                        <Select
                            labelId="review-rating-select"
                            value={reviewStatus}
                            label={lang("testimonial.rating", "Rating")}
                            onChange={(e) => {
                                setReviewStatus(e.target.value);
                                if (reviewErrors.reviewStatus) {
                                    setReviewErrors((prev) => ({ ...prev, reviewStatus: "" }));
                                }
                            }}
                        >
                            <MenuItem value="">
                                {lang("portal.selectRating", "Select Rating")}
                            </MenuItem>
                            <MenuItem value="1">⭐ 1 - {lang("testimonial.one", "Poor")}</MenuItem>
                            <MenuItem value="2">⭐⭐ 2 - {lang("testimonial.two", "Fair")}</MenuItem>
                            <MenuItem value="3">⭐⭐⭐ 3 - {lang("testimonial.three", "Good")}</MenuItem>
                            <MenuItem value="4">⭐⭐⭐⭐ 4 - {lang("testimonial.four", "Very Good")}</MenuItem>
                            <MenuItem value="5">⭐⭐⭐⭐⭐ 5 - {lang("testimonial.five", "Excellent")}</MenuItem>
                        </Select>
                        {reviewErrors.reviewStatus && (
                            <FormHelperText>{reviewErrors.reviewStatus}</FormHelperText>
                        )}
                    </FormControl>

                    {reviewStatus && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                {lang("portal.yourRating", "Your Rating")}:
                            </Typography>
                            <Rating value={Number(reviewStatus)} readOnly size="large" />
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button
                    onClick={handleClose}
                    color="error"
                    variant="outlined"
                >
                    {lang("common.cancel", "Cancel")}
                </Button>
                <Button
                    onClick={handleSubmitReview}
                    variant="contained"
                    disabled={reviewSubmitting}
                    sx={{ backgroundColor: "#F6A623", "&:hover": { backgroundColor: "#e59520" } }}
                >
                    {reviewSubmitting
                        ? lang("common.loading", "Submitting...")
                        : isEditMode
                            ? lang("common.update", "Update")
                            : lang("common.submit", "Submit")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReviewModal;
