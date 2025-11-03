"use client";
import React, { useEffect, useState } from "react";
import Table from "@/components/shared/table/Table";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import Swal from "sweetalert2";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { showSuccessToast } from "@/utils/topTost";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Button,
  Chip,
  Box,
  IconButton,
  Typography,
  Stack,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const InverterTypeTable = () => {
  const { lang } = useLanguage();

  const [types, setTypes] = useState([]);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingId, setEditingId] = useState(null);
  const [typeName, setTypeName] = useState("");
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState({});
  const [statusError, setStatusError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTypeName("");
    setStatus("");
    setErrors({});
    setStatusError("");
    setEditingId(null);
  };

  const fetchTypes = async () => {
    try {
      const res = await apiGet("/api/inverterTypes/data");
      const items = Array.isArray(res?.data?.inverterTypes) ? res.data.inverterTypes : [];
      setTypes(items);
    } catch (_) {
      // noop
    }
  };

  useEffect(() => {
    fetchTypes();
    const onSaved = () => fetchTypes();
    window.addEventListener("inverterType:saved", onSaved);
    return () => window.removeEventListener("inverterType:saved", onSaved);
  }, []);

  const handleCloseModal = () => {
    setModalMode(null);
    resetForm();
  };

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
      const res = await apiDelete(`/api/inverterTypes/${id}`);
      if (res.success) {
        showSuccessToast(lang("inverterType.deletedSuccessfully"));
        fetchTypes();
      }
    } catch (_) {
      // noop
    }
  };

  // open edit/add via window event from header or actions
  useEffect(() => {
    const openEdit = (e) => {
      const item = e?.detail?.item;
      if (!item) {
        setModalMode("add");
        resetForm();
        return;
      }
      setModalMode("edit");
      setEditingId(item.id || null);
      setTypeName(item.type || "");
      setStatus(item.status !== undefined && item.status !== null ? String(item.status) : "");
      setErrors({});
    };
    window.addEventListener("inverterType:open-edit", openEdit);
    return () => window.removeEventListener("inverterType:open-edit", openEdit);
  }, []);

  const handleSave = async () => {
    const newErrors = {
      typeName: !typeName ? lang("inverterType.typeNameRequired") : "",
    };
    const newStatusError = !status && status !== 0 ? lang("inverterType.statusRequired") : "";
    setErrors(newErrors);
    setStatusError(newStatusError);
    if (Object.values(newErrors).some(Boolean) || newStatusError) return;

    try {
      setSubmitting(true);
      const payload = { type: typeName, status: parseInt(status) };
      const res = editingId
        ? await apiPut(`/api/inverterTypes/${editingId}`, payload)
        : await apiPost("/api/inverterTypes", payload);

      if (res.success) {
        if (editingId) {
          showSuccessToast(lang("inverterType.updatedSuccessfully"));
        } else {
          showSuccessToast(lang("inverterType.createdSuccessfully"));
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("inverterType:saved"));
        }
        handleCloseModal();
      }
    } catch (_) {
      // noop
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { accessorKey: "type", header: () => lang("inverterType.typeName") },
    {
      accessorKey: "status",
      header: () => lang("inverterType.status"),
      cell: ({ row }) => {
        const s = row.original.status;
        const config = {
          1: { label: lang("inverterType.active") || "Active", color: "#17c666" },
          0: { label: lang("inverterType.inactive") || "Inactive", color: "#ea4d4d" },
        }[s] || { label: s, color: "#999" };
        return (
          <Chip
            label={config.label}
            sx={{
              backgroundColor: config.color,
              color: "#fff",
              fontWeight: 500,
              minWidth: 80,
              "&:hover": {
                backgroundColor: config.color,
                opacity: 0.9,
              },
            }}
          />
        );
      },
    },
    {
      accessorKey: "actions",
      header: () => lang("common.actions"),
      cell: ({ row }) => (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap" }}>
          <IconButton
            size="small"
            onClick={() => {
              const item = row.original;
              window.dispatchEvent(new CustomEvent("inverterType:open-edit", { detail: { item } }));
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
      meta: { disableSort: true },
    },
  ];


  return (
    <>
      <Table data={types} columns={columns} />
      <Dialog
        open={!!modalMode}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
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
            {modalMode === "edit" ? lang("inverterType.editType") : lang("inverterType.addType")}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
            <TextField
              label={lang("inverterType.typeName")}
              placeholder={lang("inverterType.typeNamePlaceholder")}
              value={typeName}
              onChange={(e) => {
                setTypeName(e.target.value);
                if (errors.typeName) setErrors((prev) => ({ ...prev, typeName: "" }));
              }}
              error={!!errors.typeName}
              helperText={errors.typeName}
              fullWidth
            />

            <FormControl fullWidth error={!!statusError}>
              <InputLabel id="status-select-label">{lang("inverterType.status")}</InputLabel>
              <Select
                labelId="status-select-label"
                value={status}
                label={lang("inverterType.status")}
                onChange={(e) => {
                  setStatus(e.target.value);
                  if (statusError) setStatusError("");
                }}
              >
                <MenuItem value="">{lang("inverterType.selectStatus") || "Select Status"}</MenuItem>
                <MenuItem value="1">{lang("inverterType.active") || "Active"}</MenuItem>
                <MenuItem value="0">{lang("inverterType.inactive") || "Inactive"}</MenuItem>
              </Select>
              {statusError && <FormHelperText>{statusError}</FormHelperText>}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCloseModal} color="error" variant="outlined">
            {lang("common.cancel")}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={submitting}>
            {submitting ? lang("common.loading") : lang("common.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InverterTypeTable;


