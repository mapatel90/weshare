import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from "@/lib/api";
import Table from "@/components/shared/table/Table";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
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
  MenuItem,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const Contract = ({ projectId }) => {
  const { lang } = useLanguage();

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [loading, setLoading] = useState(false);

  const [contracts, setContracts] = useState([]);
  const [editId, setEditId] = useState(null);

  // form fields
  const [contractTitle, setContractTitle] = useState("");
  const [contractDescription, setContractDescription] = useState("");
  const [documentUpload, setDocumentUpload] = useState("");
  const [contractDate, setContractDate] = useState("");
  const [status, setStatus] = useState(1);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState("");

  useEffect(() => {
    fetchContracts();
  }, [projectId]);

  const fetchContracts = async () => {
    try {
      const res = await apiGet("/api/contracts");
      if (res?.success) {
        const all = Array.isArray(res.data) ? res.data : [];
        const filtered = projectId
          ? all.filter((item) => Number(item.projectId) === Number(projectId))
          : all;
        setContracts(filtered);
      } else {
        setContracts([]);
      }
    } catch (e) {
      setContracts([]);
    }
  };

  const openAdd = () => {
    setModalType("add");
    setEditId(null);
    setContractTitle("");
    setContractDescription("");
    setDocumentUpload("");
    // clear any previous selected file / preview so new selection shows preview correctly
    if (documentPreviewUrl) {
      try { URL.revokeObjectURL(documentPreviewUrl); } catch (e) { /* ignore */ }
    }
    setDocumentFile(null);
    setDocumentPreviewUrl("");
    setContractDate("");
    setStatus(1);
    setShowModal(true);
  };

  const openEdit = (row) => {
    setModalType("edit");
    setEditId(row.id);
    setContractTitle(row.contractTitle || "");
    setContractDescription(row.contractDescription || "");
    setDocumentUpload(row.documentUpload || "");
    setDocumentFile(null);
    setDocumentPreviewUrl(row.documentUpload || "");
    // normalize contractDate to yyyy-mm-dd for input[type=date]
    setContractDate(
      row.contractDate
        ? new Date(row.contractDate).toISOString().slice(0, 10)
        : ""
    );
    setStatus(row.status ?? 1);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const applyDocumentSelection = (file) => {
    setDocumentFile(file || null);
    if (file) {
      if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
      const url = URL.createObjectURL(file);
      setDocumentPreviewUrl(url);
      setDocumentUpload("");
    } else {
      setDocumentPreviewUrl(documentUpload || "");
    }
  };

  const buildFormData = () => {
    const form = new FormData();
    form.append("projectId", projectId ?? "");
    form.append("contractTitle", contractTitle);
    form.append("contractDescription", contractDescription || "");
    form.append("contractDate", contractDate ? contractDate : "");
    form.append("status", String(status));
    // prefer actual uploaded file
    if (documentFile) form.append("document", documentFile);
    else if (modalType === "add" && documentUpload) form.append("document", documentUpload);
    return form;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!contractTitle) {
      showErrorToast(
        lang("contract.titleRequired", "Contract title is required")
      );
      return;
    }

    setLoading(true);
    try {
      let res;
      // If there's a file or to keep consistent with upload usage, use multipart upload
      const form = buildFormData();
      if (modalType === "add") {
        res = documentFile || documentUpload
          ? await apiUpload("/api/contracts", form)
          : await apiPost("/api/contracts", {
              projectId: projectId ?? null,
              contractTitle,
              contractDescription: contractDescription || null,
              documentUpload: documentUpload || null,
              contractDate: contractDate ? contractDate : null,
              status,
            });
        if (res?.success)
          showSuccessToast(lang("contract.created", "Contract created"));
        else showErrorToast(res.message || lang("common.error", "Error"));
      } else {
        res = documentFile
          ? await apiUpload(`/api/contracts/${editId}`, form, { method: "PUT" })
          : await apiPut(`/api/contracts/${editId}`, {
              projectId: projectId ?? null,
              contractTitle,
              contractDescription: contractDescription || null,
              documentUpload: documentUpload || null,
              contractDate: contractDate ? contractDate : null,
              status,
            });
        if (res?.success)
          showSuccessToast(lang("contract.updated", "Contract updated"));
        else showErrorToast(res.message || lang("common.error", "Error"));
      }

      if (res?.success) {
        closeModal();
        fetchContracts();
      }
    } catch (err) {
      showErrorToast(err.message || lang("common.error", "Error"));
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
    if (!confirm.isConfirmed) return;

    try {
      const res = await apiDelete(`/api/contracts/${row.id}`);
      if (res?.success) {
        showSuccessToast(lang("contract.deleted", "Contract deleted"));
        fetchContracts();
      } else {
        showErrorToast(res.message || lang("common.error", "Error"));
      }
    } catch (err) {
      showErrorToast(err.message || lang("common.error", "Error"));
    }
  };

  const columns = [
    {
      accessorKey: "contractTitle",
      header: () => lang("contract.title", "Title"),
      cell: (info) => info.getValue() || "-",
    },
    {
      accessorKey: "contractDescription",
      header: () => lang("contract.description", "Description"),
      cell: (info) => {
        const v = info.getValue() || "-";
        return String(v).length > 80 ? String(v).slice(0, 77) + "..." : v;
      },
    },
    {
      accessorKey: "documentUpload",
      header: () => lang("contract.document", "Document"),
      cell: (info) => {
        const v = info.getValue();
        return v ? (
          <a href={v} target="_blank" rel="noreferrer">
            View
          </a>
        ) : (
          "-"
        );
      },
    },
    {
      accessorKey: "contractDate",
      header: () => lang("contract.date", "Date"),
      cell: (info) => {
        const v = info.getValue();
        if (!v) return "-";
        try {
          const d = new Date(v);
          return d.toLocaleDateString();
        } catch {
          return v;
        }
      },
    },
    {
      accessorKey: "status",
      header: () => lang("common.status", "Status"),
      cell: (info) =>
        info.getValue() == 0 ? (
          <span className="badge bg-soft-warning text-warning">
            {lang("common.pending", "Pending")}
          </span>
        ) : info.getValue() == 1 ? (
          <span className="badge bg-soft-success text-success">
            {lang("common.active", "Active")}
          </span>
        ) : (
          <span className="badge bg-soft-danger text-danger">
            {lang("common.inactive", "Inactive")}
          </span>
        ),
    },
    {
      accessorKey: "actions",
      header: () => lang("common.actions", "Actions"),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="d-flex gap-2" style={{ flexWrap: "nowrap" }}>
            <FiEdit3
              size={18}
              onClick={() => openEdit(item)}
              title={lang("common.edit", "Edit")}
              style={{ color: "#007bff", cursor: "pointer" }}
            />
            <FiTrash2
              size={18}
              onClick={() => handleDelete(item)}
              title={lang("common.delete", "Delete")}
              style={{ color: "#dc3545", cursor: "pointer" }}
            />
          </div>
        );
      },
      meta: { disableSort: true },
    },
  ];

  return (
    <div className="contract-management">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">
          {lang("contract.contracts", "Contracts")}
        </h6>
        <Button
          variant="contained"
          onClick={openAdd}
          className="common-grey-color"
        >
          + {lang("contract.addContract", "Add Contract")}
        </Button>
      </div>

      <Dialog open={showModal} onClose={closeModal} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              pb: 1,
            }}
          >
            <Typography variant="h6" component="span">
              {modalType === "edit"
                ? lang("contract.editContract", "Edit Contract")
                : lang("contract.addContract", "Add Contract")}
            </Typography>
            <IconButton
              aria-label="close"
              onClick={closeModal}
              sx={{ color: (theme) => theme.palette.grey[500] }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
            >
              <TextField
                label={lang("contract.title", "Title")}
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label={lang("contract.description", "Description")}
                value={contractDescription}
                onChange={(e) => setContractDescription(e.target.value)}
                fullWidth
                multiline
                minRows={3}
              />
              {/* <TextField
                label={lang("contract.document", "Document URL")}
                value={documentUpload}
                onChange={(e) => setDocumentUpload(e.target.value)}
                fullWidth
              /> */}
              <TextField
                fullWidth
                type="file"
                inputProps={{ accept: "image/*,application/pdf" }}
                label={lang("contract.uploadDocument") || "Upload Document"}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => {
                  const file = (e.target.files && e.target.files[0]) || null;
                  applyDocumentSelection(file);
                }}
              />

              {(documentPreviewUrl || documentUpload) && (
                <Box>
                  {documentPreviewUrl && documentPreviewUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img
                      src={documentPreviewUrl}
                      alt="preview"
                      style={{ width: 160, height: 100, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }}
                    />
                  ) : (
                    <a href={documentUpload || documentPreviewUrl} target="_blank" rel="noreferrer">
                      {lang("contract.viewDocument") || "View document"}
                    </a>
                  )}
                </Box>
              )}
              <TextField
                label={lang("contract.date", "Contract Date")}
                type="date"
                value={contractDate}
                onChange={(e) => setContractDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                select
                label={lang("common.status", "Status")}
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
                fullWidth
              >
                <MenuItem value={1}>{lang("common.active", "Active")}</MenuItem>
                <MenuItem value={2}>
                  {lang("common.inactive", "Inactive")}
                </MenuItem>
                <MenuItem value={0}>
                  {lang("common.pending", "Pending")}
                </MenuItem>
              </TextField>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              onClick={closeModal}
              color="error"
              className="custom-orange-outline"
            >
              {lang("common.cancel", "Cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !contractTitle}
              startIcon={loading ? <CircularProgress size={16} /> : null}
              className="common-grey-color"
            >
              {loading
                ? lang("common.loading", "Loading...")
                : lang("common.save", "Save")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Table data={contracts} columns={columns} />
    </div>
  );
};

export default Contract;
