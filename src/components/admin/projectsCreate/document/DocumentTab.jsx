import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from "@/lib/api";
import Table from "@/components/shared/table/Table";
import { FiArrowRight, FiEdit3, FiTrash2, FiX } from "react-icons/fi";
import Swal from "sweetalert2";
import { showSuccessToast, showErrorToast } from "@/utils/topTost";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    Box,
    IconButton,
    Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { buildUploadUrl } from "@/utils/common";

const DocumentTab = ({ projectId, handleCloseForm }) => {
    const { lang } = useLanguage();
    const { user } = useAuth();

    // Modal & Form state
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("add");
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const [title, setTitle] = useState("");
    const [titleError, setTitleError] = useState("");
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [documentFile, setDocumentFile] = useState(null);
    const [fileError, setFileError] = useState("");

    // Table state
    const [projectDocuments, setProjectDocuments] = useState([]);

    // Fetch project documents
    const getProjectDocuments = () => {
        apiGet(`/api/project-documents?project_id=${projectId}`).then((res) => {
            if (res?.success) setProjectDocuments(res.data);
        });
    };
    useEffect(() => {
        getProjectDocuments();
    }, [projectId]);

    const openAddModal = () => {
        setModalType("add");
        setTitle("");
        setTitleError("");
        setAmount("");
        setNotes("");
        setDocumentFile(null);
        setFileError("");
        setEditId(null);
        setShowModal(true);
    };
    const openEditModal = (row) => {
        setModalType("edit");
        setTitle(row.title || "");
        setAmount(row.amount || "");
        setNotes(row.notes || "");
        setDocumentFile(null);
        setFileError("");
        setEditId(row.id);
        setShowModal(true);
    };
    const closeModal = () => setShowModal(false);


    const buildFormData = () => {
        const form = new FormData();
        form.append("project_id", projectId);
        form.append("title", title);
        form.append("amount", amount || "");
        form.append("notes", notes || "");
        if (documentFile) form.append("document", documentFile);
        form.append("created_by", user?.id || "");
        return form;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setTitleError("");
        setFileError("");

        if (!title.trim()) {
            setTitleError("Title is required");
            return;
        }

        if (modalType === "add" && !documentFile) {
            setFileError("Document file is required");
            return;
        }

        setLoading(true);

        try {
            let res;
            if (modalType === "add") {
                // Use FormData for file upload
                const form = buildFormData();
                res = await apiUpload("/api/project-documents", form);
            } else if (editId) {
                // If a new file is selected, use FormData and apiUpload for PUT
                if (documentFile) {
                    const form = new FormData();
                    form.append("project_id", projectId);
                    form.append("title", title);
                    form.append("amount", amount || "");
                    form.append("notes", notes || "");
                    form.append("created_by", user?.id || "");
                    form.append("document", documentFile);
                    res = await apiUpload(`/api/project-documents/${editId}`, form, { method: "PUT" });
                } else {
                    // No new file, just update fields
                    const payload = {
                        project_id: projectId ?? null,
                        title: title,
                        amount: amount || null,
                        notes: notes || null,
                        created_by: user?.id || null,
                    };
                    res = await apiPut(`/api/project-documents/${editId}`, payload);
                }
            }
            if (res && res.success) {
                showSuccessToast(res.message || lang("project_documents.saved", "Document saved successfully!"));
                getProjectDocuments();
                closeModal();
            } else {
                showErrorToast(res.message || lang("project_documents.error", "An error occurred. Please try again."));
            }
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = async (row) => {
        const confirm = await Swal.fire({
            icon: "warning",
            title: lang("common.areYouSure", "Are you sure?"),
            text: lang("modal.deleteWarning", "This action cannot be undone!"),
            showCancelButton: true,
            confirmButtonText: lang("common.yesDelete", "Yes, delete it!"),
            confirmButtonColor: "#d33",
        });
        if (confirm.isConfirmed) {
            const res = await apiDelete(`/api/project-documents/${row.id}`);
            if (res && res.success) {
                showSuccessToast(lang("project_documents.deleted", "Document deleted successfully!"));
                getProjectDocuments();
            } else {
                showErrorToast(res.message || lang("project_documents.error", "An error occurred. Please try again."));
            }
        }
    };

    // Datatable columns (translated)
    const columns = [
        {
            accessorKey: "title",
            header: () => lang("project_documents.title", "Title"),
        },
        {
            accessorKey: "amount",
            header: () => lang("project_documents.amount", "Amount"),
            cell: (info) => {
                const value = info.getValue();
                return value ? `${Number(value).toFixed(2)}` : "-";
            },
        },
        {
            accessorKey: "notes",
            header: () => lang("project_documents.notes", "Notes"),
            cell: (info) => {
                const value = info.getValue();
                return value ? value : "-";
            },
        },
        {
            accessorKey: "document",
            header: () => lang("project_documents.file", "File"),
            cell: (info) => {
                const row = info.row.original;
                return row.document ? (
                    <a
                        href={buildUploadUrl(row.document)}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                    >
                        {lang("project_documents.download", "Download")}
                    </a>
                ) : "-";
            },
        },
        {
            accessorKey: "actions",
            header: () => lang("common.actions", "Actions"),
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="gap-2 d-flex justify-content-start" style={{ flexWrap: "nowrap" }}>
                        <FiEdit3
                            size={18}
                            onClick={() => openEditModal(item)}
                            title={lang("common.edit", "Edit")}
                            style={{ color: "#007bff", cursor: "pointer", transition: "transform 0.2s ease" }}
                            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.2)")}
                            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                        />
                        <FiTrash2
                            size={18}
                            onClick={() => handleDelete(item)}
                            title={lang("common.delete", "Delete")}
                            style={{ color: "#dc3545", cursor: "pointer", transition: "transform 0.2s ease" }}
                            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.2)")}
                            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                        />
                    </div>
                );
            },
            meta: { disableSort: true },
        },
    ];

    return (
        <div className="project-document-management">
            <div className="mb-3 d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold">
                    {lang("projects.projectdocumentlist", "Project Document Lists")}
                </h6>
                <Button
                    variant="contained"
                    onClick={openAddModal}
                    className="common-grey-color"
                >
                    + {lang("project_documents.addDocument", "Add Document")}
                </Button>
            </div>
            {/* Modal */}
            <Dialog
                open={showModal}
                onClose={closeModal}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <form onSubmit={handleSave}>
                    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
                        <Typography variant="h6" component="span">
                            {modalType === "edit"
                                ? lang("project_documents.editDocument", "Edit Document")
                                : lang("project_documents.addDocument", "Add Document")}
                        </Typography>
                        <IconButton aria-label="close" onClick={closeModal} sx={{ color: (theme) => theme.palette.grey[500] }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
                            <TextField
                                label={lang("project_documents.title", "Document Title")}
                                value={title}
                                onChange={e => { setTitle(e.target.value); if (titleError) setTitleError(""); }}
                                error={!!titleError}
                                helperText={titleError}
                                fullWidth
                            />
                            <TextField
                                label={lang("project_documents.amount", "Amount")}
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                fullWidth
                            />
                            <TextField
                                label={lang("project_documents.notes", "Notes")}
                                multiline
                                rows={3}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                fullWidth
                            />
                            <TextField
                                fullWidth
                                type="file"
                                inputProps={{ accept: "image/*,application/pdf" }}
                                label={lang("contract.uploadDocument") || "Upload Document"}
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) => {
                                    const file = (e.target.files && e.target.files[0]) || null;
                                    setDocumentFile(file);
                                    if (!file) setDocumentUpload("");
                                    setFileError("");
                                }}
                                error={!!fileError}
                                helperText={fileError}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button onClick={closeModal} color="error" className="custom-orange-outline">
                            {lang("common.cancel", "Cancel")}
                        </Button>
                        <Button type="submit" variant="contained" startIcon={loading ? <CircularProgress size={16} /> : null} className="common-grey-color">
                            {loading ? lang("common.loading", "Loading...") : lang("common.save", "Save")}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
            <Table data={projectDocuments} columns={columns} />
            <div className="gap-2 col-12 d-flex justify-content-end">
                <Button
                    type="button"
                    variant="outlined"
                    disabled={loading.form}
                    startIcon={<FiX />}
                    onClick={() => handleCloseForm('close')}
                    className="common-grey-color"
                    style={{
                        marginTop: "2px",
                        marginBottom: "2px",
                    }}
                >
                    {loading.form
                        ? lang("common.saving", "Saving")
                        : lang("common.close", "close")}
                </Button>
            </div>
        </div>
    );
};

export default DocumentTab;
