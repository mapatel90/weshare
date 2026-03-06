"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiGet, apiUpload, apiDelete } from "@/lib/api";
import { buildUploadUrl } from "@/utils/common";
import Table from "@/components/shared/table/Table";
import { ImageIcon, Plus, Pencil, Trash2 } from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/utils/topTost";
import { confirmDelete } from "@/utils/confirmDelete";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    IconButton,
    Alert,
    Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const formatDisplayDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
};

const MeterReadingTable = ({ projectId, projectName, offtakerId }) => {
    const { lang } = useLanguage();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null); // null = add, object = edit
    const [readingDate, setReadingDate] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [previewUrl, setPreviewUrl] = useState(null);

    const fetchReadings = useCallback(
        async (page = 1, limit = pageSize) => {
            if (!projectId) return;
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({
                    project_id: String(projectId),
                    page: String(page),
                    limit: String(limit),
                });
                const res = await apiGet(`/api/meter-reading?${params.toString()}`);
                if (res?.success && Array.isArray(res.data)) {
                    setData(res.data);
                    const totalCount =
                        typeof res.pagination?.total === "number"
                            ? res.pagination.total
                            : res.data.length;
                    setTotal(totalCount);
                } else {
                    setData([]);
                    setTotal(0);
                }
            } catch (err) {
                console.error("Failed to fetch meter readings:", err);
                setError(
                    err?.message ||
                    lang("meter.fetchError", "Unable to fetch meter readings. Please try again.")
                );
                setData([]);
                setTotal(0);
            } finally {
                setLoading(false);
            }
        },
        [projectId, pageSize, lang]
    );

    useEffect(() => {
        fetchReadings(pageIndex + 1, pageSize);
    }, [fetchReadings, pageIndex, pageSize]);

    const handlePaginationChange = (updater) => {
        const next = typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
        if (next.pageIndex !== undefined) setPageIndex(next.pageIndex);
        if (next.pageSize !== undefined) setPageSize(next.pageSize);
    };

    const openAddModal = () => {
        setEditingRow(null);
        setReadingDate(new Date().toISOString().slice(0, 10));
        setImageFile(null);
        setModalOpen(true);
    };

    const openEditModal = (row) => {
        setEditingRow(row);
        const d = row.meter_reading_date ? new Date(row.meter_reading_date) : new Date();
        setReadingDate(Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10));
        setImageFile(null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingRow(null);
        setReadingDate("");
        setImageFile(null);
    };

    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        if (!offtakerId) {
            showErrorToast(lang("meter.projectOfftakerRequired", "Project must have an offtaker to add meter readings."));
            return;
        }
        const isEdit = !!editingRow;
        if (!isEdit && !imageFile) {
            showErrorToast(lang("meter.imageRequired", "Please upload meter screen image before saving"));
            return;
        }
        setSubmitting(true);
        try {
            const formData = new FormData();
            if (imageFile) formData.append("file", imageFile);
            formData.append("project_id", String(projectId));
            formData.append("offtaker_id", String(offtakerId));
            if (readingDate) formData.append("meter_reading_date", readingDate);

            const res = isEdit
                ? await apiUpload(`/api/meter-reading/${editingRow.id}`, formData, { method: "PUT" })
                : await apiUpload("/api/meter-reading", formData);

            if (res?.success) {
                showSuccessToast(
                    isEdit
                        ? lang("meter.updatedSuccessfullyReading", "Meter reading updated successfully")
                        : lang("meter.savedSuccessfullyReading", "Meter reading saved successfully")
                );
                closeModal();
                fetchReadings(pageIndex + 1, pageSize);
            } else {
                showErrorToast(res?.message || lang("meter.saveFailed", "Failed to save meter reading"));
            }
        } catch (err) {
            console.error("Save meter reading error:", err);
            showErrorToast(err?.message || lang("meter.saveFailed", "Failed to save meter reading"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (row) => {
        const confirmed = await confirmDelete(
            lang("meter.deleteConfirmTitle", "Delete meter reading?"),
            lang("meter.deleteConfirm", "Are you sure you want to delete this meter reading?"),
            lang("meter.deleteConfirmButton", "Yes, delete it")
        );
        if (!confirmed) return;
        try {
            const res = await apiDelete(`/api/meter-reading/${row.id}`);
            if (res?.success) {
                showSuccessToast(lang("meter.deletedSuccessfullyReading", "Meter reading deleted successfully"));
                fetchReadings(pageIndex + 1, pageSize);
            } else {
                showErrorToast(res?.message || lang("meter.deleteFailed", "Failed to delete meter reading"));
            }
        } catch (err) {
            console.error("Delete meter reading error:", err);
            showErrorToast(err?.message || lang("meter.deleteFailed", "Failed to delete meter reading"));
        }
    };

    const columns = [
        {
            header: lang("projects.projectName", "Project Name"),
            accessorKey: "projects.project_name",
            cell: ({ row }) =>
                row.original?.projects?.project_name || projectName || lang("common.na", "N/A"),
            meta: { disableSort: true },
        },
        {
            header: lang("meter.offtaker", "Offtaker"),
            accessorKey: "users",
            cell: ({ row }) =>
                row.original?.users?.full_name ||
                row.original?.users?.fullName ||
                lang("common.na", "N/A"),
            meta: { disableSort: true },
        },
        {
            header: lang("meter.readingDate", "Meter Reading Date"),
            accessorKey: "meter_reading_date",
            cell: ({ row }) => formatDisplayDate(row.original?.meter_reading_date),
            meta: { disableSort: true },
        },
        {
            header: lang("meter.screenImage", "Screen Image"),
            accessorKey: "image",
            cell: ({ row }) => {
                const url = buildUploadUrl(row.original?.image);
                if (!url)
                    return (
                        <span className="text-muted small">{lang("common.na", "N/A")}</span>
                    );
                return (
                    <button
                        type="button"
                        onClick={() => setPreviewUrl(url)}
                        className="d-inline-flex align-items-center gap-1 text-primary small btn btn-link p-0 border-0"
                        style={{ textDecoration: "none" }}
                    >
                        <ImageIcon className="w-4 h-4" />
                        {lang("meter.viewImage", "View image")}
                    </button>
                );
            },
            meta: { disableSort: true },
        },
        {
            header: lang("common.actions", "Actions"),
            accessorKey: "_actions",
            meta: { disableSort: true },
            cell: ({ row }) => (
                <div className="d-inline-flex align-items-center gap-1">
                    <Tooltip title={lang("common.edit", "Edit")}>
                        <IconButton
                            size="small"
                            onClick={() => openEditModal(row.original)}
                            sx={{ color: "primary.main" }}
                        >
                            <Pencil size={16} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={lang("common.delete", "Delete")}>
                        <IconButton
                            size="small"
                            onClick={() => handleDelete(row.original)}
                            sx={{ color: "error.main" }}
                        >
                            <Trash2 size={16} />
                        </IconButton>
                    </Tooltip>
                </div>
            ),
        },
    ];

    if (!projectId) {
        return (
            <div className="alert alert-warning">
                {lang("common.invalidId", "Invalid project.")}
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger">
                {error}
            </div>
        );
    }

    return (
        <div className="col-12">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <h5 className="mb-0">
                    {lang("meter.meterReadings", "Meter Readings")}
                    {/* {projectName && (
                        <span className="text-muted fw-normal ms-2 small">
                            — {projectName}
                        </span>
                    )} */}
                </h5>
                <Button
                    variant="contained"
                    onClick={openAddModal}
                    className="common-grey-color"
                >
                    + {lang("meter.addReading", "Add Reading")}
                </Button>
            </div>
            <Table
                data={loading ? [] : data}
                columns={columns}
                emptyMessage={
                    loading
                        ? lang("meter.loading", "Loading meter readings...")
                        : lang("meter.noData", "No meter readings found.")
                }
                onPaginationChange={handlePaginationChange}
                pageIndex={pageIndex}
                pageSize={pageSize}
                serverSideTotal={total}
                initialPageSize={10}
            />
            <Dialog
                open={modalOpen}
                onClose={closeModal}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pr: 1,
                    }}
                >
                    {editingRow
                        ? lang("meter.editReading", "Edit Reading")
                        : lang("meter.addReading", "Add Reading")}
                    <IconButton
                        aria-label="close"
                        onClick={closeModal}
                        size="small"
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent dividers>
                        {!offtakerId && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                {lang(
                                    "meter.projectOfftakerRequired",
                                    "Project must have an offtaker to add meter readings."
                                )}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            margin="normal"
                            label={lang("meter.readingDate", "Meter Reading Date")}
                            type="date"
                            value={readingDate}
                            onChange={(e) => setReadingDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />

                        <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                                {lang("meter.screenImage", "Screen Image")}
                            </div>

                            {/* show existing image in edit mode */}
                            {editingRow?.image && !imageFile && (
                                <div style={{ marginBottom: 10 }}>
                                    <img
                                        src={buildUploadUrl(editingRow.image)}
                                        alt="current"
                                        style={{
                                            maxHeight: 140,
                                            maxWidth: "100%",
                                            objectFit: "contain",
                                            border: "1px solid #ddd",
                                            borderRadius: 6,
                                            display: "block",
                                        }}
                                    />
                                    <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                                        {lang("meter.viewCurrentImage", "Current uploaded image")}
                                    </div>
                                </div>
                            )}

                            <Button
                                variant="outlined"
                                component="label"
                                size="small"
                            >
                                {editingRow
                                    ? lang("meter.changeImage", "Change image")
                                    : lang("meter.changeImage", "Choose image")}
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                                />
                            </Button>
                            {imageFile && (
                                <div style={{ marginTop: 8, fontSize: 12, color: "#6c757d" }}>
                                    {imageFile.name}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeModal} disabled={submitting} className="custom-orange-outline">
                            {lang("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            className="common-grey-color"
                            disabled={submitting || !offtakerId}
                        >
                            {submitting
                                ? lang("common.saving", "Saving...")
                                : lang("common.save", "Save")}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Image Preview Dialog */}
            <Dialog
                open={!!previewUrl}
                onClose={() => setPreviewUrl(null)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pr: 1,
                    }}
                >
                    {lang("meter.screenImage", "Screen Image")}
                    <IconButton
                        aria-label="close"
                        onClick={() => setPreviewUrl(null)}
                        size="small"
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent
                    dividers
                    sx={{ p: 0, backgroundColor: "#000", textAlign: "center" }}
                >
                    {previewUrl && (
                        <img
                            src={previewUrl}
                            alt={lang("meter.screenImage", "Screen Image")}
                            style={{
                                maxWidth: "100%",
                                maxHeight: "80vh",
                                objectFit: "contain",
                                display: "block",
                                margin: "0 auto",
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MeterReadingTable;
